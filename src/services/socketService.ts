import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private clerkUserId: string | null = null;

  connect(userId: string) {
    if (this.socket?.connected && this.clerkUserId === userId) {
      console.log('Socket already connected for user:', userId);
      return this.socket;
    }

    // Disconnect existing socket if user changed
    if (this.socket && this.clerkUserId !== userId) {
      this.disconnect();
    }

    // Remove /api suffix from base URL for Socket.IO connection
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const SOCKET_URL = baseUrl.replace(/\/api\/?$/, '');
    
    console.log('🔌 Connecting to Socket.IO server:', SOCKET_URL);
    
    this.socket = io(SOCKET_URL, {
      auth: {
        userId
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.clerkUserId = userId;

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket?.id);
      // Register user with their room
      this.socket?.emit('register', { userId });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.clerkUserId = null;
      console.log('Socket.IO disconnected manually');
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  // Emit events
  emit(event: string, data: unknown) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  }

  // Listen to events
  on(event: string, callback: (...args: unknown[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event: string, callback?: (...args: unknown[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();
