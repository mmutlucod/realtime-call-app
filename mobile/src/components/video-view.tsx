// src/components/VideoView.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RTCView, MediaStream } from 'react-native-webrtc';

interface VideoViewProps {
  stream: MediaStream | null;
  isLocal?: boolean;
}

export default function VideoView({ stream, isLocal = false }: VideoViewProps) {
  if (!stream) return null;
  
  return (
    <View style={[styles.container, isLocal && styles.localContainer]}>
      <RTCView
        streamURL={stream.toURL()}
        style={styles.video}
        objectFit="cover"
        mirror={isLocal}
        zOrder={isLocal ? 1 : 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  localContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
});