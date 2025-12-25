import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, IncomingCall, CurrentUser, CallType } from '../types';

interface CallStore {

  currentUser: CurrentUser | null;
  onlineUsers: User[];
  
  isInCall: boolean;
  callType: CallType | null;
  otherUser: User | null;
  
  incomingCall: IncomingCall | null;
  setCurrentUser: (user: CurrentUser) => void;
  setOnlineUsers: (users: User[]) => void;
  startCall: (user: User, callType: CallType) => void;
  endCall: () => void;
  setIncomingCall: (call: IncomingCall | null) => void;
  clearIncomingCall: () => void;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useCallStore = create<CallStore>((set, get) => ({
  currentUser: null,
  onlineUsers: [],
  isInCall: false,
  callType: null,
  otherUser: null,
  incomingCall: null,
  
  setCurrentUser: (user) => {
    AsyncStorage.setItem('user', JSON.stringify(user));
    set({ currentUser: user });
  },
  
  setOnlineUsers: (users) => {
    set({ onlineUsers: users });
  },
  
  startCall: (user, callType) => {
    set({
      isInCall: true,
      callType,
      otherUser: user,
    });
  },
  
  endCall: () => {
    set({
      isInCall: false,
      callType: null,
      otherUser: null,
    });
  },
  
  setIncomingCall: (call) => {
    set({ incomingCall: call });
  },
  
  clearIncomingCall: () => {
    set({ incomingCall: null });
  },
  
  loadUser: async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        set({ currentUser: user });
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('user');
    set({
      currentUser: null,
      onlineUsers: [],
      isInCall: false,
      callType: null,
      otherUser: null,
      incomingCall: null,
    });
  },
}));