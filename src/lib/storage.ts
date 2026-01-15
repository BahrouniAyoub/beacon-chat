/**
 * Local Storage & IndexedDB Module
 * Handles offline message queue and identity persistence
 * 
 * STATUS: ✅ IMPLEMENTED
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema
interface MeshDBSchema extends DBSchema {
  identity: {
    key: string;
    value: {
      id: string;
      encryptionPublicKey: string;
      encryptionPrivateKey: string;
      signingPublicKey: string;
      signingPrivateKey: string;
      displayName: string;
      createdAt: number;
    };
  };
  contacts: {
    key: string;
    value: Contact;
    indexes: { 'by-name': string };
  };
  messages: {
    key: string;
    value: Message;
    indexes: { 
      'by-contact': string;
      'by-status': string;
      'by-timestamp': number;
    };
  };
  messageQueue: {
    key: string;
    value: QueuedMessage;
    indexes: { 'by-recipient': string };
  };
}

export interface Contact {
  id: string;
  publicKey: string;
  signingPublicKey: string;
  displayName: string;
  lastSeen?: number;
  connectionType?: 'online' | 'p2p' | 'unknown';
  isGateway?: boolean;
  addedAt: number;
}

export interface Message {
  id: string;
  contactId: string;
  content: string;
  encrypted: string;
  iv: string;
  signature?: string;
  timestamp: number;
  direction: 'sent' | 'received';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  deliveryMethod?: 'direct' | 'p2p' | 'relay' | 'store-forward';
}

export interface QueuedMessage {
  id: string;
  recipientId: string;
  recipientPublicKey: string;
  encrypted: string;
  iv: string;
  signature: string;
  timestamp: number;
  attempts: number;
  lastAttempt?: number;
}

let db: IDBPDatabase<MeshDBSchema> | null = null;

// Initialize database
export async function initDatabase(): Promise<IDBPDatabase<MeshDBSchema>> {
  if (db) return db;
  
  db = await openDB<MeshDBSchema>('mesh-messenger', 1, {
    upgrade(database) {
      // Identity store
      if (!database.objectStoreNames.contains('identity')) {
        database.createObjectStore('identity');
      }
      
      // Contacts store
      if (!database.objectStoreNames.contains('contacts')) {
        const contactStore = database.createObjectStore('contacts', { keyPath: 'id' });
        contactStore.createIndex('by-name', 'displayName');
      }
      
      // Messages store
      if (!database.objectStoreNames.contains('messages')) {
        const messageStore = database.createObjectStore('messages', { keyPath: 'id' });
        messageStore.createIndex('by-contact', 'contactId');
        messageStore.createIndex('by-status', 'status');
        messageStore.createIndex('by-timestamp', 'timestamp');
      }
      
      // Message queue for offline sending
      if (!database.objectStoreNames.contains('messageQueue')) {
        const queueStore = database.createObjectStore('messageQueue', { keyPath: 'id' });
        queueStore.createIndex('by-recipient', 'recipientId');
      }
    },
  });
  
  return db;
}

// Identity operations
export async function saveIdentity(identity: MeshDBSchema['identity']['value']): Promise<void> {
  const database = await initDatabase();
  await database.put('identity', identity, 'current');
}

export async function getIdentity(): Promise<MeshDBSchema['identity']['value'] | undefined> {
  const database = await initDatabase();
  return await database.get('identity', 'current');
}

// Contact operations
export async function saveContact(contact: Contact): Promise<void> {
  const database = await initDatabase();
  await database.put('contacts', contact);
}

export async function getContact(id: string): Promise<Contact | undefined> {
  const database = await initDatabase();
  return await database.get('contacts', id);
}

export async function getAllContacts(): Promise<Contact[]> {
  const database = await initDatabase();
  return await database.getAll('contacts');
}

export async function deleteContact(id: string): Promise<void> {
  const database = await initDatabase();
  await database.delete('contacts', id);
}

// Message operations
export async function saveMessage(message: Message): Promise<void> {
  const database = await initDatabase();
  await database.put('messages', message);
}

export async function getMessagesByContact(contactId: string): Promise<Message[]> {
  const database = await initDatabase();
  return await database.getAllFromIndex('messages', 'by-contact', contactId);
}

export async function updateMessageStatus(id: string, status: Message['status']): Promise<void> {
  const database = await initDatabase();
  const message = await database.get('messages', id);
  if (message) {
    message.status = status;
    await database.put('messages', message);
  }
}

// Queue operations (for offline messages)
export async function queueMessage(message: QueuedMessage): Promise<void> {
  const database = await initDatabase();
  await database.put('messageQueue', message);
}

export async function getQueuedMessages(): Promise<QueuedMessage[]> {
  const database = await initDatabase();
  return await database.getAll('messageQueue');
}

export async function removeFromQueue(id: string): Promise<void> {
  const database = await initDatabase();
  await database.delete('messageQueue', id);
}

export async function updateQueuedMessage(message: QueuedMessage): Promise<void> {
  const database = await initDatabase();
  await database.put('messageQueue', message);
}
