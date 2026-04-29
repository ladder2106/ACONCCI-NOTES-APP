import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Note } from '@/types/note';
import React, { useContext, useEffect, useState } from 'react';
import {
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { BaseNoteEditor } from './BaseNoteEditor';

interface GenericEditorProps {
    note: Note;
}

export function GenericEditor({ note }: GenericEditorProps) {
    const appState = useContext(AppStateContext);
    const colors = useThemeColors();
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);

    useEffect(() => {
        setTitle(note.title);
        setContent(note.content);
    }, [note.id]);

    const handleSave = () => {
        if (!appState) return;
        appState.updateNote(note.id, { title, content });
    };

    return (
        <BaseNoteEditor note={note} onSave={handleSave} showToolbar={true}>
            <View style={styles.editorContainer}>
                <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Title"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    style={[styles.titleInput, { color: colors.text }]}
                    multiline
                />
                <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder="Start writing..."
                    placeholderTextColor={colors.mutedForeground + '60'}
                    style={[styles.contentInput, { color: colors.text }]}
                    multiline
                    textAlignVertical="top"
                />
            </View>
        </BaseNoteEditor>
    );
}

const styles = StyleSheet.create({
    editorContainer: {
        flex: 1,
        padding: 20,
    },
    titleInput: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 20,
        padding: 0,
        borderWidth: 0,
        outlineStyle: 'none' as any,
    },
    contentInput: {
        fontSize: 16,
        lineHeight: 24,
        flex: 1,
        padding: 0,
        minHeight: 400,
        borderWidth: 0,
        outlineStyle: 'none' as any,
    },
});