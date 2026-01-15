/**
 * QR Code Display Component
 * Shows QR code for sharing public keys
 * 
 * STATUS: ✅ IMPLEMENTED
 */

import { QRCodeSVG } from 'qrcode.react';
import { useMessaging } from '@/contexts/MessagingContext';

interface QRCodeDisplayProps {
  size?: number;
  className?: string;
}

export function QRCodeDisplay({ size = 200, className }: QRCodeDisplayProps) {
  const { identity } = useMessaging();

  if (!identity) return null;

  // Create a compact data format for QR
  const qrData = JSON.stringify({
    t: 'mesh', // type identifier
    id: identity.id,
    pk: identity.publicKey,
    sk: identity.signingPublicKey,
    n: identity.displayName,
  });

  return (
    <div className={className}>
      <div className="p-4 bg-white rounded-xl inline-block">
        <QRCodeSVG
          value={qrData}
          size={size}
          level="M"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
    </div>
  );
}
