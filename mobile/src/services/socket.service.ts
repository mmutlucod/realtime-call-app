import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  
  connect(userId: string, username: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    this.socket.on('connect', () => {
      this.socket?.emit('user:join', { userId, username });
    });
    
    return this.socket;
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }
  
  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }
  
  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }
  
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();