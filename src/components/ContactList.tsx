import { useState } from 'react';
import { Search, Plus, Radio, User, MoreVertical } from 'lucide-react';
import { useMessaging, type NearbyDevice } from '@/contexts/MessagingContext';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Contact } from '@/lib/storage';

interface ContactListProps {
  onAddContact: () => void;
}

export function ContactList({ onAddContact }: ContactListProps) {
  const { 
    contacts, 
    activeContactId, 
    selectContact, 
    identity,
    isP2PScanning,
    startP2PScan,
    stopP2PScan,
    nearbyDevices,
  } = useMessaging();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(c => 
    c.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gradient">Mesh</h1>
            <p className="text-xs text-muted-foreground font-mono">
              ID: {identity?.id}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddContact}
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        
        <ConnectionStatus />
      </div>

      {/* Search */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="pl-9 h-9 bg-sidebar-accent border-0 text-sm"
          />
        </div>
      </div>

      {/* P2P Scan Button */}
      <div className="p-3 border-b border-sidebar-border">
        <Button
          variant={isP2PScanning ? "default" : "secondary"}
          size="sm"
          onClick={isP2PScanning ? stopP2PScan : startP2PScan}
          className={cn(
            "w-full justify-start gap-2",
            isP2PScanning && "bg-gradient-primary text-primary-foreground"
          )}
        >
          <Radio className={cn("w-4 h-4", isP2PScanning && "animate-pulse")} />
          {isP2PScanning ? 'Scanning for nearby...' : 'Find Nearby Users'}
        </Button>
      </div>

      {/* Nearby Devices (when scanning) */}
      {isP2PScanning && nearbyDevices.length > 0 && (
        <div className="p-3 border-b border-sidebar-border">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            Nearby Devices
          </p>
          <div className="space-y-1">
            {nearbyDevices.map(device => (
              <NearbyDeviceItem key={device.id} device={device} />
            ))}
          </div>
        </div>
      )}

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={onAddContact}
              className="mt-2 text-primary"
            >
              Add your first contact
            </Button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredContacts.map(contact => (
              <ContactItem
                key={contact.id}
                contact={contact}
                isActive={contact.id === activeContactId}
                onClick={() => selectContact(contact.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactItem({ 
  contact, 
  isActive, 
  onClick 
}: { 
  contact: Contact; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
        "hover:bg-sidebar-accent",
        isActive && "bg-sidebar-accent border-l-2 border-primary"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
        "bg-gradient-primary text-primary-foreground"
      )}>
        {contact.displayName.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{contact.displayName}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {contact.id}
        </p>
      </div>

      {/* Connection indicator */}
      <div className={cn(
        "w-2 h-2 rounded-full",
        contact.connectionType === 'online' && "bg-status-online",
        contact.connectionType === 'p2p' && "bg-status-p2p",
        (!contact.connectionType || contact.connectionType === 'unknown') && "bg-status-offline"
      )} />
    </button>
  );
}

function NearbyDeviceItem({ device }: { device: NearbyDevice }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 border border-status-p2p/30">
      <div className="w-8 h-8 rounded-full bg-status-p2p/20 flex items-center justify-center">
        <Radio className="w-4 h-4 text-status-p2p" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{device.displayName}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground capitalize">
            {device.connectionType}
          </span>
          {device.isGateway && (
            <span className="text-xs text-status-gateway font-medium">
              Gateway
            </span>
          )}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {device.signalStrength}%
      </div>
    </div>
  );
}
