import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Note, NOTE_TYPE_COLORS, NOTE_TYPE_ICONS } from '@/types/note';
import { formatDate } from '@/utils/date';
import { NoteTagPicker } from '@/components/NoteTagPicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface BaseNoteEditorProps {
    note: Note;
    children: React.ReactNode;
    onSave?: () => void;
    showToolbar?: boolean;
    toolbar?: React.ReactNode;
}

export function BaseNoteEditor({ note, children, onSave, showToolbar = true, toolbar }: BaseNoteEditorProps) {
    const appState = useContext(AppStateContext);
    const colors = useThemeColors();
    const router = useRouter();
    const [savedIndicator, setSavedIndicator] = useState(false);
    const [showTagPicker, setShowTagPicker] = useState(false);

    useEffect(() => {
        if (!onSave) return;
        
        const timer = setTimeout(() => {
            onSave();
            setSavedIndicator(true);
            setTimeout(() => setSavedIndicator(false), 2000);
        }, 3000); // Auto-save after 3 seconds of "inactivity" (onSave changing)

        return () => clearTimeout(timer);
    }, [onSave]);

    const typeColor = NOTE_TYPE_COLORS[note.type as keyof typeof NOTE_TYPE_COLORS] || colors.primary;
    const typeIcon = NOTE_TYPE_ICONS[note.type as keyof typeof NOTE_TYPE_ICONS] || 'document-text-outline';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                    <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                        <Ionicons name={typeIcon as any} size={12} color={typeColor} />
                        <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                            {note.type.replace('_', ' ').toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.headerActions}>
                    {savedIndicator && (
                        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown} style={styles.savedIndicator}>
                            <Text style={[styles.savedText, { color: colors.mutedForeground }]}>Saved</Text>
                        </Animated.View>
                    )}
                    <TouchableOpacity onPress={onSave} style={styles.saveButton}>
                        <Text style={[styles.saveButtonText, { color: colors.primary }]}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Optional Toolbar */}
            {showToolbar && toolbar && (
                <View style={[styles.toolbar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    {toolbar}
                </View>
            )}

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView 
                    style={styles.content} 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {children}

                    {/* Footer Dates */}
                    <View style={styles.footer}>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                            Created: {formatDate(note.createdAt)}
                        </Text>
                        <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                            Last edited: {formatDate(note.updatedAt)}
                        </Text>
                    </View>
                </ScrollView>

                {/* Editor Bottom Toolbar */}
                <View style={[styles.bottomToolbar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity onPress={() => setShowTagPicker(!showTagPicker)} style={styles.toolbarIcon}>
                        <Ionicons name="pricetag-outline" size={22} color={showTagPicker ? colors.primary : colors.mutedForeground} />
                    </TouchableOpacity>
                    {/* Add more icons here in the future like Images, Audio etc. */}
                </View>

                {showTagPicker && <NoteTagPicker note={note} onClose={() => setShowTagPicker(false)} />}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 60,
    },
    backText: {
        fontSize: 17,
        marginLeft: -4,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        minWidth: 60,
    },
    saveButton: {
        paddingVertical: 4,
    },
    saveButtonText: {
        fontSize: 17,
        fontWeight: '600',
    },
    savedIndicator: {
        marginRight: 8,
    },
    savedText: {
        fontSize: 12,
    },
    toolbar: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    footer: {
        marginTop: 'auto',
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 4,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        width: '100%',
        marginBottom: 16,
    },
    dateText: {
        fontSize: 12,
        textAlign: 'center',
    },
    bottomToolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    toolbarIcon: {
        padding: 8,
    },
});
