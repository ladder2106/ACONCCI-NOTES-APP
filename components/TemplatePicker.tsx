import { noteTemplates } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { NoteTemplate } from '@/types/note';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    ZoomIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

interface TemplatePickerProps {
    visible: boolean;
    onClose: () => void;
    onSelectTemplate: (template: NoteTemplate) => void;
}

// Animated template card with bounce + press scale     
function TemplateCard({
    template,
    index,
    onSelect,
    colors,
}: {
    template: NoteTemplate;
    index: number;
    onSelect: () => void;
    colors: any;
}) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View
            entering={Platform.OS === 'web' ? undefined : ZoomIn.delay(100 + index * 80)
                .duration(350)
                .springify()
                .damping(14)}
            style={styles.templateCardWrapper}
        >
            <TouchableOpacity
                onPress={onSelect}
                onPressIn={() => {
                    scale.value = withSpring(0.93, { damping: 15, stiffness: 400 });
                }}
                onPressOut={() => {
                    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
                }}
                activeOpacity={1}
            >
                <Animated.View
                    style={[
                        styles.templateCard,
                        { borderColor: colors.border },
                        animatedStyle,
                    ]}
                >
                    <Ionicons
                        name={template.icon as any}
                        size={28}
                        color={colors.primary}
                        style={{ marginBottom: 8 }}
                    />
                    <Text style={[styles.templateName, { color: colors.text }]}>
                        {template.name}
                    </Text>
                    <Text
                        style={[styles.templatePreview, { color: colors.mutedForeground }]}
                        numberOfLines={2}
                    >
                        {template.content
                            ? template.content.substring(0, 60) + '...'
                            : 'Start with a blank note'}
                    </Text>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export function TemplatePicker({
    visible,
    onClose,
    onSelectTemplate,
}: TemplatePickerProps) {
    const colors = useThemeColors();

    const handleSelect = (template: NoteTemplate) => {
        onSelectTemplate(template);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable
                    style={[styles.modal, { backgroundColor: colors.card }]}
                    onPress={(e) => e.stopPropagation()}
                >
                    <Animated.Text
                        entering={Platform.OS === 'web' ? undefined : FadeIn.delay(50).duration(300)}
                        style={[styles.modalTitle, { color: colors.text }]}
                    >
                        Choose a Template
                    </Animated.Text>

                    <View style={styles.grid}>
                        {noteTemplates.map((template, index) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                index={index}
                                onSelect={() => handleSelect(template)}
                                colors={colors}
                            />
                        ))}
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    templateCardWrapper: {
        width: '47%',
    },
    templateCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
    },
    templateIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    templateName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    templatePreview: {
        fontSize: 11,
        lineHeight: 16,
    },
});
