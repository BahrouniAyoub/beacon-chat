import { Wifi, WifiOff, Radio, Zap } from 'lucide-react';
import { useMessaging, ConnectionMode } from '@/contexts/MessagingContext';
import { cn } from '@/lib/utils';

const connectionConfig: Record<ConnectionMode, { 
  icon: React.ElementType; 
  label: string; 
  className: string;
  description: string;
}> = {
  online: {
    icon: Wifi,
    label: 'Online',
    className: 'text-status-online glow-online',
    description: 'Connected via internet',
  },
  offline: {
    icon: WifiOff,
    label: 'Offline',
    className: 'text-status-offline',
    description: 'No connection available',
  },
  p2p: {
    icon: Radio,
    label: 'P2P',
    className: 'text-status-p2p glow-p2p',
    description: 'Peer-to-peer mesh active',
  },
  hybrid: {
    icon: Zap,
    label: 'Hybrid',
    className: 'text-primary glow-primary',
    description: 'Internet + P2P mesh',
  },
};

export function ConnectionStatus() {
  const { connectionMode, isP2PScanning, nearbyDevices, queuedMessages } = useMessaging();
  const config = connectionConfig[connectionMode];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      {/* Connection indicator */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 backdrop-blur-sm",
        "border border-border/50 transition-all duration-300",
        isP2PScanning && "animate-pulse"
      )}>
        <Icon className={cn("w-4 h-4 transition-colors", config.className)} />
        <span className="text-sm font-medium">{config.label}</span>
      </div>

      {/* Nearby devices count */}
      {isP2PScanning && nearbyDevices.length > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-p2p/20 text-status-p2p text-xs font-medium">
          <Radio className="w-3 h-3" />
          <span>{nearbyDevices.length} nearby</span>
        </div>
      )}

      {/* Queued messages indicator */}
      {queuedMessages.length > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
          <span>{queuedMessages.length} queued</span>
        </div>
      )}
    </div>
  );
}
