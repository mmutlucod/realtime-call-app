import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView } from 'react-native';
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
  
  const stableLocalStream = useMemo(() => localStream, [localStream?.id]);
  const stableRemoteStream = useMemo(() => remoteStream, [remoteStream?.id]);
  
  useEffect(() => {
    if (!currentUser || !otherUser) {
      router.replace('/lobby');
      return;
    }
    
    if (webRTCService.localStream) {
      setLocalStream(webRTCService.localStream);
    }
    
    if (webRTCService.remoteStream) {
      setRemoteStream(webRTCService.remoteStream);
    }
    
    webRTCService.onRemoteStream((stream) => {
      setRemoteStream(stream);
    });
    
    const handleIceCandidate = async ({ candidate }: any) => {
      await webRTCService.addIceCandidate(candidate);
    };
    
    socketService.on('webrtc:ice-candidate', handleIceCandidate);
    
    const handleCallEnded = () => {
      handleEndCall(false);
    };
    
    socketService.on('call:ended', handleCallEnded);
    
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    
    return () => {
      clearInterval(timer);
      socketService.off('webrtc:ice-candidate', handleIceCandidate);
      socketService.off('call:ended', handleCallEnded);
    };
  }, []);
  
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
    Alert.alert('End Call', 'Are you sure you want to end the call?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: () => handleEndCall(true) },
    ]);
  };
  
  return (
    <View style={styles.container}>
      {stableRemoteStream ? (
        <VideoView stream={stableRemoteStream} isLocal={false} />
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>Connecting...</Text>
        </View>
      )}
      
      {callType === 'video' && stableLocalStream && (
        <VideoView stream={stableLocalStream} isLocal={true} />
      )}
      
      <View style={styles.callInfo}>
        <Text style={styles.callerName}>{otherUser?.username}</Text>
        <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
      </View>
      
      <SafeAreaView style={styles.controlsContainer}>
        <CallControls
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onSwitchCamera={handleSwitchCamera}
          onEndCall={confirmEndCall}
          isVideo={callType === 'video'}
        />
      </SafeAreaView>
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
  controlsContainer: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
  },
});