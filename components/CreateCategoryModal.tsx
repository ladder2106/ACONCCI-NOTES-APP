import { useThemeColors } from '@/hooks/useThemeColors';
import { CATEGORY_COLORS } from '@/types/note';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CreateCategoryModalProps {
    visible: boolean;
    onClose: () => void;
    onCreateCategory: (name: string, color: string, icon: string) => void;
}

// Popular emojis for categories
const CATEGORY_EMOJIS = [
    '🏠', '💼', '📚', '💡', '🎯', '🏃', '🍎', '✈️', '🍽️', '🛒', 
    '🚗', '🎵', '📷', '🎮', '🎨', '💻', '📱', '📧', '📅', '📰',
    '🏥', '🏋️', '🌍', '💰', '🎁', '⭐', '🔖', '🏷️', '⚙️', '🗂️',
    '🔍', '🔔', '⏰', '📍', '🗺️', '🖼️', '🎬', '🎤', '✏️', '☑️',
    '🛡️', '💗', '🏆', '🌟', '🚀', '🔥', '💎', '🌈', '🦄', '🎪',
    '☕', '🍕', '🌮', '🥗', '🍷', '🍰', '🎂', '🌺', '🌸', '🌼',
    '🐶', '🐱', '🐭', '🐹', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁',
    '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅',
    '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌',
    '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖',
    '🦕', '🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳',
    '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦌', '🦏', '🦛', '🐪',
    '🐘', '🦣', '🦡', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑',
    '🦙', '🐒', '🦍', '🦧', '🐿️', '🦔', '🦇', '🦅', '🦉', '🦤',
    '🦢', '🦩', '🦚', '🦃', '🐔', '🐓', '🦤', '🦩', '🦚', '🦃',
    '🦆', '🦅', '🦉', '🦇', '🦢', '🦩', '🦚', '🦃', '🐔', '🐓',
    '🦤', '🦩', '🦚', '🦃', '🐔', '🐓', '🦤', '🦩', '🦚', '🦃',
];

export function CreateCategoryModal({
    visible,
    onClose,
    onCreateCategory,
}: CreateCategoryModalProps) {
    const colors = useThemeColors();
    const [name, setName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('🏠');
    const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);

    const handleSubmit = () => {
        if (name.trim()) {
            onCreateCategory(name.trim(), selectedColor, selectedEmoji);
            setName('');
            setSelectedEmoji('🏠');
            setSelectedColor(CATEGORY_COLORS[0]);
            onClose();
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={[styles.modal, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Create Category</Text>

                        <Text style={[styles.label, { color: colors.text }]}>Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Category name"
                            placeholderTextColor={colors.mutedForeground}
                            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                            autoFocus
                        />

                        <Text style={[styles.label, { color: colors.text }]}>Emoji</Text>
                        <View style={styles.emojiGrid}>
                            {CATEGORY_EMOJIS.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    onPress={() => setSelectedEmoji(emoji)}
                                    style={[
                                        styles.emojiItem,
                                        { borderColor: selectedEmoji === emoji ? colors.primary : colors.border },
                                        selectedEmoji === emoji && { backgroundColor: colors.accent },
                                    ]}
                                >
                                    <Text style={styles.emojiText}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.label, { color: colors.text }]}>Color</Text>
                        <View style={styles.colorGrid}>
                            {CATEGORY_COLORS.map((color) => (
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

                    </ScrollView>

                    {/* Always-visible action buttons — outside ScrollView */}
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
                            <Text style={[styles.buttonText, { color: '#fff' }]}>Create Category</Text>
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
        maxHeight: '80%',
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
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    emojiItem: {
        width: 44,
        height: 44,
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiText: {
        fontSize: 20,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    colorItem: {
        width: 36,
        height: 36,
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
