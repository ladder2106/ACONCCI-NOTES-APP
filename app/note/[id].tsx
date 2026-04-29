import { AppStateContext } from "@/context/AppStateContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext } from "react";
import {
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// Import specialized editors
import { ChecklistEditor } from "@/components/notes/ChecklistEditor";
import { DrawingEditor } from "@/components/notes/DrawingEditor";
import { GenericEditor } from "@/components/notes/GenericEditor";
import { ImageEditor } from "@/components/notes/ImageEditor";
import { JournalEditor } from "@/components/notes/JournalEditor";
import { PlainTextEditor } from "@/components/notes/PlainTextEditor";
import { ReminderEditor } from "@/components/notes/ReminderEditor";
import { VideoEditor } from "@/components/notes/VideoEditor";
import { VoiceEditor } from "@/components/notes/VoiceEditor";

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appState = useContext(AppStateContext);
  const colors = useThemeColors();
  const router = useRouter();

  if (!appState) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centerContent}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const note = appState.notes.find((n) => n.id === id);

  if (!note) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Animated.View
          entering={Platform.OS === 'web' ? undefined : FadeInDown.duration(400)}
          style={styles.centerContent}
        >
          <Ionicons
            name="document-text-outline"
            size={48}
            color={colors.mutedForeground}
          />
          <Text
            style={[styles.notFoundText, { color: colors.mutedForeground }]}
          >
            Note not found
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text
              style={{
                color: colors.primary,
                marginTop: 12,
                fontWeight: "600",
              }}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Select the appropriate editor based on note type
  const renderEditor = () => {
    switch (note.type) {
      case "plain_text":
        return <PlainTextEditor note={note as any} />;
      case "voice":
        return <VoiceEditor note={note as any} />;
      case "image":
        return <ImageEditor note={note as any} />;
      case "video":
        return <VideoEditor note={note as any} />;
      case "drawing":
        return <DrawingEditor note={note as any} />;
      case "checklist":
        return <ChecklistEditor note={note as any} />;
      case "journal":
        return <JournalEditor note={note as any} />;
      case "reminder":
        return <ReminderEditor note={note as any} />;
      case "vault":
      case "sticky":
      default:
        return <GenericEditor note={note as any} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {renderEditor()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
  },
});
