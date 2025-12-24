// app/call/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallStore } from '../../src/store/call-store';
import { socketService } from '../../src/services/socket.service';
import { webRTCService } from '../../src/services/webrtc.service';
import VideoView from '../../src/components/video-view';
import CallControls from '../../src/components/call-controls';
import { MediaStream } from 'react-native-webrtc';

export default function CallScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { currentUser, otherUser, callType, endCall } = useCallStore();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  
  useEffect(() => {
    console.log('🎬 Call screen mounted');
    
    if (!currentUser || !otherUser) {
      console.log('❌ No user data, redirecting to lobby');
      router.replace('/lobby');
      return;
    }
    
    console.log(`📞 Call with ${otherUser.username}, type: ${callType}`);
    
    // ✅ 1. Local stream'i al
    if (webRTCService.localStream) {
      console.log('✅ Setting local stream from service');
      setLocalStream(webRTCService.localStream);
    } else {
      console.log('⚠️ No local stream in service');
    }
    
    // ✅ 2. Remote stream zaten varsa al
    if (webRTCService.remoteStream) {
      console.log('✅ Remote stream already exists in service, setting it');
      setRemoteStream(webRTCService.remoteStream);
    } else {
      console.log('⚠️ No remote stream in service yet');
    }
    
    // ✅ 3. Remote stream callback'ini ayarla (zaten varsa hemen çağrılır)
    webRTCService.onRemoteStream((stream) => {
      console.log('📹 Remote stream callback triggered in call screen');
      setRemoteStream(stream);
    });
    
    // Karşı taraf aramayı kapattı
    const handleCallEnded = () => {
      console.log('📴 Call ended by other user');
      handleEndCall(false);
    };
    
    socketService.on('call:ended', handleCallEnded);
    
    // Call duration timer
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    
    return () => {
      console.log('🎬 Call screen unmounting');
      clearInterval(timer);
      socketService.off('call:ended', handleCallEnded); // ✅ CLEANUP
    };
  }, []);
  
  // Debug render
  useEffect(() => {
    console.log('🖼️ Call screen render:', {
      hasLocalStream: !!localStream,
      hasRemoteStream: !!remoteStream,
      localStreamId: localStream?.id,
      remoteStreamId: remoteStream?.id,
    });
  }, [localStream, remoteStream]);
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleToggleAudio = () => {
    webRTCService.toggleAudio();
  };
  
  const handleToggleVideo = () => {
    webRTCService.toggleVideo();
  };
  
  const handleSwitchCamera = () => {
    webRTCService.switchCamera();
  };
  
  const handleEndCall = (emitToServer = true) => {
    if (emitToServer) {
      socketService.emit('call:end', {
        userId: currentUser?.userId,
        otherUserId: otherUser?.userId,
      });
    }
    
    webRTCService.closeConnection();
    endCall();
    router.replace('/lobby');
  };
  
  const confirmEndCall = () => {
    Alert.alert('Aramayı Sonlandır', 'Aramayı sonlandırmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sonlandır', style: 'destructive', onPress: () => handleEndCall(true) },
    ]);
  };
  
  return (
    <View style={styles.container}>
      {/* Remote Video (Büyük ekran) */}
      {remoteStream ? (
        <>
          {console.log('✅ Rendering remote video')}
          <VideoView stream={remoteStream} />
        </>
      ) : (
        <>
          {console.log('⏳ Waiting for remote stream')}
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingEmoji}>⏳</Text>
            <Text style={styles.waitingText}>Bağlanıyor...</Text>
          </View>
        </>
      )}
      
      {/* Local Video (Küçük preview) */}
      {callType === 'video' && localStream && (
        <>
          {console.log('✅ Rendering local video')}
          <VideoView stream={localStream} isLocal={true} />
        </>
      )}
      
      {/* Call Info */}
      <View style={styles.callInfo}>
        <Text style={styles.callerName}>{otherUser?.username}</Text>
        <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
      </View>
      
      {/* Controls */}
      <CallControls
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onSwitchCamera={handleSwitchCamera}
        onEndCall={confirmEndCall}
        isVideo={callType === 'video'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  waitingEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  waitingText: {
    fontSize: 20,
    color: '#fff',
  },
  callInfo: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  callerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  callDuration: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});