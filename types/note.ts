// Base note interface
export interface BaseNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  tags: { id: string; name: string; color: string }[];
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  color: string | null;
  isMarkdown: boolean;
  isDraft?: boolean;
  lastOpenedAt?: string;
  size?: number;
}

// Vault note type - high security
export interface VaultNote extends BaseNote {
  type: "vault";
  isLocked: boolean;
  encryptionKey?: string;
}

// Quick capture note type - minimal scratchpad
export interface QuickCaptureNote extends BaseNote {
  type: "quick_capture";
  capturedAt: string;
  autoDelete?: boolean; // Option to auto-delete after 24 hours
}

// Sticky note type - visual-first
export interface StickyNote extends BaseNote {
  type: "sticky";
  background_color:
    | "Pastel Yellow"
    | "Pastel Blue"
    | "Pastel Pink"
    | "Pastel Green";
  position?: { x: number; y: number }; // For future drag-and-drop
}

// Plain Text Note type - clean minimal text editor
export interface PlainTextNote extends BaseNote {
  type: "plain_text";
  wordCount: number;
  characterCount: number;
  lastAutoSave?: string;
}

// Voice/Audio Note type - recording and playback
export interface VoiceNote extends BaseNote {
  type: "voice";
  audioUrl: string | null;
  duration: number;
  waveform?: string;
  caption?: string;
}

export interface ImageNote extends BaseNote {
  type: "image";
  images: Array<{ uri: string; caption?: string }>;
}

export interface VideoNote extends BaseNote {
  type: "video";
  videoUrl: string | null;
  thumbnailUrl?: string;
  coverImage?: string;
}

export interface DrawingNote extends BaseNote {
  type: "drawing";
  paths?: any[]; // Serialized Skia paths
  canvasImage?: string | null; // Base64 or URI of captured canvas
  toolsUsed?: Array<string>;
}

export interface ChecklistNote extends BaseNote {
  type: "checklist";
  items: Array<{
    id: string;
    text: string;
    completed: boolean;
    order: number;
  }>;
}

export interface JournalNote extends BaseNote {
  type: "journal";
  entryDate: string; // Full formatted date
  moodEmoji: keyof typeof JOURNAL_MOODS;
  weather?: string;
  wordCount: number;
}

export interface ReminderNote extends BaseNote {
  type: "reminder";
  dueDate: string | null;
  dueTime: string | null;
  repeat: "once" | "daily" | "weekly" | "monthly";
  priority: "low" | "medium" | "high";
  notify: boolean;
}

// Discriminated union for all note types
export type Note =
  | VaultNote
  | StickyNote
  | JournalNote
  | PlainTextNote
  | VoiceNote
  | ImageNote
  | VideoNote
  | DrawingNote
  | ChecklistNote
  | ReminderNote;

// Legacy note type for backward compatibility
export interface LegacyNote extends BaseNote {
  type?: never;
}

// Helper function to check note type
export function getNoteType(note: Note): Note["type"] {
  return note.type;
}

// Helper function to check if note is vault
export function isVaultNote(note: Note): note is VaultNote {
  return note.type === "vault";
}

// Helper function to check if note is sticky
export function isStickyNote(note: Note): note is StickyNote {
  return note.type === "sticky";
}

// Helper function to check if note is journal
export function isJournalNote(note: Note): note is JournalNote {
  return note.type === "journal";
}

// Helper function to check if note is plain text
export function isPlainTextNote(note: Note): note is PlainTextNote {
  return note.type === "plain_text";
}

// Helper function to check if note is voice
export function isVoiceNote(note: Note): note is VoiceNote {
  return note.type === "voice";
}

// Helper function to check if note is image
export function isImageNote(note: Note): note is ImageNote {
  return note.type === "image";
}

// Helper function to check if note is video
export function isVideoNote(note: Note): note is VideoNote {
  return note.type === "video";
}

// Helper function to check if note is drawing
export function isDrawingNote(note: Note): note is DrawingNote {
  return note.type === "drawing";
}

// Helper function to check if note is checklist
export function isChecklistNote(note: Note): note is ChecklistNote {
  return note.type === "checklist";
}

// Helper function to check if note is reminder
export function isReminderNote(note: Note): note is ReminderNote {
  return note.type === "reminder";
}

// Sticky note background colors
export const STICKY_COLORS = {
  "Pastel Yellow": "#FFF9C4",
  "Pastel Blue": "#E3F2FD",
  "Pastel Pink": "#FCE4EC",
  "Pastel Green": "#E8F5E8",
} as const;

// Journal mood emojis
export const JOURNAL_MOODS = {
  Happy: "😊",
  Neutral: "😐",
  Sad: "😢",
  Excited: "🤗",
  Anxious: "😰",
  Grateful: "🙏",
  Tired: "😴",
  Productive: "💪",
  Stressed: "😰",
  Creative: "🎨",
} as const;

// Note type icons and colors for UI
export const NOTE_TYPE_ICONS = {
  plain_text: "document-text-outline",
  voice: "mic-outline",
  image: "image-outline",
  video: "videocam-outline",
  drawing: "brush-outline",
  checklist: "checkbox-outline",
  journal: "journal-outline",
  reminder: "time-outline",
  vault: "shield-checkmark-outline",
  sticky: "layers-outline",
} as const;

export const NOTE_TYPE_COLORS = {
  plain_text: "#3B82F6",
  voice: "#10B981",
  image: "#F59E0B",
  video: "#EF4444",
  drawing: "#8B5CF6",
  checklist: "#06B6D4",
  journal: "#6366F1",
  reminder: "#F97316",
  vault: "#0EA5E9",
  sticky: "#F59E0B",
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
  theme: "light" | "dark" | "system";
  accentColor?: string;
  sortBy: "dateModified" | "dateCreated" | "title" | "pinned" | "lastOpened" | "noteType" | "size";
  sortOrder: "asc" | "desc";
  autoSave: boolean;
  showWordCount: boolean;
}

export interface NoteTemplate {
  id: string;
  name: string;
  content: string;
  icon: string;
}

export type ViewMode =
  | "all"
  | "favorites"
  | "pinned"
  | "archived"
  | "trash"
  | "category"
  | "tag";

export interface AppState {
  notes: Note[];
  categories: Category[];
  tags: Tag[];
  settings: AppSettings;
  selectedNoteId: string | null;
  selectedNoteIds: string[];
  searchQuery: string;
  viewMode: ViewMode;
  selectedCategoryId: string | null;
  selectedTagId: string | null;
}

export const NOTE_COLORS = [
  { name: "None", value: null },
  { name: "Red", value: "#fee2e2" },
  { name: "Orange", value: "#fed7aa" },
  { name: "Yellow", value: "#fef3c7" },
  { name: "Green", value: "#d1fae5" },
  { name: "Blue", value: "#dbeafe" },
  { name: "Purple", value: "#e9d5ff" },
  { name: "Pink", value: "#fce7f3" },
];

export const CATEGORY_ICONS = [
  "folder",
  "briefcase",
  "home",
  "business",
  "school",
  "medical",
  "fitness",
  "travel",
  "restaurant",
  "shopping-cart",
  "car",
  "airplane",
  "book",
  "musical-notes",
  "camera",
  "game-controller",
  "headset",
  "laptop",
  "phone-portrait",
  "mail",
  "calendar",
  "newspaper",
  "library",
  "flask",
  "construct",
  "analytics",
  "bar-chart",
  "globe",
  "heart",
  "star",
  "flag",
  "bookmark",
  "tag",
  "color-palette",
  "settings",
  "wallet",
  "receipt",
  "document-text",
  "clipboard",
  "create",
  "options",
  "layers",
  "archive",
  "trash",
  "search",
  "notifications",
  "time",
  "location",
  "map",
  "image",
  "videocam",
  "mic",
  "brush",
  "checkbox",
  "shield-checkmark",
  "pulse",
];

export const CATEGORY_COLORS = [
  "#3EACC6",
  "#ED9097",
  "#FFC857",
  "#4ECDC4",
  "#95E1D3",
  "#F38181",
  "#AA96DA",
  "#FCBAD3",
];

export const TAG_COLORS = [
  '#4A90D9', // blue
  '#E74C3C', // red
  '#2ECC71', // green
  '#F39C12', // orange
  '#9B59B6', // purple
  '#1ABC9C', // teal
  '#E91E63', // pink
  '#F1C40F', // yellow
  '#34495E', // dark grey
  '#E67E22', // amber
];

export const getAutoColor = (tagName: string) => {
  if (!tagName) return TAG_COLORS[0];
  const index = tagName.charCodeAt(0) % TAG_COLORS.length;
  return TAG_COLORS[index];
};
