import { useThemeColors } from '@/hooks/useThemeColors';
import { Category, Tag, ViewMode } from '@/types/note';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useContext } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
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
    selectedTagId: string | null;
    categories: Category[];
    tags: Tag[];
    noteCounts: {
        all: number;
        favorites: number;
        pinned: number;
        archived: number;
        trash: number;
        byCategory: Record<string, number>;
        byTag: Record<string, number>;
    };
    onViewChange: (mode: ViewMode, categoryId?: string) => void;
    onCreateCategory: () => void;
    onDeleteCategory: (id: string) => void;
    onOpenSettings: () => void;
    onOpenSearch: () => void;
    onLogout: () => void;
    userEmail?: string;
}

// Animated menu item with press scale
function AnimatedMenuItem({
    icon,
    label,
    count,
    active,
    onPress,
    colors,
    index,
}: {
    icon: string;
    label: string;
    count?: number;
    active: boolean;
    onPress: () => void;
    colors: any;
    index: number;
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
                entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(index * 40).duration(400).springify().damping(20)}
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
    onOpenSearch,
    onLogout,
    userEmail,
    selectedTagId,
    tags,
}: CategoryDrawerProps) {
    const colors = useThemeColors();
    const [categoriesExpanded, setCategoriesExpanded] = React.useState(true);
    const [tagsExpanded, setTagsExpanded] = React.useState(true);

    const handleViewChange = (mode: ViewMode, id?: string) => {
        onViewChange(mode, id);
        onClose();
    };

    const rootCategories = (categories ?? []).filter((c) => !c.parentId);

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Backdrop with fade */}
            <Animated.View
                entering={Platform.OS === 'web' ? undefined : FadeIn.duration(250)}
                exiting={Platform.OS === 'web' ? undefined : FadeOut.duration(200)}
                style={styles.overlay}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            {/* Drawer with slide-in from left */}
            <Animated.View
                entering={Platform.OS === 'web' ? undefined : SlideInLeft.duration(300).springify().damping(20)}
                exiting={Platform.OS === 'web' ? undefined : SlideOutLeft.duration(250)}
                style={[styles.drawer, { backgroundColor: colors.card }]}
            >
                {/* Logo */}
                <View style={[styles.logoSection, { borderBottomColor: colors.border }]}>
            <Image
                        source={require('@/assets/images/aconcci-logo-transparent.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* View modes */}
                    <View style={styles.section}>
                        <AnimatedMenuItem
                            index={0}
                            icon="search-outline"
                            label="Search"
                            active={false}
                            onPress={() => {
                                onClose();
                                onOpenSearch();
                            }}
                            colors={colors}
                        />
                        <AnimatedMenuItem
                            index={1}
                            icon="folder-open-outline"
                            label="All Notes"
                            count={noteCounts.all}
                            active={viewMode === 'all'}
                            onPress={() => handleViewChange('all')}
                            colors={colors}
                        />
                        <AnimatedMenuItem
                            index={2}
                            icon="heart-outline"
                            label="Favorites"
                            count={noteCounts.favorites}
                            active={viewMode === 'favorites'}
                            onPress={() => handleViewChange('favorites')}
                            colors={colors}
                        />
                        <AnimatedMenuItem
                            index={3}
                            icon="pin-outline"
                            label="Pinned"
                            count={noteCounts.pinned}
                            active={viewMode === 'pinned'}
                            onPress={() => handleViewChange('pinned')}
                            colors={colors}
                        />
                        <AnimatedMenuItem
                            index={4}
                            icon="archive-outline"
                            label="Archived"
                            count={noteCounts.archived}
                            active={viewMode === 'archived'}
                            onPress={() => handleViewChange('archived')}
                            colors={colors}
                        />
                        <AnimatedMenuItem
                            index={5}
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
                        <TouchableOpacity 
                            style={styles.sectionHeader}
                            onPress={() => setCategoriesExpanded(!categoriesExpanded)}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                                CATEGORIES
                            </Text>
                            <TouchableOpacity onPress={onCreateCategory}>
                                <Ionicons name="add" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        </TouchableOpacity>

                        {categoriesExpanded && (
                            <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.duration(300).springify().damping(20)} exiting={Platform.OS === 'web' ? undefined : FadeOut.duration(200)}>
                                {rootCategories.map((category, index) => {
                                    const count = noteCounts.byCategory[category.id] || 0;
                                    const isActive =
                                        viewMode === 'category' && selectedCategoryId === category.id;

                                    return (
                                        <Animated.View 
                                            key={category.id}
                                            entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(300 + index * 40).duration(400).springify().damping(20)}
                                        >
                                            <TouchableOpacity
                                                onPress={() => handleViewChange('category', category.id)}
                                                onLongPress={() => {
                                                    onDeleteCategory(category.id);
                                                }}
                                                delayLongPress={300}
                                                style={[
                                                    styles.categoryItem,
                                                    { backgroundColor: isActive ? colors.accent : 'transparent' },
                                                ]}
                                                activeOpacity={0.7}
                                            >
                                                <Text 
                                                    style={styles.categoryEmoji}
                                                >
                                                    {category.icon}
                                                </Text>
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
                                                    <Text style={[styles.menuCount, { color: colors.mutedForeground, marginRight: 8 }]}>
                                                        {count > 99 ? '99+' : count}
                                                    </Text>
                                                )}
                                            </TouchableOpacity>
                                        </Animated.View>
                                    );
                                })}
                            </Animated.View>
                        )}
                    </View>

                    {/* Tags */}
                    <View style={[styles.section, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                        <TouchableOpacity 
                            style={styles.sectionHeader}
                            onPress={() => setTagsExpanded(!tagsExpanded)}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                                TAGS
                            </Text>
                            <Ionicons 
                                name={tagsExpanded ? "chevron-down" : "chevron-forward"} 
                                size={14} 
                                color={colors.mutedForeground} 
                            />
                        </TouchableOpacity>

                        {tagsExpanded && (
                            <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.duration(300).springify().damping(20)} exiting={Platform.OS === 'web' ? undefined : FadeOut.duration(200)}>
                                {(tags ?? []).length === 0 ? (
                                    <Text style={[styles.emptyItemText, { color: colors.mutedForeground, marginLeft: 12, marginTop: 4, marginBottom: 16 }]}>
                                        No tags yet. Add tags inside a note.
                                    </Text>
                                ) : (
                                    (tags ?? []).map((tag, index) => {
                                        const count = noteCounts.byTag?.[tag.id] || 0;
                                        const isActive = viewMode === 'tag' && selectedTagId === tag.id;

                                        return (
                                            <Animated.View 
                                                key={tag.id}
                                                entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(100 + index * 40).duration(400).springify().damping(20)}
                                            >
                                                <TouchableOpacity
                                                    onPress={() => handleViewChange('tag', tag.id)}
                                                    style={[
                                                        styles.tagItem,
                                                        { backgroundColor: isActive ? colors.accent : 'transparent' },
                                                    ]}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                                                    <Text
                                                        style={[
                                                            styles.tagName,
                                                            { color: isActive ? tag.color : colors.text },
                                                        ]}
                                                        numberOfLines={1}
                                                    >
                                                        {tag.name}
                                                    </Text>
                                                    {count > 0 && (
                                                        <Text style={[styles.menuCount, { color: colors.mutedForeground, marginRight: 8 }]}>
                                                            {count > 99 ? '99+' : count}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            </Animated.View>
                                        );
                                    })
                                )}
                            </Animated.View>
                        )}
                    </View>
                </ScrollView>

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

                {/* Log Out */}
                <TouchableOpacity
                    onPress={onLogout}
                    style={[styles.logoutButton, { borderTopColor: colors.border }]}
                >
                    <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
                    <View style={styles.logoutTextContainer}>
                        {userEmail ? (
                            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
                                Signed in as {userEmail}
                            </Text>
                        ) : null}
                        <Text style={[styles.menuLabel, { color: colors.destructive }]}>Log Out</Text>
                    </View>
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
        width: 160,
        height: 40,
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
    categoryEmoji: {
        fontSize: 18,
    },
    categoryName: {
        fontSize: 13,
        flex: 1,
    },
    tagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 10,
    },
    tagDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 4,
    },
    tagName: {
        fontSize: 13,
        flex: 1,
        marginLeft: 4,
    },
    emptyItemText: {
        fontSize: 12,
        fontStyle: 'italic',
    },

    settingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderTopWidth: 1,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderTopWidth: 1,
    },
    logoutTextContainer: {
        flex: 1,
    },
    userEmail: {
        fontSize: 12,
    },
});
