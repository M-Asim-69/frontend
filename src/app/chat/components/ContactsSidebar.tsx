'use client';
import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import Image from 'next/image';

export interface Contact {
  id: number;
  username: string;
  email: string;
  profileImage?: string;
}

// Add type for pending request API response
interface PendingRequestApi {
  id: number;
  sender: Contact;
}

export default function ContactsSidebar({
  onSelectContact,
  onAddContact,
  refresh,
}: {
  onSelectContact: (contact: Contact) => void;
  onAddContact: () => void;
  refresh: boolean;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingError, setPendingError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [internalRefresh, setInternalRefresh] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/contact/list')
      .then((res) => {
        setContacts(res.data.contacts || res.data || []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load contacts');
      })
      .finally(() => setLoading(false));
  }, [refresh, internalRefresh]);

  useEffect(() => {
    setPendingLoading(true);
    setPendingError('');
    api
      .get('/contact/requests')
      .then((res) => {
        // Map the API response to a flat array of sender info for UI
        const requests = (res.data.requests || res.data || []).map(
          (req: PendingRequestApi) => ({
            id: req.id,
            username: req.sender.username,
            email: req.sender.email,
            profileImage: req.sender.profileImage,
          })
        );
        setPendingRequests(requests);
      })
      .catch((err: unknown) => {
        const error = err as { response?: { data?: { message?: string } } };
        setPendingError(
          error.response?.data?.message || 'Failed to load pending requests'
        );
      })
      .finally(() => setPendingLoading(false));
  }, [refresh, internalRefresh]);

  // Listen for contacts_updated socket event
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => setInternalRefresh((r) => !r);
    socket.on('contacts_updated', handler);
    return () => {
      socket.off('contacts_updated', handler);
    };
  }, []);

  const handleAccept = async (id: number) => {
    setActionLoading(id);
    try {
      await api.patch(`/contact/accept/${id}`);
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await api.delete(`/contact/reject/${id}`);
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 rounded-xl shadow-lg p-2 md:p-4 border border-blue-100 w-full md:w-auto">
      <div className="font-bold text-base md:text-lg mb-2 md:mb-4 text-gray-800">Contacts</div>
      {/* Pending Requests Section */}
      <div className="mb-4 md:mb-6">
        <div className="font-semibold text-sm md:text-md text-blue-800 mb-1 md:mb-2 flex items-center gap-2">
          Pending Requests
          {pendingLoading && (
            <span className="ml-2 text-xs text-blue-400">Loading...</span>
          )}
        </div>
        {pendingError && (
          <div className="text-red-500 text-xs mb-2">{pendingError}</div>
        )}
        {!pendingLoading && !pendingError && pendingRequests.length === 0 && (
          <div className="text-blue-300 text-xs">No pending requests</div>
        )}
        <ul>
          {pendingRequests.map((req) => (
            <li
              key={req.id}
              className="flex flex-col items-center gap-2 md:gap-3 py-2 px-2 md:px-3 rounded-lg bg-blue-50 mb-2 border border-blue-100"
            >
              <div className="flex flex-row gap-2">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border border-blue-300 bg-blue-50 text-blue-700 font-bold text-base md:text-lg select-none overflow-hidden">
                  {req.profileImage ? (
                    <Image
                      src={req.profileImage}
                      alt={req.username}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    req.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-blue-900 truncate">
                    {req.username}
                  </div>
                  <div className="text-xs text-blue-500 truncate">
                    {req.email}
                  </div>
                </div>
              </div>
              <div className="flex">
                <button
                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs disabled:opacity-60"
                  onClick={() => handleAccept(req.id)}
                  disabled={actionLoading === req.id}
                  title="Accept"
                >
                  {actionLoading === req.id ? '...' : 'Accept'}
                </button>
                <button
                  className="px-2 py-1 bg-slate-100 text-blue-700 rounded hover:bg-blue-200 text-xs disabled:opacity-60 ml-1"
                  onClick={() => handleReject(req.id)}
                  disabled={actionLoading === req.id}
                  title="Reject"
                >
                  {actionLoading === req.id ? '...' : 'Reject'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Contacts List Section */}
      {loading && (
        <div className="text-blue-400 text-center mt-8">Loading...</div>
      )}
      {error && <div className="text-red-500 text-center mt-8">{error}</div>}
      {!loading && !error && contacts.length === 0 && (
        <div className="text-blue-300 text-center mt-8">No contacts yet</div>
      )}
      <ul>
        {contacts.map((contact) => (
          <li
            key={contact.id}
            className="py-2 px-3 rounded-lg hover:bg-blue-100 cursor-pointer flex items-center gap-3 transition group"
            onClick={() => onSelectContact(contact)}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border border-blue-300 bg-blue-50 text-blue-700 font-bold text-lg select-none overflow-hidden group-hover:scale-105 transition-transform">
                {contact.profileImage ? (
                  <Image
                    src={contact.profileImage}
                    alt={contact.username}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  contact.username?.charAt(0).toUpperCase() || '?'
                )}
              </div>
              {/* Status dot (example: online) */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-blue-900 truncate">
                {contact.username}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {/* Floating Action Button for Add Contact */}
      <button
        className="fixed md:static bottom-6 right-6 md:mt-4 md:w-full flex items-center justify-center md:justify-center py-4 md:py-2 px-4 md:px-0 bg-blue-600 text-white rounded-full md:rounded-lg shadow-lg hover:bg-blue-700 transition z-50 text-2xl md:text-base gap-2 md:gap-0"
        onClick={onAddContact}
        aria-label="Add Contact"
        style={{ minWidth: '48px', minHeight: '48px' }}
      >
        <span className="material-icons md:hidden">add</span>
        <span className="hidden md:inline">+ Add Contact</span>
      </button>
    </div>
  );
}
