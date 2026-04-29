import { useThemeColors } from '@/hooks/useThemeColors';
import { NOTE_TYPE_COLORS } from '@/types/note';
import { Spacing } from '@/utils/mobile';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
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

interface VideoNoteProps {
  note?: any; // Will be typed as VideoNote when integrated
  onSave: (note: any) => void;
  onClose: () => void;
}

export function VideoNote({ note, onSave, onClose }: VideoNoteProps) {
  const colors = useThemeColors();
  const [title, setTitle] = useState(note?.title || 'Video Note');
  const [description, setDescription] = useState(note?.content || '');
  const [videoFile, setVideoFile] = useState(note?.videoUrl || null);
  const [thumbnail, setThumbnail] = useState(note?.thumbnailUrl || null);
  const [duration, setDuration] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    setIsAutoSaving(true);
    setShowSavedIndicator(true);
    
    // Save note
    const noteData = {
      ...note,
      title,
      content: description,
      videoUrl: videoFile,
      thumbnailUrl: thumbnail,
      duration,
      updatedAt: new Date().toISOString(),
    };

    onSave(noteData);

    // Hide saved indicator after 2 seconds
    setTimeout(() => {
      setShowSavedIndicator(false);
    }, 2000);

    setIsAutoSaving(false);
  }, [title, description, videoFile, thumbnail, duration, note, onSave]);

  // Auto-save every 30 seconds or on content change
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      autoSave();
    }, 30000); // 30 seconds

    return () => {
      clearTimeout(autoSaveTimer);
    };
  }, [title, description, videoFile, thumbnail, duration, autoSave]);

  // Pick video from gallery or camera
  const pickVideo = async (source: 'gallery' | 'camera') => {
    try {
      const permissionResult = source === 'camera' 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', `Permission to access ${source} is required!`);
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setVideoFile(asset.uri);
        
        // Generate thumbnail from video
        if (asset.uri) {
          try {
            // For now, we'll use a placeholder. In a real app, you'd generate a thumbnail
            setThumbnail(asset.uri);
            setDuration(asset.duration || 0);
          } catch (error) {
            console.error('Error processing video:', error);
          }
        }
        
        autoSave(); // Auto-save after adding video
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  // Delete video
  const deleteVideo = () => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setVideoFile(null);
            setThumbnail(null);
            setDuration(0);
            autoSave();
          },
        },
      ]
    );
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    autoSave();
  };

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
            <View style={[styles.noteTypeBadge, { backgroundColor: NOTE_TYPE_COLORS.video }]}>
              <Text style={styles.noteTypeText}>Video Note</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {showSavedIndicator && (
              <View style={styles.savedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.savedText, { color: colors.primary }]}>Saved</Text>
              </View>
            )}
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

          {/* Video Section */}
          <View style={styles.videoSection}>
            {!videoFile ? (
              // Empty state
              <View style={[styles.emptyVideoState, { backgroundColor: colors.card }]}>
                <Ionicons name="videocam-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyVideoText, { color: colors.mutedForeground }]}>
                  No video yet
                </Text>
                <Text style={[styles.emptyVideoSubtext, { color: colors.mutedForeground }]}>
                  Tap + button to add a video
                </Text>
              </View>
            ) : (
              // Video preview
              <View style={styles.videoContainer}>
                <View style={styles.videoWrapper}>
                  {thumbnail ? (
                    <View style={styles.thumbnailContainer}>
                      <Image 
                        source={{ uri: thumbnail }} 
                        style={styles.thumbnail} 
                        // For video, we'd use Video component with poster
                      />
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => {
                          // In a real app, this would open video player
                          Alert.alert('Video Player', 'Video playback would open here');
                        }}
                      >
                        <Ionicons name="play" size={32} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.placeholderThumbnail, { backgroundColor: colors.mutedForeground }]}>
                      <Ionicons name="videocam" size={48} color="#fff" />
                    </View>
                  )}
                  
                  {/* Delete button */}
                  <TouchableOpacity
                    style={styles.deleteVideoButton}
                    onPress={deleteVideo}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Video info */}
                <View style={styles.videoInfo}>
                  <Text style={[styles.videoDuration, { color: colors.text }]}>
                    Duration: {formatTime(duration)}
                  </Text>
                  <Text style={[styles.videoSize, { color: colors.mutedForeground }]}>
                    Video recorded
                  </Text>
                </View>
              </View>
            )}

            {/* Add video button */}
            <TouchableOpacity
              style={[styles.addVideoButton, { borderColor: colors.border }]}
              onPress={() => {
                Alert.alert(
                  'Add Video',
                  'Choose video source',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Camera', onPress: () => pickVideo('camera') },
                    { text: 'Gallery', onPress: () => pickVideo('gallery') },
                  ]
                );
              }}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
              <Text style={[styles.addVideoText, { color: colors.primary }]}>
                {videoFile ? 'Replace Video' : 'Add Video'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description Input */}
          <TextInput
            style={[
              styles.descriptionInput,
              { 
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.inputBackground,
              }
            ]}
            placeholder="Add a description or notes about this video..."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline={true}
            textAlignVertical="top"
            numberOfLines={6}
          />

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={[styles.metadataText, { color: colors.mutedForeground }]}>
              {videoFile ? '1 video' : 'No video'} • 
              Created: {new Date().toLocaleDateString()} • 
              {new Date().toLocaleTimeString()}
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
    width: 80,
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  savedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  savedText: {
    fontSize: 12,
    fontWeight: '600',
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
  videoSection: {
    marginBottom: Spacing.lg,
  },
  emptyVideoState: {
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    marginBottom: Spacing.lg,
  },
  emptyVideoText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyVideoSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  videoContainer: {
    marginBottom: Spacing.lg,
  },
  videoWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  thumbnailContainer: {
    width: screenWidth - Spacing.lg * 2,
    height: (screenWidth - Spacing.lg * 2) * 9 / 16, // 16:9 aspect ratio
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  placeholderThumbnail: {
    width: screenWidth - Spacing.lg * 2,
    height: (screenWidth - Spacing.lg * 2) * 9 / 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteVideoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  videoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoDuration: {
    fontSize: 16,
    fontWeight: '600',
  },
  videoSize: {
    fontSize: 14,
  },
  addVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addVideoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionInput: {
    fontSize: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: Spacing.md,
    minHeight: 120,
  },
  metadata: {
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
