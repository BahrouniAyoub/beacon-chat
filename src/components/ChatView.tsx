import { useState, useRef, useEffect } from 'react';
import { Send, Lock, Clock, Check, CheckCheck, AlertCircle, ArrowLeft, Radio } from 'lucide-react';
import { useMessaging } from '@/contexts/MessagingContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/storage';

interface ChatViewProps {
  onBack?: () => void;
}

export function ChatView({ onBack }: ChatViewProps) {
  const { 
    activeContactId, 
    contacts, 
    messages, 
    sendMessage,
    connectionMode,
  } = useMessaging();
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeContact = contacts.find(c => c.id === activeContactId);
  const contactMessages = activeContactId ? messages[activeContactId] || [] : [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [contactMessages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    
    setIsSending(true);
    await sendMessage(inputValue.trim());
    setInputValue('');
    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeContact) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-background">
        <div className="w-20 h-20 mb-6 rounded-2xl bg-secondary flex items-center justify-center">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Choose a contact from the list or add someone new to start messaging securely.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        
        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium">
          {activeContact.displayName.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{activeContact.displayName}</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3 h-3 text-primary" />
            <span>End-to-end encrypted</span>
            {connectionMode === 'p2p' && (
              <>
                <span>•</span>
                <Radio className="w-3 h-3 text-status-p2p" />
                <span className="text-status-p2p">P2P</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {contactMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              Messages are encrypted end-to-end. Only you and {activeContact.displayName} can read them.
            </p>
          </div>
        ) : (
          contactMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm safe-bottom">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className={cn(
                "w-full resize-none rounded-xl bg-secondary/50 border border-border/50",
                "px-4 py-3 text-sm placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "min-h-[48px] max-h-[120px]"
              )}
              rows={1}
            />
          </div>
          
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className={cn(
              "h-12 w-12 rounded-xl transition-all",
              inputValue.trim() 
                ? "bg-gradient-primary text-primary-foreground hover:opacity-90" 
                : "bg-secondary text-muted-foreground"
            )}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        
        {connectionMode === 'offline' && (
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Offline - messages will be queued and sent when connection is available
          </p>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isSent = message.direction === 'sent';
  
  return (
    <div className={cn(
      "flex message-appear",
      isSent ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-2.5 break-words",
        isSent 
          ? "bg-message-sent text-message-sent-foreground rounded-br-md" 
          : "bg-message-received text-message-received-foreground rounded-bl-md"
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        
        <div className={cn(
          "flex items-center gap-1 mt-1 text-xs",
          isSent ? "justify-end opacity-70" : "opacity-50"
        )}>
          <span>
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          
          {isSent && (
            <span className="ml-1">
              {message.status === 'pending' && <Clock className="w-3 h-3" />}
              {message.status === 'sent' && <Check className="w-3 h-3" />}
              {message.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
              {message.status === 'read' && <CheckCheck className="w-3 h-3 text-primary" />}
              {message.status === 'failed' && <AlertCircle className="w-3 h-3 text-destructive" />}
            </span>
          )}
          
          {message.deliveryMethod === 'p2p' && (
            <Radio className="w-3 h-3 ml-1 text-status-p2p" />
          )}
        </div>
      </div>
    </div>
  );
}
