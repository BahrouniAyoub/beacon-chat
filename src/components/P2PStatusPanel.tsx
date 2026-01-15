/**
 * P2P Status Panel Component
 * Shows Bluetooth and Wi-Fi Direct status with controls
 * 
 * STATUS: ✅ UI IMPLEMENTED (Native features require Capacitor plugins)
 */

import { Bluetooth, Wifi, WifiOff, Radio, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useBluetooth } from '@/hooks/useBluetooth';
import { useWifiDirect } from '@/hooks/useWifiDirect';
import { cn } from '@/lib/utils';

interface P2PStatusPanelProps {
  className?: string;
}

export function P2PStatusPanel({ className }: P2PStatusPanelProps) {
  const bluetooth = useBluetooth();
  const wifiDirect = useWifiDirect();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Bluetooth Section */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bluetooth className={cn(
              "w-5 h-5",
              bluetooth.isAvailable ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="font-medium">Bluetooth</span>
          </div>
          <Switch
            checked={bluetooth.isScanning}
            onCheckedChange={(checked) => checked ? bluetooth.startScan() : bluetooth.stopScan()}
            disabled={!bluetooth.isAvailable}
          />
        </div>

        {!bluetooth.isAvailable && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Requires native Android app with BLE plugin
            </p>
          </div>
        )}

        {bluetooth.isScanning && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Radio className="w-4 h-4 animate-pulse text-primary" />
              <span>Scanning for nearby devices...</span>
            </div>
            
            {bluetooth.discoveredDevices.map(device => (
              <button
                key={device.id}
                onClick={() => bluetooth.connectToDevice(device.id)}
                className="w-full p-2 rounded-lg bg-background/50 hover:bg-background transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    device.isGateway ? "bg-status-success" : "bg-status-warning"
                  )} />
                  <span className="text-sm font-medium">{device.displayName}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {device.signalStrength}%
                </span>
              </button>
            ))}
          </div>
        )}

        {bluetooth.connectedDevice && (
          <div className="mt-3 p-2 rounded-lg bg-status-success/10 border border-status-success/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-status-success">
                Connected: {bluetooth.connectedDevice.displayName}
              </span>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={bluetooth.disconnect}
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Wi-Fi Direct Section */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {wifiDirect.isAvailable ? (
              <Wifi className="w-5 h-5 text-primary" />
            ) : (
              <WifiOff className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="font-medium">Wi-Fi Direct</span>
          </div>
          <Switch
            checked={wifiDirect.isScanning}
            onCheckedChange={(checked) => checked ? wifiDirect.startDiscovery() : wifiDirect.stopDiscovery()}
            disabled={!wifiDirect.isAvailable}
          />
        </div>

        <div className="flex items-start gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Requires custom native Android plugin (not available in Capacitor)
          </p>
        </div>

        {wifiDirect.isGroupOwner && wifiDirect.groupInfo && (
          <div className="mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium">Group Owner</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {wifiDirect.groupInfo.ssid}
            </p>
          </div>
        )}
      </div>

      {/* Status Summary */}
      <div className="p-3 rounded-lg bg-muted/50 text-center">
        <p className="text-xs text-muted-foreground">
          {bluetooth.isScanning || wifiDirect.isScanning ? (
            <span className="flex items-center justify-center gap-2">
              <Radio className="w-3 h-3 animate-pulse" />
              P2P Discovery Active
            </span>
          ) : (
            "P2P Discovery Inactive"
          )}
        </p>
      </div>
    </div>
  );
}
