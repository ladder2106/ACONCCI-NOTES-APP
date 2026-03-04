import { NoteCard } from '@/components/NoteCard';
import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function SearchScreen() {
    const appState = useContext(AppStateContext);
    const colors = useThemeColors();
    const router = useRouter();

    if (!appState) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.centerContent}>
                    <Text style={{ color: colors.text }}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const renderContent = () => {
        const searchResults = appState.searchQuery
            ? appState.notes.filter(
                (n) =>
                    !n.isTrashed &&
                    (n.title.toLowerCase().includes(appState.searchQuery.toLowerCase()) ||
                        n.content.toLowerCase().includes(appState.searchQuery.toLowerCase()))
            )
            : [];

        return (
            <>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Search</Text>
                    <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
                        <TextInput
                            placeholder="Search notes..."
                            placeholderTextColor={colors.mutedForeground}
                            value={appState.searchQuery}
                            onChangeText={appState.setSearchQuery}
                            style={[styles.searchInput, { color: colors.text }]}
                            autoFocus
                        />
                        {appState.searchQuery.length > 0 && (
                            <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
                                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                            </Text>
                        )}
                    </View>
                </View>

                {appState.searchQuery.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={48} color={colors.mutedForeground + '40'} />
                        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                            Search by title or content
                        </Text>
                    </View>
                ) : searchResults.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground + '40'} />
                        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                            No notes found for "{appState.searchQuery}"
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <NoteCard
                                note={item}
                                tags={appState.tags}
                                categories={appState.categories}
                                onPress={() => {
                                    appState.setSelectedNote(item.id);
                                    router.push(`/note/${item.id}` as any);
                                }}
                                onDelete={(id) => appState.deleteNote(id, false)}
                                onTogglePin={appState.togglePin}
                                onToggleArchive={appState.toggleArchive}
                                onChangeColor={(noteId, color) => appState.updateNote(noteId, { color })}
                            />
                        )}
                    />
                )}
            </>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {renderContent()}
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
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 0,
    },
    resultCount: {
        fontSize: 12,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
});
