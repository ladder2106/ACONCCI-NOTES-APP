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
// @ts-ignore
import { login as apiLogin, signup as apiSignup, logout as apiLogout } from '../services/authService';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'aconcci_notes_app_state';

const defaultSettings: AppSettings = {
    theme: 'light',
    sortBy: 'dateModified',
    sortOrder: 'desc',
    autoSave: true,
    showWordCount: true,
};

const defaultCategories: Category[] = [];

export const noteTemplates: NoteTemplate[] = [
    { id: 'blank', name: 'Blank Note', content: '', icon: 'document' },
    {
        id: 'meeting',
        name: 'Meeting Notes',
        content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n- \n\n## Discussion\n\n\n## Action Items\n- [ ] \n\n## Next Steps\n',
        icon: 'people',
    },
    {
        id: 'journal',
        name: 'Daily Journal',
        content: "# Daily Journal\n\n**Date:** \n**Mood:** \n\n## What happened today?\n\n\n## Grateful for:\n- \n\n## Tomorrow's goals:\n- \n",
        icon: 'journal',
    },
    {
        id: 'todo',
        name: 'To-Do List',
        content: '# To-Do List\n\n## Today\n- [ ] \n\n## This Week\n- [ ] \n\n## Backlog\n- [ ] \n',
        icon: 'checkbox',
    },
    {
        id: 'project',
        name: 'Project Plan',
        content: '# Project Plan\n\n**Project Name:** \n**Start Date:** \n**Deadline:** \n\n## Overview\n\n\n## Goals\n1. \n\n## Tasks\n- [ ] \n\n## Resources\n\n\n## Notes\n',
        icon: 'rocket',
    },
];

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 12);
}

interface AppContextType extends AppState {
    isLoaded: boolean;
    selectedNote: Note | null;
    selectedNoteIds: string[];
    filteredNotes: Note[];
    noteCounts: {
        all: number;
        favorites: number;
        pinned: number;
        archived: number;
        trash: number;
        byCategory: Record<string, number>;
        byTag: Record<string, number>;
    };
    createNote: (template?: NoteTemplate, noteType?: Note['type']) => Note;
    updateNote: (id: string, updates: Partial<Note>) => void;
    deleteNote: (id: string, permanent?: boolean) => void;
    restoreNote: (id: string) => void;
    emptyTrash: () => void;
    toggleFavorite: (id: string) => void;
    togglePin: (id: string) => void;
    toggleArchive: (id: string) => void;
    createCategory: (name: string, color: string, icon: string, parentId?: string | null) => Category;
    deleteCategory: (id: string) => void;
    createTag: (name: string, color: string) => Tag;
    deleteTag: (id: string) => void;
    updateTag: (id: string, updates: Partial<Tag>) => void;
    addTagToNote: (noteId: string, tag: { id: string; name: string; color: string }) => void;
    removeTagFromNote: (noteId: string, tagId: string) => void;
    updateSettings: (updates: Partial<AppSettings>) => void;
    setViewMode: (viewMode: ViewMode, categoryId?: string, tagId?: string) => void;
    setSearchQuery: (query: string) => void;
    setSelectedNote: (id: string | null) => void;
    toggleNoteSelection: (id: string) => void;
    deleteSelectedNotes: () => void;
    restoreSelectedNotes: () => void;
    clearSelection: () => void;
    user: { email: string } | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

export const AppStateContext = createContext<AppContextType | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AppState>({
        notes: [],
        categories: defaultCategories,
        tags: [],
        settings: defaultSettings,
        selectedNoteId: null,
        selectedNoteIds: [],
        searchQuery: '',
        viewMode: 'all',
        selectedCategoryId: null,
        selectedTagId: null,
    });
    const [user, setUser] = useState<{ email: string } | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);


    // New icon mapping to migrate from emojis
    const emojiToIconMap: Record<string, string> = {
        '📁': 'folder', '💼': 'briefcase', '👤': 'person', '💡': 'bulb',
        '🎯': 'target', '📚': 'book', '🏠': 'home', '✈️': 'airplane',
        '🎨': 'color-palette', '⚡': 'flash', '🔬': 'beaker', '🎵': 'musical-notes',
        '📝': 'document-text', '🤝': 'people', '📔': 'journal', '✅': 'checkmark-done-circle'
    };

    useEffect(() => {
        const loadState = async () => {
            try {
                // Check auth token
                const token = await AsyncStorage.getItem('accessToken');
                if (token) {
                    setUser({ email: 'user@restored.com' });
                }

                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const data = JSON.parse(stored);
                    
                    // Migrate stored icons and remove defaults
                    const sanitizedCategories = (data.categories || [])
                        .filter((c: Category) => !['personal', 'work', 'ideas', 'trash'].includes(c.id.toLowerCase()))
                        .filter((c: Category) => !['personal', 'work', 'ideas', 'trash'].includes(c.name.toLowerCase()))
                        .map((c: Category) => ({
                            ...c,
                            icon: emojiToIconMap[c.icon] || c.icon
                        }));

                    setState((prev) => ({
                        ...prev,
                        ...data,
                        categories: sanitizedCategories,
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

    const createNote = useCallback((template?: NoteTemplate, noteType?: Note['type']) => {
        const now = new Date().toISOString();
        const base = {
            id: generateId(),
            title: '',
            content: template?.content || '',
            createdAt: now,
            updatedAt: now,
            categoryId: null,
            tags: [] as { id: string; name: string; color: string }[],
            isFavorite: false,
            isPinned: false,
            isArchived: false,
            isTrashed: false,
            isDraft: !state.settings.autoSave,
            lastOpenedAt: now,
            size: (template?.content || '').length,
            color: null,
            isMarkdown: !!template?.content,
        };

        const type = noteType || 'vault';
        let newNote: Note;

        switch (type) {
            case 'journal':
                newNote = {
                    ...base,
                    type: 'journal',
                    moodEmoji: 'Neutral',
                    entryDate: now.split('T')[0],
                    wordCount: 0,
                };
                break;
            case 'sticky':
                newNote = {
                    ...base,
                    type: 'sticky',
                    background_color: 'Pastel Yellow',
                };
                break;
            case 'plain_text':
                newNote = {
                    ...base,
                    type: 'plain_text',
                    wordCount: 0,
                    characterCount: 0,
                };
                break;  
            case 'voice':
                newNote = {
                    ...base,
                    type: 'voice',
                    audioUrl: null,
                    duration: 0,
                };
                break;
            case 'image':
                newNote = {
                    ...base,
                    type: 'image',
                    images: [],
                };
                break;
            case 'video':
                newNote = {
                    ...base,
                    type: 'video',
                    videoUrl: null,
                };
                break;
            case 'drawing':
                newNote = {
                    ...base,
                    type: 'drawing',
                    canvasImage: null,
                };
                break;
            case 'checklist':
                newNote = {
                    ...base,
                    type: 'checklist',
                    items: [],
                };
                break;
            case 'reminder':
                newNote = {
                    ...base,
                    type: 'reminder',
                    dueDate: null,
                    dueTime: null,
                    repeat: 'once',
                    priority: 'medium',
                    notify: true,
                };
                break;
            case 'vault':
            default:
                newNote = {
                    ...base,
                    type: 'vault',
                    isLocked: false,
                };
                break;
        }

        if (state.settings.autoSave) {
            setState((prev) => ({
                ...prev,
                notes: [newNote, ...prev.notes],
                selectedNoteId: newNote.id,
            }));
        } else {
            // If auto-save is off, it's a draft that isn't in state.notes yet
            setState((prev) => ({
                ...prev,
                notes: [newNote, ...prev.notes], // Add it so the editor can find it, but it will be hidden from list
                selectedNoteId: newNote.id,
            }));
        }
        return newNote;
    }, []);

    const updateNote = useCallback((id: string, updates: Partial<Note>) => {
        setState((prev) => ({
            ...prev,
            notes: prev.notes.map((note) =>
                note.id === id
                    ? { ...note, ...updates, updatedAt: new Date().toISOString() } as Note
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
                            ? { ...note, isTrashed: true, updatedAt: new Date().toISOString() } as Note
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
                        ? { ...note, isTrashed: false, isArchived: false, updatedAt: new Date().toISOString() } as Note
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

    const toggleFavorite = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            notes: prev.notes.map((note) =>
                note.id === id
                    ? { ...note, isFavorite: !note.isFavorite, updatedAt: new Date().toISOString() } as Note
                    : note
            ),
        }));
    }, []);

    const togglePin = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            notes: prev.notes.map((note) =>
                note.id === id
                    ? { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() } as Note
                    : note
            ),
        }));
    }, []);

    const toggleArchive = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            notes: prev.notes.map((note) =>
                note.id === id
                    ? { ...note, isArchived: !note.isArchived, updatedAt: new Date().toISOString() } as Note
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
                note.categoryId === id ? { ...note, categoryId: null } as Note : note
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
                tags: note.tags.filter((t) => t.id !== id),
            } as Note)),
        }));
    }, []);

    const updateTag = useCallback((id: string, updates: Partial<Tag>) => {
        setState((prev) => {
            const updatedTags = prev.tags.map(t => t.id === id ? { ...t, ...updates } : t);
            const tagToUpdate = updatedTags.find(t => t.id === id);
            
            return {
                ...prev,
                tags: updatedTags,
                notes: prev.notes.map(note => {
                    const hasTag = note.tags.some(t => t.id === id);
                    if (!hasTag) return note;
                    return {
                        ...note,
                        tags: note.tags.map(t => t.id === id ? { id, name: tagToUpdate?.name || t.name, color: tagToUpdate?.color || t.color } : t)
                    } as Note;
                })
            };
        });
    }, []);

    const addTagToNote = useCallback((noteId: string, tag: { id: string; name: string; color: string }) => {
        setState((prev) => ({
            ...prev,
            notes: prev.notes.map((note) =>
                note.id === noteId && !note.tags.some(t => t.id === tag.id)
                    ? { ...note, tags: [...note.tags, tag], updatedAt: new Date().toISOString() } as Note
                    : note
            ),
        }));
    }, []);

    const removeTagFromNote = useCallback((noteId: string, tagId: string) => {
        setState((prev) => ({
            ...prev,
            notes: prev.notes.map((note) =>
                note.id === noteId
                    ? { ...note, tags: note.tags.filter((t) => t.id !== tagId), updatedAt: new Date().toISOString() } as Note
                    : note
            ),
        }));
    }, []);
    
    // Auth methods (Real)
    const login = useCallback(async (email: string, password: string) => {
        try {
            const data = await apiLogin(email, password);
            if (data.accessToken) {
                setUser({ email });
                return { success: true };
            }
            // Server responded but with an error (e.g. invalid credentials)
            return { success: false, error: data.error || data.message || 'Login failed' };
        } catch (err: any) {
            console.error('[AppStateContext] login error:', err);
            // The authService throws with a user-friendly message for network failures
            return { success: false, error: err.message || 'Cannot reach server. Make sure you are connected to the same network.' };
        }
    }, []);

    const signup = useCallback(async (email: string, password: string) => {
        try {
            const data = await apiSignup(email, password);
            if (data.message === 'Account created successfully') {
                return { success: true };
            }
            // Server responded but with an error (e.g. email already in use)
            return { success: false, error: data.error || data.message || 'Signup failed' };
        } catch (err: any) {
            console.error('[AppStateContext] signup error:', err);
            return { success: false, error: err.message || 'Cannot reach server. Make sure you are connected to the same network.' };
        }
    }, []);

    const logout = useCallback(async () => {
        setUser(null);
        try {
            await apiLogout();
        } catch (err) {
            console.error('Logout error:', err);
        }
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

    const toggleNoteSelection = useCallback((id: string) => {
        setState((prev) => {
            const isSelected = prev.selectedNoteIds.includes(id);
            const newList = isSelected
                ? prev.selectedNoteIds.filter((noteId) => noteId !== id)
                : [...prev.selectedNoteIds, id];
            return { ...prev, selectedNoteIds: newList };
        });
    }, []);

    const clearSelection = useCallback(() => {
        setState((prev) => ({ ...prev, selectedNoteIds: [] }));
    }, []);

    const deleteSelectedNotes = useCallback(() => {
        setState((prev) => {
            const now = new Date().toISOString();
            // 1. Mark selected notes as trashed
            const updatedNotes = prev.notes.map((note) =>
                prev.selectedNoteIds.includes(note.id)
                    ? { 
                        ...note, 
                        isTrashed: true, 
                        isPinned: false, // Match individual delete (hides from pinned)
                        updatedAt: now 
                      } as Note
                    : note
            );
            
            // 2. Clear selectedNoteId if it was in the mass deletion
            const wasEditingDeleted = prev.selectedNoteId && prev.selectedNoteIds.includes(prev.selectedNoteId);
            
            return {
                ...prev,
                notes: updatedNotes,
                selectedNoteId: wasEditingDeleted ? null : prev.selectedNoteId,
                selectedNoteIds: [],
            };
        });
    }, []);

    const restoreSelectedNotes = useCallback(() => {
        setState((prev) => {
            const now = new Date().toISOString();
            const updatedNotes = prev.notes.map((note) =>
                prev.selectedNoteIds.includes(note.id)
                    ? { 
                        ...note, 
                        isTrashed: false, 
                        updatedAt: now 
                      } as Note
                    : note
            );
            
            return {
                ...prev,
                notes: updatedNotes,
                selectedNoteIds: [],
            };
        });
    }, []);

    // Get filtered notes based on current view
    const filteredNotes = useMemo(() => {
        let filtered = state.notes.filter(n => !n.isDraft || n.id === state.selectedNoteId);

        if (state.viewMode === 'favorites') {
            filtered = filtered.filter((n) => n.isFavorite && !n.isTrashed);
        } else if (state.viewMode === 'pinned') {
            filtered = filtered.filter((n) => n.isPinned && !n.isTrashed);
        } else if (state.viewMode === 'archived') {
            filtered = filtered.filter((n) => n.isArchived && !n.isTrashed);
        } else if (state.viewMode === 'trash') {
            filtered = filtered.filter((n) => n.isTrashed);
        } else if (state.viewMode === 'category') {
            filtered = filtered.filter(
                (n) => n.categoryId === state.selectedCategoryId && !n.isTrashed && !n.isArchived
            );
        } else if (state.viewMode === 'tag') {
            filtered = filtered.filter(
                (n) => n.tags.some(t => t.id === state.selectedTagId!) && !n.isTrashed && !n.isArchived
            );
        } else {
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

        // Apply sorting
        return [...filtered].sort((a, b) => {
            if (state.settings.sortBy === 'pinned') {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
            }

            let comparison = 0;
            const order = state.settings.sortOrder === 'asc' ? 1 : -1;

            switch (state.settings.sortBy) {
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'dateCreated':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case 'dateModified':
                    comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                    break;
                case 'lastOpened':
                    comparison = new Date(a.lastOpenedAt || 0).getTime() - new Date(b.lastOpenedAt || 0).getTime();
                    break;
                case 'noteType':
                    comparison = a.type.localeCompare(b.type);
                    break;
                case 'size':
                    comparison = (a.size || 0) - (b.size || 0);
                    break;
                default:
                    comparison = 0;
            }

            return comparison * order;
        });
    }, [
        state.notes,
        state.viewMode,
        state.selectedCategoryId,
        state.selectedTagId,
        state.searchQuery,
        state.settings.sortBy,
        state.settings.sortOrder,
        state.selectedNoteId,
    ]);

    const selectedNote = state.notes.find((n) => n.id === state.selectedNoteId) || null;

    const noteCounts = useMemo(
        () => ({
            all: state.notes.filter((n) => !n.isTrashed && !n.isArchived).length,
            favorites: state.notes.filter((n) => n.isFavorite && !n.isTrashed).length,
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
            byTag: state.tags.reduce(
                (acc, tag) => {
                    acc[tag.id] = state.notes.filter(
                        (n) => n.tags.some(t => t.id === tag.id) && !n.isTrashed && !n.isArchived
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
        toggleFavorite,
        togglePin,
        toggleArchive,
        createCategory,
        deleteCategory,
        createTag,
        deleteTag,
        updateTag,
        addTagToNote,
        removeTagFromNote,
        updateSettings,
        setViewMode,
        setSearchQuery,
        setSelectedNote,
        toggleNoteSelection,
        deleteSelectedNotes,
        restoreSelectedNotes,
        clearSelection,
        user,
        login,
        signup,
        logout,
    };

    return (
        <AppStateContext.Provider value={value}>
            {children}
        </AppStateContext.Provider>
    );
}
