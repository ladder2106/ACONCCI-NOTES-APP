import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors } from '@/hooks/useThemeColors';
import { NOTE_TYPE_COLORS } from '@/types/note';
import { Spacing, Touch } from '@/utils/mobile';

const { width: screenWidth } = Dimensions.get('window');
const imageSpacing = 4;
const imagesPerRow = 2;
const imageSize = (screenWidth - Spacing.lg * 2 - imageSpacing * (imagesPerRow - 1)) / imagesPerRow;

interface ImageNoteProps {
  note?: any; // Will be typed as ImageNote when integrated
  onSave: (note: any) => void;
  onClose: () => void;
}

interface ImageItem {
  id: string;
  uri: string;
  caption?: string;
  width: number;
  height: number;
}

export function ImageNote({ note, onSave, onClose }: ImageNoteProps) {
  const colors = useThemeColors();
  const [title, setTitle] = useState(note?.title || 'Image Note');
  const [content, setContent] = useState(note?.content || '');
  const [images, setImages] = useState<ImageItem[]>(note?.images || []);
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
      content,
      images,
      updatedAt: new Date().toISOString(),
    };

    onSave(noteData);

    // Hide saved indicator after 2 seconds
    setTimeout(() => {
      setShowSavedIndicator(false);
    }, 2000);

    setIsAutoSaving(false);
  }, [title, content, images, note, onSave]);

  // Auto-save every 30 seconds or on content change
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      autoSave();
    }, 30000); // 30 seconds

    return () => {
      clearTimeout(autoSaveTimer);
    };
  }, [title, content, images, autoSave]);

  // Pick image from gallery or camera
  const pickImage = async (source: 'gallery' | 'camera') => {
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
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            selectionLimit: 5,
          });

      if (!result.canceled && result.assets) {
        const newImages: ImageItem[] = result.assets.map((asset, index) => ({
          id: Date.now().toString() + index,
          uri: asset.uri,
          width: asset.width || 0,
          height: asset.height || 0,
        }));

        setImages(prev => [...prev, ...newImages]);
        autoSave(); // Auto-save after adding images
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Update image caption
  const updateImageCaption = (imageId: string, caption: string) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, caption } : img
    ));
  };

  // Delete image
  const deleteImage = (imageId: string) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setImages(prev => prev.filter(img => img.id !== imageId));
            autoSave();
          },
        },
      ]
    );
  };

  // Render image item
  const renderImageItem = ({ item, index }: { item: ImageItem; index: number }) => (
    <View style={styles.imageContainer}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.uri }} style={styles.image} />
        
        {/* Delete button overlay */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteImage(item.id)}
        >
          <Ionicons name="close-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Caption input */}
      <TextInput
        style={[
          styles.captionInput,
          { 
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.inputBackground,
          }
        ]}
        placeholder="Add caption..."
        placeholderTextColor={colors.mutedForeground}
        value={item.caption || ''}
        onChangeText={(text) => updateImageCaption(item.id, text)}
        multiline={true}
        maxLength={100}
      />
    </View>
  );

  // Show image source options
  const showImageSourceOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose image source',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => pickImage('camera') },
        { text: 'Gallery', onPress: () => pickImage('gallery') },
      ]
    );
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
            <View style={[styles.noteTypeBadge, { backgroundColor: NOTE_TYPE_COLORS.image }]}>
              <Text style={styles.noteTypeText}>Image Note</Text>
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

          {/* Images Grid */}
          <View style={styles.imagesSection}>
            {images.length === 0 ? (
              // Empty state
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <Ionicons name="images-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
                  No images yet
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.mutedForeground }]}>
                  Tap the + button to add images
                </Text>
              </View>
            ) : (
              // Images grid
              <FlatList
                data={images}
                renderItem={renderImageItem}
                keyExtractor={(item) => item.id}
                numColumns={imagesPerRow}
                scrollEnabled={false}
                columnWrapperStyle={styles.imageRow}
              />
            )}

            {/* Add image button */}
            <TouchableOpacity
              style={[styles.addImageButton, { borderColor: colors.border }]}
              onPress={showImageSourceOptions}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
              <Text style={[styles.addImageText, { color: colors.primary }]}>
                Add Images
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Input */}
          <TextInput
            style={[
              styles.contentInput,
              { 
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.inputBackground,
              }
            ]}
            placeholder="Add additional context or notes..."
            placeholderTextColor={colors.mutedForeground}
            value={content}
            onChangeText={setContent}
            multiline={true}
            textAlignVertical="top"
            numberOfLines={4}
          />

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={[styles.metadataText, { color: colors.mutedForeground }]}>
              {images.length} image{images.length !== 1 ? 's' : ''} • 
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
  imagesSection: {
    marginBottom: Spacing.lg,
  },
  emptyState: {
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    marginBottom: Spacing.lg,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  imageRow: {
    justifyContent: 'space-between',
  },
  imageContainer: {
    marginBottom: Spacing.md,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: imageSize,
    height: imageSize,
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
  },
  captionInput: {
    fontSize: 12,
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: 6,
    marginTop: Spacing.xs,
    height: 40,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contentInput: {
    fontSize: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: Spacing.md,
    minHeight: 100,
  },
  metadata: {
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
