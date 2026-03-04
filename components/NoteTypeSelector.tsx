import { useThemeColors } from '@/hooks/useThemeColors';
import { Note } from '@/types/note';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NoteTypeSelectorProps {
  onSelectNoteType: (type: Note['type']) => void;
  onClose: () => void;
}

const NOTE_TYPES = [
  {
    type: 'journal' as const,
    title: 'Journal Entry',
    description: 'Chronological entry with mood tracking',
    icon: 'book-outline',
    color: '#3EACC6',
  },
  {
    type: 'vault' as const,
    title: 'Vault Note',
    description: 'High-security encrypted content',
    icon: 'lock-closed-outline',
    color: '#ED9097',
  },
  {
    type: 'sticky' as const,
    title: 'Sticky Note',
    description: 'Visual note with background color',
    icon: 'color-palette-outline',
    color: '#FFB74D',
  },
  {
    type: 'quick_capture' as const,
    title: 'Quick Capture',
    description: 'Minimal scratchpad for rapid entry',
    icon: 'flash-outline',
    color: '#66BB6A',
  },
];

export function NoteTypeSelector({ onSelectNoteType, onClose }: NoteTypeSelectorProps) {
  const colors = useThemeColors();

  const handleSelect = (type: Note['type']) => {
    onSelectNoteType(type);
    onClose();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Choose Note Type
      </Text>
      
      {NOTE_TYPES.map((noteType) => (
        <TouchableOpacity
          key={noteType.type}
          style={[styles.typeOption, { borderColor: colors.border }]}
          onPress={() => handleSelect(noteType.type)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: noteType.color + '20' }]}>
            <Ionicons 
              name={noteType.icon} 
              size={24} 
              color={noteType.color} 
            />
          </View>
          
          <View style={styles.typeInfo}>
            <Text style={[styles.typeTitle, { color: colors.text }]}>
              {noteType.title}
            </Text>
            <Text style={[styles.typeDescription, { color: colors.mutedForeground }]}>
              {noteType.description}
            </Text>
          </View>
          
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color={colors.mutedForeground} 
          />
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity
        style={[styles.cancelButton, { borderColor: colors.border }]}
        onPress={onClose}
        activeOpacity={0.7}
      >
        <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
