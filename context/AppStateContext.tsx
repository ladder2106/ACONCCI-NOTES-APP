import {
    AppSettings,
    AppState,
    Category,
    Note,
    NoteTemplate,
    Tag,
    ViewMode,
} from '@/types/note';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'aconcci-notes-app';

const defaultSettings: AppSettings = {
    theme: 'light',
    defaultView: 'list',
    sortBy: 'dateModified',
    sortOrder: 'desc',
    autoSave: true,
    showWordCount: true,
};

const defaultCategories: Category[] = [
    { id: 'personal', name: 'Personal', color: '#3EACC6', icon: '👤', parentId: null, createdAt: new Date().toISOString() },
    { id: 'work', name: 'Work', color: '#ED9097', icon: '💼', parentId: null, createdAt: new Date().toISOString() },
    { id: 'ideas', name: 'Ideas', color: '#FFC857', icon: '💡', parentId: null, createdAt: new Date().toISOString() },
];

export const noteTemplates: NoteTemplate[] = [
    { id: 'blank', name: 'Blank Note', content: '', icon: '📝' },
    {
        id: 'meeting',
        name: 'Meeting Notes',
        content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n- \n\n## Discussion\n\n\n## Action Items\n- [ ] \n\n## Next Steps\n',
        icon: '🤝',
    },
    {
        id: 'journal',
        name: 'Daily Journal',
        content: "# Daily Journal\n\n**Date:** \n**Mood:** \n\n## What happened today?\n\n\n## Grateful for:\n- \n\n## Tomorrow's goals:\n- \n",
        icon: '📔',
    },
    {
        id: 'todo',
        name: 'To-Do List',
        content: '# To-Do List\n\n## Today\n- [ ] \n\n## This Week\n- [ ] \n\n## Backlog\n- [ ] \n',
        icon: '✅',
    },
    {
        id: 'project',
        name: 'Project Plan',
        content: '# Project Plan\n\n**Project Name:** \n**Start Date:** \n**Deadline:** \n\n## Overview\n\n\n## Goals\n1. \n\n## Tasks\n- [ ] \n\n## Resources\n\n\n## Notes\n',
        icon: '🎯',
    },
];

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 12);
}

interface AppContextType extends AppState {
    isLoaded: boolean;
    selectedNote: Note | null;
    filteredNotes: Note[];
    noteCounts: {
        all: number;
        pinned: number;
        archived: number;
        trash: number;
        byCategory: Record<string, number>;
    };
    createNote: (template?: NoteTemplate) => Note;
    updateNote: (id: string, updates: Partial<Note>) => void;
    deleteNote: (id: string, permanent?: boolean) => void;
    restoreNote: (id: string) => void;
    emptyTrash: () => void;
    togglePin: (id: string) => void;
    toggleArchive: (id: string) => void;
    createCategory: (name: string, color: string, icon: string, parentId?: string | null) => Category;
    deleteCategory: (id: string) => void;
    createTag: (name: string, color: string) => Tag;
    deleteTag: (id: string) => void;
    addTagToNote: (noteId: string, tagId: string) => void;
    removeTagFromNote: (noteId: string, tagId: string) => void;
    updateSettings: (updates: Partial<AppSettings>) => void;
    setViewMode: (viewMode: ViewMode, categoryId?: string, tagId?: string) => void;
    setSearchQuery: (query: string) => void;
    setSelectedNote: (id: string | null) => void;
}

export const AppStateContext = createContext<AppContextType | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
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
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from AsyncStorage
    useEffect(() => {
        const loadState = async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const data = JSON.parse(stored);
                    setState((prev) => ({
                        ...prev,
                        ...data,
                        settings: { ...defaultSettings, ...data.settings },
                    }));
                }
            } catch (e) {
                console.error('Failed to load app state:', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadState();
    }, []);

    // Save to AsyncStorage when state changes
    useEffect(() => {
        if (isLoaded) {
            const saveState = async () => {
                try {
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                } catch (e) {
                    console.error('Failed to save app state:', e);
                }
            };
            saveState();
        }
    }, [state, isLoaded]);

    const createNote = useCallback((template?: NoteTemplate) => {
        const newNote: Note = {
            id: generateId(),
            title: '',
            content: template?.content || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            categoryId: null,
            tags: [],
            isPinned: false,
            isArchived: false,
            isTrashed: false,
            color: null,
            isMarkdown: !!template?.content,
        };
        setState((prev) => ({
            ...prev,
            notes: [newNote, ...prev.notes],
            selectedNoteId: newNote.id,
        }));
        return newNote;
    }, []);

    const updateNote = useCallback((id: string, updates: Partial<Note>) => {
        setState((prev) => ({
            ...prev,
            notes: prev.notes.map((note) =>
                note.id === id
                    ? { ...note, ...updates, updatedAt: new Date().toISOString() }
                    : note
            ),
        }));
    }, []);

    const deleteNote = useCallback(
        (id: string, permanent = false) => {
            if (permanent) {
                setState((prev) => ({
                    ...prev,
                    notes: prev.notes.filter((note) => note.id !== id),
                    selectedNoteId: prev.selectedNoteId === id ? null : prev.selectedNoteId,
                }));
            } else {
                setState((prev) => ({
                    ...prev,
                    notes: prev.notes.map((note) =>
                        note.id === id
                            ? { ...note, isTrashed: true, updatedAt: new Date().toISOString() }
                            : note
                    ),
                    selectedNoteId: prev.selectedNoteId === id ? null : prev.selectedNoteId,
                }));
            }
        },
        []
    );

    const restoreNote = useCallback(
        (id: string) => {
            setState((prev) => ({
                ...prev,
                notes: prev.notes.map((note) =>
                    note.id === id
                        ? { ...note, isTrashed: false, isArchived: false, updatedAt: new Date().toISOString() }
                        : note
                ),
            }));
        },
        []
    );

    const emptyTrash = useCallback(() => {
        setState((prev) => ({
            ...prev,
            notes: prev.notes.filter((note) => !note.isTrashed),
            selectedNoteId: null,
        }));
    }, []);

    const togglePin = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            notes: prev.notes.map((note) =>
                note.id === id
                    ? { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() }
                    : note
            ),
        }));
    }, []);

    const toggleArchive = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            notes: prev.notes.map((note) =>
                note.id === id
                    ? { ...note, isArchived: !note.isArchived, updatedAt: new Date().toISOString() }
                    : note
            ),
        }));
    }, []);

    const createCategory = useCallback(
        (name: string, color: string, icon: string, parentId: string | null = null) => {
            const newCategory: Category = {
                id: generateId(),
                name,
                color,
                icon,
                parentId,
                createdAt: new Date().toISOString(),
            };
            setState((prev) => ({
                ...prev,
                categories: [...prev.categories, newCategory],
            }));
            return newCategory;
        },
        []
    );

    const deleteCategory = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            categories: prev.categories.filter((cat) => cat.id !== id && cat.parentId !== id),
            notes: prev.notes.map((note) =>
                note.categoryId === id ? { ...note, categoryId: null } : note
            ),
        }));
    }, []);

    const createTag = useCallback((name: string, color: string) => {
        const newTag: Tag = {
            id: generateId(),
            name,
            color,
            createdAt: new Date().toISOString(),
        };
        setState((prev) => ({
            ...prev,
            tags: [...prev.tags, newTag],
        }));
        return newTag;
    }, []);

    const deleteTag = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            tags: prev.tags.filter((tag) => tag.id !== id),
            notes: prev.notes.map((note) => ({
                ...note,
                tags: note.tags.filter((tagId) => tagId !== id),
            })),
        }));
    }, []);

    const addTagToNote = useCallback((noteId: string, tagId: string) => {
        setState((prev) => ({
            ...prev,
            notes: prev.notes.map((note) =>
                note.id === noteId && !note.tags.includes(tagId)
                    ? { ...note, tags: [...note.tags, tagId], updatedAt: new Date().toISOString() }
                    : note
            ),
        }));
    }, []);

    const removeTagFromNote = useCallback((noteId: string, tagId: string) => {
        setState((prev) => ({
            ...prev,
            notes: prev.notes.map((note) =>
                note.id === noteId
                    ? { ...note, tags: note.tags.filter((t) => t !== tagId), updatedAt: new Date().toISOString() }
                    : note
            ),
        }));
    }, []);

    const updateSettings = useCallback((updates: Partial<AppSettings>) => {
        setState((prev) => ({
            ...prev,
            settings: { ...prev.settings, ...updates },
        }));
    }, []);

    const setViewMode = useCallback(
        (viewMode: ViewMode, categoryId?: string, tagId?: string) => {
            setState((prev) => ({
                ...prev,
                viewMode,
                selectedCategoryId: categoryId || null,
                selectedTagId: tagId || null,
                selectedNoteId: null,
            }));
        },
        []
    );

    const setSearchQuery = useCallback((query: string) => {
        setState((prev) => ({ ...prev, searchQuery: query }));
    }, []);

    const setSelectedNote = useCallback((id: string | null) => {
        setState((prev) => ({ ...prev, selectedNoteId: id }));
    }, []);

    // Get filtered notes based on current view
    const filteredNotes = useMemo(() => {
        let filtered = state.notes;

        switch (state.viewMode) {
            case 'pinned':
                filtered = filtered.filter((n) => n.isPinned && !n.isTrashed);
                break;
            case 'archived':
                filtered = filtered.filter((n) => n.isArchived && !n.isTrashed);
                break;
            case 'trash':
                filtered = filtered.filter((n) => n.isTrashed);
                break;
            case 'category':
                filtered = filtered.filter(
                    (n) => n.categoryId === state.selectedCategoryId && !n.isTrashed && !n.isArchived
                );
                break;
            case 'tag':
                filtered = filtered.filter(
                    (n) => n.tags.includes(state.selectedTagId!) && !n.isTrashed && !n.isArchived
                );
                break;
            default:
                filtered = filtered.filter((n) => !n.isTrashed && !n.isArchived);
        }

        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            filtered = filtered.filter(
                (n) =>
                    n.title.toLowerCase().includes(query) ||
                    n.content.toLowerCase().includes(query)
            );
        }

        filtered.sort((a, b) => {
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
    }, [state.notes, state.viewMode, state.selectedCategoryId, state.selectedTagId, state.searchQuery, state.settings.sortBy, state.settings.sortOrder]);

    const selectedNote = state.notes.find((n) => n.id === state.selectedNoteId) || null;

    const noteCounts = useMemo(
        () => ({
            all: state.notes.filter((n) => !n.isTrashed && !n.isArchived).length,
            pinned: state.notes.filter((n) => n.isPinned && !n.isTrashed).length,
            archived: state.notes.filter((n) => n.isArchived && !n.isTrashed).length,
            trash: state.notes.filter((n) => n.isTrashed).length,
            byCategory: state.categories.reduce(
                (acc, cat) => {
                    acc[cat.id] = state.notes.filter(
                        (n) => n.categoryId === cat.id && !n.isTrashed && !n.isArchived
                    ).length;
                    return acc;
                },
                {} as Record<string, number>
            ),
        }),
        [state.notes, state.categories]
    );

    const value = {
        ...state,
        isLoaded,
        selectedNote,
        filteredNotes,
        noteCounts,
        createNote,
        updateNote,
        deleteNote,
        restoreNote,
        emptyTrash,
        togglePin,
        toggleArchive,
        createCategory,
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

    return (
        <AppStateContext.Provider value={value}>
            {children}
        </AppStateContext.Provider>
    );
}
