import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTypography } from '@/hooks/useTypography';
import { Note } from '@/types/note';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { useLayout } from '@/context/LayoutContext';
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
} from 'react-native';
import { NoteCard } from '@/components/NoteCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = 'aconcci-search-history';

export default function SearchScreen() {
    const router = useRouter();
    const appState = useContext(AppStateContext);
    const colors = useThemeColors();
    const { typography } = useTypography();
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const { layoutMode } = useLayout();

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load search history');
        }
    };

    const saveHistory = async (newHistory: string[]) => {
        try {
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (e) {
            console.error('Failed to save search history');
        }
    };

    const addToHistory = (q: string) => {
        if (!q.trim()) return;
        const newHistory = [q.trim(), ...history.filter(h => h !== q.trim())].slice(0, 10);
        setHistory(newHistory);
        saveHistory(newHistory);
    };

    const clearHistory = () => {
        setHistory([]);
        saveHistory([]);
    };

    const filteredNotes = React.useMemo(() => {
        if (!query.trim() || !appState) return [];
        const q = query.toLowerCase();
        return appState.notes.filter(n => 
            !n.isTrashed && 
            (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
        );
    }, [query, appState?.notes]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                    <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search your notes..."
                        placeholderTextColor={colors.mutedForeground}
                        style={[styles.searchInput, { color: colors.text }]}
                        autoFocus
                        onSubmitEditing={() => addToHistory(query)}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {query.trim() === '' ? (
                <View style={styles.historyContainer}>
                    <View style={styles.historyHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RECENT SEARCHES</Text>
                        {history.length > 0 && (
                            <TouchableOpacity onPress={clearHistory}>
                                <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {history.length === 0 ? (
                        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No recent searches</Text>
                    ) : (
                        history.map((item, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.historyItem, { borderBottomColor: colors.border }]}
                                onPress={() => setQuery(item)}
                            >
                                <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
                                <Text style={[styles.historyText, { color: colors.text }]}>{item}</Text>
                                <Ionicons name="arrow-forward-outline" size={16} color={colors.border} style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            ) : (
                <FlatList
                    data={filteredNotes}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <NoteCard
                            note={item}
                            tags={appState?.tags || []}
                            categories={appState?.categories || []}
                            onPress={() => {
                                addToHistory(query);
                                router.push(`/note/${item.id}` as any);
                            }}
                            onDelete={(id) => appState?.deleteNote(id)}
                            viewType={layoutMode}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.centerContent}>
                            <Ionicons name="search-outline" size={48} color={colors.mutedForeground} />
                            <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>No notes found for "{query}"</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 0, // Removed border
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        padding: 0,
        borderWidth: 0,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
    },
    historyContainer: {
        padding: 20,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    clearText: {
        fontSize: 14,
        fontWeight: '600',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 12,
    },
    historyText: {
        fontSize: 15,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 20,
    },
    listContent: {
        padding: 16,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    notFoundText: {
        fontSize: 16,
        marginTop: 12,
    },
});
