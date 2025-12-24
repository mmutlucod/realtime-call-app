// src/components/IncomingCallModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallStore } from '../store/call-store';
import { socketService } from '../services/socket.service';
import { webRTCService } from '../services/webrtc.service';

export default function IncomingCallModal() {
  const router = useRouter();
  const { currentUser, incomingCall, clearIncomingCall, startCall } = useCallStore();
  
  if (!incomingCall) return null;
  
const handleAccept = async () => {
  try {
    console.log('📞 Accepting call...');
    
    const isVideo = incomingCall.callType === 'video';
    await webRTCService.startLocalStream(isVideo);
    await webRTCService.initializePeerConnection();
    
    webRTCService.onIceCandidate((candidate) => {
      socketService.emit('webrtc:ice-candidate', {
        to: incomingCall.from,
        candidate,
      });
    });
    
    // ✅ Remote stream callback'ini set et (call screen'de de lazım olacak)
    webRTCService.onRemoteStream((stream) => {
      console.log('📹 Remote stream received in modal/call screen');
    });
    
    const answer = await webRTCService.createAnswer(incomingCall.offer);
    
    socketService.emit('call:accept', {
      from: incomingCall.from,
      to: currentUser?.userId,
      answer,
    });
    
    startCall(incomingCall.caller, incomingCall.callType);
    clearIncomingCall();
    
    // ✅ Answer gönderdikten HEMEN SONRA navigate et
    console.log('✅ Navigating to call screen...');
    router.push(`/call/${incomingCall.from}`);
    
  } catch (error) {
    console.error('❌ Accept call error:', error);
    clearIncomingCall();
  }
};
  
  const handleReject = () => {
    console.log('❌ Rejecting call');
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
          <Text style={styles.title}>Gelen Arama</Text>
          <Text style={styles.caller}>{incomingCall.caller.username}</Text>
          <Text style={styles.callType}>
            {incomingCall.callType === 'video' ? '📹 Görüntülü' : '🎤 Sesli'} Arama
          </Text>
          
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
              <Text style={styles.buttonText}>❌</Text>
              <Text style={styles.buttonLabel}>Reddet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
              <Text style={styles.buttonText}>✅</Text>
              <Text style={styles.buttonLabel}>Kabul Et</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  caller: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  callType: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 40,
  },
  buttons: {
    flexDirection: 'row',
    gap: 30,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#f44336',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 32,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },
});