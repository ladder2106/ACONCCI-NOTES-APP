import { CreateTagModal } from '@/components/CreateTagModal';
import { Brand } from '@/constants/theme';
import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { exportToJSON } from '@/utils/export';
import { Ionicons } from '@expo/vector-icons';
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
    const [showTagDialog, setShowTagDialog] = useState(false);

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
        onPress,
    }: {
        icon: string;
        label: string;
        value?: string;
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
            {value && (
                <View style={styles.settingRight}>
                    <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>
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



    const handleDefaultView = () => {
        Alert.alert('Default View', 'Choose the default view', [
            { text: 'List', onPress: () => appState.updateSettings({ defaultView: 'list' }) },
            { text: 'Grid', onPress: () => appState.updateSettings({ defaultView: 'grid' }) },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleSortBy = () => {
        Alert.alert('Sort By', '', [
            { text: 'Date Modified', onPress: () => appState.updateSettings({ sortBy: 'dateModified' }) },
            { text: 'Date Created', onPress: () => appState.updateSettings({ sortBy: 'dateCreated' }) },
            { text: 'Title', onPress: () => appState.updateSettings({ sortBy: 'title' }) },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleSortOrder = () => {
        Alert.alert('Sort Order', '', [
            { text: 'Newest First', onPress: () => appState.updateSettings({ sortOrder: 'desc' }) },
            { text: 'Oldest First', onPress: () => appState.updateSettings({ sortOrder: 'asc' }) },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleExportAll = () => {
        Alert.alert(
            'Export All Data',
            'Export all notes, categories, and tags as JSON?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Export',
                    onPress: () => exportToJSON(appState.notes, appState.categories, appState.tags),
                },
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
                </View>

                {/* Appearance */}
                <SectionTitle>APPEARANCE</SectionTitle>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <ToggleRow
                        icon="moon-outline"
                        label="Dark Mode"
                        value={appState.settings.theme === 'dark'}
                        onToggle={(val) => appState.updateSettings({ theme: val ? 'dark' : 'light' })}
                    />
                    <SettingRow
                        icon="grid-outline"
                        label="Default View"
                        value={appState.settings.defaultView === 'list' ? 'List' : 'Grid'}
                        onPress={handleDefaultView}
                    />
                </View>

                {/* Sorting */}
                <SectionTitle>SORTING</SectionTitle>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <SettingRow
                        icon="swap-vertical-outline"
                        label="Sort By"
                        value={
                            appState.settings.sortBy === 'dateModified'
                                ? 'Date Modified'
                                : appState.settings.sortBy === 'dateCreated'
                                    ? 'Date Created'
                                    : 'Title'
                        }
                        onPress={handleSortBy}
                    />
                    <SettingRow
                        icon="arrow-down-outline"
                        label="Sort Order"
                        value={appState.settings.sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                        onPress={handleSortOrder}
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
                                    Alert.alert('Delete Tag?', `Delete "${tag.name}"?`, [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Delete',
                                            style: 'destructive',
                                            onPress: () => appState.deleteTag(tag.id),
                                        },
                                    ]);
                                }}
                            >
                                <View style={[styles.tagColor, { backgroundColor: tag.color }]} />
                                <Text style={[styles.tagName, { color: colors.text }]}>{tag.name}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                    <TouchableOpacity
                        onPress={() => setShowTagDialog(true)}
                        style={styles.addTagButton}
                    >
                        <Ionicons name="add" size={18} color={colors.primary} />
                        <Text style={[styles.addTagText, { color: colors.primary }]}>Add Tag</Text>
                    </TouchableOpacity>
                </View>

                {/* Data */}
                <SectionTitle>DATA</SectionTitle>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <SettingRow
                        icon="download-outline"
                        label="Export All Data"
                        value="JSON"
                        onPress={handleExportAll}
                    />
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

            <CreateTagModal
                visible={showTagDialog}
                onClose={() => setShowTagDialog(false)}
                onCreateTag={appState.createTag}
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
});
