import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ImageNote } from '@/types/note';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useContext, useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { BaseNoteEditor } from './BaseNoteEditor';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

interface ImageEditorProps {
    note: ImageNote;
}

export function ImageEditor({ note }: ImageEditorProps) {
    const appState = useContext(AppStateContext);
    const colors = useThemeColors();
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [images, setImages] = useState(note.images || []);

    useEffect(() => {
        setTitle(note.title);
        setContent(note.content);
        setImages(note.images || []);
    }, [note.id]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled) {
            const newImages = result.assets.map((asset) => ({
                uri: asset.uri,
                caption: '',
            }));
            const updatedImages = [...images, ...newImages];
            setImages(updatedImages);
            appState?.updateNote(note.id, { images: updatedImages });
        }
    };

    const takePhoto = async () => {
        const result = await ImagePicker.launchCameraAsync({
            quality: 1,
        });

        if (!result.canceled) {
            const newImage = {
                uri: result.assets[0].uri,
                caption: '',
            };
            const updatedImages = [...images, newImage];
            setImages(updatedImages);
            appState?.updateNote(note.id, { images: updatedImages });
        }
    };

    const updateCaption = (index: number, caption: string) => {
        const updatedImages = [...images];
        updatedImages[index].caption = caption;
        setImages(updatedImages);
        appState?.updateNote(note.id, { images: updatedImages });
    };

    const removeImage = (index: number) => {
        const updatedImages = images.filter((_, i) => i !== index);
        setImages(updatedImages);
        appState?.updateNote(note.id, { images: updatedImages });
    };

    const moveImage = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= images.length) return;
        const updatedImages = [...images];
        const [movedImage] = updatedImages.splice(fromIndex, 1);
        updatedImages.splice(toIndex, 0, movedImage);
        setImages(updatedImages);
        appState?.updateNote(note.id, { images: updatedImages });
    };

    const handleSave = () => {
        if (!appState) return;
        appState.updateNote(note.id, { title, content, images });
    };

    return (
        <BaseNoteEditor note={note} onSave={handleSave} showToolbar={false}>
            <View style={styles.container}>
                <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Title"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    style={[styles.titleInput, { color: colors.text }]}
                />

                <View style={styles.imageGrid}>
                    {images.map((item, index) => (
                        <View key={index} style={[styles.imageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Image source={{ uri: item.uri }} style={styles.image} contentFit="cover" />
                            <View style={styles.imageOverlay}>
                                <TouchableOpacity 
                                    style={[styles.overlayButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                                    onPress={() => removeImage(index)}
                                >
                                    <Ionicons name="close" size={16} color="white" />
                                </TouchableOpacity>
                                {index > 0 && (
                                    <TouchableOpacity 
                                        style={[styles.overlayButton, { backgroundColor: 'rgba(0,0,0,0.5)', marginTop: 4 }]}
                                        onPress={() => moveImage(index, index - 1)}
                                    >
                                        <Ionicons name="chevron-back" size={16} color="white" />
                                    </TouchableOpacity>
                                )}
                                {index < images.length - 1 && (
                                    <TouchableOpacity 
                                        style={[styles.overlayButton, { backgroundColor: 'rgba(0,0,0,0.5)', marginTop: 4 }]}
                                        onPress={() => moveImage(index, index + 1)}
                                    >
                                        <Ionicons name="chevron-forward" size={16} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TextInput
                                value={item.caption}
                                onChangeText={(text) => updateCaption(index, text)}
                                placeholder="Add caption..."
                                placeholderTextColor={colors.mutedForeground + '60'}
                                style={[styles.imageCaption, { color: colors.text, borderTopColor: colors.border }]}
                            />
                        </View>
                    ))}
                    
                    <TouchableOpacity 
                        style={[styles.addPlaceholder, { backgroundColor: colors.muted, borderColor: colors.border }]} 
                        onPress={pickImage}
                    >
                        <Ionicons name="add" size={32} color={colors.primary} />
                        <Text style={[styles.addPlaceholderText, { color: colors.primary }]}>Add Image</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.quickActions}>
                    <TouchableOpacity onPress={takePhoto} style={styles.quickActionButton}>
                        <Ionicons name="camera-outline" size={20} color={colors.primary} />
                        <Text style={[styles.quickActionText, { color: colors.primary }]}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickImage} style={styles.quickActionButton}>
                        <Ionicons name="images-outline" size={20} color={colors.primary} />
                        <Text style={[styles.quickActionText, { color: colors.primary }]}>Gallery</Text>
                    </TouchableOpacity>
                </View>

                <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder="Add more context..."
                    placeholderTextColor={colors.mutedForeground + '60'}
                    style={[styles.contentInput, { color: colors.text }]}
                    multiline
                    textAlignVertical="top"
                />
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
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 20,
        padding: 0,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
        marginBottom: 20,
    },
    imageCard: {
        width: COLUMN_WIDTH,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    image: {
        width: '100%',
        aspectRatio: 1,
    },
    imageOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        alignItems: 'center',
    },
    overlayButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCaption: {
        padding: 8,
        fontSize: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    addPlaceholder: {
        width: COLUMN_WIDTH,
        aspectRatio: 1,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    addPlaceholderText: {
        fontSize: 12,
        fontWeight: '600',
    },
    quickActions: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    quickActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    contentInput: {
        fontSize: 16,
        lineHeight: 24,
        padding: 0,
        minHeight: 150,
    },
});