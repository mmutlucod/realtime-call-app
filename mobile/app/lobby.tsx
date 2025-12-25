import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { pushNotificationService } from '../src/services/push-notification.services';
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

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
      return;
    }
    
    const socket = socketService.connect(currentUser.userId, currentUser.username);
    
    const registerPushToken = async () => {
      try {
        const token = await pushNotificationService.registerForPushNotificationsAsync();
        if (token) {
          socket.emit('user:register-push-token', {
            userId: currentUser.userId,
            pushToken: token,
          });
        }
      } catch (error) {
        console.error('Push token error:', error);
      }
    };
    
    registerPushToken();
    
    const handleUsersList = (users: User[]) => {
      const filteredUsers = users.filter((u) => u.userId !== currentUser.userId);
      setOnlineUsers(filteredUsers);
    };
    
    const handleIncomingCall = (data: any) => {
      setIncomingCall(data);
    };
    
    const handleCallAccepted = async ({ answer }: any) => {
      try {
        await webRTCService.setRemoteAnswer(answer);
        
        const store = useCallStore.getState();
        if (store.otherUser) {
          router.replace(`/call/${store.otherUser.userId}`);
        }
        
        setIsConnecting(false);
        setConnectingUserId(null);
      } catch (error) {
        console.error('Set remote answer error:', error);
        webRTCService.closeConnection();
        setIsConnecting(false);
        setConnectingUserId(null);
      }
    };
    
    const handleCallRejected = () => {
      Alert.alert('Call Rejected', 'User rejected the call.');
      webRTCService.closeConnection();
      setIsConnecting(false);
      setConnectingUserId(null);
    };
    
    const handleIceCandidate = async ({ candidate }: any) => {
      await webRTCService.addIceCandidate(candidate);
    };
    
    const handleCallEnded = () => {
      webRTCService.closeConnection();
      setIsConnecting(false);
      setConnectingUserId(null);
    };
    
    socket.off('users:list');
    socket.off('call:incoming');
    socket.off('call:accepted');
    socket.off('call:rejected');
    socket.off('webrtc:ice-candidate');
    socket.off('call:ended');
    
    socket.on('users:list', handleUsersList);
    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('call:ended', handleCallEnded);
    
    return () => {
      socket.off('users:list', handleUsersList);
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('call:ended', handleCallEnded);
    };
  }, []);

  const handleCall = async (user: User, callType: 'audio' | 'video') => {
    try {
      setIsConnecting(true);
      setConnectingUserId(user.userId);
      
      webRTCService.closeConnection();
      await webRTCService.startLocalStream(callType === 'video');
      
      webRTCService.onIceCandidate((candidate) => {
        socketService.emit('webrtc:ice-candidate', {
          to: user.userId,
          candidate,
        });
      });
      
      webRTCService.onRemoteStream((stream) => {
        console.log('Remote stream received');
      });
      
      await webRTCService.initializePeerConnection();
      const offer = await webRTCService.createOffer();
      
      socketService.emit('call:initiate', {
        from: currentUser?.userId,
        to: user.userId,
        callType,
        offer,
      });
      
      startCall(user, callType);
      
    } catch (error) {
      console.error('Call initiation error:', error);
      Alert.alert('Error', 'Could not start call');
      webRTCService.closeConnection();
      setIsConnecting(false);
      setConnectingUserId(null);
    }
  };
  
  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
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
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.status}>Online</Text>
            </View>
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
              <Ionicons name="call" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.callButton, styles.videoButton]}
              onPress={() => handleCall(item, 'video')}
              disabled={isConnecting}
            >
              <Ionicons name="videocam" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Online Users</Text>
          <Text style={styles.subtitle}>Welcome, {currentUser?.username} 👋</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {onlineUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={80} color="#555" />
          <Text style={styles.emptyText}>No one is online yet</Text>
          <Text style={styles.emptySubtext}>Waiting for someone to join...</Text>
        </View>
      ) : (
        <FlatList
          data={onlineUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {incomingCall && <IncomingCallModal />}
      
      {isConnecting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Calling...</Text>
        </View>
      )}
    </SafeAreaView>
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
    paddingTop: 56,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  status: {
    fontSize: 14,
    color: '#4CAF50',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginTop: 20,
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