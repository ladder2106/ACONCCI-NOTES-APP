import { EditTagModal } from '@/components/EditTagModal';
import { Brand } from '@/constants/theme';
import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Tag } from '@/types/note';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SettingsScreen() {
    const appState = useContext(AppStateContext);
    const colors = useThemeColors();
    const router = useRouter();
    const [tagToEdit, setTagToEdit] = useState<Tag | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);

    if (!appState) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.centerContent}>
                    <Text style={{ color: colors.text }}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const SectionTitle = ({ children }: { children: string }) => (
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{children}</Text>
    );

    const SettingRow = ({
        icon,
        label,
        value,
        rightElement,
        onPress,
    }: {
        icon: string;
        label: string;
        value?: string;
        rightElement?: React.ReactNode;
        onPress?: () => void;
    }) => (
        <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.settingLeft}>
                <Ionicons name={icon as any} size={18} color={colors.primary} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
            </View>
            {(value || rightElement) && (
                <View style={styles.settingRight}>
                    {value && <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>}
                    {rightElement}
                    {onPress && <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />}
                </View>
            )}
        </TouchableOpacity>
    );

    const ToggleRow = ({
        icon,
        label,
        value,
        onToggle,
    }: {
        icon: string;
        label: string;
        value: boolean;
        onToggle: (val: boolean) => void;
    }) => (
        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingLeft}>
                <Ionicons name={icon as any} size={18} color={colors.primary} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: colors.border, true: Brand.primary + '80' }}
                thumbColor={value ? Brand.primary : colors.mutedForeground}
            />
        </View>
    );

    const EXPANDED_COLORS = [
        '#F87171', '#FCA5A5', '#EF4444', '#B91C1C', // Reds
        '#FB923C', '#FDBA74', '#F97316', '#C2410C', // Oranges
        '#FACC15', '#FDE047', '#EAB308', '#A16207', // Yellows
        '#4ADE80', '#86EFAC', '#22C55E', '#15803D', // Greens
        '#2DD4BF', '#5EEAD4', '#14B8A6', '#0F766E', // Teals
        '#60A5FA', '#93C5FD', '#3B82F6', '#2563EB', // Blues
        '#818CF8', '#A5B4FC', '#6366F1', '#4338CA', // Indigos
        '#A855F7', '#C084FC', '#8B5CF6', '#6D28D9', // Purples
        '#EC4899', '#F472B6', '#D946EF', '#BE185D', // Pinks
    ];

    const handleSortBy = () => {
        Alert.alert('Sort By', '', [
            { text: 'Date Modified', onPress: () => appState.updateSettings({ sortBy: 'dateModified' }) },
            { text: 'Date Created', onPress: () => appState.updateSettings({ sortBy: 'dateCreated' }) },
            { text: 'Last Opened', onPress: () => appState.updateSettings({ sortBy: 'lastOpened' }) },
            { text: 'Note Type', onPress: () => appState.updateSettings({ sortBy: 'noteType' }) },
            { text: 'Size', onPress: () => appState.updateSettings({ sortBy: 'size' }) },
            { text: 'Title', onPress: () => appState.updateSettings({ sortBy: 'title' }) },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleSortOrder = () => {
        Alert.alert('Sort Order', '', [
            { text: 'Newest/Largest First', onPress: () => appState.updateSettings({ sortOrder: 'desc' }) },
            { text: 'Oldest/Smallest First', onPress: () => appState.updateSettings({ sortOrder: 'asc' }) },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Appearance */}
                <SectionTitle>APPEARANCE</SectionTitle>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <ToggleRow
                        icon="moon-outline"
                        label="Dark Mode"
                        value={appState.settings.theme === 'dark'}
                        onToggle={(val) => appState.updateSettings({ theme: val ? 'dark' : 'light' })}
                    />

                    {/* Accent Color Picker Toggle */}
                    <SettingRow
                        icon="color-palette-outline"
                        label="Accent Color"
                        onPress={() => setShowColorPicker(!showColorPicker)}
                        rightElement={
                            appState.settings.accentColor ? (
                                <View style={[styles.inlineSwatch, { backgroundColor: appState.settings.accentColor }]} />
                            ) : (
                                <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>Default</Text>
                            )
                        }
                    />

                    {showColorPicker && (
                        <View style={styles.expandedColorPicker}>
                            <View style={styles.colorGrid}>
                                <TouchableOpacity
                                    onPress={() => appState.updateSettings({ accentColor: undefined })}
                                    style={[
                                        styles.colorSwatch,
                                        { backgroundColor: '#00000010' },
                                        !appState.settings.accentColor && styles.selectedSwatch
                                    ]}
                                >
                                    {!appState.settings.accentColor && (
                                        <Ionicons name="checkmark" size={16} color={colors.text} />
                                    )}
                                </TouchableOpacity>
                                {EXPANDED_COLORS.map(color => (
                                    <TouchableOpacity
                                        key={color}
                                        onPress={() => appState.updateSettings({ accentColor: color })}
                                        style={[
                                            styles.colorSwatch,
                                            { backgroundColor: color },
                                            appState.settings.accentColor === color && styles.selectedSwatch
                                        ]}
                                    >
                                        {appState.settings.accentColor === color && (
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Sorting */}
                <SectionTitle>SORTING</SectionTitle>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <SettingRow
                        icon="swap-vertical-outline"
                        label="Sort By"
                        value={
                            appState.settings.sortBy === 'dateModified' ? 'Date Modified' :
                                appState.settings.sortBy === 'dateCreated' ? 'Date Created' :
                                    appState.settings.sortBy === 'lastOpened' ? 'Last Opened' :
                                        appState.settings.sortBy === 'noteType' ? 'Note Type' :
                                            appState.settings.sortBy === 'size' ? 'Size' : 'Title'
                        }
                        onPress={handleSortBy}
                    />
                    <ToggleRow
                        icon="funnel-outline"
                        label="Newest/Largest First"
                        value={appState.settings.sortOrder === 'desc'}
                        onToggle={(val) => appState.updateSettings({ sortOrder: val ? 'desc' : 'asc' })}
                    />
                </View>

                {/* Editor */}
                <SectionTitle>EDITOR</SectionTitle>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <ToggleRow
                        icon="save-outline"
                        label="Auto Save"
                        value={appState.settings.autoSave}
                        onToggle={(val) => appState.updateSettings({ autoSave: val })}
                    />
                    <ToggleRow
                        icon="text-outline"
                        label="Show Word Count"
                        value={appState.settings.showWordCount}
                        onToggle={(val) => appState.updateSettings({ showWordCount: val })}
                    />
                </View>

                {/* Tags */}
                <SectionTitle>TAGS</SectionTitle>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    {appState.tags.length === 0 ? (
                        <View style={[styles.emptyTags, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.emptyTagsText, { color: colors.mutedForeground }]}>
                                No tags yet
                            </Text>
                        </View>
                    ) : (
                        appState.tags.map((tag) => (
                            <TouchableOpacity
                                key={tag.id}
                                style={[styles.tagRow, { borderBottomColor: colors.border }]}
                                onLongPress={() => {
                                    Alert.alert('Delete Tag Globally?', `Delete "${tag.name}" from all notes and settings?`, [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Delete',
                                            style: 'destructive',
                                            onPress: () => appState.deleteTag(tag.id),
                                        },
                                    ]);
                                }}
                                onPress={() => setTagToEdit(tag)}
                            >
                                <View style={[styles.tagColor, { backgroundColor: tag.color }]} />
                                <Text style={[styles.tagName, { color: colors.text }]}>{tag.name}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* About */}
                <SectionTitle>ABOUT</SectionTitle>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <SettingRow icon="information-circle-outline" label="Version" value="1.0.0" />
                    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="heart-outline" size={18} color={Brand.secondary} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Made by</Text>
                        </View>
                        <Text style={[styles.settingValue, { color: Brand.primary }]}>ACONCCI</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <EditTagModal
                visible={!!tagToEdit}
                tag={tagToEdit}
                onClose={() => setTagToEdit(null)}
                onSaveTag={(id, name, color) => {
                    appState.updateTag(id, { name, color });
                }}
            />
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
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 8,
    },
    section: {
        borderRadius: 12,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    settingLabel: {
        fontSize: 15,
    },
    settingValue: {
        fontSize: 14,
        textTransform: 'capitalize',
    },
    emptyTags: {
        padding: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    emptyTagsText: {
        fontSize: 14,
        textAlign: 'center',
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 12,
    },
    tagColor: {
        width: 12,
        height: 12,
        borderRadius: 3,
    },
    tagName: {
        fontSize: 15,
    },
    addTagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        gap: 8,
    },
    addTagText: {
        fontSize: 14,
        fontWeight: '600',
    },
    expandedColorPicker: {
        padding: 16,
        paddingTop: 0,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    colorSwatch: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedSwatch: {
        borderWidth: 3,
        borderColor: '#00000030',
        transform: [{ scale: 1.15 }]
    },
    backButton: {
        padding: 4,
    },
    inlineSwatch: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: '#00000020',
        marginRight: 4,
    },
});
