import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        <Ionicons 
          name={isAudioOn ? 'mic' : 'mic-off'} 
          size={26} 
          color={isAudioOn ? '#4CAF50' : '#fff'} 
        />
      </TouchableOpacity>
      
      {isVideo && (
        <>
          <TouchableOpacity
            style={[styles.button, !isVideoOn && styles.buttonOff]}
            onPress={handleToggleVideo}
          >
            <Ionicons 
              name={isVideoOn ? 'videocam' : 'videocam-off'} 
              size={26} 
              color={isVideoOn ? '#2196F3' : '#fff'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={onSwitchCamera}>
            <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </>
      )}
      
      <TouchableOpacity style={styles.endButton} onPress={onEndCall}>
        <Ionicons name="close" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  buttonOff: {
    backgroundColor: 'rgba(244, 67, 54, 0.5)',
    borderColor: 'rgba(244, 67, 54, 0.4)',
  },
  endButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});