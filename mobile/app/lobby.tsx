// app/lobby.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCallStore } from '../src/store/call-store';
import { socketService } from '../src/services/socket.service';
import { webRTCService } from '../src/services/webrtc.service';
import IncomingCallModal from '../src/components/incoming-call-modal';
import { User } from '../src/types';

export default function LobbyScreen() {
  const router = useRouter();
  const {
    currentUser,
    onlineUsers,
    setOnlineUsers,
    startCall,
    setIncomingCall,
    incomingCall,
    logout,
  } = useCallStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);
  
 // app/lobby.tsx
useEffect(() => {
  if (!currentUser) {
    router.replace('/');
    return;
  }
  
  console.log('🔌 Connecting to socket...');
  const socket = socketService.connect(currentUser.userId, currentUser.username);
  
  // ✅ Handler fonksiyonlarını tanımla
  const handleUsersList = (users: User[]) => {
    console.log('📋 Users list updated:', users.length);
    const filteredUsers = users.filter((u) => u.userId !== currentUser.userId);
    setOnlineUsers(filteredUsers);
  };
  
  const handleIncomingCall = (data: any) => {
    console.log('📞 Incoming call from:', data.caller.username);
    setIncomingCall(data);
  };
  
  const handleCallAccepted = async ({ answer }: any) => {
    console.log('✅ Call accepted, setting remote answer...');
    try {
      await webRTCService.setRemoteAnswer(answer);
      setIsConnecting(false);
      setConnectingUserId(null);
    } catch (error) {
      console.error('❌ Set remote answer error:', error);
      webRTCService.closeConnection();
      setIsConnecting(false);
      setConnectingUserId(null);
    }
  };
  
  const handleCallRejected = () => {
    console.log('❌ Call rejected');
    Alert.alert('Arama Reddedildi', 'Kullanıcı aramayı reddetti.');
    webRTCService.closeConnection();
    setIsConnecting(false);
    setConnectingUserId(null);
  };
  
  const handleIceCandidate = async ({ candidate }: any) => {
    await webRTCService.addIceCandidate(candidate);
  };
  
  const handleCallEnded = () => {
    console.log('📴 Call ended by other user');
    webRTCService.closeConnection();
    setIsConnecting(false);
    setConnectingUserId(null);
  };
  
  // ✅ Event listener'ları ONCE ekle
  socket.once('users:list', handleUsersList);
  socket.once('call:incoming', handleIncomingCall);
  socket.once('call:accepted', handleCallAccepted);
  socket.once('call:rejected', handleCallRejected);
  socket.on('webrtc:ice-candidate', handleIceCandidate);
  socket.once('call:ended', handleCallEnded);
  
  // ✅ CLEANUP - Event listener'ları KALDIR
  return () => {
    console.log('🧹 Lobby cleanup - removing event listeners');
    socket.off('users:list', handleUsersList);
    socket.off('call:incoming', handleIncomingCall);
    socket.off('call:accepted', handleCallAccepted);
    socket.off('call:rejected', handleCallRejected);
    socket.off('webrtc:ice-candidate', handleIceCandidate);
    socket.off('call:ended', handleCallEnded);
  };
}, []); // ✅ BOŞ dependency array
  
 const handleCall = async (user: User, callType: 'audio' | 'video') => {
  try {
    setIsConnecting(true);
    setConnectingUserId(user.userId);
    console.log(`📞 Initiating ${callType} call to:`, user.username);
    
    // ✅ 1. ÖNCE ESKİ BAĞLANTIYI TEMİZLE
    webRTCService.closeConnection();
    
    // ✅ 2. Local stream başlat
    await webRTCService.startLocalStream(callType === 'video');
    
    // ✅ 3. CALLBACK'LERİ ÖNCE SET ET (peer başlamadan önce!)
    let hasNavigated = false;
    
    webRTCService.onIceCandidate((candidate) => {
      socketService.emit('webrtc:ice-candidate', {
        to: user.userId,
        candidate,
      });
    });
    
    webRTCService.onRemoteStream((stream) => {
      if (hasNavigated) {
        console.log('⚠️ Already navigated to call screen');
        return;
      }
      
      console.log('📹 Remote stream in lobby, navigating...');
      hasNavigated = true;
      setIsConnecting(false);
      router.push(`/call/${user.userId}`);
    });
    
    // ✅ 4. ŞİMDİ peer connection başlat (callbacks hazır!)
    await webRTCService.initializePeerConnection();
    
    // ✅ 5. Offer oluştur ve gönder
    const offer = await webRTCService.createOffer();
    
    socketService.emit('call:initiate', {
      from: currentUser?.userId,
      to: user.userId,
      callType,
      offer,
    });
    
    startCall(user, callType);
    
  } catch (error) {
    console.error('❌ Call initiation error:', error);
    Alert.alert('Hata', 'Arama başlatılamadı');
    webRTCService.closeConnection();
    setIsConnecting(false);
    setConnectingUserId(null);
  }
};
  
  const handleLogout = async () => {
    Alert.alert('Çıkış', 'Çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış',
        style: 'destructive',
        onPress: async () => {
          socketService.disconnect();
          await logout();
          router.replace('/');
        },
      },
    ]);
  };
  
  const renderUser = ({ item }: { item: User }) => {
    const isCurrentlyConnecting = connectingUserId === item.userId;
    
    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.status}>🟢 Online</Text>
          </View>
        </View>
        
        {isCurrentlyConnecting ? (
          <ActivityIndicator size="small" color="#2196F3" />
        ) : (
          <View style={styles.callButtons}>
            <TouchableOpacity
              style={[styles.callButton, styles.audioButton]}
              onPress={() => handleCall(item, 'audio')}
              disabled={isConnecting}
            >
              <Text style={styles.callButtonIcon}>🎤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.callButton, styles.videoButton]}
              onPress={() => handleCall(item, 'video')}
              disabled={isConnecting}
            >
              <Text style={styles.callButtonIcon}>📹</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Online Kullanıcılar</Text>
          <Text style={styles.subtitle}>Hoş geldin, {currentUser?.username} 👋</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>
      
      {onlineUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>Henüz kimse online değil</Text>
          <Text style={styles.emptySubtext}>Birinin katılmasını bekleyin...</Text>
        </View>
      ) : (
        <FlatList
          data={onlineUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
        />
      )}
      
      {incomingCall && <IncomingCallModal />}
      
      {isConnecting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Aranıyor...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  status: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2,
  },
  callButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButton: {
    backgroundColor: '#4CAF50',
  },
  videoButton: {
    backgroundColor: '#2196F3',
  },
  callButtonIcon: {
    fontSize: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    color: '#fff',
    marginTop: 20,
  },
});