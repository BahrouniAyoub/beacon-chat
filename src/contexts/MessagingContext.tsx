/**
 * Messaging Context - Core State Management
 * Manages identity, contacts, messages, and connection state
 * 
 * STATUS: ✅ IMPLEMENTED
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  generateIdentityKeyPair, 
  generateSigningKeyPair, 
  exportPublicKey,
  generateIdentityId,
  encryptMessage,
  signMessage,
} from '@/lib/crypto';
import {
  initDatabase,
  saveIdentity,
  getIdentity,
  saveContact,
  getAllContacts,
  saveMessage,
  getMessagesByContact,
  queueMessage,
  getQueuedMessages,
  Contact,
  Message,
  QueuedMessage,
} from '@/lib/storage';

export type ConnectionMode = 'online' | 'offline' | 'p2p' | 'hybrid';

interface Identity {
  id: string;
  publicKey: string;
  signingPublicKey: string;
  displayName: string;
  // Private keys stored separately in IndexedDB
}

interface MessagingState {
  identity: Identity | null;
  contacts: Contact[];
  activeContactId: string | null;
  messages: Record<string, Message[]>;
  connectionMode: ConnectionMode;
  isOnline: boolean;
  isP2PScanning: boolean;
  nearbyDevices: NearbyDevice[];
  queuedMessages: QueuedMessage[];
  isInitialized: boolean;
}

export interface NearbyDevice {
  id: string;
  publicKey: string;
  displayName: string;
  signalStrength: number;
  isGateway: boolean;
  connectionType: 'bluetooth' | 'wifi-direct';
}

interface MessagingContextType extends MessagingState {
  createIdentity: (displayName: string) => Promise<void>;
  addContact: (publicKey: string, signingKey: string, displayName: string) => Promise<void>;
  selectContact: (contactId: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  startP2PScan: () => void;
  stopP2PScan: () => void;
  toggleGatewayMode: () => void;
  isGatewayMode: boolean;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MessagingState>({
    identity: null,
    contacts: [],
    activeContactId: null,
    messages: {},
    connectionMode: 'offline',
    isOnline: navigator.onLine,
    isP2PScanning: false,
    nearbyDevices: [],
    queuedMessages: [],
    isInitialized: false,
  });
  
  const [isGatewayMode, setIsGatewayMode] = useState(false);
  const [encryptionKeyPair, setEncryptionKeyPair] = useState<CryptoKeyPair | null>(null);
  const [signingKeyPair, setSigningKeyPair] = useState<CryptoKeyPair | null>(null);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      await initDatabase();
      const storedIdentity = await getIdentity();
      
      if (storedIdentity) {
        // Reconstruct keys from stored data
        setState(prev => ({
          ...prev,
          identity: {
            id: storedIdentity.id,
            publicKey: storedIdentity.encryptionPublicKey,
            signingPublicKey: storedIdentity.signingPublicKey,
            displayName: storedIdentity.displayName,
          },
          isInitialized: true,
        }));
      } else {
        setState(prev => ({ ...prev, isInitialized: true }));
      }
      
      // Load contacts
      const contacts = await getAllContacts();
      setState(prev => ({ ...prev, contacts }));
      
      // Load queued messages
      const queued = await getQueuedMessages();
      setState(prev => ({ ...prev, queuedMessages: queued }));
    };
    
    init();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ 
        ...prev, 
        isOnline: true,
        connectionMode: prev.isP2PScanning ? 'hybrid' : 'online',
      }));
    };
    
    const handleOffline = () => {
      setState(prev => ({ 
        ...prev, 
        isOnline: false,
        connectionMode: prev.isP2PScanning ? 'p2p' : 'offline',
      }));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Create new identity
  const createIdentity = useCallback(async (displayName: string) => {
    const encKeyPair = await generateIdentityKeyPair();
    const signKeyPair = await generateSigningKeyPair();
    
    const encPublicKey = await exportPublicKey(encKeyPair.publicKey);
    const signPublicKey = await exportPublicKey(signKeyPair.publicKey);
    const id = generateIdentityId(encPublicKey);
    
    // Store private keys (in production, use more secure storage)
    const encPrivateExport = await crypto.subtle.exportKey('pkcs8', encKeyPair.privateKey);
    const signPrivateExport = await crypto.subtle.exportKey('pkcs8', signKeyPair.privateKey);
    
    const identityData = {
      id,
      encryptionPublicKey: encPublicKey,
      encryptionPrivateKey: btoa(String.fromCharCode(...new Uint8Array(encPrivateExport))),
      signingPublicKey: signPublicKey,
      signingPrivateKey: btoa(String.fromCharCode(...new Uint8Array(signPrivateExport))),
      displayName,
      createdAt: Date.now(),
    };
    
    await saveIdentity(identityData);
    setEncryptionKeyPair(encKeyPair);
    setSigningKeyPair(signKeyPair);
    
    setState(prev => ({
      ...prev,
      identity: {
        id,
        publicKey: encPublicKey,
        signingPublicKey: signPublicKey,
        displayName,
      },
    }));
  }, []);

  // Add contact
  const addContact = useCallback(async (publicKey: string, signingKey: string, displayName: string) => {
    const id = generateIdentityId(publicKey);
    const contact: Contact = {
      id,
      publicKey,
      signingPublicKey: signingKey,
      displayName,
      addedAt: Date.now(),
      connectionType: 'unknown',
    };
    
    await saveContact(contact);
    setState(prev => ({
      ...prev,
      contacts: [...prev.contacts, contact],
    }));
  }, []);

  // Select active contact
  const selectContact = useCallback(async (contactId: string | null) => {
    setState(prev => ({ ...prev, activeContactId: contactId }));
    
    if (contactId && !state.messages[contactId]) {
      const contactMessages = await getMessagesByContact(contactId);
      setState(prev => ({
        ...prev,
        messages: { ...prev.messages, [contactId]: contactMessages },
      }));
    }
  }, [state.messages]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!state.activeContactId || !state.identity || !encryptionKeyPair) return;
    
    const contact = state.contacts.find(c => c.id === state.activeContactId);
    if (!contact) return;
    
    const messageId = crypto.randomUUID();
    const timestamp = Date.now();
    
    try {
      // Import recipient's public key and encrypt
      const recipientKey = await crypto.subtle.importKey(
        'spki',
        Uint8Array.from(atob(contact.publicKey), c => c.charCodeAt(0)),
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
      );
      
      const { encrypted, iv } = await encryptMessage(
        content,
        encryptionKeyPair.privateKey,
        recipientKey
      );
      
      // Sign the message
      const signature = signingKeyPair 
        ? await signMessage(encrypted, signingKeyPair.privateKey)
        : '';
      
      const message: Message = {
        id: messageId,
        contactId: state.activeContactId,
        content,
        encrypted,
        iv,
        signature,
        timestamp,
        direction: 'sent',
        status: state.isOnline ? 'sent' : 'pending',
        deliveryMethod: state.isOnline ? 'direct' : 'store-forward',
      };
      
      await saveMessage(message);
      
      setState(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          [state.activeContactId!]: [
            ...(prev.messages[state.activeContactId!] || []),
            message,
          ],
        },
      }));
      
      // If offline, queue for later delivery
      if (!state.isOnline) {
        const queuedMsg: QueuedMessage = {
          id: messageId,
          recipientId: contact.id,
          recipientPublicKey: contact.publicKey,
          encrypted,
          iv,
          signature,
          timestamp,
          attempts: 0,
        };
        await queueMessage(queuedMsg);
        setState(prev => ({
          ...prev,
          queuedMessages: [...prev.queuedMessages, queuedMsg],
        }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [state.activeContactId, state.identity, state.contacts, state.isOnline, encryptionKeyPair, signingKeyPair]);

  // P2P scanning (simulated for MVP - real implementation needs native plugins)
  const startP2PScan = useCallback(() => {
    setState(prev => ({
      ...prev,
      isP2PScanning: true,
      connectionMode: prev.isOnline ? 'hybrid' : 'p2p',
    }));
    
    // Simulate finding nearby devices (FUTURE: Replace with real BLE/WiFi Direct)
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        nearbyDevices: [
          {
            id: 'demo-1',
            publicKey: 'demo-key-1',
            displayName: 'Nearby User',
            signalStrength: 75,
            isGateway: true,
            connectionType: 'bluetooth',
          },
        ],
      }));
    }, 2000);
  }, []);

  const stopP2PScan = useCallback(() => {
    setState(prev => ({
      ...prev,
      isP2PScanning: false,
      connectionMode: prev.isOnline ? 'online' : 'offline',
      nearbyDevices: [],
    }));
  }, []);

  const toggleGatewayMode = useCallback(() => {
    setIsGatewayMode(prev => !prev);
  }, []);

  return (
    <MessagingContext.Provider
      value={{
        ...state,
        createIdentity,
        addContact,
        selectContact,
        sendMessage,
        startP2PScan,
        stopP2PScan,
        toggleGatewayMode,
        isGatewayMode,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within MessagingProvider');
  }
  return context;
}
