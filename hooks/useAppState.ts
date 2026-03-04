import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from "react";
import { VaultService } from "../services/vaultService";
import {
    AppSettings,
    AppState,
    Category,
    Note,
    NoteTemplate,
    Tag,
    VaultNote,
    ViewMode
} from "../types/note";

const STORAGE_KEY = "aconcci-notes-app";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 12);
}

const defaultSettings: AppSettings = {
  theme: 'light',
  defaultView: 'list',
  sortBy: 'dateModified',
  sortOrder: 'desc',
  autoSave: true,
  showWordCount: true,
};

const defaultCategories: Category[] = [
  { id: 'personal', name: 'Personal', color: '#3EACC6', icon: 'ðŸ‘¤', parentId: null, createdAt: new Date().toISOString() },
  { id: 'work', name: 'Work', color: '#ED9097', icon: 'ðŸ’¼', parentId: null, createdAt: new Date().toISOString() },
  { id: 'ideas', name: 'Ideas', color: '#FFC857', icon: 'ðŸ’¡', parentId: null, createdAt: new Date().toISOString() },
];

export const noteTemplates: NoteTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Note',
    content: '',
    icon: 'ðŸ“',
  },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n- \n\n## Discussion\n\n\n## Action Items\n- [ ] \n\n## Next Steps\n',
    icon: 'ðŸ¤',
  },
  {
    id: 'journal',
    name: 'Daily Journal',
    content: '# Daily Journal\n\n**Date:** \n**Mood:** \n\n## What happened today?\n\n\n## Grateful for:\n- \n\n## Tomorrow\'s goals:\n- \n',
    icon: 'ðŸ“”',
  },
  {
    id: 'todo',
    name: 'To-Do List',
    content: '# To-Do List\n\n## Today\n- [ ] \n\n## This Week\n- [ ] \n\n## Backlog\n- [ ] \n',
    icon: 'âœ…',
  },
  {
    id: 'project',
    name: 'Project Plan',
    content: '# Project Plan\n\n**Project Name:** \n**Start Date:** \n**Deadline:** \n\n## Overview\n\n\n## Goals\n1. \n\n## Tasks\n- [ ] \n\n## Resources\n\n\n## Notes\n',
    icon: 'ðŸŽ¯',
  },
];

export function useAppState(userId: string | null, masterPassword: string | null) {
  const [state, setState] = useState<AppState>({
    notes: [],
    categories: defaultCategories,
    tags: [],
    settings: defaultSettings,
    selectedNoteId: null,
    searchQuery: '',
    viewMode: 'all',
    selectedCategoryId: null,
    selectedTagId: null,
  });

  const [isLoading, setIsLoading] = useState(true);

  const getUserStorageKey = () => {
    return userId ? `${STORAGE_KEY}-${userId}` : STORAGE_KEY;
  };

  // Safe JSON parse with error handling
  const safeJsonParse = (data: string | null): any => {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return null;
    }
  };

  // Load from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const storageKey = getUserStorageKey();

      try {
        const stored = await AsyncStorage.getItem(storageKey);

        if (stored) {
          const data = safeJsonParse(stored);
          if (data) {
            setState(prev => ({
              ...prev,
              ...data,
              settings: { ...defaultSettings, ...data.settings },
            }));
          }
        } else {
          // Initialize with default categories for new users
          setState(prev => ({
            ...prev,
            categories: defaultCategories,
          }));
        }
      } catch (e) {
        console.error("Failed to load app state:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Save to AsyncStorage
  useEffect(() => {
    if (!userId || isLoading) return;

    const saveData = async () => {
      try {
        const dataToSave = JSON.stringify({
          notes: state.notes,
          categories: state.categories,
          tags: state.tags,
          settings: state.settings,
        });

        const storageKey = getUserStorageKey();
        await AsyncStorage.setItem(storageKey, dataToSave);
      } catch (e) {
        console.error("Failed to save data:", e);
      }
    };

    saveData();
  }, [state, userId, isLoading]);

  // Note: Theme handling will be done at the component level in React Native

  const createNote = async (template?: NoteTemplate, noteType?: Note['type']) => {
    let newNote: Note;

    switch (noteType) {
      case 'vault':
        const vaultNote: VaultNote = {
          id: generateId(),
          title: 'Secure Vault Note',
          content: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          categoryId: state.selectedCategoryId,
          tags: [],
          isPinned: false,
          isArchived: false,
          isTrashed: false,
          color: null,
          isMarkdown: false,
          type: 'vault',
          isLocked: true,
        };
        
        // Store empty content in secure storage
        await VaultService.storeVaultContent(vaultNote.id, '');
        newNote = vaultNote;
        break;

      case 'quick_capture':
        newNote = {
          id: generateId(),
          title: 'Quick Capture',
          content: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          categoryId: state.selectedCategoryId,
          tags: [],
          isPinned: false,
          isArchived: false,
          isTrashed: false,
          color: null,
          isMarkdown: false,
          type: 'quick_capture',
          capturedAt: new Date().toISOString(),
          autoDelete: false,
        };
        break;

      case 'sticky':
        newNote = {
          id: generateId(),
          title: 'Sticky Note',
          content: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          categoryId: state.selectedCategoryId,
          tags: [],
          isPinned: false,
          isArchived: false,
          isTrashed: false,
          color: null,
          isMarkdown: false,
          type: 'sticky',
          background_color: 'Pastel Yellow',
        };
        break;

      case 'journal':
        const today = new Date().toISOString().split('T')[0];
        newNote = {
          id: generateId(),
          title: `Journal Entry - ${today}`,
          content: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          categoryId: state.selectedCategoryId,
          tags: [],
          isPinned: false,
          isArchived: false,
          isTrashed: false,
          color: null,
          isMarkdown: false,
          type: 'journal',
          timestamp: new Date().toISOString(),
          mood_emoji: 'Neutral',
          entry_date: today,
        };
        break;

      default:
        // Legacy note type
        newNote = {
          id: generateId(),
          title: '',
          content: template?.content || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          categoryId: state.selectedCategoryId,
          tags: [],
          isPinned: false,
          isArchived: false,
          isTrashed: false,
          color: null,
          isMarkdown: !!template?.content,
          type: 'journal', // Default to journal for new notes
          timestamp: new Date().toISOString(),
          mood_emoji: 'Neutral',
          entry_date: new Date().toISOString().split('T')[0],
        };
    }

    setState(prev => ({
      ...prev,
      notes: [newNote, ...prev.notes],
      selectedNoteId: newNote.id,
      viewMode: 'all',
    }));
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(note =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      ),
    }));
  };

  const deleteNote = (id: string, permanent = false) => {
    if (permanent) {
      setState(prev => ({
        ...prev,
        notes: prev.notes.filter(note => note.id !== id),
        selectedNoteId: prev.selectedNoteId === id ? null : prev.selectedNoteId,
      }));
    } else {
      updateNote(id, { isTrashed: true });
      setState(prev => ({
        ...prev,
        selectedNoteId: prev.selectedNoteId === id ? null : prev.selectedNoteId,
      }));
    }
  };

  const restoreNote = (id: string) => {
    updateNote(id, { isTrashed: false, isArchived: false });
  };

  const emptyTrash = () => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.filter(note => !note.isTrashed),
    }));
  };

  const togglePin = (id: string) => {
    const note = state.notes.find(n => n.id === id);
    if (note) {
      updateNote(id, { isPinned: !note.isPinned });
    }
  };

  const toggleArchive = (id: string) => {
    const note = state.notes.find(n => n.id === id);
    if (note) {
      updateNote(id, { isArchived: !note.isArchived });
    }
  };

  const createCategory = (name: string, color: string, icon: string, parentId: string | null = null) => {
    const newCategory: Category = {
      id: generateId(),
      name,
      color,
      icon,
      parentId,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === id ? { ...cat, ...updates } : cat
      ),
    }));
  };

  const deleteCategory = (id: string) => {
    // Move notes from this category to uncategorized
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== id && cat.parentId !== id),
      notes: prev.notes.map(note =>
        note.categoryId === id ? { ...note, categoryId: null } : note
      ),
    }));
  };

  const createTag = (name: string, color: string) => {
    const newTag: Tag = {
      id: generateId(),
      name,
      color,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      tags: [...prev.tags, newTag],
    }));
    return newTag;
  };

  const deleteTag = (id: string) => {
    setState(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.id !== id),
      notes: prev.notes.map(note => ({
        ...note,
        tags: note.tags.filter(tagId => tagId !== id),
      })),
    }));
  };

  const addTagToNote = (noteId: string, tagId: string) => {
    const note = state.notes.find(n => n.id === noteId);
    if (note && !note.tags.includes(tagId)) {
      updateNote(noteId, { tags: [...note.tags, tagId] });
    }
  };

  const removeTagFromNote = (noteId: string, tagId: string) => {
    const note = state.notes.find(n => n.id === noteId);
    if (note) {
      updateNote(noteId, { tags: note.tags.filter(t => t !== tagId) });
    }
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  };

  const setViewMode = (viewMode: ViewMode, categoryId?: string, tagId?: string) => {
    setState(prev => ({
      ...prev,
      viewMode,
      selectedCategoryId: categoryId || null,
      selectedTagId: tagId || null,
      selectedNoteId: null,
    }));
  };

  const setSearchQuery = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const setSelectedNote = (id: string | null) => {
    setState(prev => ({ ...prev, selectedNoteId: id }));
  };

  // Get filtered notes based on current view
  const getFilteredNotes = () => {
    let filtered = state.notes;

    // Filter by view mode
    switch (state.viewMode) {
      case 'pinned':
        filtered = filtered.filter(n => n.isPinned && !n.isTrashed);
        break;
      case 'archived':
        filtered = filtered.filter(n => n.isArchived && !n.isTrashed);
        break;
      case 'trash':
        filtered = filtered.filter(n => n.isTrashed);
        break;
      case 'category':
        filtered = filtered.filter(n => n.categoryId === state.selectedCategoryId && !n.isTrashed && !n.isArchived);
        break;
      case 'tag':
        filtered = filtered.filter(n => n.tags.includes(state.selectedTagId!) && !n.isTrashed && !n.isArchived);
        break;
      default:
        filtered = filtered.filter(n => !n.isTrashed && !n.isArchived);
    }

    // Search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      // Pinned always first (except in trash/archive view)
      if (state.viewMode !== 'trash' && state.viewMode !== 'archived') {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
      }

      const multiplier = state.settings.sortOrder === 'asc' ? 1 : -1;

      switch (state.settings.sortBy) {
        case 'dateCreated':
          return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case 'dateModified':
          return multiplier * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        case 'title':
          return multiplier * a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const selectedNote = state.notes.find(n => n.id === state.selectedNoteId) || null;
  const filteredNotes = getFilteredNotes();

  // Calculate note counts for categories
  const noteCounts = {
    all: state.notes.filter(n => !n.isTrashed && !n.isArchived).length,
    pinned: state.notes.filter(n => n.isPinned && !n.isTrashed).length,
    archived: state.notes.filter(n => n.isArchived && !n.isTrashed).length,
    trash: state.notes.filter(n => n.isTrashed).length,
    byCategory: state.categories.reduce((acc, cat) => {
      acc[cat.id] = state.notes.filter(
        n => n.categoryId === cat.id && !n.isTrashed && !n.isArchived
      ).length;
      return acc;
    }, {} as Record<string, number>),
  };

  return {
    ...state,
    selectedNote,
    filteredNotes,
    noteCounts,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    emptyTrash,
    togglePin,
    toggleArchive,
    createCategory,
    updateCategory,
    deleteCategory,
    createTag,
    deleteTag,
    addTagToNote,
    removeTagFromNote,
    updateSettings,
    setViewMode,
    setSearchQuery,
    setSelectedNote,
  };
}
