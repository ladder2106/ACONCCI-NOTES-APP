import { useThemeColors } from '@/hooks/useThemeColors';
import { Category, ViewMode } from '@/types/note';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInLeft,
    SlideOutLeft,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

interface CategoryDrawerProps {
    visible: boolean;
    onClose: () => void;
    viewMode: ViewMode;
    selectedCategoryId: string | null;
    categories: Category[];
    noteCounts: {
        all: number;
        pinned: number;
        archived: number;
        trash: number;
        byCategory: Record<string, number>;
    };
    onViewChange: (mode: ViewMode, categoryId?: string) => void;
    onCreateCategory: () => void;
    onDeleteCategory: (id: string) => void;
    onOpenSettings: () => void;
}

// Animated menu item with press scale
function AnimatedMenuItem({
    icon,
    label,
    count,
    active,
    onPress,
    colors,
}: {
    icon: string;
    label: string;
    count?: number;
    active: boolean;
    onPress: () => void;
    colors: any;
}) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={() => {
                scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
            }}
            onPressOut={() => {
                scale.value = withSpring(1, { damping: 15, stiffness: 400 });
            }}
            activeOpacity={1}
        >
            <Animated.View
                style={[
                    styles.menuItem,
                    { backgroundColor: active ? colors.accent : 'transparent' },
                    animatedStyle,
                ]}
            >
                <Ionicons
                    name={icon as any}
                    size={18}
                    color={active ? colors.primary : colors.mutedForeground}
                />
                <Text
                    style={[
                        styles.menuLabel,
                        { color: active ? colors.primary : colors.text },
                    ]}
                >
                    {label}
                </Text>
                {count !== undefined && count > 0 && (
                    <Text style={[styles.menuCount, { color: colors.mutedForeground }]}>
                        {count > 99 ? '99+' : count}
                    </Text>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
}

export function CategoryDrawer({
    visible,
    onClose,
    viewMode,
    selectedCategoryId,
    categories,
    noteCounts,
    onViewChange,
    onCreateCategory,
    onDeleteCategory,
    onOpenSettings,
}: CategoryDrawerProps) {
    const colors = useThemeColors();

    const handleViewChange = (mode: ViewMode, categoryId?: string) => {
        onViewChange(mode, categoryId);
        onClose();
    };

    const rootCategories = categories.filter((c) => !c.parentId);

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Backdrop with fade */}
            <Animated.View
                entering={FadeIn.duration(250)}
                exiting={FadeOut.duration(200)}
                style={styles.overlay}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            {/* Drawer with slide-in from left */}
            <Animated.View
                entering={SlideInLeft.duration(300).springify().damping(20)}
                exiting={SlideOutLeft.duration(250)}
                style={[styles.drawer, { backgroundColor: colors.card }]}
            >
                {/* Logo */}
                <View style={[styles.logoSection, { borderBottomColor: colors.border }]}>
                    <Image
                        source={require('@/assets/images/aconcci-logo.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* View modes */}
                    <View style={styles.section}>
                        <AnimatedMenuItem
                            icon="folder-open-outline"
                            label="All Notes"
                            count={noteCounts.all}
                            active={viewMode === 'all'}
                            onPress={() => handleViewChange('all')}
                            colors={colors}
                        />
                        <AnimatedMenuItem
                            icon="pin-outline"
                            label="Pinned"
                            count={noteCounts.pinned}
                            active={viewMode === 'pinned'}
                            onPress={() => handleViewChange('pinned')}
                            colors={colors}
                        />
                        <AnimatedMenuItem
                            icon="archive-outline"
                            label="Archived"
                            count={noteCounts.archived}
                            active={viewMode === 'archived'}
                            onPress={() => handleViewChange('archived')}
                            colors={colors}
                        />
                        <AnimatedMenuItem
                            icon="trash-outline"
                            label="Trash"
                            count={noteCounts.trash}
                            active={viewMode === 'trash'}
                            onPress={() => handleViewChange('trash')}
                            colors={colors}
                        />
                    </View>

                    {/* Categories */}
                    <View style={[styles.section, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                                CATEGORIES
                            </Text>
                            <TouchableOpacity onPress={onCreateCategory}>
                                <Ionicons name="add" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {rootCategories.map((category) => {
                            const count = noteCounts.byCategory[category.id] || 0;
                            const isActive =
                                viewMode === 'category' && selectedCategoryId === category.id;

                            return (
                                <TouchableOpacity
                                    key={category.id}
                                    onPress={() => handleViewChange('category', category.id)}
                                    onLongPress={() => onDeleteCategory(category.id)}
                                    style={[
                                        styles.categoryItem,
                                        { backgroundColor: isActive ? colors.accent : 'transparent' },
                                    ]}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                                    <Text
                                        style={[
                                            styles.categoryName,
                                            { color: isActive ? category.color : colors.text },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {category.name}
                                    </Text>
                                    {count > 0 && (
                                        <Text style={[styles.menuCount, { color: colors.mutedForeground }]}>
                                            {count > 99 ? '99+' : count}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Settings */}
                <TouchableOpacity
                    onPress={() => {
                        onClose();
                        onOpenSettings();
                    }}
                    style={[styles.settingsButton, { borderTopColor: colors.border }]}
                >
                    <Ionicons name="settings-outline" size={18} color={colors.mutedForeground} />
                    <Text style={[styles.menuLabel, { color: colors.text }]}>Settings</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    drawer: {
        width: 280,
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
    },
    logoSection: {
        padding: 20,
        borderBottomWidth: 1,
        paddingTop: 60,
    },
    logo: {
        width: 140,
        height: 35,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 12,
    },
    menuLabel: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    menuCount: {
        fontSize: 12,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 10,
    },
    categoryIcon: {
        fontSize: 14,
    },
    categoryName: {
        fontSize: 13,
        flex: 1,
    },

    settingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
    },
});
