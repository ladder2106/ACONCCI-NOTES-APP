import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getAutoColor, Note, Tag } from '@/types/note';
import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useMemo, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface NoteTagPickerProps {
    note: Note;
    onClose: () => void;
}

export function NoteTagPicker({ note, onClose }: NoteTagPickerProps) {
    const appState = useContext(AppStateContext);
    const colors = useThemeColors();
    const [searchText, setSearchText] = useState('');

    if (!appState) return null;

    const allTags = appState.tags;
    const selectedTags = note.tags || [];

    const availableTags = useMemo(() => {
        return allTags.filter(
            (t) => !selectedTags.some((st) => st.id === t.id)
        );
    }, [allTags, selectedTags]);

    const filteredTags = useMemo(() => {
        if (!searchText.trim()) return availableTags;
        const query = searchText.trim().toLowerCase();
        return availableTags.filter((t) => t.name.toLowerCase().includes(query));
    }, [availableTags, searchText]);

    const exactMatch = availableTags.find(
        (t) => t.name.toLowerCase() === searchText.trim().toLowerCase()
    );

    const exactMatchSelected = selectedTags.find(
        (t) => t.name.toLowerCase() === searchText.trim().toLowerCase()
    );

    const handleSelectTag = (tag: Tag) => {
        appState.addTagToNote(note.id, tag);
        setSearchText('');
    };

    const handleCreateTag = () => {
        const name = searchText.trim();
        if (!name) return;
        const color = getAutoColor(name);
        const newTag = appState.createTag(name, color);
        appState.addTagToNote(note.id, newTag);
        setSearchText('');
    };

    const handleRemoveTag = (tagId: string) => {
        appState.removeTagFromNote(note.id, tagId);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Tags</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Selected Tags Chips */}
            {selectedTags.length > 0 && (
                <View style={styles.chipsContainer}>
                    {selectedTags.map((tag) => (
                        <View key={tag.id} style={[styles.chip, { backgroundColor: tag.color + '20', borderColor: tag.color }]}>
                            <Text style={[styles.chipText, { color: tag.color }]}>{tag.name}</Text>
                            <TouchableOpacity onPress={() => handleRemoveTag(tag.id)} style={styles.chipRemove}>
                                <Ionicons name="close" size={14} color={tag.color} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* Search Input */}
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="pricetag-outline" size={16} color={colors.mutedForeground} />
                <TextInput
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search or create a tag..."
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { color: colors.text }]}
                    autoFocus={Platform.OS !== 'web'}
                />
            </View>

            {/* Dropdown Results */}
            <ScrollView style={styles.dropdown} keyboardShouldPersistTaps="handled">
                {filteredTags.map((tag) => (
                    <TouchableOpacity
                        key={tag.id}
                        style={[styles.resultItem, { borderBottomColor: colors.border }]}
                        onPress={() => handleSelectTag(tag)}
                    >
                        <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                        <Text style={[styles.resultText, { color: colors.text }]}>{tag.name}</Text>
                    </TouchableOpacity>
                ))}

                {searchText.trim().length > 0 && !exactMatch && !exactMatchSelected && (
                    <TouchableOpacity
                        style={[styles.createItem, { borderBottomColor: colors.border }]}
                        onPress={handleCreateTag}
                    >
                        <Ionicons name="add" size={16} color={colors.primary} />
                        <Text style={[styles.createText, { color: colors.primary }]}>
                            Create "{searchText.trim()}"
                        </Text>
                    </TouchableOpacity>
                )}
                
                {filteredTags.length === 0 && (!searchText.trim() || exactMatchSelected) && (
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        {exactMatchSelected ? 'Tag already added.' : 'No available tags.'}
                    </Text>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderTopWidth: 1,
        padding: 16,
        maxHeight: 300,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
        gap: 4,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    chipRemove: {
        padding: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
        marginBottom: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        outlineStyle: 'none' as any,
    },
    dropdown: {
        flex: 1,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 8,
    },
    tagDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    resultText: {
        fontSize: 14,
    },
    createItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 6,
    },
    createText: {
        fontSize: 14,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 13,
        textAlign: 'center',
        paddingVertical: 16,
        fontStyle: 'italic',
    },
});
