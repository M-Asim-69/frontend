'use client';
import React, { useState } from 'react';
import api from '../../../lib/api';
import Image from 'next/image';

interface User {
  id: number;
  username: string;
  email: string;
  profileImage?: string;
}

export default function UserSearchModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!open) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.get(
        `/user/search?query=${encodeURIComponent(query)}`
      );
      setResults(res.data.users || res.data || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const sendContactRequest = async (userId: number) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/contact/request', { receiverId: userId });
      setSuccess('Contact request sent!');
      onAdd();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg p-3 md:p-6 w-full max-w-xs md:max-w-md relative border border-blue-200 animate-fade-in mx-2">
        <button
          className="absolute top-2 right-2 text-blue-500 hover:text-blue-700 text-xl md:text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-base md:text-lg font-bold mb-2 md:mb-4 text-blue-700">Add Contact</h2>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row mb-2 md:mb-4 gap-2 md:gap-0">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full px-3 md:px-4 py-2 border border-blue-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50 text-blue-900 placeholder-blue-400 text-sm md:text-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-all font-bold text-sm md:text-base"
          >
            Search
          </button>
        </form>
        {loading && (
          <div className="text-blue-500 text-center mb-2">Loading...</div>
        )}
        {error && <div className="text-red-500 text-center mb-2">{error}</div>}
        {success && (
          <div className="text-green-500 text-center mb-2">{success}</div>
        )}
        <ul className="max-h-60 overflow-y-auto">
          {results.map((user) => (
            <li
              key={user.id}
              className="p-2 hover:bg-blue-50 flex justify-between items-center transition-all duration-200 animate-fade-in rounded"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center border border-blue-300 bg-blue-100 text-blue-700 font-bold text-base select-none overflow-hidden">
                  {user.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt={user.username}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    user.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <div>
                  <div className="font-medium text-blue-900">
                    {user.username}
                  </div>
                </div>
              </div>
              <button
                className="ml-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-bold transition-all"
                onClick={() => sendContactRequest(user.id)}
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
