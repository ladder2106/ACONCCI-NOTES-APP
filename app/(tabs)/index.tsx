import { CategoryDrawer } from '@/components/CategoryDrawer';
import { CreateCategoryModal } from '@/components/CreateCategoryModal';
import { NoteCard } from '@/components/NoteCard';
import { TemplatePicker } from '@/components/TemplatePicker';
import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { NoteTemplate } from '@/types/note';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
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
} from 'react-native';

export default function NotesScreen() {
  const appState = useContext(AppStateContext);
  const colors = useThemeColors();
  const router = useRouter();

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [viewType, setViewType] = useState<'list' | 'grid'>(appState.settings.defaultView);

  const handleCreateNote = () => {
    setShowTemplateDialog(true);
  };

  const handleSelectTemplate = (template: NoteTemplate) => {
    const note = appState.createNote(template);
    router.push(`/note/${note.id}` as any);
  };

  const handleDeleteNote = (id: string) => {
    const note = appState.notes.find((n) => n.id === id);
    if (note?.isTrashed) {
      Alert.alert(
        'Delete Permanently?',
        'This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => appState.deleteNote(id, true),
          },
        ]
      );
    } else {
      appState.deleteNote(id, false);
    }
  };

  const handleEmptyTrash = () => {
    Alert.alert(
      'Empty Trash?',
      'This will permanently delete all notes in trash.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Empty',
          style: 'destructive',
          onPress: () => appState.emptyTrash(),
        },
      ]
    );
  };

  const getViewTitle = () => {
    switch (appState.viewMode) {
      case 'pinned': return 'Pinned Notes';
      case 'archived': return 'Archived Notes';
      case 'trash': return 'Trash';
      case 'category': {
        const cat = appState.categories.find((c) => c.id === appState.selectedCategoryId);
        return cat ? `${cat.icon} ${cat.name}` : 'Category';
      }
      default: return 'All Notes';
    }
  };

  if (!appState.isLoaded) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={{ color: colors.mutedForeground }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => setShowDrawer(true)} style={styles.menuButton}>
            <Ionicons name="menu-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <Image
            source={require('@/assets/images/aconcci-logo.png')}
            style={styles.headerLogo}
            contentFit="contain"
          />
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setViewType((v) => (v === 'list' ? 'grid' : 'list'))}
              style={styles.iconButton}
            >
              <Ionicons
                name={viewType === 'list' ? 'grid-outline' : 'list-outline'}
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.viewTitle, { color: colors.text }]}>{getViewTitle()}</Text>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            placeholder="Search notes..."
            placeholderTextColor={colors.mutedForeground}
            value={appState.searchQuery}
            onChangeText={appState.setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {appState.searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => appState.setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notes list */}
      {appState.filteredNotes.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
            <Ionicons
              name={appState.viewMode === 'trash' ? 'trash-outline' : 'document-text-outline'}
              size={40}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {appState.searchQuery
              ? 'No notes found'
              : appState.viewMode === 'trash'
                ? 'Trash is empty'
                : 'No notes yet'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            {appState.searchQuery
              ? 'Try a different search term'
              : 'Tap + to create your first note'}
          </Text>
        </View>
      ) : (
        <FlatList
          key={viewType}
          data={appState.filteredNotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            viewType === 'grid' && styles.gridContent,
          ]}
          numColumns={viewType === 'grid' ? 2 : 1}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              isSelected={appState.selectedNoteId === item.id}
              isTrash={appState.viewMode === 'trash'}
              tags={appState.tags}
              categories={appState.categories}
              viewType={viewType}
              onPress={() => {
                if (appState.viewMode !== 'trash') {
                  appState.setSelectedNote(item.id);
                  router.push(`/note/${item.id}` as any);
                }
              }}
              onDelete={handleDeleteNote}
              onRestore={appState.restoreNote}
              onTogglePin={appState.togglePin}
              onToggleArchive={appState.toggleArchive}
              onChangeColor={(noteId, color) =>
                appState.updateNote(noteId, { color })
              }
            />
          )}
        />
      )}

      {/* Empty trash button */}
      {appState.viewMode === 'trash' && appState.filteredNotes.length > 0 && (
        <TouchableOpacity
          onPress={handleEmptyTrash}
          style={[styles.emptyTrashButton, { backgroundColor: colors.destructive }]}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.emptyTrashText}>Empty Trash</Text>
        </TouchableOpacity>
      )}

      {/* FAB */}
      {appState.viewMode !== 'trash' && (
        <TouchableOpacity
          onPress={handleCreateNote}
          style={[styles.fab, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modals */}
      <TemplatePicker
        visible={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <CategoryDrawer
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        viewMode={appState.viewMode}
        selectedCategoryId={appState.selectedCategoryId}
        categories={appState.categories}
        noteCounts={appState.noteCounts}
        onViewChange={appState.setViewMode}
        onCreateCategory={() => {
          setShowDrawer(false);
          setShowCategoryDialog(true);
        }}
        onDeleteCategory={(id) => {
          Alert.alert('Delete Category?', 'Notes will be moved to "Uncategorized".', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => appState.deleteCategory(id),
            },
          ]);
        }}
        onOpenSettings={() => {
          router.push('/(tabs)/settings');
        }}
      />

      <CreateCategoryModal
        visible={showCategoryDialog}
        onClose={() => setShowCategoryDialog(false)}
        onCreateCategory={appState.createCategory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 12,
  },
  menuButton: {
    padding: 4,
  },
  headerLogo: {
    width: 110,
    height: 28,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  viewTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  listContent: {
    padding: 12,
  },
  gridContent: {
    paddingHorizontal: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  emptyTrashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    padding: 14,
    borderRadius: 10,
  },
  emptyTrashText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
});
