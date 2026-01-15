import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useMessaging } from '@/contexts/MessagingContext';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { ContactList } from '@/components/ContactList';
import { ChatView } from '@/components/ChatView';
import { AddContactDialog } from '@/components/AddContactDialog';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MessengerApp() {
  const { identity, isInitialized, activeContactId, selectContact } = useMessaging();
  const [showAddContact, setShowAddContact] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if no identity
  if (!identity) {
    return <OnboardingScreen />;
  }

  // Mobile: switch views
  const handleSelectContact = (contactId: string | null) => {
    selectContact(contactId);
    if (contactId) {
      setMobileView('chat');
    }
  };

  const handleBackToList = () => {
    setMobileView('list');
    selectContact(null);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Sidebar (Contact List) */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border",
        "md:flex flex-col",
        mobileView === 'list' ? "flex" : "hidden"
      )}>
        <ContactList 
          onAddContact={() => setShowAddContact(true)} 
        />
        
        {/* Settings button */}
        <div className="p-3 border-t border-sidebar-border bg-sidebar">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        "md:flex",
        mobileView === 'chat' ? "flex" : "hidden"
      )}>
        <ChatView onBack={handleBackToList} />
      </div>

      {/* Dialogs */}
      <AddContactDialog 
        isOpen={showAddContact} 
        onClose={() => setShowAddContact(false)} 
      />
      <SettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
}
