import { MessagingProvider } from '@/contexts/MessagingContext';
import { MessengerApp } from '@/components/MessengerApp';

const Index = () => {
  return (
    <MessagingProvider>
      <MessengerApp />
    </MessagingProvider>
  );
};

export default Index;
