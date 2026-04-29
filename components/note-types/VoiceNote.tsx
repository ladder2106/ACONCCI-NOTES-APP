import { useThemeColors } from '@/hooks/useThemeColors';
import { NOTE_TYPE_COLORS } from '@/types/note';
import { Spacing } from '@/utils/mobile';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

interface VoiceNoteProps {
  note?: any; // Will be typed as VoiceNote when integrated
  onSave: (note: any) => void;
  onClose: () => void;
}

export function VoiceNote({ note, onSave, onClose }: VoiceNoteProps) {
  const colors = useThemeColors();
  const [title, setTitle] = useState(note?.title || 'Voice Note');
  const [caption, setCaption] = useState(note?.caption || '');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFile, setAudioFile] = useState(note?.audioUrl || null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  
  const recordingTimerRef = useRef<number>(0);
  const playbackTimerRef = useRef<number>(0);
  const recordButtonScale = useRef(new Animated.Value(1)).current;
  const waveformOpacity = useRef(new Animated.Value(0)).current;

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      console.log('Starting recording..');
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.log('Permission to record audio denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingTime(0);

      // Animate record button
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordButtonScale, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(recordButtonScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animate waveform
      Animated.timing(waveformOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000) as unknown as number;

    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (!recording) return;

    try {
      console.log('Stopping recording..');
      setIsRecording(false);
      
      // Stop animations
      recordButtonScale.setValue(1);
      Animated.timing(waveformOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioFile(uri);
      setDuration(recordingTime);
      setRecording(null);

      // Auto-save note
      handleSave();

    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  // Start playback
  const startPlayback = async () => {
    if (!audioFile) return;

    try {
      console.log('Starting playback..');
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioFile },
        { shouldPlay: true }
      );
      
      setSound(sound);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          if (status.positionMillis) {
            setPlaybackPosition(status.positionMillis / 1000);
          }
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPlaybackPosition(0);
            sound.unloadAsync();
            setSound(null);
          }
        }
      });

      // Start playback timer
      playbackTimerRef.current = setInterval(() => {
        sound.getStatusAsync().then((status: any) => {
          if (status.isLoaded && status.positionMillis) {
            setPlaybackPosition(status.positionMillis / 1000);
          }
        });
      }, 1000) as unknown as number;

    } catch (err) {
      console.error('Failed to start playback', err);
    }
  };

  // Stop playback
  const stopPlayback = async () => {
    if (!sound) return;

    try {
      console.log('Stopping playback..');
      setIsPlaying(false);
      
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }

      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setPlaybackPosition(0);

    } catch (err) {
      console.error('Failed to stop playback', err);
    }
  };

  // Handle save
  const handleSave = useCallback(() => {
    const noteData = {
      ...note,
      title,
      caption,
      audioUrl: audioFile,
      duration: duration || recordingTime,
      updatedAt: new Date().toISOString(),
    };

    onSave(noteData);
  }, [title, caption, audioFile, duration, recordingTime, note, onSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [recording, sound]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={[styles.noteTypeBadge, { backgroundColor: NOTE_TYPE_COLORS.voice }]}>
              <Text style={styles.noteTypeText}>Voice Note</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Ionicons name="checkmark" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <TextInput
            style={[
              styles.titleInput,
              { 
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.inputBackground,
              }
            ]}
            placeholder="Note Title"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            returnKeyType="done"
          />

          {/* Recording Section */}
          <View style={[styles.recordingSection, { backgroundColor: colors.card }]}>
            {!audioFile ? (
              // Recording interface
              <View style={styles.recordInterface}>
                <TouchableOpacity
                  onPress={isRecording ? stopRecording : startRecording}
                  activeOpacity={0.8}
                >
                  <Animated.View 
                    style={[
                      styles.recordButton,
                      { 
                        backgroundColor: isRecording ? '#EF4444' : '#10B981',
                        transform: [{ scale: recordButtonScale }]
                      }
                    ]}
                  >
                    <Ionicons 
                      name={isRecording ? "stop" : "mic"} 
                      size={40} 
                      color="#fff" 
                    />
                  </Animated.View>
                </TouchableOpacity>

                <Text style={[styles.recordingTime, { color: colors.text }]}>
                  {formatTime(recordingTime)}
                </Text>

                <Text style={[styles.recordingStatus, { color: colors.mutedForeground }]}>
                  {isRecording ? 'Recording...' : 'Tap to start recording'}
                </Text>

                {/* Animated waveform visualization */}
                <Animated.View 
                  style={[
                    styles.waveformContainer,
                    { opacity: waveformOpacity }
                  ]}
                >
                  {[...Array(20)].map((_, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.waveformBar,
                        { 
                          backgroundColor: colors.primary,
                          height: Math.random() * 40 + 10,
                          left: i * 12,
                        }
                      ]}
                    />
                  ))}
                </Animated.View>
              </View>
            ) : (
              // Playback interface
              <View style={styles.playbackInterface}>
                <Text style={[styles.durationLabel, { color: colors.mutedForeground }]}>
                  Duration: {formatTime(duration)}
                </Text>

                {/* Playback controls */}
                <View style={styles.playbackControls}>
                  <TouchableOpacity
                    onPress={isPlaying ? stopPlayback : startPlayback}
                    style={[styles.playButton, { backgroundColor: colors.primary }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={isPlaying ? "pause" : "play"} 
                      size={24} 
                      color="#fff" 
                    />
                  </TouchableOpacity>

                  {/* Progress bar */}
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            backgroundColor: colors.primary,
                            width: `${(playbackPosition / duration) * 100}%`
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressTime, { color: colors.mutedForeground }]}>
                      {formatTime(playbackPosition)} / {formatTime(duration)}
                    </Text>
                  </View>
                </View>

                {/* Re-record button */}
                <TouchableOpacity
                  onPress={() => {
                    setAudioFile(null);
                    setDuration(0);
                    setRecordingTime(0);
                    setPlaybackPosition(0);
                  }}
                  style={styles.rerecordButton}
                >
                  <Ionicons name="refresh" size={20} color={colors.primary} />
                  <Text style={[styles.rerecordText, { color: colors.primary }]}>
                    Record Again
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Caption Input */}
          <TextInput
            style={[
              styles.captionInput,
              { 
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.inputBackground,
              }
            ]}
            placeholder="Add a caption or transcript..."
            placeholderTextColor={colors.mutedForeground}
            value={caption}
            onChangeText={setCaption}
            multiline={true}
            textAlignVertical="top"
            numberOfLines={3}
          />

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={[styles.metadataText, { color: colors.mutedForeground }]}>
              Created: {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  noteTypeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  noteTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  saveButton: {
    padding: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  recordingSection: {
    borderRadius: 16,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  recordInterface: {
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingTime: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  recordingStatus: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  waveformContainer: {
    flexDirection: 'row',
    height: 60,
    width: screenWidth - 80,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  playbackInterface: {
    width: '100%',
  },
  durationLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressTime: {
    fontSize: 12,
    textAlign: 'center',
  },
  rerecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: 8,
  },
  rerecordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  captionInput: {
    fontSize: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: Spacing.md,
    minHeight: 80,
  },
  metadata: {
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
