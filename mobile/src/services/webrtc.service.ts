import {
  MediaStream,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from 'react-native-webrtc';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onIceCandidateCallback?: (candidate: RTCIceCandidate) => void;
  
  async startLocalStream(isVideo: boolean): Promise<MediaStream> {
    // @ts-ignore
    const stream = await mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }as any,
      video: isVideo
        ? {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          }
        : false,
    });
    
    this.localStream = stream;
    return stream;
  }
  
  async initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }
    
    // @ts-ignore
    this.peerConnection.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.onRemoteStreamCallback?.(event.streams[0]);
      }
    };
    
    // @ts-ignore
    this.peerConnection.onicecandidate = (event: any) => {
      if (event.candidate) {
        this.onIceCandidateCallback?.(event.candidate);
      }
    };
    
    // @ts-ignore
    this.peerConnection.onconnectionstatechange = () => {
      // @ts-ignore
      const state = this.peerConnection?.connectionState;
      
      if (state === 'failed') {
        // @ts-ignore
        this.peerConnection?.restartIce();
      } else if (state === 'disconnected') {
        setTimeout(() => {
          // @ts-ignore
          if (this.peerConnection?.connectionState === 'disconnected') {
            // @ts-ignore
            this.peerConnection?.restartIce();
          }
        }, 5000);
      }
    };
    
    // @ts-ignore
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection?.iceConnectionState === 'failed') {
        // @ts-ignore
        this.peerConnection?.restartIce();
      }
    };
  }
  
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }
  
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer as any));
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    return answer;
  }
  
  async setRemoteAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    // @ts-ignore
    if (this.peerConnection.currentRemoteDescription) return;
    
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer as any));
  }
  
  async addIceCandidate(candidate: RTCIceCandidate) {
    if (this.peerConnection) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate as any));
      } catch (error) {
        // Ignore
      }
    }
  }
  
  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
    
    if (this.remoteStream) {
      callback(this.remoteStream);
    }
  }
  
  onIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
    this.onIceCandidateCallback = callback;
  }
  
  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }
  
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }
  
  switchCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        // @ts-ignore
        videoTrack._switchCamera();
      }
    }
  }
  
  closeConnection() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    this.remoteStream = null;
    this.onRemoteStreamCallback = undefined;
    this.onIceCandidateCallback = undefined;
  }
}

export const webRTCService = new WebRTCService();