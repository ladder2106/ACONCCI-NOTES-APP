import { AppStateContext } from "@/context/AppStateContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { JOURNAL_MOODS, JournalNote } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BaseNoteEditor } from "./BaseNoteEditor";

interface JournalEditorProps {
  note: JournalNote;
}

const WEATHER_OPTIONS = [
  { icon: "sunny", label: "Sunny" },
  { icon: "cloudy", label: "Cloudy" },
  { icon: "rainy", label: "Rainy" },
  { icon: "thunderstorm", label: "Stormy" },
  { icon: "snow", label: "Snowy" },
  { icon: "partly-sunny", label: "Partly Sunny" },
];

export function JournalEditor({ note }: JournalEditorProps) {
  const appState = useContext(AppStateContext);
  const colors = useThemeColors();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [mood, setMood] = useState(note.moodEmoji || "Neutral");
  const [weather, setWeather] = useState(note.weather || "Sunny");

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setMood(note.moodEmoji || "Neutral");
    setWeather(note.weather || "Sunny");
  }, [note.id]);

  const handleSave = () => {
    if (!appState) return;
    appState.updateNote(note.id, {
      title,
      content,
      moodEmoji: mood as any,
      weather,
      wordCount,
      entryDate: today,
    });
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const renderLines = () => {
    const lines = [];
    for (let i = 0; i < 30; i++) {
      lines.push(
        <View
          key={i}
          style={[
            styles.line,
            { borderBottomColor: colors.border, top: (i + 1) * 32 + 20 },
          ]}
        />,
      );
    }
    return lines;
  };

  return (
    <BaseNoteEditor note={note} onSave={handleSave} showToolbar={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.dateText, { color: colors.primary }]}>
            {today}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="My Daily Thoughts"
            placeholderTextColor={colors.mutedForeground + "60"}
            style={[styles.titleInput, { color: colors.text }]}
          />
        </View>

        <View style={styles.selectorSection}>
          <Text
            style={[styles.selectorTitle, { color: colors.mutedForeground }]}
          >
            How are you feeling today?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodList}
          >
            {Object.entries(JOURNAL_MOODS).map(([label, emoji]) => (
              <TouchableOpacity
                key={label}
                style={[
                  styles.moodItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  mood === label && {
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.primary,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setMood(label as any)}
              >
                <Text style={styles.moodEmoji}>{emoji}</Text>
                <Text style={[styles.moodLabel, { color: colors.text }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.selectorSection}>
          <Text
            style={[styles.selectorTitle, { color: colors.mutedForeground }]}
          >
            Weather check
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weatherList}
          >
            {WEATHER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={[
                  styles.weatherItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  weather === opt.label && {
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.primary,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setWeather(opt.label)}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={20}
                  color={
                    weather === opt.label
                      ? colors.primary
                      : colors.mutedForeground
                  }
                />
                <Text style={[styles.weatherLabel, { color: colors.text }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View
          style={[
            styles.paperArea,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.linesContainer}>{renderLines()}</View>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Dear Diary..."
            placeholderTextColor={colors.mutedForeground + "40"}
            style={[styles.contentInput, { color: colors.text }]}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.footerStats}>
          <View style={[styles.statsBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.statsText, { color: colors.mutedForeground }]}>
              {wordCount} words
            </Text>
          </View>
        </View>
      </View>
    </BaseNoteEditor>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  titleInput: {
    fontSize: 34,
    fontWeight: "800",
    padding: 0,
    letterSpacing: -0.5,
  },
  selectorSection: {
    marginBottom: 24,
  },
  selectorTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    opacity: 0.7,
  },
  moodList: {
    gap: 12,
    paddingRight: 20,
    paddingBottom: 4,
  },
  moodItem: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 70,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  moodEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  weatherList: {
    gap: 10,
    paddingRight: 20,
    paddingBottom: 4,
  },
  weatherItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    gap: 6,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  weatherLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  paperArea: {
    flex: 1,
    minHeight: 500,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  linesContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  line: {
    position: "absolute",
    left: 20,
    right: 20,
    borderBottomWidth: 1,
    opacity: 0.1,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
    paddingTop: 12,
    padding: 0,
    borderWidth: 0,
    outlineStyle: 'none' as any,
  },
  footerStats: {
    alignItems: "flex-end",
    paddingBottom: 10,
  },
  statsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
