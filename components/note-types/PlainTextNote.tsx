import { useThemeColors } from '@/hooks/useThemeColors';
import { NOTE_TYPE_COLORS } from '@/types/note';
import { Spacing, Touch } from '@/utils/mobile';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
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

interface PlainTextNoteProps {
  note?: any; // Will be typed as PlainTextNote when integrated
  onSave: (note: any) => void;
  onClose: () => void;
}

export function PlainTextNote({ note, onSave, onClose }: PlainTextNoteProps) {
  const colors = useThemeColors();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [titleFocused, setTitleFocused] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);
  
  const contentInputRef = useRef<TextInput>(null);
  const autoSaveTimerRef = useRef<number>(0);
  const savedOpacity = useRef(new Animated.Value(0)).current;

  // Calculate word and character count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
    const chars = content.length;
    setWordCount(words);
    setCharacterCount(chars);
  }, [content]);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    setIsAutoSaving(true);
    setShowSavedIndicator(true);
    
    // Animate saved indicator
    Animated.timing(savedOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Save note
    const noteData = {
      ...note,
      title,
      content,
      wordCount,
      characterCount,
      lastAutoSave: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(noteData);

    // Hide saved indicator after 2 seconds
    setTimeout(() => {
      Animated.timing(savedOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowSavedIndicator(false);
      });
    }, 2000);

    setIsAutoSaving(false);
  }, [title, content, wordCount, characterCount, note, onSave, savedOpacity]);

  // Auto-save every 30 seconds or on content change
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      autoSave();
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content, autoSave]);

  const handleSave = () => {
    autoSave();
  };

  const handleTitleFocus = () => {
    setTitleFocused(true);
    // Focus content input after title
    setTimeout(() => {
      contentInputRef.current?.focus();
    }, 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header with back button and save indicator */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={[styles.noteTypeBadge, { backgroundColor: NOTE_TYPE_COLORS.plain_text }]}>
              <Text style={styles.noteTypeText}>Plain Text</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {showSavedIndicator && (
              <Animated.View style={[styles.savedIndicator, { opacity: savedOpacity }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.savedText, { color: colors.primary }]}>Saved</Text>
              </Animated.View>
            )}
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
                borderColor: titleFocused ? colors.primary : colors.border,
              }
            ]}
            placeholder="Note Title"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
            onSubmitEditing={handleTitleFocus}
            multiline={false}
            maxLength={100}
            returnKeyType="next"
          />

          {/* Content Input */}
          <TextInput
            ref={contentInputRef}
            style={[
              styles.contentInput,
              { 
                color: colors.text,
                borderColor: contentFocused ? colors.primary : 'transparent',
              }
            ]}
            placeholder="Start typing your note..."
            placeholderTextColor={colors.mutedForeground}
            value={content}
            onChangeText={setContent}
            onFocus={() => setContentFocused(true)}
            onBlur={() => setContentFocused(false)}
            multiline={true}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect={true}
          />

          {/* Word and Character Count */}
          <View style={styles.countContainer}>
            <Text style={[styles.countText, { color: colors.mutedForeground }]}>
              {wordCount} words • {characterCount} characters
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderRadius: 12,
    minHeight: Touch.buttonHeight,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    padding: Spacing.md,
    borderWidth: 2,
    borderRadius: 12,
    textAlignVertical: 'top',
  },
  countContainer: {
    marginTop: Spacing.md,
    alignItems: 'flex-end',
  },
  countText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
