import { AppStateContext } from '@/context/AppStateContext';
import { Note } from '@/types/note';
import React, { useContext, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

export const NotesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const appState = useContext(AppStateContext);

  if (!appState) {
    return null;
  }

  const {
    notes,
    selectedNote,
    filteredNotes,
    createNote,
    updateNote,
    deleteNote,
    setSelectedNote,
    setSearchQuery: setAppStateSearchQuery,
  } = appState;

  const handleCreateNote = () => {
    createNote();
  };

  const handleNotePress = (note: Note) => {
    setSelectedNote(note.id);
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNote(noteId),
        },
      ]
    );
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={styles.noteItem}
      onPress={() => handleNotePress(item)}
      onLongPress={() => handleDeleteNote(item.id)}
    >
      <Text style={styles.noteTitle}>{item.title || 'Untitled'}</Text>
      <Text style={styles.noteContent} numberOfLines={2}>
        {item.content}
      </Text>
      <Text style={styles.noteDate}>
        {new Date(item.updatedAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (selectedNote) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedNote(null)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteNote(selectedNote.id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.titleInput}
            value={selectedNote.title}
            onChangeText={(text) => updateNote(selectedNote.id, { title: text })}
            placeholder="Note title"
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.contentInput}
            value={selectedNote.content}
            onChangeText={(text) => updateNote(selectedNote.id, { content: text })}
            placeholder="Start typing..."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ACONCCI Notes</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNote}>
          <Text style={styles.createButtonText}>+ New Note</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          setAppStateSearchQuery(text);
        }}
        placeholder="Search notes..."
        placeholderTextColor="#999"
      />

      <FlatList
        data={filteredNotes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        style={styles.notesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notes yet</Text>
            <Text style={styles.emptySubtext}>Create your first note to get started</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3EACC6',
  },
  createButton: {
    backgroundColor: '#3EACC6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
  },
  notesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  noteItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3EACC6',
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  noteContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  editorContainer: {
    flex: 1,
    padding: 16,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#3EACC6',
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    color: '#ED9097',
    fontSize: 16,
  },
  titleInput: {
    padding: 15,
    fontSize: 24,
    fontWeight: 'bold',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
  },
  contentInput: {
    padding: 15,
    fontSize: 16,
    flex: 1,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
  },
});
