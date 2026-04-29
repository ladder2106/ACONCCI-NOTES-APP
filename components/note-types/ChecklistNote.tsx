import { useThemeColors } from '@/hooks/useThemeColors';
import { NOTE_TYPE_COLORS } from '@/types/note';
import { Spacing } from '@/utils/mobile';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

interface ChecklistNoteProps {
  note?: any; // Will be typed as ChecklistNote when integrated
  onSave: (note: any) => void;
  onClose: () => void;
}

export function ChecklistNote({ note, onSave, onClose }: ChecklistNoteProps) {
  const colors = useThemeColors();
  const [title, setTitle] = useState(note?.title || 'Checklist');
  const [items, setItems] = useState<ChecklistItem[]>(note?.items || []);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const newItemInputRef = useRef<TextInput>(null);

  // Calculate progress
  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Auto-save functionality
  const autoSave = useCallback(() => {
    setIsAutoSaving(true);
    setShowSavedIndicator(true);
    
    // Save note
    const noteData = {
      ...note,
      title,
      content: generateContentFromItems(),
      items,
      completedCount,
      totalCount,
      updatedAt: new Date().toISOString(),
    };

    onSave(noteData);

    // Hide saved indicator after 2 seconds
    setTimeout(() => {
      setShowSavedIndicator(false);
    }, 2000);

    setIsAutoSaving(false);
  }, [title, items, completedCount, totalCount, note, onSave]);

  // Generate content from items
  const generateContentFromItems = () => {
    return items.map(item => `${item.completed ? '✓' : '○'} ${item.text}`).join('\n');
  };

  // Auto-save every 30 seconds or on content change
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      autoSave();
    }, 30000); // 30 seconds

    return () => {
      clearTimeout(autoSaveTimer);
    };
  }, [title, items, autoSave]);

  // Add new item
  const addNewItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        completed: false,
        order: items.length,
      };
      
      setItems(prev => [...prev, newItem]);
      setNewItemText('');
      
      // Focus back to input for continuous adding
      setTimeout(() => {
        newItemInputRef.current?.focus();
      }, 100);
      
      autoSave();
    }
  };

  // Toggle item completion
  const toggleItemCompletion = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
    autoSave();
  };

  // Update item text
  const updateItemText = (itemId: string, text: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, text } : item
    ));
  };

  // Delete item
  const deleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setItems(prev => prev.filter(item => item.id !== itemId));
            autoSave();
          },
        },
      ]
    );
  };

  // Reorder items (simplified version)
  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    
    // Update order values
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order: index,
    }));
    
    setItems(reorderedItems);
    autoSave();
  };

  // Separate completed and incomplete items
  const incompleteItems = items.filter(item => !item.completed);
  const completedItems = items.filter(item => item.completed);

  // Render checklist item
  const renderChecklistItem = ({ item, isCompleted = false }: { item: ChecklistItem; isCompleted?: boolean }) => {
    const animatedValue = useRef(new Animated.Value(1)).current;

    const handleSwipe = () => {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        deleteItem(item.id);
      });
    };

    return (
      <Animated.View style={[styles.itemContainer, { opacity: animatedValue }]}>
        <TouchableOpacity
          style={styles.itemCheckbox}
          onPress={() => toggleItemCompletion(item.id)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.checkbox,
            { 
              borderColor: colors.border,
              backgroundColor: item.completed ? colors.primary : 'transparent',
            }
          ]}>
            {item.completed && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
        </TouchableOpacity>

        <TextInput
          style={[
            styles.itemText,
            {
              color: colors.text,
              textDecorationLine: item.completed ? 'line-through' : 'none',
              opacity: item.completed ? 0.6 : 1,
            }
          ]}
          value={item.text}
          onChangeText={(text) => updateItemText(item.id, text)}
          multiline={true}
          placeholder="Task item..."
          placeholderTextColor={colors.mutedForeground}
          onSubmitEditing={() => newItemInputRef.current?.focus()}
          returnKeyType="next"
        />

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteItem(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </Animated.View>
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
            <View style={[styles.noteTypeBadge, { backgroundColor: NOTE_TYPE_COLORS.checklist }]}>
              <Text style={styles.noteTypeText}>Checklist</Text>
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
          ref={scrollViewRef}
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
            placeholder="Checklist Title"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            returnKeyType="done"
          />

          {/* Progress Indicator */}
          <View style={[styles.progressContainer, { backgroundColor: colors.card }]}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressText, { color: colors.text }]}>
                {completedCount} of {totalCount} completed
              </Text>
              <Text style={[styles.progressPercentage, { color: colors.primary }]}>
                {Math.round(progressPercentage)}%
              </Text>
            </View>
            
            {/* Progress Bar */}
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    backgroundColor: colors.primary,
                    width: `${progressPercentage}%`
                  }
                ]}
              />
            </View>
          </View>

          {/* Incomplete Items */}
          {incompleteItems.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Tasks ({incompleteItems.length})
              </Text>
              {incompleteItems.map(item => (
                <View key={item.id}>
                  {renderChecklistItem({ item })}
                </View>
              ))}
            </View>
          )}

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                Completed ({completedItems.length})
              </Text>
              {completedItems.map(item => (
                <View key={item.id}>
                  {renderChecklistItem({ item, isCompleted: true })}
                </View>
              ))}
            </View>
          )}

          {/* Add New Item */}
          <View style={[styles.addItemContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.itemCheckbox}
              onPress={addNewItem}
              disabled={!newItemText.trim()}
            >
              <View style={[
                styles.checkbox,
                { 
                  borderColor: colors.border,
                  backgroundColor: newItemText.trim() ? colors.primary : 'transparent',
                }
              ]}>
                {newItemText.trim() && (
                  <Ionicons name="add" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>

            <TextInput
              ref={newItemInputRef}
              style={[
                styles.newItemInput,
                { 
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.inputBackground,
                }
              ]}
              placeholder="Add new task..."
              placeholderTextColor={colors.mutedForeground}
              value={newItemText}
              onChangeText={setNewItemText}
              onSubmitEditing={addNewItem}
              returnKeyType="done"
              multiline={false}
            />
          </View>

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={[styles.metadataText, { color: colors.mutedForeground }]}>
              {totalCount} item{totalCount !== 1 ? 's' : ''} • 
              {completedCount} completed • 
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
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  itemCheckbox: {
    paddingTop: Spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
    minHeight: 24,
    textAlignVertical: 'top',
  },
  deleteButton: {
    padding: Spacing.xs,
    alignSelf: 'flex-start',
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  newItemInput: {
    flex: 1,
    fontSize: 16,
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
  },
  metadata: {
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  metadataText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
