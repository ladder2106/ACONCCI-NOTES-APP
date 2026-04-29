import { AppStateContext } from "@/context/AppStateContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { VoiceNote } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { BaseNoteEditor } from "./BaseNoteEditor";

const { width } = Dimensions.get("window");

interface VoiceEditorProps {
  note: VoiceNote;
}

const WaveformBar = ({ active, color }: { active: boolean; color: string }) => {
  const height = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (active) {
      const animate = () => {
        Animated.sequence([
          Animated.timing(height, {
            toValue: 10 + Math.random() * 40,
            duration: 100 + Math.random() * 100,
            useNativeDriver: false,
          }),
          Animated.timing(height, {
            toValue: 10,
            duration: 100 + Math.random() * 100,
            useNativeDriver: false,
          }),
        ]).start(() => {
          if (active) animate();
        });
      };
      animate();
    } else {
      height.setValue(10);
    }
  }, [active]);

  return (
    <Animated.View
      style={[styles.waveformBar, { height, backgroundColor: color }]}
    />
  );
};

export function VoiceEditor({ note }: VoiceEditorProps) {
  const appState = useContext(AppStateContext);
  const colors = useThemeColors();
  const [title, setTitle] = useState(note.title);
  const [caption, setCaption] = useState(note.caption || "");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTitle(note.title);
    setCaption(note.caption || "");
    setDuration(note.duration || 0);

    return () => {
      if (recording) recording.stopAndUnloadAsync();
      if (sound) sound.unloadAsync();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [note.id]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(recording);
      setIsRecording(true);
      setDuration(0);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (appState && uri) {
      appState.updateNote(note.id, {
        audioUrl: uri,
        duration: duration,
      });
    }
  };

  const playSound = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
      return;
    }

    if (note.audioUrl) {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: note.audioUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate,
      );
      setSound(newSound);
      setIsPlaying(true);
    }
  };

  const pauseSound = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
        sound?.setPositionAsync(0);
      }
    }
  };

  const handleScrub = async (event: any) => {
    if (!sound || !playbackDuration) return;
    const { x } = event.nativeEvent;
    const progress = Math.max(0, Math.min(1, x / (width - 100)));
    const newPosition = progress * playbackDuration;
    await sound.setPositionAsync(newPosition);
    setPlaybackPosition(newPosition);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSave = () => {
    if (!appState) return;
    appState.updateNote(note.id, { title, caption });
  };

  return (
    <BaseNoteEditor note={note} onSave={handleSave} showToolbar={false}>
      <View style={styles.container}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={colors.mutedForeground + "80"}
          style={[styles.titleInput, { color: colors.text }]}
        />

        <View style={styles.recorderSection}>
          {!note.audioUrl && !isRecording ? (
            <View style={styles.recordContainer}>
              <TouchableOpacity
                onPress={startRecording}
                style={[
                  styles.recordButton,
                  { backgroundColor: colors.destructive },
                ]}
              >
                <Ionicons name="mic" size={40} color="white" />
              </TouchableOpacity>
              <Text
                style={[styles.recordLabel, { color: colors.mutedForeground }]}
              >
                Tap to record
              </Text>
            </View>
          ) : isRecording ? (
            <View style={styles.recordingContainer}>
              <View style={styles.waveformContainer}>
                {[...Array(12)].map((_, i) => (
                  <WaveformBar
                    key={i}
                    active={isRecording}
                    color={colors.destructive}
                  />
                ))}
              </View>
              <Animated.View
                style={[
                  styles.pulse,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: colors.destructive + "40",
                  },
                ]}
              />
              <TouchableOpacity
                onPress={stopRecording}
                style={[
                  styles.recordButton,
                  { backgroundColor: colors.destructive },
                ]}
              >
                <Ionicons name="stop" size={40} color="white" />
              </TouchableOpacity>
              <Text style={[styles.timer, { color: colors.text }]}>
                {formatTime(duration)}
              </Text>
              <Text
                style={[styles.recordingLabel, { color: colors.destructive }]}
              >
                Recording...
              </Text>
            </View>
          ) : (
            <View style={styles.playbackContainer}>
              <View
                style={[
                  styles.audioBar,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={isPlaying ? pauseSound : playSound}
                  style={styles.playButton}
                >
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={32}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                  <PanGestureHandler
                    onGestureEvent={handleScrub}
                    onHandlerStateChange={(e) => {
                      if (e.nativeEvent.state === State.BEGAN) pauseSound();
                      if (e.nativeEvent.state === State.END) playSound();
                    }}
                  >
                    <View style={styles.scrubberArea}>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: colors.border },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: colors.primary,
                              width: playbackDuration
                                ? `${(playbackPosition / playbackDuration) * 100}%`
                                : "0%",
                            },
                          ]}
                        />
                      </View>
                      <View
                        style={[
                          styles.scrubberThumb,
                          {
                            backgroundColor: colors.primary,
                            left: playbackDuration
                              ? `${(playbackPosition / playbackDuration) * 100}%`
                              : "0%",
                          },
                        ]}
                      />
                    </View>
                  </PanGestureHandler>
                  <View style={styles.timeLabels}>
                    <Text
                      style={[
                        styles.timeText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {formatTime(Math.floor(playbackPosition / 1000))}
                    </Text>
                    <Text
                      style={[
                        styles.timeText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {formatTime(duration)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    appState?.updateNote(note.id, {
                      audioUrl: null,
                      duration: 0,
                    })
                  }
                  style={styles.deleteButton}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.destructive}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Add a caption..."
          placeholderTextColor={colors.mutedForeground + "60"}
          style={[styles.captionInput, { color: colors.text }]}
          multiline
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
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    padding: 0,
    borderWidth: 0,
    outlineStyle: 'none' as any,
  },
  transcriptInput: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    padding: 0,
    borderWidth: 0,
    outlineStyle: 'none' as any,
  },
  recorderSection: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  recordContainer: {
    alignItems: "center",
  },
  recordLabel: {
    marginTop: 15,
    fontSize: 16,
  },
  recordingContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pulse: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    zIndex: 1,
  },
  waveformContainer: {
    flexDirection: "row",
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  waveformBar: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  timer: {
    fontSize: 32,
    fontWeight: "600",
    marginTop: 20,
  },
  recordingLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 5,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  playbackContainer: {
    width: "100%",
  },
  audioBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 16,
  },
  playButton: {
    marginRight: 10,
  },
  progressContainer: {
    flex: 1,
  },
  scrubberArea: {
    height: 30,
    justifyContent: "center",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  scrubberThumb: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    top: 8,
    marginLeft: -7,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -5,
  },
  timeText: {
    fontSize: 11,
  },
  deleteButton: {
    marginLeft: 10,
    padding: 5,
  },
  captionInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
    textAlignVertical: "top",
    padding: 0,
  },
});
