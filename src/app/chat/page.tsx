'use client';
import React, { useState } from 'react';
import ContactsSidebar from './components/ContactsSidebar';
import ChatWindow from './components/ChatWindow';
import type { Contact } from './components/ContactsSidebar';
import UserSearchModal from './components/UserSearchModal';

export default function ChatPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [refreshContacts, setRefreshContacts] = useState(false);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-gray-100">
      <aside className="w-72 bg-white border-r border-gray-200  flex flex-col">
        <ContactsSidebar
          onSelectContact={setSelectedContact}
          onAddContact={() => setShowSearch(true)}
          refresh={refreshContacts}
        />
      </aside>
      <main className="flex-1 flex flex-col">
        {selectedContact ? (
          <ChatWindow contact={selectedContact} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-xl">
            Select a contact to start chatting
          </div>
        )}
      </main>
      <UserSearchModal
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onAdd={() => setRefreshContacts((v) => !v)}
      />
    </div>
  );
}
