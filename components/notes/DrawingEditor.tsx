import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { DrawingNote } from '@/types/note';
import { Ionicons } from '@expo/vector-icons';
import { Skia, Canvas, Path, SkPath } from '@shopify/react-native-skia';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Dimensions,
    Animated as RNAnimated,
} from 'react-native';
import { BaseNoteEditor } from './BaseNoteEditor';

const { width, height } = Dimensions.get('window');

interface DrawingEditorProps {
    note: DrawingNote;
}

interface PathWithColor {
    path: SkPath;
    color: string;
    strokeWidth: number;
    opacity: number;
}

const COLORS = ['#000000', '#FF3B30', '#34C759', '#007AFF', '#FFCC00', '#AF52DE', '#FF9500'];
const STROKE_WIDTHS = [2, 5, 10, 20];

export function DrawingEditor({ note }: DrawingEditorProps) {
    const appState = useContext(AppStateContext);
    const colors = useThemeColors();
    const [title, setTitle] = useState(note.title);
    const [paths, setPaths] = useState<PathWithColor[]>([]);
    const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
    const [currentColor, setCurrentColor] = useState(COLORS[0]);
    const [currentStrokeWidth, setCurrentStrokeWidth] = useState(STROKE_WIDTHS[1]);
    const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
    const [undoStack, setUndoStack] = useState<PathWithColor[][]>([]);
    const [redoStack, setRedoStack] = useState<PathWithColor[][]>([]);
    const [showTitle, setShowTitle] = useState(false);
    
    const titleAnim = useRef(new RNAnimated.Value(-100)).current;

    useEffect(() => {
        setTitle(note.title);
    }, [note.id]);

    useEffect(() => {
        RNAnimated.timing(titleAnim, {
            toValue: showTitle ? 0 : -100,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [showTitle]);

    const pan = Gesture.Pan()
        .minDistance(0)
        .runOnJS(true)
        .onStart(({ x, y }: { x: number; y: number }) => {
            if (showTitle) setShowTitle(false);
            const newPath = Skia.Path.Make();
            newPath.moveTo(x, y);
            setCurrentPath(newPath);
        })
        .onUpdate(({ x, y }: { x: number; y: number }) => {
            if (currentPath) {
                currentPath.lineTo(x, y);
            }
        })
        .onEnd(() => {
            if (currentPath) {
                const newPathWithColor: PathWithColor = {
                    path: currentPath,
                    color: tool === 'eraser' ? colors.background : currentColor,
                    strokeWidth: tool === 'highlighter' ? currentStrokeWidth * 2 : currentStrokeWidth,
                    opacity: tool === 'highlighter' ? 0.4 : 1.0,
                };
                const newPaths = [...paths, newPathWithColor];
                setUndoStack((prev) => [...prev, paths]);
                setPaths(newPaths);
                setRedoStack([]);
                setCurrentPath(null);
            }
        });

    const handleUndo = () => {
        if (undoStack.length > 0) {
            const previousPaths = undoStack[undoStack.length - 1];
            setRedoStack((prev) => [...prev, paths]);
            setPaths(previousPaths);
            setUndoStack((prev) => prev.slice(0, -1));
        }
    };

    const handleRedo = () => {
        if (redoStack.length > 0) {
            const nextPaths = redoStack[redoStack.length - 1];
            setUndoStack((prev) => [...prev, paths]);
            setPaths(nextPaths);
            setRedoStack((prev) => prev.slice(0, -1));
        }
    };

    const handleSave = () => {
        if (!appState) return;
        appState.updateNote(note.id, { title });
    };

    return (
        <BaseNoteEditor note={note} onSave={handleSave} showToolbar={false}>
            <View style={styles.container}>
                {/* Sliding Title */}
                <RNAnimated.View style={[styles.titleContainer, { transform: [{ translateY: titleAnim }], backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Untitled Drawing"
                        placeholderTextColor={colors.mutedForeground + '80'}
                        style={[styles.titleInput, { color: colors.text }]}
                    />
                </RNAnimated.View>

                {/* Full Screen Canvas Area */}
                <TouchableOpacity 
                    activeOpacity={1} 
                    style={styles.canvasArea} 
                    onPress={() => setShowTitle(!showTitle)}
                >
                    <GestureDetector gesture={pan}>
                        <Canvas style={styles.canvas}>
                            {paths.map((p, index) => (
                                <Path
                                    key={index}
                                    path={p.path}
                                    color={p.color}
                                    style="stroke"
                                    strokeWidth={p.strokeWidth}
                                    strokeCap="round"
                                    strokeJoin="round"
                                    opacity={p.opacity}
                                />
                            ))}
                            {currentPath && (
                                <Path
                                    path={currentPath}
                                    color={tool === 'eraser' ? colors.background : currentColor}
                                    style="stroke"
                                    strokeWidth={tool === 'highlighter' ? currentStrokeWidth * 2 : currentStrokeWidth}
                                    strokeCap="round"
                                    strokeJoin="round"
                                    opacity={tool === 'highlighter' ? 0.4 : 1.0}
                                />
                            )}
                        </Canvas>
                    </GestureDetector>
                </TouchableOpacity>

                {/* Drawing Toolbar */}
                <View style={[styles.toolbar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <View style={styles.toolRow}>
                        <TouchableOpacity 
                            style={[styles.toolButton, tool === 'pen' && { backgroundColor: colors.primary + '20' }]}
                            onPress={() => setTool('pen')}
                        >
                            <Ionicons name="brush" size={24} color={tool === 'pen' ? colors.primary : colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.toolButton, tool === 'highlighter' && { backgroundColor: colors.primary + '20' }]}
                            onPress={() => setTool('highlighter')}
                        >
                            <Ionicons name="pencil" size={24} color={tool === 'highlighter' ? colors.primary : colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.toolButton, tool === 'eraser' && { backgroundColor: colors.primary + '20' }]}
                            onPress={() => setTool('eraser')}
                        >
                            <Ionicons name="remove-circle-outline" size={24} color={tool === 'eraser' ? colors.primary : colors.text} />
                        </TouchableOpacity>
                        
                        <View style={styles.divider} />
                        
                        <TouchableOpacity style={styles.toolButton} onPress={handleUndo} disabled={undoStack.length === 0}>
                            <Ionicons name="arrow-undo" size={24} color={undoStack.length > 0 ? colors.text : colors.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolButton} onPress={handleRedo} disabled={redoStack.length === 0}>
                            <Ionicons name="arrow-redo" size={24} color={redoStack.length > 0 ? colors.text : colors.muted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.optionsRow}>
                        <View style={styles.colorPalette}>
                            {COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: color },
                                        currentColor === color && tool !== 'eraser' && { borderColor: colors.primary, borderWidth: 2 },
                                    ]}
                                    onPress={() => {
                                        setCurrentColor(color);
                                        if (tool === 'eraser') setTool('pen');
                                    }}
                                />
                            ))}
                        </View>
                        
                        <View style={styles.widthPicker}>
                            {STROKE_WIDTHS.map((sw) => (
                                <TouchableOpacity
                                    key={sw}
                                    style={[
                                        styles.widthButton,
                                        currentStrokeWidth === sw && { backgroundColor: colors.muted }
                                    ]}
                                    onPress={() => setCurrentStrokeWidth(sw)}
                                >
                                    <View style={[styles.widthDot, { width: sw / 2 + 4, height: sw / 2 + 4, borderRadius: (sw / 2 + 4) / 2, backgroundColor: colors.text }]} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </View>
        </BaseNoteEditor>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    titleContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    titleInput: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        paddingHorizontal: 20,
        borderWidth: 0,
        outlineStyle: 'none' as any,
    },
    canvasArea: {
        flex: 1,
    },
    canvas: {
        flex: 1,
    },
    toolbar: {
        paddingBottom: 30,
        paddingTop: 15,
        paddingHorizontal: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 15,
    },
    toolRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toolButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginHorizontal: 5,
    },
    optionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    colorPalette: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        flex: 1,
    },
    colorCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    widthPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    widthButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    widthDot: {
        backgroundColor: '#000',
    },
});