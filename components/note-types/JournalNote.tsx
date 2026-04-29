import { useThemeColors } from '@/hooks/useThemeColors';
import { NOTE_TYPE_COLORS } from '@/types/note';
import { Spacing } from '@/utils/mobile';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
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

interface JournalNoteProps {
  note?: any; // Will be typed as JournalNote when integrated
  onSave: (note: any) => void;
  onClose: () => void;
}

// Mood options with emojis
const MOOD_OPTIONS = [
  { key: 'happy', emoji: '😊', label: 'Happy' },
  { key: 'neutral', emoji: '😐', label: 'Neutral' },
  { key: 'sad', emoji: '😢', label: 'Sad' },
  { key: 'excited', emoji: '🤗', label: 'Excited' },
  { key: 'anxious', emoji: '😰', label: 'Anxious' },
  { key: 'grateful', emoji: '🙏', label: 'Grateful' },
  { key: 'tired', emoji: '😴', label: 'Tired' },
];

// Weather options
const WEATHER_OPTIONS = [
  { key: 'sunny', emoji: '☀️', label: 'Sunny' },
  { key: 'cloudy', emoji: '☁️', label: 'Cloudy' },
  { key: 'rainy', emoji: '🌧️', label: 'Rainy' },
  { key: 'snowy', emoji: '❄️', label: 'Snowy' },
  { key: 'stormy', emoji: '⛈️', label: 'Stormy' },
  { key: 'windy', emoji: '💨', label: 'Windy' },
  { key: 'foggy', emoji: '🌫️', label: 'Foggy' },
];

export function JournalNote({ note, onSave, onClose }: JournalNoteProps) {
  const colors = useThemeColors();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [moodEmoji, setMoodEmoji] = useState(note?.moodEmoji || 'neutral');
  const [weather, setWeather] = useState(note?.weather || null);
  const [entryDate, setEntryDate] = useState(
    note?.entryDate || new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  );
  const [wordCount, setWordCount] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

  const contentInputRef = useRef<TextInput>(null);

  // Calculate word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
    setWordCount(words);
  }, [content]);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    setIsAutoSaving(true);
    setShowSavedIndicator(true);
    
    // Save note
    const noteData = {
      ...note,
      title: title || `Journal Entry - ${entryDate}`,
      content,
      entryDate,
      moodEmoji,
      weather,
      wordCount,
      updatedAt: new Date().toISOString(),
    };

    onSave(noteData);

    // Hide saved indicator after 2 seconds
    setTimeout(() => {
      setShowSavedIndicator(false);
    }, 2000);

    setIsAutoSaving(false);
  }, [title, content, entryDate, moodEmoji, weather, wordCount, note, onSave]);

  // Auto-save every 30 seconds or on content change
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      autoSave();
    }, 30000); // 30 seconds

    return () => {
      clearTimeout(autoSaveTimer);
    };
  }, [title, content, entryDate, moodEmoji, weather, wordCount, autoSave]);

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
            <View style={[styles.noteTypeBadge, { backgroundColor: NOTE_TYPE_COLORS.journal }]}>
              <Text style={styles.noteTypeText}>Journal</Text>
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
          {/* Date Header */}
          <View style={[styles.dateHeader, { backgroundColor: colors.card }]}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {entryDate}
            </Text>
          </View>

          {/* Mood Selector */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              How are you feeling?
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodScrollContent}
            >
              {MOOD_OPTIONS.map((mood) => (
                <TouchableOpacity
                  key={mood.key}
                  style={[
                    styles.moodOption,
                    { 
                      backgroundColor: moodEmoji === mood.key ? colors.primary : 'transparent',
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => {
                    setMoodEmoji(mood.key);
                    autoSave();
                  }}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[
                    styles.moodLabel,
                    { 
                      color: moodEmoji === mood.key ? '#fff' : colors.text,
                      fontWeight: moodEmoji === mood.key ? '600' : '400',
                    }
                  ]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Weather Selector */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              What's the weather like?
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weatherScrollContent}
            >
              <TouchableOpacity
                style={[
                  styles.weatherOption,
                  { 
                    backgroundColor: weather === null ? colors.primary : 'transparent',
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => {
                  setWeather(null);
                  autoSave();
                }}
              >
                <Text style={styles.weatherEmoji}>🌤️</Text>
                <Text style={[
                  styles.weatherLabel,
                  { 
                    color: weather === null ? '#fff' : colors.text,
                    fontWeight: weather === null ? '600' : '400',
                  }
                ]}>
                  None
                </Text>
              </TouchableOpacity>
              
              {WEATHER_OPTIONS.map((weatherOption) => (
                <TouchableOpacity
                  key={weatherOption.key}
                  style={[
                    styles.weatherOption,
                    { 
                      backgroundColor: weather === weatherOption.key ? colors.primary : 'transparent',
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => {
                    setWeather(weatherOption.key);
                    autoSave();
                  }}
                >
                  <Text style={styles.weatherEmoji}>{weatherOption.emoji}</Text>
                  <Text style={[
                    styles.weatherLabel,
                    { 
                      color: weather === weatherOption.key ? '#fff' : colors.text,
                      fontWeight: weather === weatherOption.key ? '600' : '400',
                    }
                  ]}>
                    {weatherOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Journal Content */}
          <View style={[styles.contentSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.contentLabel, { color: colors.text }]}>
              Today's thoughts...
            </Text>
            
            <View style={[styles.journalPaper, { backgroundColor: colors.background }]}>
              <TextInput
                ref={contentInputRef}
                style={[
                  styles.contentInput,
                  { 
                    color: colors.text,
                  }
                ]}
                placeholder="Dear diary..."
                placeholderTextColor={colors.mutedForeground}
                value={content}
                onChangeText={setContent}
                multiline={true}
                textAlignVertical="top"
                autoCapitalize="sentences"
                autoCorrect={true}
              />
            </View>
          </View>

          {/* Word Count */}
          <View style={styles.wordCountContainer}>
            <Text style={[styles.wordCountText, { color: colors.mutedForeground }]}>
              {wordCount} words
            </Text>
          </View>

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={[styles.metadataText, { color: colors.mutedForeground }]}>
              Mood: {MOOD_OPTIONS.find(m => m.key === moodEmoji)?.emoji} • 
              {weather ? `Weather: ${WEATHER_OPTIONS.find(w => w.key === weather)?.emoji}` : 'No weather'} • 
              Created: {new Date().toLocaleDateString()}
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
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  moodScrollContent: {
    gap: Spacing.sm,
  },
  moodOption: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 80,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  moodLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  weatherScrollContent: {
    gap: Spacing.sm,
  },
  weatherOption: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 80,
  },
  weatherEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  weatherLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  contentSection: {
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  contentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  journalPaper: {
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  wordCountContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  wordCountText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  metadata: {
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  metadataText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
});
