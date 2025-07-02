'use client';
import React, { useState, useEffect, useRef } from 'react';
import ContactsSidebar from './components/ContactsSidebar';
import ChatWindow from './components/ChatWindow';
import type { Contact } from './components/ContactsSidebar';
import UserSearchModal from './components/UserSearchModal';

export default function ChatPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [refreshContacts, setRefreshContacts] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Prevent background scroll when sidebar or modal is open
  useEffect(() => {
    if (sidebarOpen || showSearch) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    // Listen for nav event to open sidebar
    const handler = () => setSidebarOpen(true);
    window.addEventListener('open-contacts-sidebar', handler);
    return () => {
      document.body.classList.remove('overflow-hidden');
      window.removeEventListener('open-contacts-sidebar', handler);
    };
  }, [sidebarOpen, showSearch]);

  // Swipe gesture for opening sidebar
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = () => {
      if (
        touchStartX.current !== null &&
        touchEndX.current !== null &&
        touchStartX.current < 40 && // Only from left edge
        touchEndX.current - touchStartX.current > 60 // Swipe right
      ) {
        setSidebarOpen(true);
      }
      touchStartX.current = null;
      touchEndX.current = null;
    };
    const main = document.getElementById('main-chat-area');
    if (main) {
      main.addEventListener('touchstart', handleTouchStart);
      main.addEventListener('touchmove', handleTouchMove);
      main.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      if (main) {
        main.removeEventListener('touchstart', handleTouchStart);
        main.removeEventListener('touchmove', handleTouchMove);
        main.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-gray-100 flex-col md:flex-row overflow-hidden max-w-full">
      {/* Sidebar: show on md+, or as overlay on mobile */}
      <aside
        className={`bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300 md:relative md:static fixed top-[64px] left-0 h-[calc(100vh-64px)] w-64 md:w-72 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:block`}
        style={{ maxHeight: '100vh' }}
      >
        <ContactsSidebar
          onSelectContact={(contact) => {
            setSelectedContact(contact);
            setSidebarOpen(false); // close sidebar on mobile after selecting
          }}
          onAddContact={() => setShowSearch(true)}
          refresh={refreshContacts}
        />
      </aside>
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <main id="main-chat-area" className="flex-1 flex flex-col min-h-0 touch-pan-y">
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
