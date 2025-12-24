// src/components/CallControls.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface CallControlsProps {
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onEndCall: () => void;
  isVideo: boolean;
}

export default function CallControls({
  onToggleAudio,
  onToggleVideo,
  onSwitchCamera,
  onEndCall,
  isVideo,
}: CallControlsProps) {
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  
  const handleToggleAudio = () => {
    onToggleAudio();
    setIsAudioOn(!isAudioOn);
  };
  
  const handleToggleVideo = () => {
    onToggleVideo();
    setIsVideoOn(!isVideoOn);
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !isAudioOn && styles.buttonOff]}
        onPress={handleToggleAudio}
      >
        <Text style={styles.icon}>{isAudioOn ? '🎤' : '🔇'}</Text>
      </TouchableOpacity>
      
      {isVideo && (
        <>
          <TouchableOpacity
            style={[styles.button, !isVideoOn && styles.buttonOff]}
            onPress={handleToggleVideo}
          >
            <Text style={styles.icon}>{isVideoOn ? '📹' : '📵'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={onSwitchCamera}>
            <Text style={styles.icon}>🔄</Text>
          </TouchableOpacity>
        </>
      )}
      
      <TouchableOpacity style={styles.endButton} onPress={onEndCall}>
        <Text style={styles.icon}>📞</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonOff: {
    backgroundColor: 'rgba(244,67,54,0.8)',
  },
  endButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
  icon: {
    fontSize: 28,
  },
});