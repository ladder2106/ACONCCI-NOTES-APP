import { CategoryDrawer } from '@/components/CategoryDrawer';
import { CreateCategoryModal } from '@/components/CreateCategoryModal';
import { NoteCard } from '@/components/NoteCard';
import { TemplatePicker } from '@/components/TemplatePicker';
import { Brand } from '@/constants/theme';
import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { NoteTemplate } from '@/types/note';
import { Spacing, Touch } from '@/utils/mobile';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Animated counter component for stats
function AnimatedCounter({
  value,
  style,
}: {
  value: number;
  style: any;
}) {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.value = 0;
    const duration = 800;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [value]);

  return <Text style={style}>{displayValue}</Text>;
}

export default function NotesScreen() {
  const appState = useContext(AppStateContext);
  const colors = useThemeColors();
  const router = useRouter();

  if (!appState) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [viewType, setViewType] = useState<'list' | 'grid'>(appState.settings.defaultView);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNoteTypeSelector, setShowNoteTypeSelector] = useState(false);

  // FAB animation values
  const fabScale = useSharedValue(1);
  const fabRotation = useSharedValue(0);

  // Search bar animation
  const searchBorderProgress = useSharedValue(0);

  // Empty state floating animation
  const floatY = useSharedValue(0);

  useEffect(() => {
    // Start empty state floating animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Search bar animated border
  useEffect(() => {
    searchBorderProgress.value = withTiming(isSearchFocused ? 1 : 0, { duration: 200 });
  }, [isSearchFocused]);

  const searchAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      searchBorderProgress.value,
      [0, 1],
      [colors.border, colors.primary]
    );
    return {
      borderColor,
      borderWidth: searchBorderProgress.value === 1 ? 1.5 : 1,
    };
  });

  // FAB animated style
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotation.value}deg` },
    ],
  }));

  // Empty state float style
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const handleCreateNote = () => {
    // FAB press animation
    fabScale.value = withSpring(0.85, { damping: 15, stiffness: 400 }, () => {
      fabScale.value = withSpring(1, { damping: 12, stiffness: 300 });
    });
    fabRotation.value = withSpring(90, { damping: 15, stiffness: 300 }, () => {
      fabRotation.value = withSpring(0, { damping: 15, stiffness: 300 });
    });
    setTimeout(() => setShowNoteTypeSelector(true), 150);
  };

  const handleSelectTemplate = (template: NoteTemplate) => {
    appState.createNote(template);
    // Note: The note ID will be available as selectedNoteId after creation
    if (appState.selectedNoteId) {
      router.push(`/note/${appState.selectedNoteId}` as any);
    }
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

  const handleCreateNote = (noteType?: Note['type']) => {
    if (noteType) {
      appState.createNote(undefined, noteType);
      // Navigate to the created note
      if (appState.selectedNoteId) {
        router.push(`/note/${appState.selectedNoteId}` as any);
      }
    } else {
      setShowNoteTypeSelector(true);
    }
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

  // View toggle with LayoutAnimation
  const handleViewToggle = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
    setViewType((v) => (v === 'list' ? 'grid' : 'list'));
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

  const totalWords = appState.notes
    .filter((n) => !n.isTrashed)
    .reduce((sum, n) => {
      const words = n.content.trim().split(/\s+/).filter((w) => w.length > 0).length;
      return sum + words;
    }, 0);

  const activeNotesCount = appState.notes.filter((n) => !n.isTrashed).length;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                onPress={handleViewToggle}
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

          {/* Search with focus animation */}
          <Animated.View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.inputBackground },
              searchAnimatedStyle,
            ]}
          >
            <Ionicons name="search-outline" size={16} color={isSearchFocused ? colors.primary : colors.mutedForeground} />
            <TextInput
              placeholder="Search notes..."
              placeholderTextColor={colors.mutedForeground}
              value={appState.searchQuery}
              onChangeText={appState.setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {appState.searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => appState.setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Stats with animated counters */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={styles.statsRow}
          >
            <View style={[styles.statCard, { backgroundColor: colors.accent }]}>
              <AnimatedCounter
                value={activeNotesCount}
                style={[styles.statNumber, { color: colors.primary }]}
              />
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Notes</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.accent }]}>
              <AnimatedCounter
                value={appState.categories.length}
                style={[styles.statNumber, { color: Brand.secondary }]}
              />
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Categories</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.accent }]}>
              <AnimatedCounter
                value={totalWords}
                style={[styles.statNumber, { color: colors.primary }]}
              />
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Words</Text>
            </View>
          </Animated.View>
        </View>

        {/* Notes list */}
        {appState.filteredNotes.length === 0 ? (
          <Animated.View
            entering={FadeIn.delay(300).duration(600)}
            style={styles.emptyState}
          >
            <Animated.View style={[styles.emptyIcon, { backgroundColor: colors.accent }, floatStyle]}>
              <Ionicons
                name={appState.viewMode === 'trash' ? 'trash-outline' : 'document-text-outline'}
                size={40}
                color={colors.primary}
              />
            </Animated.View>
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
          </Animated.View>
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
            renderItem={({ item, index }) => (
              <NoteCard
                note={item}
                isSelected={appState.selectedNoteId === item.id}
                isTrash={appState.viewMode === 'trash'}
                tags={appState.tags}
                categories={appState.categories}
                viewType={viewType}
                index={index}
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

        {/* FAB with animation */}
        {appState.viewMode !== 'trash' && (
          <TouchableOpacity
            onPress={handleCreateNote}
            activeOpacity={1}
          >
            <Animated.View
              style={[
                styles.fab,
                { backgroundColor: colors.primary },
                fabAnimatedStyle,
              ]}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Modals */}
        <TemplatePicker
          visible={showTemplateDialog}
          onClose={() => setShowTemplateDialog(false)}
          onSelectTemplate={handleSelectTemplate}
        />

        <NoteTypeSelector
          visible={showNoteTypeSelector}
          onClose={() => setShowNoteTypeSelector(false)}
          onSelectNoteType={handleCreateNote}
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
    </GestureHandlerRootView>
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
    paddingHorizontal: Spacing.responsive(3),
    paddingBottom: Spacing.responsive(3),
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.responsive(2),
    marginBottom: Spacing.md,
  },
  menuButton: {
    padding: Spacing.xs,
    minHeight: Touch.minTouchSize,
    justifyContent: 'center',
    alignItems: 'center',
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
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
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
