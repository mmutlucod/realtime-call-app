import { Server, Socket } from 'socket.io';
import { userManager } from './user-manager';
import { pushNotificationService } from '../services/push-notification';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('socket connected:', socket.id);
    socket.on('user:join', ({ userId, username }) => {
      userManager.addUser({
        socketId: socket.id,
        userId,
        username,
        isInCall: false
      });
      
      io.emit('users:list', userManager.getAvailableUsers());
    });
    socket.on('user:register-push-token', ({ userId, pushToken }) => {
      userManager.updatePushToken(userId, pushToken);
    })
    socket.on('call:initiate', async ({ from, to, callType, offer }) => {
      console.log(`call from ${from} to ${to}`);
      const targetUser = userManager.getUser(to);
      const caller = userManager.getUser(from);
      
      if (targetUser && !targetUser.isInCall) {
        io.to(targetUser.socketId).emit('call:incoming', {
          from,
          callType,
          offer,
          caller: caller
        });
        
        if (targetUser.pushToken && caller) {
          await pushNotificationService.sendCallNotification(
            targetUser.pushToken,
            caller.username,
            callType
          );
        }
      }
    });
    
    socket.on('call:accept', ({ from, to, answer }) => {
      console.log(`call accepted: ${from} <-> ${to}`);
      const caller = userManager.getUser(from);
      if (caller) {
        userManager.setUserInCall(from, true);
        userManager.setUserInCall(to, true);
        
        io.to(caller.socketId).emit('call:accepted', { answer });
        io.emit('users:list', userManager.getAvailableUsers());
      }
    });
    
    socket.on('call:reject', ({ from }) => {
      console.log(`call rejected by user`);
      const caller = userManager.getUser(from);
      if (caller) {
        io.to(caller.socketId).emit('call:rejected');
      }
    });
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
    socket.on('webrtc:ice-candidate', ({ to, candidate }) => {
      const targetUser = userManager.getUser(to);
      if (targetUser) {
        io.to(targetUser.socketId).emit('webrtc:ice-candidate', { candidate });
      }
    });

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