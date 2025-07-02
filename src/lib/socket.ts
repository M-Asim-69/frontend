import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

// Use /chat namespace to match your backend
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000/chat';

let socket: Socket | null = null;

export const getSocket = () => {
  const token = Cookies.get('authToken');

  if (!token) {
    console.warn('No auth token found for socket connection.');
    return null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      forceNew: true,
    });

    // Connect immediately
    socket.connect();

    // Debug event listeners
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Real-time chat events
    socket.on('new_message', (msg) => {
      console.log('New message received:', msg);
      // TODO: Update your chat UI state here
    });

    socket.on('message_edited', (data) => {
      console.log('Message edited:', data);
      // TODO: Update the message in your chat UI
    });

    socket.on('message_deleted', (data) => {
      console.log('Message deleted:', data);
      // TODO: Remove the message from your chat UI
    });

    socket.on('contact_accepted', (data) => {
      console.log('accepted request', data);
    });
    // Remove this, as the backend does not emit 'send_message'
    // socket.on('send_message', (data) => {
    //   console.log('message sended:', data);
    // });
  } else {
    // If reusing, update the token if it changed
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
};
