import { useThemeColors } from '@/hooks/useThemeColors';
import { Tag, TAG_COLORS } from '@/types/note';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface EditTagModalProps {
    visible: boolean;
    tag: Tag | null;
    onClose: () => void;
    onSaveTag: (id: string, name: string, color: string) => void;
}

export function EditTagModal({
    visible,
    tag,
    onClose,
    onSaveTag,
}: EditTagModalProps) {
    const colors = useThemeColors();
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

    useEffect(() => {
        if (tag) {
            setName(tag.name);
            setSelectedColor(tag.color);
        }
    }, [tag]);

    const handleSubmit = () => {
        if (name.trim() && tag) {
            onSaveTag(tag.id, name.trim(), selectedColor);
            onClose();
        }
    };

    if (!tag) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={[styles.modal, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Tag</Text>

                    <Text style={[styles.label, { color: colors.text }]}>Name</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Tag name"
                        placeholderTextColor={colors.mutedForeground}
                        style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                        autoFocus
                    />

                    <Text style={[styles.label, { color: colors.text }]}>Color</Text>
                    <View style={styles.colorGrid}>
                        {TAG_COLORS.map((color) => (
                            <TouchableOpacity
                                key={color}
                                onPress={() => setSelectedColor(color)}
                                style={[
                                    styles.colorItem,
                                    { backgroundColor: color },
                                    selectedColor === color && {
                                        borderColor: colors.text,
                                        borderWidth: 3,
                                        transform: [{ scale: 1.1 }],
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                        >
                            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            style={[styles.button, styles.submitButton, { backgroundColor: colors.primary, opacity: name.trim() ? 1 : 0.5 }]}
                            disabled={!name.trim()}
                        >
                            <Text style={[styles.buttonText, { color: '#fff' }]}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modal: {
        borderRadius: 16,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 0,
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        outlineStyle: 'none' as any,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    colorItem: {
        width: 40,
        height: 40,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    button: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
    },
    submitButton: {},
    buttonText: {
        fontWeight: '600',
        fontSize: 15,
    },
});
