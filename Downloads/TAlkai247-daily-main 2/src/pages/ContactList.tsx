import ContactList from '../components/ContactList';
import { ContactProvider } from '@/lib/contexts/ContactContext';

export default function ContactListPage() {
  return (
    <ContactProvider>
      <div className="min-h-screen">
        <ContactList />
      </div>
    </ContactProvider>
  );
}