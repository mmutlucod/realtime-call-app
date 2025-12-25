import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallStore } from '../src/store/call-store';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const router = useRouter();
  const { setCurrentUser, currentUser } = useCallStore();
  
  useEffect(() => {
    const checkUser = async () => {
      if (currentUser) {
        router.replace('/lobby');
      }
    };
    checkUser();
  }, []);
  
  const handleJoin = () => {
    if (username.trim()) {
      const userId = Date.now().toString();
      const newUser = { userId, username: username.trim() };
      setCurrentUser(newUser);
      router.push('/lobby');
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="videocam" size={80} color="#2196F3" />
        </View>
        <Text style={styles.title}>Video Call App</Text>
        <Text style={styles.subtitle}>Make voice and video calls</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleJoin}
        />
        
        <TouchableOpacity
          style={[styles.button, !username.trim() && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={!username.trim()}
        >
          <Text style={styles.buttonText}>Join</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    width: '100%',
    height: 55,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});