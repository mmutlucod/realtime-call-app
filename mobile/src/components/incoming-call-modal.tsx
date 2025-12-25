import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallStore } from '../store/call-store';
import { socketService } from '../services/socket.service';
import { webRTCService } from '../services/webrtc.service';

export default function IncomingCallModal() {
  const router = useRouter();
  const { currentUser, incomingCall, clearIncomingCall, startCall } = useCallStore();
  const [isProcessing, setIsProcessing] = useState(false);
  
  if (!incomingCall) return null;
  
  const handleAccept = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const callerId = incomingCall.from;
      const callerInfo = incomingCall.caller;
      const callTypeInfo = incomingCall.callType;
      const offerInfo = incomingCall.offer;
      
      webRTCService.closeConnection();
      
      const isVideo = callTypeInfo === 'video';
      await webRTCService.startLocalStream(isVideo);
      
      webRTCService.onIceCandidate((candidate) => {
        socketService.emit('webrtc:ice-candidate', {
          to: callerId,
          candidate,
        });
      });
      
      webRTCService.onRemoteStream((stream) => {});
      
      await webRTCService.initializePeerConnection();
      const answer = await webRTCService.createAnswer(offerInfo);
      
      socketService.emit('call:accept', {
        from: callerId,
        to: currentUser?.userId,
        answer,
      });
      
      startCall(callerInfo, callTypeInfo);
      router.replace(`/call/${callerId}`);
      
      setTimeout(() => {
        clearIncomingCall();
        setIsProcessing(false);
      }, 200);
      
    } catch (error) {
      console.error('Accept call error:', error);
      clearIncomingCall();
      setIsProcessing(false);
    }
  };
  
  const handleReject = () => {
    if (isProcessing) return;
    
    socketService.emit('call:reject', {
      from: incomingCall.from,
      to: currentUser?.userId,
    });
    clearIncomingCall();
  };
  
  return (
    <Modal transparent animationType="fade" visible={true}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {incomingCall.caller.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.pulseRing} />
          </View>
          
          <Text style={styles.caller}>{incomingCall.caller.username}</Text>
          
          <View style={styles.callTypeContainer}>
            <Ionicons 
              name={incomingCall.callType === 'video' ? 'videocam' : 'call'} 
              size={20} 
              color="#888" 
            />
            <Text style={styles.callType}>
              {incomingCall.callType === 'video' ? 'Video Call' : 'Voice Call'}
            </Text>
          </View>
          
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.processingText}>Connecting...</Text>
            </View>
          ) : (
            <View style={styles.buttons}>
              <TouchableOpacity 
                style={styles.rejectButton} 
                onPress={handleReject}
                disabled={isProcessing}
              >
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.acceptButton} 
                onPress={handleAccept}
                disabled={isProcessing}
              >
                <Ionicons name="call" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.subtitle}>Incoming Call</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 30,
    padding: 40,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 25,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#4CAF50',
    opacity: 0.6,
  },
  caller: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  callTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  callType: {
    fontSize: 16,
    color: '#888',
  },
  buttons: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 20,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  rejectButton: {
    backgroundColor: '#f44336',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  processingText: {
    color: '#4CAF50',
    fontSize: 16,
    marginTop: 15,
    fontWeight: '600',
  },
});