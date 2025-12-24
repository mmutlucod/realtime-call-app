// src/services/webrtc.service.ts
import {
  MediaStream,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from 'react-native-webrtc';

const ICE_SERVERS = {
  iceServers: [
    // STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    
    // TURN servers (ücretsiz)
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
  
  // Kamera/mikrofonu aç
  async startLocalStream(isVideo: boolean): Promise<MediaStream> {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
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
      console.log('✅ Local stream started:', stream.id);
      return stream;
    } catch (error) {
      console.error('❌ Local stream error:', error);
      throw error;
    }
  }
  
  // Peer connection başlat
  async initializePeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
      console.log('✅ Peer connection initialized');
      
      // Local stream'i peer'a ekle
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection?.addTrack(track, this.localStream!);
        });
        console.log('✅ Local tracks added to peer');
      }
      
      // Remote stream geldiğinde
      this.peerConnection.ontrack = (event) => {
        console.log('📹 Remote track received:', event.track.kind);
        if (event.streams && event.streams[0]) {
          // ✅ Stream'i store et
          this.remoteStream = event.streams[0];
          console.log('✅ Remote stream stored in service:', this.remoteStream.id);
          
          // ✅ Callback'i çağır
          if (this.onRemoteStreamCallback) {
            console.log('✅ Calling remote stream callback');
            this.onRemoteStreamCallback(event.streams[0]);
          } else {
            console.log('⚠️ No remote stream callback set!');
          }
        }
      };
      
      // ICE candidate bulunduğunda
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate found');
          this.onIceCandidateCallback?.(event.candidate);
        }
      };
      
      // Connection state
      this.peerConnection.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', this.peerConnection?.connectionState);
        
        // Bağlantı başarısız olduğunda
        if (this.peerConnection?.connectionState === 'failed') {
          console.log('❌ Connection failed, attempting ICE restart...');
          this.peerConnection?.restartIce();
        }
      };
      
      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('🧊 ICE state:', this.peerConnection?.iceConnectionState);
        
        // ICE bağlantısı başarısız olduğunda
        if (this.peerConnection?.iceConnectionState === 'failed') {
          console.log('❌ ICE connection failed');
        }
      };
      
    } catch (error) {
      console.error('❌ Peer connection error:', error);
      throw error;
    }
  }
  
  // Arayan kişi - Offer oluştur
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await this.peerConnection.setLocalDescription(offer);
      console.log('✅ Offer created and set as local description');
      
      return offer;
    } catch (error) {
      console.error('❌ Create offer error:', error);
      throw error;
    }
  }
  
  // Aranan kişi - Answer oluştur
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      console.log('✅ Remote offer set');
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log('✅ Answer created and set as local description');
      
      return answer;
    } catch (error) {
      console.error('❌ Create answer error:', error);
      throw error;
    }
  }
  
  // Arayan kişi - Answer'ı al
  async setRemoteAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    // Eğer zaten remote description set edilmişse, tekrar set etme
    if (this.peerConnection.currentRemoteDescription) {
      console.log('⚠️ Remote description already set, skipping...');
      return;
    }
    
    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      console.log('✅ Remote answer set');
    } catch (error) {
      console.error('❌ Set remote answer error:', error);
      throw error;
    }
  }
  
  // ICE candidate ekle
  async addIceCandidate(candidate: RTCIceCandidate) {
    if (this.peerConnection) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ ICE candidate added');
      } catch (error) {
        console.error('❌ Add ICE candidate error:', error);
      }
    }
  }
  
  // Callbacks
  onRemoteStream(callback: (stream: MediaStream) => void) {
    console.log('📝 Setting remote stream callback');
    this.onRemoteStreamCallback = callback;
    
    // ✅ Eğer remote stream zaten varsa, hemen çağır
    if (this.remoteStream) {
      console.log('✅ Remote stream already exists, calling callback immediately');
      callback(this.remoteStream);
    }
  }
  
  onIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
    this.onIceCandidateCallback = callback;
  }
  
  // Toggle controls
  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('🎤 Audio:', audioTrack.enabled ? 'ON' : 'OFF');
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
        console.log('📹 Video:', videoTrack.enabled ? 'ON' : 'OFF');
        return videoTrack.enabled;
      }
    }
    return false;
  }
  
  switchCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        // @ts-ignore - react-native-webrtc specific method
        videoTrack._switchCamera();
        console.log('📷 Camera switched');
      }
    }
  }
  
 closeConnection() {
  console.log('🧹 Cleaning up WebRTC...');
  
  if (this.localStream) {
    this.localStream.getTracks().forEach((track) => {
      track.stop();
    });
    this.localStream = null;
  }
  
  if (this.peerConnection) {
    this.peerConnection.close();
    this.peerConnection = null;
  }
  
  this.remoteStream = null;
  
  // ✅ Callback'leri SİLME - bir sonraki aramada yeniden set edilecek
  // this.onRemoteStreamCallback = undefined;  // ❌ KALDIR
  // this.onIceCandidateCallback = undefined;  // ❌ KALDIR
  
  console.log('✅ WebRTC cleaned up');
}
}

export const webRTCService = new WebRTCService();