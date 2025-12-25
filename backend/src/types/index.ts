export interface User {
  socketId: string;
  userId: string;
  username: string;
  isInCall: boolean;
   pushToken?: string;
}

export interface CallOffer {
  from: string;
  to: string;
  offer: any;
  callType: 'audio' | 'video';
}

export interface CallAnswer {
  from: string;
  to: string;
  answer: any;
}

export interface IceCandidate {
  to: string;
  candidate: any;
}