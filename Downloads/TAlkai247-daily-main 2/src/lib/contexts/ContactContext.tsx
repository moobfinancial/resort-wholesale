import React, { createContext, useContext, useState } from 'react';

interface ContactContextType {
  showAddContactModal: boolean;
  setShowAddContactModal: (show: boolean) => void;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

export function ContactProvider({ children }: { children: React.ReactNode }) {
  const [showAddContactModal, setShowAddContactModal] = useState(false);

  return (
    <ContactContext.Provider value={{ showAddContactModal, setShowAddContactModal }}>
      {children}
    </ContactContext.Provider>
  );
}

export function useContactContext() {
  const context = useContext(ContactContext);
  if (context === undefined) {
    throw new Error('useContactContext must be used within a ContactProvider');
  }
  return context;
}