/**
 * Message Relay Hook
 * Handles sending and receiving messages through the cloud relay
 * 
 * STATUS: ✅ IMPLEMENTED
 */

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMessaging } from '@/contexts/MessagingContext';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useMessageRelay() {
  const { identity, isOnline, queuedMessages } = useMessaging();
  const processingRef = useRef(false);

  // Send message through relay
  const sendViaRelay = useCallback(async (
    recipientPublicKey: string,
    encryptedContent: string,
    iv: string,
    signature?: string
  ) => {
    if (!identity) throw new Error('No identity');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/relay-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        action: 'send',
        senderPublicKey: identity.publicKey,
        recipientPublicKey,
        encryptedContent,
        iv,
        signature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return response.json();
  }, [identity]);

  // Fetch pending messages for this user
  const fetchPendingMessages = useCallback(async () => {
    if (!identity) return [];

    const response = await fetch(`${SUPABASE_URL}/functions/v1/relay-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        action: 'fetch',
        recipientPublicKey: identity.publicKey,
      }),
    });

    if (!response.ok) {
      console.error('Failed to fetch pending messages');
      return [];
    }

    const { messages } = await response.json();
    return messages;
  }, [identity]);

  // Acknowledge message delivery
  const acknowledgeMessage = useCallback(async (messageId: string) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/relay-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        action: 'acknowledge',
        messageId,
      }),
    });

    return response.ok;
  }, []);

  // Process queued messages when online
  const processQueue = useCallback(async () => {
    if (!isOnline || !identity || processingRef.current) return;
    
    processingRef.current = true;
    
    try {
      for (const msg of queuedMessages) {
        try {
          await sendViaRelay(
            msg.recipientPublicKey,
            msg.encrypted,
            msg.iv,
            msg.signature
          );
          // Note: Queue cleanup handled in context
          console.log(`Relayed queued message: ${msg.id}`);
        } catch (error) {
          console.error(`Failed to relay message ${msg.id}:`, error);
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [isOnline, identity, queuedMessages, sendViaRelay]);

  // Subscribe to realtime updates for new messages
  useEffect(() => {
    if (!identity) return;

    const channel = supabase
      .channel('pending-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pending_messages',
          filter: `recipient_public_key=eq.${identity.publicKey}`,
        },
        (payload) => {
          console.log('New message received via relay:', payload);
          toast.info('New message received!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [identity]);

  // Process queue when coming online
  useEffect(() => {
    if (isOnline && queuedMessages.length > 0) {
      processQueue();
    }
  }, [isOnline, queuedMessages.length, processQueue]);

  return {
    sendViaRelay,
    fetchPendingMessages,
    acknowledgeMessage,
    processQueue,
  };
}
