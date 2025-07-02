'use client';
import React, { useEffect, useRef, useState } from 'react';
import api from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import type { Contact } from './ContactsSidebar';

interface Message {
  id: number;
  sender: { id: number; username: string };
  receiver: { id: number; username: string };
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatWindow({ contact }: { contact: Contact }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('user') || '{}')
      : {};
  // Edit message state
  const [editingId, setEditingId] = useState<number | null>(null);

  // Fetch chat history (on mount/contact change only)
  useEffect(() => {
    if (!contact || !user.username) return;
    setLoading(true);
    setError('');
    api
      .get(
        `/chat/history?userA=${user.username}&userB=${contact.username}&page=1&limit=50`
      )
      .then((res) => {
        // Support both array and { messages: [...] }
        const msgs = Array.isArray(res.data)
          ? res.data
          : res.data.messages || res.data || [];
        setMessages(msgs);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load messages');
      })
      .finally(() => setLoading(false));
  }, [contact, user.username]);

  // Socket.io for real-time messages
  useEffect(() => {
    if (!contact || !user.username) return;
    const socket = getSocket();
    if (!socket) return;

    // Handler for new messages
    const handleNewMessage = (msg: Message) => {
      if (
        (msg.sender.username === user.username &&
          msg.receiver.username === contact.username) ||
        (msg.sender.username === contact.username &&
          msg.receiver.username === user.username)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    // Handler for message edits
    const handleMessageEdited = (data: {
      messageId: number;
      newMessage: string;
      editedAt: string;
    }) => {
      setMessages((msgs) =>
        msgs.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, message: data.newMessage, updatedAt: data.editedAt }
            : msg
        )
      );
    };

    // Handler for message deletes
    const handleMessageDeleted = (data: {
      messageId: number;
      deletedAt: string;
    }) => {
      setMessages((msgs) => msgs.filter((msg) => msg.id !== data.messageId));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [contact?.username, user.username]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Edit message handler
  const handleEdit = async () => {
    if (!input.trim() || editingId === null) return;
    try {
      await api.patch(`/chat/edit/${editingId}`, { message: input });
      setMessages((msgs) =>
        msgs.map((msg) =>
          msg.id === editingId ? { ...msg, message: input } : msg
        )
      );
      setEditingId(null);
      setInput('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to edit message');
    }
  };

  // Delete message handler
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/chat/delete/${id}`);
      setMessages((msgs) => msgs.filter((msg) => msg.id !== id));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to delete message');
    }
  };

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (editingId !== null) {
      await handleEdit();
      return;
    }
    setSending(true);
    try {
      // Call REST API to save and trigger real-time event
      await api.post('/chat/send', {
        receiverUsername: contact.username,
        message: input,
      });
      setInput('');
      // Do NOT refetch history here; rely on socket event for real-time update
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Dropdown state for triple dot menu
  const [dropdownId, setDropdownId] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />
      {/* Blue overlay for consistency */}
      <div className="absolute inset-0 z-0 bg-blue-900/40 backdrop-blur-sm" />
      {/* Chat content */}
      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Header - fixed */}
        <div className="h-16 md:h-20 flex items-center px-3 md:px-6 border-b border-blue-100 bg-white/90 shadow-sm sticky top-0 z-20">
          <div className="flex items-center space-x-2 md:space-x-3 w-full justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border border-blue-300 bg-blue-50 text-blue-700 font-bold text-base md:text-lg select-none overflow-hidden">
                {contact.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="font-semibold text-blue-900 text-base md:text-lg leading-tight">
                  {contact.username}
                </h2>
                <div className="text-xs text-blue-400 font-medium md:mt-1 mt-0.5">Chatting as {user.username || 'You'}</div>
              </div>
            </div>
            {/* Optionally, add more header actions here */}
          </div>
        </div>
        {/* Messages Container - scrollable and sticky between header and input */}
        <div className="flex-1 overflow-y-auto p-2 md:p-4" style={{ minHeight: 0 }}>
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading messages...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-32">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-center max-w-md">
                <div className="font-medium mb-1">Error</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-blue-400">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-8 h-8 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="font-medium">No messages yet</p>
                <p className="text-sm mt-1">Start the conversation!</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.sender.username === user.username;
              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${
                    isMe ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`relative max-w-[75%] flex flex-col ${
                      isMe ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`group px-4 py-3 rounded-2xl shadow-sm text-sm whitespace-pre-line break-words transition-all duration-200 hover:shadow-md ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white text-blue-900 border border-blue-100 rounded-bl-md'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 leading-relaxed">
                          {msg.message}
                        </div>
                        {isMe && (
                          <div className="relative">
                            <button
                              className=" group-hover:opacity-100 z-50 text-white/70 hover:text-white text-lg px-1 focus:outline-none transition-opacity duration-200 rounded hover:bg-white/10"
                              onClick={() =>
                                setDropdownId(
                                  dropdownId === msg.id ? null : msg.id
                                )
                              }
                            >
                              &#8942;
                            </button>
                            {dropdownId === msg.id && (
                              <div className="absolute right-0 mt-1 w-28 bg-white border border-blue-100 rounded-lg shadow-lg z-50 overflow-hidden">
                                <button
                                  className="block w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 transition-colors duration-150"
                                  onClick={() => {
                                    setEditingId(msg.id);
                                    setInput(msg.message);
                                    setDropdownId(null);
                                  }}
                                >
                                  <span className="flex items-center space-x-2">
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                    <span>Edit</span>
                                  </span>
                                </button>
                                <button
                                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                                  onClick={() => {
                                    handleDelete(msg.id);
                                    setDropdownId(null);
                                  }}
                                >
                                  <span className="flex items-center space-x-2">
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    <span>Delete</span>
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex items-center space-x-2 mt-1 px-3 ${
                        isMe ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <span
                        className={`text-xs font-medium ${
                          isMe ? 'text-blue-600' : 'text-blue-700'
                        }`}
                      >
                        {isMe ? 'You' : msg.sender.username}
                      </span>
                      <span className="text-xs text-blue-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
        {/* Input Form - fixed at bottom */}
        <div className="p-2 md:p-4 bg-white border-t border-slate-200 shadow-sm sticky bottom-0 z-20">
          {editingId !== null && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-700 text-sm">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="font-medium">Editing message</span>
              </div>
            </div>
          )}
          <form onSubmit={handleSend} className="flex gap-2 md:gap-3 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                className="w-full px-4 py-3 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-gray-900 placeholder-slate-400 transition-all duration-200 text-base md:text-lg shadow-sm"
                placeholder={
                  editingId !== null
                    ? 'Edit your message...'
                    : 'Type a message...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
                autoFocus
              />
            </div>
            {editingId !== null ? (
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={sending}
                >
                  {sending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  type="button"
                  className="px-4 py-3 bg-slate-500 text-white rounded-full hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 font-medium"
                  onClick={() => {
                    setEditingId(null);
                    setInput('');
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2 shadow-md"
                disabled={sending || !input.trim()}
                aria-label="Send message"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </>
                )}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
