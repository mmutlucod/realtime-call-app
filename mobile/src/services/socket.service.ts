// src/services/socket.service.ts
import { io, Socket } from 'socket.io-client';

// ⚠️ KENDİ LOCAL IP ADRESİNİ YAZ! (cmd'de ipconfig yaz, IPv4 adresini kopyala)
const SOCKET_URL = 'http://192.168.1.113:3000'; // <-- BURAYA KENDİ IP'NI YAZ

class SocketService {
  private socket: Socket | null = null;
  
  connect(userId: string, username: string): Socket {
    if (this.socket?.connected) {
      console.log('⚠️ Already connected');
      return this.socket;
    }
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.socket?.emit('user:join', { userId, username });
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });
    
    return this.socket;
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket disconnected manually');
    }
  }
  
  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.error('❌ Socket not connected, cannot emit:', event);
    }
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