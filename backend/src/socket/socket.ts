import { Server, Socket } from 'socket.io';
import { userManager } from './user-manager';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('🔌 Socket connected:', socket.id);
    
    // Kullanıcı lobby'e katıldı
    socket.on('user:join', ({ userId, username }) => {
      userManager.addUser({
        socketId: socket.id,
        userId,
        username,
        isInCall: false
      });
      
      // Tüm kullanıcılara güncel listeyi gönder
      io.emit('users:list', userManager.getAvailableUsers());
    });
    
    // Arama başlatma
    socket.on('call:initiate', ({ from, to, callType, offer }) => {
      console.log(`📞 Call from ${from} to ${to}`);
      const targetUser = userManager.getUser(to);
      if (targetUser && !targetUser.isInCall) {
        io.to(targetUser.socketId).emit('call:incoming', {
          from,
          callType,
          offer,
          caller: userManager.getUser(from)
        });
      }
    });
    
    // Aramayı kabul et
    socket.on('call:accept', ({ from, to, answer }) => {
      console.log(`✅ Call accepted: ${from} <-> ${to}`);
      const caller = userManager.getUser(from);
      if (caller) {
        userManager.setUserInCall(from, true);
        userManager.setUserInCall(to, true);
        
        io.to(caller.socketId).emit('call:accepted', { answer });
        io.emit('users:list', userManager.getAvailableUsers());
      }
    });
    
    // Aramayı reddet
    socket.on('call:reject', ({ from }) => {
      console.log(`❌ Call rejected by user`);
      const caller = userManager.getUser(from);
      if (caller) {
        io.to(caller.socketId).emit('call:rejected');
      }
    });
    
    // Arama bitti
    socket.on('call:end', ({ userId, otherUserId }) => {
      console.log(`📴 Call ended: ${userId} <-> ${otherUserId}`);
      userManager.setUserInCall(userId, false);
      userManager.setUserInCall(otherUserId, false);
      
      const otherUser = userManager.getUser(otherUserId);
      if (otherUser) {
        io.to(otherUser.socketId).emit('call:ended');
      }
      
      io.emit('users:list', userManager.getAvailableUsers());
    });
    
    // WebRTC ICE Candidate
    socket.on('webrtc:ice-candidate', ({ to, candidate }) => {
      const targetUser = userManager.getUser(to);
      if (targetUser) {
        io.to(targetUser.socketId).emit('webrtc:ice-candidate', { candidate });
      }
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      const user = userManager.getUserBySocketId(socket.id);
      if (user) {
        userManager.removeUser(user.userId);
        io.emit('users:list', userManager.getAvailableUsers());
      }
      console.log('🔌 Socket disconnected:', socket.id);
    });
  });
};