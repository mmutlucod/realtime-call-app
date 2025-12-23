// src/types/index.ts
export interface User {
  socketId: string;
  userId: string;
  username: string;
  isInCall: boolean;
}

export interface IncomingCall {
  from: string;
  caller: User;
  callType: 'audio' | 'video';
  offer: RTCSessionDescriptionInit;
}

export interface CurrentUser {
  userId: string;
  username: string;
}

export type CallType = 'audio' | 'video';