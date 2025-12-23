import { User } from '../types';

class UserManager {
  private users: Map<string, User> = new Map();
  
  addUser(user: User) {
    this.users.set(user.userId, user);
    console.log(`👤 User joined: ${user.username} (Total: ${this.users.size})`);
  }
  
  removeUser(userId: string) {
    const user = this.users.get(userId);
    this.users.delete(userId);
    console.log(`👋 User left: ${user?.username} (Total: ${this.users.size})`);
    return user;
  }
  
  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }
  
  getUserBySocketId(socketId: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.socketId === socketId);
  }
  
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
  
  getAvailableUsers(): User[] {
    return Array.from(this.users.values()).filter(u => !u.isInCall);
  }
  
  setUserInCall(userId: string, inCall: boolean) {
    const user = this.users.get(userId);
    if (user) {
      user.isInCall = inCall;
      this.users.set(userId, user);
    }
  }
}

export const userManager = new UserManager();