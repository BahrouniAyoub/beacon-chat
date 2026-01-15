import { useState } from 'react';
import { Settings, Radio, Shield, Moon, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { useMessaging } from '@/contexts/MessagingContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { identity, isGatewayMode, toggleGatewayMode } = useMessaging();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl animate-scale-in max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>

        <div className="overflow-y-auto">
          {/* Identity Section */}
          <div className="p-4 border-b border-border">
            <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
              Your Identity
            </h3>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-lg">
                {identity?.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{identity?.displayName}</p>
                <p className="text-xs text-muted-foreground font-mono">{identity?.id}</p>
              </div>
            </div>
          </div>

          {/* P2P Settings */}
          <div className="p-4 border-b border-border">
            <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
              Peer-to-Peer
            </h3>
            
            <SettingRow
              icon={Radio}
              title="Act as Gateway"
              description="Relay messages for nearby offline users when you have internet"
              trailing={
                <button 
                  onClick={toggleGatewayMode}
                  className={cn(
                    "transition-colors",
                    isGatewayMode ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {isGatewayMode ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              }
            />

            <div className="mt-3 p-3 bg-status-gateway/10 rounded-lg border border-status-gateway/20">
              <p className="text-xs text-muted-foreground">
                <span className="text-status-gateway font-medium">Gateway Mode</span> allows your 
                device to help others send messages when they're offline. This uses your data 
                connection but helps the mesh network function.
              </p>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="p-4 border-b border-border">
            <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
              Privacy & Security
            </h3>
            
            <SettingRow
              icon={Shield}
              title="Encryption"
              description="All messages use end-to-end encryption"
              trailing={
                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full font-medium">
                  Always On
                </span>
              }
            />
          </div>

          {/* About Section */}
          <div className="p-4">
            <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
              About
            </h3>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-gradient">Mesh</span> is a privacy-first 
                messaging app that works without internet using peer-to-peer connections.
              </p>
              <p className="text-xs">
                Version 0.1.0 MVP
              </p>
            </div>

            <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-2">MVP Status</p>
              <div className="space-y-1.5 text-xs">
                <StatusItem label="E2E Encryption" status="done" />
                <StatusItem label="Offline Message Queue" status="done" />
                <StatusItem label="Anonymous Identity" status="done" />
                <StatusItem label="P2P Discovery (Bluetooth)" status="future" />
                <StatusItem label="Wi-Fi Direct Transfer" status="future" />
                <StatusItem label="Gateway Relay" status="future" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  trailing,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {trailing}
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: 'done' | 'future' }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className={cn(
        "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
        status === 'done' 
          ? "bg-status-online/20 text-status-online" 
          : "bg-muted text-muted-foreground"
      )}>
        {status === 'done' ? '✓ Done' : 'Future'}
      </span>
    </div>
  );
}
