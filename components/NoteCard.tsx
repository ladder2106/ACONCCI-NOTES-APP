import { useThemeColors } from "@/hooks/useThemeColors";
import {
    Category,
    isChecklistNote,
    isDrawingNote,
    isImageNote,
    isJournalNote,
    isPlainTextNote,
    isReminderNote,
    isStickyNote,
    isVaultNote,
    isVideoNote,
    isVoiceNote,
    JOURNAL_MOODS,
    Note,
    NOTE_COLORS,
    NOTE_TYPE_COLORS,
    NOTE_TYPE_ICONS,
    STICKY_COLORS,
    Tag
} from "@/types/note";
import { Spacing, Touch } from "@/utils/mobile";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActionSheetIOS,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import Animated, {
    FadeInDown,
    runOnJS,
    SlideOutRight,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface NoteCardProps {
  note: Note;
  isSelected?: boolean;
  isTrash?: boolean;
  tags: Tag[];
  categories: Category[];
  onPress: () => void;
  onDelete: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onToggleArchive?: (id: string) => void;
  onChangeColor?: (noteId: string, color: string | null) => void;
  viewType?: "list" | "grid";
  index?: number;
  isSelectionMode?: boolean;
  isItemSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  onEnterSelectionMode?: (id: string) => void;
  exitDelay?: number;
}

export function NoteCard({
  note,
  isSelected,
  isTrash,
  tags,
  categories,
  onPress,
  onDelete,
  onPermanentDelete,
  onRestore,
  onToggleFavorite,
  onTogglePin,
  onToggleArchive,
  onChangeColor,
  viewType = "list",
  index = 0,
  isSelectionMode = false,
  isItemSelected = false,
  onToggleSelection,
  onEnterSelectionMode,
  exitDelay = 0,
}: NoteCardProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);

  const category = categories.find((c) => c.id === note.categoryId);
  const noteTags = note.tags || [];
  const stripHtml = (value: string) =>
    value
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();

  // Handle vault authentication on long press
  const handleVaultLongPress = async () => {
    if (isVaultNote(note)) {
      // TODO: Implement proper vault authentication service
      Alert.alert(
        "Vault Note",
        "Authentication required to access this note.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unlock",
            onPress: () => {
              setIsVaultUnlocked(true);
              onPress();
            },
          },
        ],
      );
      return;
    }
    handleLongPress();
  };

  // Get note-specific background color
  const getNoteBackground = () => {
    if (isStickyNote(note)) {
      return STICKY_COLORS[note.background_color];
    }
    return note.color || colors.card;
  };

  // Get note-specific content preview
  const getContentPreview = () => {
    if (isVaultNote(note)) {
      return note.isLocked ? "🔒 Locked content" : note.content || "No content";
    }
    if (isJournalNote(note)) {
      const moodEmoji = note.moodEmoji ? JOURNAL_MOODS[note.moodEmoji] : "📖";
      return `${moodEmoji} ${note.content || "Journal entry..."}`;
    }
    if (isVoiceNote(note)) {
      return note.caption || "Voice recording";
    }
    if (isChecklistNote(note)) {
      const completed = note.items.filter((i) => i.completed).length;
      return `✅ ${completed}/${note.items.length} items completed`;
    }
    if (isImageNote(note)) {
      return `🖼️ ${note.images.length} images ${note.content ? "- " + note.content : ""}`;
    }
    if (isReminderNote(note)) {
      return `⏰ Due: ${note.dueDate} ${note.dueTime}`;
    }
    if (isPlainTextNote(note)) {
      return stripHtml(note.content) || "No content";
    }
    return note.content || "No content";
  };

  // Get note-specific title
  const getNoteTitle = () => {
    if (isVaultNote(note)) {
      return `🔒 ${note.title}`;
    }
    if (isStickyNote(note)) {
      return `📝 ${note.title}`;
    }
    if (isJournalNote(note)) {
      return `📖 ${note.title}`;
    }
    if (isReminderNote(note)) {
      const priorityIcon = note.priority === "high" ? "🚩 " : "";
      return `${priorityIcon}${note.title}`;
    }
    return (note as Note).title || "Untitled";
  };

  // Get note-specific icon
  const getNoteIcon = () => {
    const type = note.type || "plain_text";
    const iconName = NOTE_TYPE_ICONS[type as keyof typeof NOTE_TYPE_ICONS] || "document-text";
    const color = NOTE_TYPE_COLORS[type as keyof typeof NOTE_TYPE_COLORS] || colors.primary;

    return (
      <Ionicons
        name={iconName as any}
        size={12}
        color={color}
        style={styles.pinIcon}
      />
    );
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      return d.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const handleLongPress = () => {
    if (Platform.OS === "ios") {
      const options = isTrash
        ? ["Restore", "Delete Permanently", "Cancel"]
        : ["Pin", "Archive", "Change Color", "Move to Trash", "Cancel"];
      const cancelIndex = options.length - 1;
      const destructiveIndex = isTrash ? 1 : 3;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: cancelIndex,
          destructiveButtonIndex: destructiveIndex,
        },
        (buttonIndex) => {
          if (isTrash) {
            if (buttonIndex === 0) onRestore?.(note.id);
            else if (buttonIndex === 1) onPermanentDelete ? onPermanentDelete(note.id) : onDelete(note.id);
          } else {
            if (buttonIndex === 0) onTogglePin?.(note.id);
            else if (buttonIndex === 1) onToggleArchive?.(note.id);
            else if (buttonIndex === 2) showColorPicker();
            else if (buttonIndex === 3) onDelete(note.id);
          }
        },
      );
    } else {
      // Android/Web fallback
      if (isTrash) {
        Alert.alert("Note Options", "", [
          { text: "Restore", onPress: () => onRestore?.(note.id) },
          {
            text: "Delete Permanently",
            style: "destructive",
            onPress: () => onPermanentDelete ? onPermanentDelete(note.id) : onDelete(note.id),
          },
          { text: "Cancel", style: "cancel" },
        ]);
      } else {
        Alert.alert("Note Options", "", [
          {
            text: note.isPinned ? "Unpin" : "Pin",
            onPress: () => onTogglePin?.(note.id),
          },
          {
            text: note.isArchived ? "Unarchive" : "Archive",
            onPress: () => onToggleArchive?.(note.id),
          },
          { text: "Change Color", onPress: () => showColorPicker() },
          {
            text: "Move to Trash",
            style: "destructive",
            onPress: () => onDelete(note.id),
          },
          { text: "Cancel", style: "cancel" },
        ]);
      }
    }
  };

  const showColorPicker = () => {
    if (Platform.OS === "ios") {
      const colorNames = NOTE_COLORS.map((c) => c.name);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...colorNames, "Cancel"],
          cancelButtonIndex: colorNames.length,
        },
        (buttonIndex) => {
          if (buttonIndex < colorNames.length) {
            onChangeColor?.(note.id, NOTE_COLORS[buttonIndex].value);
          }
        },
      );
    } else {
      Alert.alert("Choose Color", "", [
        ...NOTE_COLORS.map((c) => ({
          text: c.name,
          onPress: () => onChangeColor?.(note.id, c.value),
        })),
        { text: "Cancel", style: "cancel" as const },
      ]);
    }
  };

  // Press scale animation
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    })
    .onEnd(() => {
      if (isSelectionMode) {
        runOnJS(onToggleSelection!)(note.id);
      } else {
        runOnJS(onPress)();
      }
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
      if (!isSelectionMode) {
        runOnJS(onEnterSelectionMode!)(note.id);
      } else {
        runOnJS(handleLongPress)();
      }
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    });

  const composed = Gesture.Race(tapGesture, longPressGesture);

  // Stagger delay: 50ms per card, max 500ms
  const staggerDelay = Math.min(index * 50, 500);

  // Calculate note age limits
  const now = new Date();
  const updated = new Date(note.updatedAt);
  const diffInDays =
    (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);

  // Default opacity is 1, but if it's older than 30 days we lower it. Trash overrides this.
  const ageOpacity = isTrash ? 0.6 : diffInDays > 30 ? 0.75 : 1;

  const renderRightActions = () => {
    if (isTrash) {
      return (
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: colors.destructive }]}
          onPress={() => onDelete(note.id)}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <Text style={styles.swipeText}>Delete</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: colors.primary }]}
        onPress={() => onTogglePin?.(note.id)}
      >
        <Ionicons
          name={note.isPinned ? "pin-outline" : "pin"}
          size={24}
          color="#fff"
        />
        <Text style={styles.swipeText}>{note.isPinned ? "Unpin" : "Pin"}</Text>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = () => {
    if (isTrash) {
      return (
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: "#22C55E" }]} // Green for restore
          onPress={() => onRestore?.(note.id)}
        >
          <Ionicons name="refresh-outline" size={24} color="#fff" />
          <Text style={styles.swipeText}>Restore</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View style={{ flexDirection: "row" }}>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: "#FD7E14" }]}
          onPress={() => onToggleFavorite?.(note.id)}
        >
          <Ionicons
            name={note.isFavorite ? "heart" : "heart-outline"}
            size={24}
            color="#fff"
          />
          <Text style={styles.swipeText}>
            {note.isFavorite ? "Unfavorite" : "Favorite"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: colors.secondary }]}
          onPress={() => onToggleArchive?.(note.id)}
        >
          <Ionicons
            name={note.isArchived ? "archive-outline" : "archive"}
            size={24}
            color="#fff"
          />
          <Text style={styles.swipeText}>
            {note.isArchived ? "Unarchive" : "Archive"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: colors.destructive }]}
          onPress={() => onDelete(note.id)}
        >
          <Ionicons name="trash" size={24} color="#fff" />
          <Text style={styles.swipeText}>Trash</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      containerStyle={[
        viewType === "grid" && styles.gridCard,
        viewType === "list" && styles.listCard,
      ]}
    >
      <GestureDetector gesture={composed}>
        <Animated.View
          entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(staggerDelay)
            .duration(400)
            .springify()
            .damping(18)}
          exiting={Platform.OS === 'web' ? undefined : SlideOutRight.delay(exitDelay).duration(400)}
          style={[
            animatedStyle,
            styles.card,
            {
              backgroundColor: getNoteBackground(),
              borderColor: isItemSelected
                ? colors.primary
                : isSelected
                  ? colors.primary
                  : colors.border,
              borderWidth: isItemSelected || isSelected ? 2 : 1,
              opacity: ageOpacity,
              shadowColor: isItemSelected || isSelected ? colors.primary : "#000",
              shadowOpacity: isItemSelected || isSelected ? 0.2 : 0.05,
              elevation: isItemSelected || isSelected ? 6 : 1,
            },
          ]}
        >
          {/* Selection Checkmark */}
          {isSelectionMode && (
            <View
              style={[
                styles.selectionIndicator,
                {
                  backgroundColor: isItemSelected ? colors.primary : colors.card,
                  borderColor: isItemSelected ? colors.primary : colors.border,
                },
              ]}
            >
              {isItemSelected && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </View>
          )}
          {/* Header row: pin + title */}
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              {note.isPinned && !isTrash && (
                <Ionicons
                  name="pin"
                  size={12}
                  color={colors.primary}
                  style={styles.pinIcon}
                />
              )}
              <Text
                style={[styles.title, { color: colors.text }]}
                numberOfLines={1}
              >
                {note.title || "Untitled"}
              </Text>
            </View>
          </View>

          {/* Content preview */}
          <Text
            style={[styles.preview, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {getContentPreview()}
          </Text>

          {/* Badges and Context */}
          {(category || noteTags.length > 0 || true) && (
            <View style={styles.badgesRow}>
              {/* Mocked Location Context */}
              <View style={[styles.badge, styles.contextBadge]}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={colors.mutedForeground}
                  style={styles.badgeIcon}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: colors.mutedForeground, fontWeight: "400" },
                  ]}
                >
                  San Francisco, CA
                </Text>
              </View>

              {/* Note Aging Badges */}
              {diffInDays > 90 && !isTrash && (
                <View style={[styles.badge, styles.contextBadge]}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={12}
                    color={colors.mutedForeground}
                    style={styles.badgeIcon}
                  />
                  <Text
                    style={[
                      styles.badgeText,
                      { color: colors.mutedForeground, fontWeight: "400" },
                    ]}
                  >
                    Dusty
                  </Text>
                </View>
              )}
              {diffInDays > 30 && diffInDays <= 90 && !isTrash && (
                <View style={[styles.badge, styles.contextBadge]}>
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={colors.mutedForeground}
                    style={styles.badgeIcon}
                  />
                  <Text
                    style={[
                      styles.badgeText,
                      { color: colors.mutedForeground, fontWeight: "400" },
                    ]}
                  >
                    Aging
                  </Text>
                </View>
              )}

              {category && (
                <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                  <Ionicons
                    name={category.icon as any}
                    size={12}
                    color={colors.text}
                    style={styles.badgeIcon}
                  />
                  <Text style={[styles.badgeText, { color: colors.text }]}>
                    {category.name}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Footer Row: Timestamp and Tags Dots */}
          <View style={styles.footerRow}>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>
              {formatDate(note.updatedAt)}
            </Text>
            {noteTags.length > 0 && (
              <View style={styles.tagDotsContainer}>
                {noteTags.slice(0, 3).map((tag, idx) => (
                  <View
                    key={tag.id || idx.toString()}
                    style={[
                      styles.tagDot,
                      { backgroundColor: tag.color },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 75,
    borderRadius: 16,
    marginBottom: Spacing.responsive(2.5),
    marginTop: 0,
  },
  swipeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  card: {
    flex: 1,
    padding: Spacing.responsive(4),
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.responsive(2.5),
    minHeight: Touch.buttonHeight * 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  gridCard: {
    flex: 1,
    marginHorizontal: 6,
  },
  listCard: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  pinIcon: {
    marginRight: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 0.2,
  },
  date: {
    fontSize: 12,
    fontWeight: "500",
  },
  preview: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
    opacity: 0.85,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  contextBadge: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginRight: 4,
  },
  selectionIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  tagDotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
