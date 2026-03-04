// Base note interface
export interface BaseNote {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    categoryId: string | null;
    tags: string[];
    isPinned: boolean;
    isArchived: boolean;
    isTrashed: boolean;
    color: string | null;
    isMarkdown: boolean;
}

// Vault note type - high security
export interface VaultNote extends BaseNote {
    type: 'vault';
    isLocked: boolean;
    encryptionKey?: string;
}

// Quick capture note type - minimal scratchpad
export interface QuickCaptureNote extends BaseNote {
    type: 'quick_capture';
    capturedAt: string;
    autoDelete?: boolean; // Option to auto-delete after 24 hours
}

// Sticky note type - visual-first
export interface StickyNote extends BaseNote {
    type: 'sticky';
    background_color: 'Pastel Yellow' | 'Pastel Blue' | 'Pastel Pink' | 'Pastel Green';
    position?: { x: number; y: number }; // For future drag-and-drop
}

// Journal note type - chronological with mood
export interface JournalNote extends BaseNote {
    type: 'journal';
    timestamp: string;
    mood_emoji: 'Happy' | 'Neutral' | 'Productive' | 'Stressed' | 'Creative' | 'Tired';
    entry_date: string; // YYYY-MM-DD format
}

// Discriminated union for all note types
export type Note = VaultNote | QuickCaptureNote | StickyNote | JournalNote;

// Legacy note type for backward compatibility
export interface LegacyNote extends BaseNote {
    type?: never;
}

// Helper function to check note type
export function getNoteType(note: Note): Note['type'] {
    return note.type;
}

// Helper function to check if note is vault
export function isVaultNote(note: Note): note is VaultNote {
    return note.type === 'vault';
}

// Helper function to check if note is quick capture
export function isQuickCaptureNote(note: Note): note is QuickCaptureNote {
    return note.type === 'quick_capture';
}

// Helper function to check if note is sticky
export function isStickyNote(note: Note): note is StickyNote {
    return note.type === 'sticky';
}

// Helper function to check if note is journal
export function isJournalNote(note: Note): note is JournalNote {
    return note.type === 'journal';
}

// Sticky note background colors
export const STICKY_COLORS = {
    'Pastel Yellow': '#FFF9C4',
    'Pastel Blue': '#E3F2FD',
    'Pastel Pink': '#FCE4EC',
    'Pastel Green': '#E8F5E8',
} as const;

// Journal mood emojis
export const JOURNAL_MOODS = {
    'Happy': '😊',
    'Neutral': '😐',
    'Productive': '💪',
    'Stressed': '😰',
    'Creative': '🎨',
    'Tired': '😴',
} as const;

export interface Category {
    id: string;
    name: string;
    color: string;
    icon: string;
    parentId: string | null;
    createdAt: string;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
    createdAt: string;
}

export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    defaultView: 'list' | 'grid';
    sortBy: 'dateModified' | 'dateCreated' | 'title' | 'pinned';
    sortOrder: 'asc' | 'desc';
    autoSave: boolean;
    showWordCount: boolean;
}

export interface NoteTemplate {
    id: string;
    name: string;
    content: string;
    icon: string;
}

export type ViewMode = 'all' | 'pinned' | 'archived' | 'trash' | 'category' | 'tag';

export interface AppState {
    notes: Note[];
    categories: Category[];
    tags: Tag[];
    settings: AppSettings;
    selectedNoteId: string | null;
    searchQuery: string;
    viewMode: ViewMode;
    selectedCategoryId: string | null;
    selectedTagId: string | null;
}

export const NOTE_COLORS = [
    { name: 'None', value: null },
    { name: 'Red', value: '#fee2e2' },
    { name: 'Orange', value: '#fed7aa' },
    { name: 'Yellow', value: '#fef3c7' },
    { name: 'Green', value: '#d1fae5' },
    { name: 'Blue', value: '#dbeafe' },
    { name: 'Purple', value: '#e9d5ff' },
    { name: 'Pink', value: '#fce7f3' },
];

export const CATEGORY_ICONS = ['📁', '💼', '👤', '💡', '🎯', '📚', '🏠', '✈️', '🎨', '⚡', '🔬', '🎵'];
export const CATEGORY_COLORS = ['#3EACC6', '#ED9097', '#FFC857', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'];
export const TAG_COLORS = [
    '#3EACC6', '#ED9097', '#FFC857', '#4ECDC4',
    '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3',
    '#6C5CE7', '#00B894', '#FDCB6E', '#E17055',
];
