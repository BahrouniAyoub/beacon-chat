/**
 * QR Code Scanner Component
 * Scans QR codes to add contacts
 * 
 * STATUS: ✅ IMPLEMENTED
 */

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMessaging } from '@/contexts/MessagingContext';
import { toast } from 'sonner';

interface QRCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QRData {
  t: string;
  id: string;
  pk: string;
  sk: string;
  n: string;
}

export function QRCodeScanner({ isOpen, onClose }: QRCodeScannerProps) {
  const { addContact } = useMessaging();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    if (!containerRef.current) return;

    try {
      setError(null);
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        () => {} // Ignore scan errors
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Could not access camera. Please grant camera permissions.');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    try {
      const data: QRData = JSON.parse(decodedText);
      
      if (data.t !== 'mesh') {
        setError('Invalid QR code - not a MeshChat contact');
        return;
      }

      await stopScanning();
      await addContact(data.pk, data.sk, data.n);
      toast.success(`Added ${data.n} as a contact!`);
      onClose();
    } catch (err) {
      console.error('Failed to parse QR code:', err);
      setError('Invalid QR code format');
    }
  };

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Scan Contact QR
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scanner */}
        <div className="p-6">
          <div className="relative">
            <div
              id="qr-reader"
              ref={containerRef}
              className="w-full aspect-square rounded-xl overflow-hidden bg-secondary"
            />
            
            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-2 border-primary/50 rounded-xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary rounded-lg animate-pulse" />
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <p className="mt-4 text-sm text-muted-foreground text-center">
            Point your camera at a contact's QR code to add them
          </p>
        </div>
      </div>
    </div>
  );
}
