import { useState } from 'react';
import { X, Copy, Check, QrCode, UserPlus, ScanLine } from 'lucide-react';
import { useMessaging } from '@/contexts/MessagingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { QRCodeDisplay } from './QRCodeDisplay';
import { QRCodeScanner } from './QRCodeScanner';

interface AddContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddContactDialog({ isOpen, onClose }: AddContactDialogProps) {
  const { identity, addContact } = useMessaging();
  const [tab, setTab] = useState<'share' | 'add'>('share');
  const [displayName, setDisplayName] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [signingKey, setSigningKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  if (!isOpen) return null;

  const shareData = identity ? `${identity.publicKey}\n${identity.signingPublicKey}` : '';

  const handleCopy = async () => {
    if (!shareData) return;
    await navigator.clipboard.writeText(shareData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = async () => {
    if (!displayName.trim() || !publicKey.trim() || !signingKey.trim()) return;
    
    setIsAdding(true);
    try {
      await addContact(publicKey.trim(), signingKey.trim(), displayName.trim());
      onClose();
      setDisplayName('');
      setPublicKey('');
      setSigningKey('');
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Add Contact</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('share')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              tab === 'share' 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Share Your ID
          </button>
          <button
            onClick={() => setTab('add')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              tab === 'add' 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Add Contact
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === 'share' ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Share your QR code or keys to let others add you.
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <QRCodeDisplay size={180} />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Your ID
                  </label>
                  <div className="mt-1 px-3 py-2 bg-secondary rounded-lg">
                    <p className="font-mono text-sm text-primary truncate">{identity?.id}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Public Keys (share both)
                  </label>
                  <div className="mt-1 relative">
                    <textarea
                      readOnly
                      value={shareData}
                      className="w-full h-20 px-3 py-2 bg-secondary rounded-lg font-mono text-xs resize-none"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCopy}
                className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Keys
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scan QR Button */}
              <Button
                onClick={() => setShowScanner(true)}
                variant="outline"
                className="w-full border-primary/50 hover:bg-primary/10"
              >
                <ScanLine className="w-4 h-4 mr-2" />
                Scan QR Code
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or enter manually</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">
                    Display Name
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How you'll remember them"
                    className="mt-1 bg-secondary border-0"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-medium">
                    Encryption Public Key
                  </label>
                  <Input
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="Paste the first key"
                    className="mt-1 bg-secondary border-0 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-medium">
                    Signing Public Key
                  </label>
                  <Input
                    value={signingKey}
                    onChange={(e) => setSigningKey(e.target.value)}
                    placeholder="Paste the second key"
                    className="mt-1 bg-secondary border-0 font-mono text-xs"
                  />
                </div>
              </div>

              <Button
                onClick={handleAdd}
                disabled={!displayName.trim() || !publicKey.trim() || !signingKey.trim() || isAdding}
                className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {isAdding ? (
                  <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Contact
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* QR Scanner Modal */}
        <QRCodeScanner 
          isOpen={showScanner} 
          onClose={() => setShowScanner(false)} 
        />
      </div>
    </div>
  );
}
