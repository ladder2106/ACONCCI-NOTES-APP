import { useThemeColors } from '@/hooks/useThemeColors';
import { NOTE_TYPE_COLORS } from '@/types/note';
import { Spacing } from '@/utils/mobile';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ReminderNoteProps {
  note?: any; // Will be typed as ReminderNote when integrated
  onSave: (note: any) => void;
  onClose: () => void;
}

// Priority options
const PRIORITY_OPTIONS = [
  { key: 'low', label: 'Low', color: '#10B981' },
  { key: 'medium', label: 'Medium', color: '#F59E0B' },
  { key: 'high', label: 'High', color: '#EF4444' },
];

// Repeat options
const REPEAT_OPTIONS = [
  { key: 'once', label: 'Once' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

export function ReminderNote({ note, onSave, onClose }: ReminderNoteProps) {
  const colors = useThemeColors();
  const [title, setTitle] = useState(note?.title || 'Reminder');
  const [description, setDescription] = useState(note?.content || '');
  const [reminderDate, setReminderDate] = useState(
    note?.dueDate ? new Date(note.dueDate) : new Date()
  );
  const [reminderTime, setReminderTime] = useState(
    note?.dueTime ? new Date(`2000-01-01T${note.dueTime}`) : new Date()
  );
  const [repeatOption, setRepeatOption] = useState(note?.repeat || 'once');
  const [priority, setPriority] = useState(note?.priority || 'medium');
  const [notificationsEnabled, setNotificationsEnabled] = useState(note?.notify !== false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

  // Calculate time remaining
  const calculateTimeRemaining = useCallback(() => {
    const now = new Date();
    const reminderDateTime = new Date(
      reminderDate.getFullYear(),
      reminderDate.getMonth(),
      reminderDate.getDate(),
      reminderTime.getHours(),
      reminderTime.getMinutes()
    );

    if (reminderDateTime <= now) {
      return 'Past due';
    }

    const diff = reminderDateTime.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }, [reminderDate, reminderTime]);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    setIsAutoSaving(true);
    setShowSavedIndicator(true);
    
    // Format date and time
    const formattedDate = reminderDate.toISOString().split('T')[0];
    const formattedTime = `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`;
    
    // Save note
    const noteData = {
      ...note,
      title,
      content: description,
      dueDate: formattedDate,
      dueTime: formattedTime,
      repeat: repeatOption,
      priority,
      notify: notificationsEnabled,
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    onSave(noteData);

    // Hide saved indicator after 2 seconds
    setTimeout(() => {
      setShowSavedIndicator(false);
    }, 2000);

    setIsAutoSaving(false);
  }, [title, description, reminderDate, reminderTime, repeatOption, priority, notificationsEnabled, note, onSave]);

  // Auto-save every 30 seconds or on content change
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      autoSave();
    }, 30000); // 30 seconds

    return () => {
      clearTimeout(autoSaveTimer);
    };
  }, [title, description, reminderDate, reminderTime, repeatOption, priority, notificationsEnabled, autoSave]);

  const handleSave = () => {
    autoSave();
  };

  const getPriorityColor = (priorityKey: string) => {
    const option = PRIORITY_OPTIONS.find(p => p.key === priorityKey);
    return option ? option.color : colors.primary;
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
            <View style={[styles.noteTypeBadge, { backgroundColor: NOTE_TYPE_COLORS.reminder }]}>
              <Text style={styles.noteTypeText}>Reminder</Text>
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
            placeholder="Reminder Title"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            returnKeyType="done"
          />

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
            placeholder="Add description or notes..."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline={true}
            textAlignVertical="top"
            numberOfLines={4}
          />

          {/* Date Picker */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} /> Date
            </Text>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: colors.text }]}>
                {reminderDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Time Picker */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Ionicons name="time-outline" size={18} color={colors.primary} /> Time
            </Text>
            <TouchableOpacity
              style={[styles.timeButton, { borderColor: colors.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.timeText, { color: colors.text }]}>
                {reminderTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Repeat Options */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Ionicons name="repeat-outline" size={18} color={colors.primary} /> Repeat
            </Text>
            <View style={styles.optionsContainer}>
              {REPEAT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: repeatOption === option.key ? colors.primary : 'transparent',
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => {
                    setRepeatOption(option.key);
                    autoSave();
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    { 
                      color: repeatOption === option.key ? '#fff' : colors.text,
                      fontWeight: repeatOption === option.key ? '600' : '400',
                    }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority Options */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Ionicons name="flag-outline" size={18} color={colors.primary} /> Priority
            </Text>
            <View style={styles.optionsContainer}>
              {PRIORITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: priority === option.key ? option.color : 'transparent',
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => {
                    setPriority(option.key);
                    autoSave();
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    { 
                      color: priority === option.key ? '#fff' : colors.text,
                      fontWeight: priority === option.key ? '600' : '400',
                    }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notifications Toggle */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>
                  <Ionicons name="notifications-outline" size={18} color={colors.primary} /> Notifications
                </Text>
                <Text style={[styles.toggleDescription, { color: colors.mutedForeground }]}>
                  Get notified when this reminder is due
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => {
                  setNotificationsEnabled(value);
                  autoSave();
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
          </View>

          {/* Time Remaining */}
          <View style={[styles.countdownContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.countdownTitle, { color: colors.text }]}>
              Time Remaining
            </Text>
            <Text style={[styles.countdownTime, { color: colors.primary }]}>
              {calculateTimeRemaining()}
            </Text>
          </View>

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={[styles.metadataText, { color: colors.mutedForeground }]}>
              Priority: <Text style={{ color: getPriorityColor(priority) }}>{priority.toUpperCase()}</Text> • 
              Repeat: {repeatOption} • 
              Notifications: {notificationsEnabled ? 'On' : 'Off'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={reminderDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event: any, selectedDate: any) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setReminderDate(selectedDate);
              autoSave();
            }
          }}
        />
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          display="default"
          onChange={(event: any, selectedTime: any) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setReminderTime(selectedTime);
              autoSave();
            }
          }}
        />
      )}
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
  descriptionInput: {
    fontSize: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    minHeight: 100,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toggleDescription: {
    fontSize: 14,
  },
  countdownContainer: {
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  countdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  countdownTime: {
    fontSize: 24,
    fontWeight: '700',
  },
  metadata: {
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
