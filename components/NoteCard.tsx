import { useThemeColors } from '@/hooks/useThemeColors';
import {
    Category,
    Note,
    NOTE_COLORS,
    Tag
} from '@/types/note';
import { Responsive, Spacing, Touch } from '@/utils/mobile';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActionSheetIOS,
    Alert,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    FadeInDown,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

interface NoteCardProps {
    note: Note;
    isSelected?: boolean;
    isTrash?: boolean;
    tags: Tag[];
    categories: Category[];
    onPress: () => void;
    onDelete: (id: string) => void;
    onRestore?: (id: string) => void;
    onTogglePin?: (id: string) => void;
    onToggleArchive?: (id: string) => void;
    onChangeColor?: (noteId: string, color: string | null) => void;
    viewType?: 'list' | 'grid';
    index?: number;
}

export function NoteCard({
    note,
    isSelected,
    isTrash,
    tags,
    categories,
    onPress,
    onDelete,
    onRestore,
    onTogglePin,
    onToggleArchive,
    onChangeColor,
    viewType = 'list',
    index = 0,
}: NoteCardProps) {
    const colors = useThemeColors();
    const scale = useSharedValue(1);
    const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);

    const category = categories.find((c) => c.id === note.categoryId);
    const noteTags = note.tags
        .map((tagId) => tags.find((t) => t.id === tagId))
        .filter(Boolean) as Tag[];

    // Handle vault authentication on long press
    const handleVaultLongPress = async () => {
        if (isVaultNote(note)) {
            const authenticated = await VaultService.authenticateWithBiometrics('Authenticate to access vault');
            if (authenticated) {
                setIsVaultUnlocked(true);
                onPress(); // Open the note
            }
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
            return note.isLocked ? '🔒 Locked content' : note.content || 'No content';
        }
        if (isQuickCaptureNote(note)) {
            return note.content || 'Quick capture...';
        }
        if (isJournalNote(note)) {
            return `${JOURNAL_MOODS[note.mood_emoji]} ${note.content || 'Journal entry...'}`;
        }
        return note.content || 'No content';
    };

    // Get note-specific title
    const getNoteTitle = () => {
        if (isVaultNote(note)) {
            return `🔒 ${note.title}`;
        }
        if (isQuickCaptureNote(note)) {
            return `⚡ ${note.title}`;
        }
        if (isStickyNote(note)) {
            return `📝 ${note.title}`;
        }
        if (isJournalNote(note)) {
            return `📖 ${note.title}`;
        }
        return note.title || 'Untitled';
    };

    // Get note-specific icon
    const getNoteIcon = () => {
        if (isVaultNote(note)) {
            return <Ionicons name="lock-closed" size={12} color={colors.primary} style={styles.pinIcon} />;
        }
        if (isQuickCaptureNote(note)) {
            return <Ionicons name="flash" size={12} color={colors.secondary} style={styles.pinIcon} />;
        }
        if (isStickyNote(note)) {
            return <Ionicons name="color-palette" size={12} color={colors.primary} style={styles.pinIcon} />;
        }
        if (isJournalNote(note)) {
            return <Ionicons name="book" size={12} color={colors.primary} style={styles.pinIcon} />;
        }
        return null;
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (diffInHours < 168) {
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const handleLongPress = () => {
        if (Platform.OS === 'ios') {
            const options = isTrash
                ? ['Restore', 'Delete Permanently', 'Cancel']
                : ['Pin', 'Archive', 'Change Color', 'Move to Trash', 'Cancel'];
            const cancelIndex = options.length - 1;
            const destructiveIndex = isTrash ? 1 : 3;

            ActionSheetIOS.showActionSheetWithOptions(
                { options, cancelButtonIndex: cancelIndex, destructiveButtonIndex: destructiveIndex },
                (buttonIndex) => {
                    if (isTrash) {
                        if (buttonIndex === 0) onRestore?.(note.id);
                        else if (buttonIndex === 1) onDelete(note.id);
                    } else {
                        if (buttonIndex === 0) onTogglePin?.(note.id);
                        else if (buttonIndex === 1) onToggleArchive?.(note.id);
                        else if (buttonIndex === 2) showColorPicker();
                        else if (buttonIndex === 3) onDelete(note.id);
                    }
                }
            );
        } else {
            // Android/Web fallback
            if (isTrash) {
                Alert.alert('Note Options', '', [
                    { text: 'Restore', onPress: () => onRestore?.(note.id) },
                    { text: 'Delete Permanently', style: 'destructive', onPress: () => onDelete(note.id) },
                    { text: 'Cancel', style: 'cancel' },
                ]);
            } else {
                Alert.alert('Note Options', '', [
                    { text: note.isPinned ? 'Unpin' : 'Pin', onPress: () => onTogglePin?.(note.id) },
                    { text: note.isArchived ? 'Unarchive' : 'Archive', onPress: () => onToggleArchive?.(note.id) },
                    { text: 'Change Color', onPress: () => showColorPicker() },
                    { text: 'Move to Trash', style: 'destructive', onPress: () => onDelete(note.id) },
                    { text: 'Cancel', style: 'cancel' },
                ]);
            }
        }
    };

    const showColorPicker = () => {
        if (Platform.OS === 'ios') {
            const colorNames = NOTE_COLORS.map((c) => c.name);
            ActionSheetIOS.showActionSheetWithOptions(
                { options: [...colorNames, 'Cancel'], cancelButtonIndex: colorNames.length },
                (buttonIndex) => {
                    if (buttonIndex < colorNames.length) {
                        onChangeColor?.(note.id, NOTE_COLORS[buttonIndex].value);
                    }
                }
            );
        } else {
            Alert.alert('Choose Color', '', [
                ...NOTE_COLORS.map((c) => ({
                    text: c.name,
                    onPress: () => onChangeColor?.(note.id, c.value),
                })),
                { text: 'Cancel', style: 'cancel' as const },
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
            runOnJS(onPress)();
        });

    const longPressGesture = Gesture.LongPress()
        .minDuration(500)
        .onStart(() => {
            scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
            runOnJS(handleLongPress)();
        })
        .onFinalize(() => {
            scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        });

    const composed = Gesture.Race(tapGesture, longPressGesture);

    // Stagger delay: 50ms per card, max 500ms
    const staggerDelay = Math.min(index * 50, 500);

    return (
        <GestureDetector gesture={composed}>
            <Animated.View
                entering={FadeInDown.delay(staggerDelay).duration(400).springify().damping(18)}
                style={[
                    animatedStyle,
                    styles.card,
                    {
                        backgroundColor: note.color || colors.card,
                        borderColor: isSelected ? colors.primary + '50' : colors.border,
                        opacity: isTrash ? 0.6 : 1,
                    },
                    isSelected && {
                        backgroundColor: note.color || colors.accent,
                        shadowColor: colors.primary,
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                    },
                    viewType === 'grid' && styles.gridCard,
                ]}
            >
                {/* Header row: pin + title + date */}
                <View style={styles.headerRow}>
                    <View style={styles.titleRow}>
                        {note.isPinned && !isTrash && (
                            <Ionicons name="pin" size={12} color={colors.primary} style={styles.pinIcon} />
                        )}
                        <Text
                            style={[styles.title, { color: colors.text }]}
                            numberOfLines={1}
                        >
                            {note.title || 'Untitled'}
                        </Text>
                    </View>
                    <Text style={[styles.date, { color: colors.mutedForeground }]}>
                        {formatDate(note.updatedAt)}
                    </Text>
                </View>

                {/* Content preview */}
                <Text
                    style={[styles.preview, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                >
                    {note.content || 'No content'}
                </Text>

                {/* Badges */}
                {(category || noteTags.length > 0) && (
                    <View style={styles.badgesRow}>
                        {category && (
                            <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                                <Text style={styles.badgeIcon}>{category.icon}</Text>
                                <Text style={[styles.badgeText, { color: colors.text }]}>{category.name}</Text>
                            </View>
                        )}
                        {noteTags.map((tag) => (
                            <View
                                key={tag.id}
                                style={[styles.badge, { borderColor: tag.color, borderWidth: 1, backgroundColor: 'transparent' }]}
                            >
                                <Text style={[styles.badgeText, { color: tag.color }]}>{tag.name}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: Spacing.responsive(3.5),
        borderRadius: Responsive.isMaxWidth(400) ? 8 : 10,
        borderWidth: 1,
        marginBottom: Spacing.responsive(2),
        minHeight: Touch.buttonHeight * 2, // Ensure minimum touch target
    },
    gridCard: {
        flex: 1,
        marginHorizontal: 4,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    pinIcon: {
        marginRight: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    date: {
        fontSize: 11,
    },
    preview: {
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 8,
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeIcon: {
        fontSize: 10,
        marginRight: 3,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '500',
    },
});
