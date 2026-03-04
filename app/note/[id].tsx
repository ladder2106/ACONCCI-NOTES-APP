import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { exportNoteToMarkdown, exportNoteToText } from '@/utils/export';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    ActionSheetIOS,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

// Save confirmation animation component
function SaveButton({ onPress, saved, colors }: { onPress: () => void; saved: boolean; colors: any }) {
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotation.value}deg` }
        ],
    }));

    const handlePress = () => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
        setTimeout(() => {
            scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }, 100);
        onPress();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={[styles.saveButton, { opacity: saved ? 0.8 : 1 }]}
            activeOpacity={0.7}
        >
            <Animated.View style={animatedStyle}>
                {saved ? (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                ) : (
                    <Ionicons name="save-outline" size={18} color={colors.primary} />
                )}
            </Animated.View>
            <Text style={[styles.saveButtonText, { color: colors.primary }]}>
                {saved ? 'Saved' : 'Save'}
            </Text>
        </TouchableOpacity>
    );
}

// Animated toolbar button with ripple/scale effect
function ToolButton({
    onPress,
    children,
    style,
}: {
    onPress: () => void;
    children: React.ReactNode;
    style?: any;
}) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={() => {
                scale.value = withSpring(0.8, { damping: 15, stiffness: 500 });
            }}
            onPressOut={() => {
                scale.value = withSpring(1, { damping: 10, stiffness: 300 });
            }}
            activeOpacity={1}
        >
            <Animated.View style={[styles.toolButton, style, animatedStyle]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
}

export default function NoteEditorScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
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

    const note = appState.notes.find((n) => n.id === id);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [lastSaved, setLastSaved] = useState<{ title: string; content: string } | null>(null);
    const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
    const contentRef = useRef<TextInput>(null);

    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.content);
            setLastSaved({ title: note.title, content: note.content });
        }
    }, [note?.id]);

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        if (note) {
            appState.updateNote(note.id, { title: newTitle });
        }
    };

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
        if (note) {
            appState.updateNote(note.id, { content: newContent });
        }
    };

    const handleSave = () => {
        if (!note) return;
        
        // Update note with current content
        appState.updateNote(note.id, { title, content });
        
        // Update last saved state
        setLastSaved({ title, content });
        
        // Show saved confirmation
        setShowSavedConfirmation(true);
        setTimeout(() => setShowSavedConfirmation(false), 2000);
    };

    const isNoteChanged = () => {
        if (!lastSaved) return false;
        return lastSaved.title !== title || lastSaved.content !== content;
    };

    const insertMarkdown = (before: string, after: string = '') => {
        // Simple insertion at the end for mobile (cursor manipulation is complex in RN)
        const newContent = content + before + after;
        setContent(newContent);
        if (note) {
            appState.updateNote(note.id, { content: newContent, isMarkdown: true });
        }
        contentRef.current?.focus();
    };

    const getWordCount = () => {
        if (!content) return { words: 0, chars: 0 };
        const words = content.trim().split(/\s+/).filter((w) => w.length > 0).length;
        const chars = content.length;
        return { words, chars };
    };

    const handleExport = () => {
        if (!note) return;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Export as Markdown', 'Export as Text', 'Cancel'],
                    cancelButtonIndex: 2,
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) exportNoteToMarkdown(note);
                    else if (buttonIndex === 1) exportNoteToText(note);
                }
            );
        } else {
            Alert.alert('Export Note', '', [
                { text: 'Markdown', onPress: () => exportNoteToMarkdown(note) },
                { text: 'Text', onPress: () => exportNoteToText(note) },
                { text: 'Cancel', style: 'cancel' },
            ]);
        }
    };

    const handleMore = () => {
        if (!note) return;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: [
                        note.isPinned ? 'Unpin' : 'Pin',
                        note.isArchived ? 'Unarchive' : 'Archive',
                        'Export',
                        'Move to Trash',
                        'Cancel',
                    ],
                    cancelButtonIndex: 4,
                    destructiveButtonIndex: 3,
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) appState.togglePin(note.id);
                    else if (buttonIndex === 1) appState.toggleArchive(note.id);
                    else if (buttonIndex === 2) handleExport();
                    else if (buttonIndex === 3) {
                        appState.deleteNote(note.id);
                        router.back();
                    }
                }
            );
        } else {
            Alert.alert('Note Options', '', [
                { text: note.isPinned ? 'Unpin' : 'Pin', onPress: () => appState.togglePin(note.id) },
                { text: note.isArchived ? 'Unarchive' : 'Archive', onPress: () => appState.toggleArchive(note.id) },
                { text: 'Export', onPress: handleExport },
                {
                    text: 'Move to Trash',
                    style: 'destructive',
                    onPress: () => {
                        appState.deleteNote(note.id);
                        router.back();
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]);
        }
    };

    if (!note) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Animated.View
                    entering={FadeInDown.duration(400)}
                    style={styles.centerContent}
                >
                    <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
                    <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
                        Note not found
                    </Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={{ color: colors.primary, marginTop: 12, fontWeight: '600' }}>Go Back</Text>
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>
        );
    }

    const category = appState.categories.find((c) => c.id === note.categoryId);
    const noteTags = note.tags
        .map((tagId) => appState.tags.find((t) => t.id === tagId))
        .filter(Boolean);
    const { words, chars } = getWordCount();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                    <Text style={[styles.backText, { color: colors.primary }]}>Notes</Text>
                </TouchableOpacity>
                <View style={styles.headerActions}>
                    {showSavedConfirmation && (
                        <Animated.View 
                            entering={FadeInDown.duration(300)}
                            style={[styles.savedConfirmation, { 
                                backgroundColor: colors.card, 
                                borderColor: colors.primary 
                            }]}
                        >
                            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                                Saved
                            </Text>
                        </Animated.View>
                    )}
                    <SaveButton 
                        onPress={handleSave} 
                        saved={!isNoteChanged()} 
                        colors={colors} 
                    />
                    {note.isPinned && (
                        <Ionicons name="pin" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                    )}
                    <TouchableOpacity onPress={handleMore} style={styles.headerButton}>
                        <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Toolbar with animated buttons */}
            <Animated.View
                entering={FadeInDown.delay(100).duration(300)}
                style={[styles.toolbar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
            >
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarContent}>
                    <ToolButton onPress={() => insertMarkdown('**', '**')}>
                        <Ionicons name="text" size={18} color={colors.mutedForeground} />
                    </ToolButton>
                    <ToolButton onPress={() => insertMarkdown('*', '*')}>
                        <Text style={[styles.toolButtonItalic, { color: colors.mutedForeground }]}>I</Text>
                    </ToolButton>
                    <ToolButton onPress={() => insertMarkdown('`', '`')}>
                        <Ionicons name="code-outline" size={18} color={colors.mutedForeground} />
                    </ToolButton>
                    <View style={[styles.toolDivider, { backgroundColor: colors.border }]} />
                    <ToolButton onPress={() => insertMarkdown('## ')}>
                        <Text style={[styles.toolButtonText, { color: colors.mutedForeground }]}>H</Text>
                    </ToolButton>
                    <ToolButton onPress={() => insertMarkdown('- ')}>
                        <Ionicons name="list-outline" size={18} color={colors.mutedForeground} />
                    </ToolButton>
                    <ToolButton onPress={() => insertMarkdown('1. ')}>
                        <Ionicons name="reorder-four-outline" size={18} color={colors.mutedForeground} />
                    </ToolButton>
                    <ToolButton onPress={() => insertMarkdown('[', '](url)')}>
                        <Ionicons name="link-outline" size={18} color={colors.mutedForeground} />
                    </ToolButton>
                </ScrollView>
                <View style={styles.toolbarRight}>
                    <Text style={[styles.wordCount, { color: colors.mutedForeground }]}>
                        {words}w · {chars}c
                    </Text>
                </View>
            </Animated.View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView style={styles.editorScroll} keyboardDismissMode="interactive">
                    {/* Metadata */}
                    <Animated.View
                        entering={FadeInDown.delay(150).duration(350)}
                        style={styles.metadata}
                    >
                        <View style={styles.metaRow}>
                            <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
                            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                                Modified {new Date(note.updatedAt).toLocaleDateString()}
                            </Text>
                        </View>
                        {category && (
                            <View style={[styles.metaBadge, { backgroundColor: colors.muted }]}>
                                <Text style={styles.metaBadgeIcon}>{category.icon}</Text>
                                <Text style={[styles.metaBadgeText, { color: colors.text }]}>{category.name}</Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* Tags */}
                    {noteTags.length > 0 && (
                        <View style={styles.tagsRow}>
                            {noteTags.map((tag: any) => (
                                <TouchableOpacity
                                    key={tag.id}
                                    onPress={() => appState.removeTagFromNote(note.id, tag.id)}
                                    style={[styles.tagBadge, { borderColor: tag.color }]}
                                >
                                    <Text style={[styles.tagText, { color: tag.color }]}>{tag.name} ×</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Title */}
                    <TextInput
                        value={title}
                        onChangeText={handleTitleChange}
                        placeholder="Note title"
                        placeholderTextColor={colors.mutedForeground + '60'}
                        style={[styles.titleInput, { color: colors.text }]}
                        multiline
                    />

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Content */}
                    <TextInput
                        ref={contentRef}
                        value={content}
                        onChangeText={handleContentChange}
                        placeholder="Start typing... Use Markdown for formatting"
                        placeholderTextColor={colors.mutedForeground + '60'}
                        style={[styles.contentInput, { color: colors.text }]}
                        multiline
                        textAlignVertical="top"
                    />
                </ScrollView>
            </KeyboardAvoidingView>
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
    notFoundText: {
        fontSize: 16,
        marginTop: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: 16,
        fontWeight: '500',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: 8,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
    },
    toolbarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    toolButton: {
        padding: 8,
        borderRadius: 6,
    },
    toolButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    toolButtonItalic: {
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    toolDivider: {
        width: 1,
        height: 20,
        marginHorizontal: 6,
    },
    toolbarRight: {
        marginLeft: 'auto',
        paddingHorizontal: 8,
    },
    wordCount: {
        fontSize: 11,
    },
    editorScroll: {
        flex: 1,
        padding: 20,
    },
    metadata: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    metaBadgeIcon: {
        fontSize: 10,
        marginRight: 3,
    },
    metaBadgeText: {
        fontSize: 11,
        fontWeight: '500',
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    tagBadge: {
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '500',
    },
    titleInput: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 12,
        padding: 0,
    },
    divider: {
        height: 1,
        marginBottom: 16,
    },
    contentInput: {
        fontSize: 15,
        lineHeight: 24,
        minHeight: 300,
        padding: 0,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    savedConfirmation: {
        position: 'absolute',
        top: -30,
        right: 0,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
});
