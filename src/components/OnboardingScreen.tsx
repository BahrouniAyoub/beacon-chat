import { useState } from 'react';
import { Shield, ArrowRight, User } from 'lucide-react';
import { useMessaging } from '@/contexts/MessagingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function OnboardingScreen() {
  const { createIdentity } = useMessaging();
  const [displayName, setDisplayName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'intro' | 'name'>('intro');

  const handleCreate = async () => {
    if (!displayName.trim()) return;
    setIsCreating(true);
    try {
      await createIdentity(displayName.trim());
    } catch (error) {
      console.error('Failed to create identity:', error);
    }
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-card relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(172_66%_50%_/_0.08),_transparent_70%)]" />
      
      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[400px] h-[400px] rounded-full border border-primary/10 ripple" />
        <div className="absolute w-[500px] h-[500px] rounded-full border border-primary/5 ripple" style={{ animationDelay: '0.5s' }} />
        <div className="absolute w-[600px] h-[600px] rounded-full border border-primary/5 ripple" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {step === 'intro' ? (
          <div className="animate-fade-in text-center">
            {/* Logo/Icon */}
            <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-primary flex items-center justify-center glow-primary">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>

            <h1 className="text-3xl font-bold mb-3 tracking-tight">
              <span className="text-gradient">Mesh</span>
            </h1>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Private messaging that works everywhere.<br />
              No phone number. No email. No tracking.
            </p>

            {/* Features list */}
            <div className="space-y-3 mb-10 text-left">
              {[
                'End-to-end encrypted by default',
                'Works offline via peer-to-peer',
                'Anonymous identity - you control your keys',
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm text-foreground/80">{feature}</span>
                </div>
              ))}
            </div>

            <Button 
              onClick={() => setStep('name')}
              className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
              size="lg"
            >
              Create Your Identity
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <button 
              onClick={() => setStep('intro')}
              className="text-muted-foreground hover:text-foreground mb-6 text-sm"
            >
              ← Back
            </button>

            <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-secondary flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">Choose a name</h2>
            <p className="text-muted-foreground text-center mb-8 text-sm">
              This is how others will see you. You can change it later.
            </p>

            <div className="space-y-4">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="h-12 bg-secondary/50 border-border/50 focus:border-primary text-center text-lg"
                maxLength={30}
                autoFocus
              />

              <Button
                onClick={handleCreate}
                disabled={!displayName.trim() || isCreating}
                className={cn(
                  "w-full h-12 text-primary-foreground transition-all",
                  displayName.trim() 
                    ? "bg-gradient-primary hover:opacity-90" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Generating keys...
                  </span>
                ) : (
                  <>
                    Generate Secure Identity
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Your cryptographic keys will be generated and stored locally.
                Only you have access to your private keys.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
