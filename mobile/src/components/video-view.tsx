import React, { useEffect, useState, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { RTCView, MediaStream } from 'react-native-webrtc';

interface VideoViewProps {
  stream: MediaStream | null;
  isLocal?: boolean;
}

function VideoView({ stream, isLocal = false }: VideoViewProps) {
  const [streamURL, setStreamURL] = useState<string>('');
  
  useEffect(() => {
    if (!stream) {
      setStreamURL('');
      return;
    }
    
    const url = stream.toURL();
    setStreamURL(url);
    
    return () => {
      setStreamURL('');
    };
  }, [stream?.id, isLocal]); 
  
  if (!stream || !streamURL) {
    return null;
  }
  
  return (
    <View style={[styles.container, isLocal && styles.localContainer]}>
      <RTCView
        streamURL={streamURL}
        style={styles.video}
        objectFit="cover"
        mirror={isLocal}
        zOrder={isLocal ? 1 : 0}
      />
    </View>
  );
}

export default memo(VideoView, (prevProps, nextProps) => {
  return prevProps.stream?.id === nextProps.stream?.id && 
         prevProps.isLocal === nextProps.isLocal;
});

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
    zIndex: 10,
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
});