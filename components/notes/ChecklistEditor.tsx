import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ChecklistNote } from '@/types/note';
import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useEffect, useState, useRef } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Animated,
} from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { BaseNoteEditor } from './BaseNoteEditor';

interface ChecklistEditorProps {
    note: ChecklistNote;
}

const ChecklistItem = ({ 
    item, 
    onToggle, 
    onUpdateText, 
    onDelete, 
    onAddNext,
    onMoveUp,
    onMoveDown,
    colors,
    isFirst,
    isLast,
    showMoveControls = true
}: { 
    item: any; 
    onToggle: (id: string) => void; 
    onUpdateText: (id: string, text: string) => void; 
    onDelete: (id: string) => void; 
    onAddNext: () => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    colors: any;
    isFirst: boolean;
    isLast: boolean;
    showMoveControls?: boolean;
}) => {
    const swipeableRef = useRef<Swipeable>(null);

    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
        const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [64, 0],
        });
        return (
            <View style={{ width: 64, flexDirection: 'row' }}>
                <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
                    <RectButton
                        style={[styles.deleteAction, { backgroundColor: colors.destructive }]}
                        onPress={() => onDelete(item.id)}
                    >
                        <Ionicons name="trash" size={24} color="white" />
                    </RectButton>
                </Animated.View>
            </View>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            friction={2}
            rightThreshold={40}
        >
            <View style={[styles.itemRow, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => onToggle(item.id)}>
                    <Ionicons 
                        name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
                        size={24} 
                        color={colors.primary} 
                    />
                </TouchableOpacity>
                
                <TextInput
                    value={item.text}
                    onChangeText={(text) => onUpdateText(item.id, text)}
                    placeholder="List item"
                    placeholderTextColor={colors.mutedForeground + '60'}
                    style={[
                        styles.itemInput, 
                        { color: item.completed ? colors.mutedForeground : colors.text },
                        item.completed && styles.strikethrough
                    ]}
                    onSubmitEditing={onAddNext}
                />

                {showMoveControls && !item.completed && (
                    <View style={styles.moveControls}>
                        <TouchableOpacity onPress={() => onMoveUp(item.id)} disabled={isFirst}>
                            <Ionicons 
                                name="chevron-up" 
                                size={18} 
                                color={isFirst ? colors.muted : colors.mutedForeground} 
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onMoveDown(item.id)} disabled={isLast}>
                            <Ionicons 
                                name="chevron-down" 
                                size={18} 
                                color={isLast ? colors.muted : colors.mutedForeground} 
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Swipeable>
    );
};

export function ChecklistEditor({ note }: ChecklistEditorProps) {
    const appState = useContext(AppStateContext);
    const colors = useThemeColors();
    const [title, setTitle] = useState(note.title);
    const [items, setItems] = useState(note.items || []);

    useEffect(() => {
        setTitle(note.title);
        setItems(note.items || []);
    }, [note.id]);

    const addItem = (text = '') => {
        const newItem = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            order: items.length,
        };
        const updatedItems = [...items, newItem];
        setItems(updatedItems);
        appState?.updateNote(note.id, { items: updatedItems });
    };

    const updateItemText = (id: string, text: string) => {
        const updatedItems = items.map((item) =>
            item.id === id ? { ...item, text } : item
        );
        setItems(updatedItems);
        appState?.updateNote(note.id, { items: updatedItems });
    };

    const toggleItem = (id: string) => {
        const updatedItems = items.map((item) =>
            item.id === id ? { ...item, completed: !item.completed } : item
        );
        setItems(updatedItems);
        appState?.updateNote(note.id, { items: updatedItems });
    };

    const deleteItem = (id: string) => {
        const updatedItems = items.filter((item) => item.id !== id);
        setItems(updatedItems);
        appState?.updateNote(note.id, { items: updatedItems });
    };

    const moveItem = (id: string, direction: 'up' | 'down') => {
        const index = items.findIndex(item => item.id === id);
        if (index < 0) return;
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= items.length) return;
        
        const updatedItems = [...items];
        const [movedItem] = updatedItems.splice(index, 1);
        updatedItems.splice(newIndex, 0, movedItem);
        
        // Update order property
        const reorderedItems = updatedItems.map((item, idx) => ({ ...item, order: idx }));
        setItems(reorderedItems);
        appState?.updateNote(note.id, { items: reorderedItems });
    };

    const handleSave = () => {
        if (!appState) return;
        appState.updateNote(note.id, { title, items });
    };

    const completedItems = items.filter((i) => i.completed);
    const pendingItems = items.filter((i) => !i.completed);
    const progress = items.length > 0 ? completedItems.length / items.length : 0;

    return (
        <BaseNoteEditor note={note} onSave={handleSave} showToolbar={false}>
            <View style={styles.container}>
                <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Checklist Title"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    style={[styles.titleInput, { color: colors.text }]}
                />

                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View 
                            style={[
                                styles.progressFill, 
                                { 
                                    backgroundColor: colors.primary,
                                    width: `${progress * 100}%`
                                }
                            ]} 
                        />
                    </View>
                    <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                        {completedItems.length} of {items.length} items completed
                    </Text>
                </View>

                <View style={styles.listSection}>
                    {pendingItems.map((item, index) => (
                        <ChecklistItem
                            key={item.id}
                            item={item}
                            onToggle={toggleItem}
                            onUpdateText={updateItemText}
                            onDelete={deleteItem}
                            onAddNext={() => addItem()}
                            onMoveUp={() => moveItem(item.id, 'up')}
                            onMoveDown={() => moveItem(item.id, 'down')}
                            colors={colors}
                            isFirst={index === 0}
                            isLast={index === pendingItems.length - 1}
                        />
                    ))}

                    <TouchableOpacity style={styles.addItemButton} onPress={() => addItem()}>
                        <Ionicons name="add" size={24} color={colors.primary} />
                        <Text style={[styles.addItemText, { color: colors.primary }]}>Add Item</Text>
                    </TouchableOpacity>
                </View>

                {completedItems.length > 0 && (
                    <View style={styles.completedSection}>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>COMPLETED</Text>
                        {completedItems.map((item) => (
                            <ChecklistItem
                                key={item.id}
                                item={item}
                                onToggle={toggleItem}
                                onUpdateText={updateItemText}
                                onDelete={deleteItem}
                                onAddNext={() => addItem()}
                                onMoveUp={() => {}}
                                onMoveDown={() => {}}
                                colors={colors}
                                isFirst={false}
                                isLast={false}
                                showMoveControls={false}
                            />
                        ))}
                    </View>
                )}
            </View>
        </BaseNoteEditor>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    titleInput: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
        padding: 0,
        borderWidth: 0,
        outlineStyle: 'none' as any,
    },
    progressContainer: {
        marginBottom: 30,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressFill: {
        height: '100%',
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    listSection: {
        gap: 0,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    itemInput: {
        flex: 1,
        fontSize: 17,
        padding: 0,
    },
    strikethrough: {
        textDecorationLine: 'line-through',
    },
    moveControls: {
        flexDirection: 'row',
        gap: 8,
    },
    addItemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 12,
    },
    addItemText: {
        fontSize: 17,
        fontWeight: '600',
    },
    completedSection: {
        marginTop: 30,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 20,
        opacity: 0.1,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 10,
        letterSpacing: 1,
    },
    deleteAction: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
});