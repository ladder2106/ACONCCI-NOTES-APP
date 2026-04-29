import { AppStateContext } from '@/context/AppStateContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { VideoNote } from '@/types/note';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useContext, useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { BaseNoteEditor } from './BaseNoteEditor';

interface VideoEditorProps {
    note: VideoNote;
}

export function VideoEditor({ note }: VideoEditorProps) {
    const appState = useContext(AppStateContext);
    const colors = useThemeColors();
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [videoUrl, setVideoUrl] = useState(note.videoUrl);
    const [coverImage, setCoverImage] = useState(note.coverImage);
    const [isPlaying, setIsPlaying] = useState(false);

    const player = useVideoPlayer(videoUrl || '', (player) => {
        player.loop = false;
    });

    useEffect(() => {
        setTitle(note.title);
        setContent(note.content);
        setVideoUrl(note.videoUrl);
        setCoverImage(note.coverImage);
    }, [note.id]);

    const pickVideo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setVideoUrl(uri);
            appState?.updateNote(note.id, { videoUrl: uri });
        }
    };

    const pickCoverImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setCoverImage(uri);
            appState?.updateNote(note.id, { coverImage: uri });
        }
    };

    const handleSave = () => {
        if (!appState) return;
        appState.updateNote(note.id, { title, content, videoUrl, coverImage });
    };

    const togglePlay = () => {
        if (isPlaying) {
            player.pause();
        } else {
            player.play();
        }
        setIsPlaying(!isPlaying);
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

                <View style={styles.videoSection}>
                    {videoUrl ? (
                        <View style={[styles.videoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            {!isPlaying && coverImage ? (
                                <View style={styles.thumbnailContainer}>
                                    <Image source={{ uri: coverImage }} style={styles.video} contentFit="cover" />
                                    <TouchableOpacity style={styles.playOverlay} onPress={togglePlay}>
                                        <View style={[styles.playButtonCircle, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                                            <Ionicons name="play" size={48} color="white" style={{ marginLeft: 5 }} />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <VideoView 
                                    player={player} 
                                    style={styles.video} 
                                    nativeControls={true}
                                />
                            )}
                            <TouchableOpacity 
                                style={[styles.removeButton, { backgroundColor: colors.destructive }]}
                                onPress={() => {
                                    setVideoUrl(null);
                                    appState?.updateNote(note.id, { videoUrl: null });
                                }}
                            >
                                <Ionicons name="close" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.addButton, { backgroundColor: colors.muted }]} 
                            onPress={pickVideo}
                        >
                            <Ionicons name="videocam" size={40} color={colors.primary} />
                            <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Video</Text>
                        </TouchableOpacity>
                    )}

                    {videoUrl && (
                        <TouchableOpacity 
                            style={[styles.coverPicker, { backgroundColor: colors.muted }]} 
                            onPress={pickCoverImage}
                        >
                            {coverImage ? (
                                <View style={styles.coverImageContainer}>
                                    <Image source={{ uri: coverImage }} style={styles.coverImage} contentFit="cover" />
                                    <View style={styles.coverBadge}>
                                        <Text style={styles.coverBadgeText}>Cover</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.coverPlaceholder}>
                                    <Ionicons name="image-outline" size={24} color={colors.primary} />
                                    <Text style={[styles.coverText, { color: colors.primary }]}>Add Cover Thumbnail</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder="Add description..."
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
    videoSection: {
        gap: 20,
        marginBottom: 20,
    },
    videoCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    video: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    thumbnailContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButtonCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    addButton: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    coverPicker: {
        height: 120,
        borderRadius: 16,
        overflow: 'hidden',
    },
    coverImageContainer: {
        flex: 1,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    coverBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    coverPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    coverText: {
        fontSize: 14,
        fontWeight: '600',
    },
    contentInput: {
        fontSize: 16,
        lineHeight: 24,
        padding: 0,
        minHeight: 100,
    },
});