/**
 * End-to-End Encryption Module
 * Uses Web Crypto API for key generation and message encryption
 * 
 * STATUS: ✅ IMPLEMENTED
 */

// Generate a new identity keypair (for anonymous identity)
export async function generateIdentityKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable
    ["deriveKey", "deriveBits"]
  );
}

// Generate signing keypair for message authentication
export async function generateSigningKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );
}

// Export public key to shareable format
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

// Import public key from shared format
export async function importPublicKey(keyString: string, forEncryption = true): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "spki",
    keyData,
    forEncryption 
      ? { name: "ECDH", namedCurve: "P-256" }
      : { name: "ECDSA", namedCurve: "P-256" },
    true,
    forEncryption ? [] : ["verify"]
  );
}

// Derive shared secret for encryption
async function deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  return await crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt a message
export async function encryptMessage(
  message: string,
  senderPrivateKey: CryptoKey,
  recipientPublicKey: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  const sharedKey = await deriveSharedKey(senderPrivateKey, recipientPublicKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedMessage = new TextEncoder().encode(message);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    encodedMessage
  );
  
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

// Decrypt a message
export async function decryptMessage(
  encrypted: string,
  iv: string,
  recipientPrivateKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<string> {
  const sharedKey = await deriveSharedKey(recipientPrivateKey, senderPublicKey);
  const encryptedData = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivData },
    sharedKey,
    encryptedData
  );
  
  return new TextDecoder().decode(decrypted);
}

// Sign a message for authenticity
export async function signMessage(message: string, privateKey: CryptoKey): Promise<string> {
  const encoded = new TextEncoder().encode(message);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    encoded
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Verify message signature
export async function verifySignature(
  message: string,
  signature: string,
  publicKey: CryptoKey
): Promise<boolean> {
  const encoded = new TextEncoder().encode(message);
  const signatureData = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
  return await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    signatureData,
    encoded
  );
}

// Generate a short, shareable identity ID from public key
export function generateIdentityId(publicKey: string): string {
  // Create a short hash for display purposes
  let hash = 0;
  for (let i = 0; i < publicKey.length; i++) {
    const char = publicKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const positiveHash = Math.abs(hash);
  return positiveHash.toString(36).toUpperCase().slice(0, 8);
}
