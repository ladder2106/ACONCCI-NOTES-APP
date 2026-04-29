 import { useThemeColors } from "@/hooks/useThemeColors";
import { useTypography } from "@/hooks/useTypography";
import { NOTE_TYPE_COLORS, NOTE_TYPE_ICONS, Note } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface NoteTypeSelectorProps {
  onClose: () => void;
  onSelectNoteType: (noteType?: Note["type"]) => void;
}

// All note types with their descriptions
const NOTE_TYPES = [
  {
    type: "plain_text",
    title: "Plain Text",
    description: "Clean, minimal text editor with word count",
    icon: NOTE_TYPE_ICONS.plain_text,
    accentColor: NOTE_TYPE_COLORS.plain_text,
    gradientBg: "#EFF6FF",
  },
  {
    type: "voice",
    title: "Voice Note",
    description: "Record audio with playback controls",
    icon: NOTE_TYPE_ICONS.voice,
    accentColor: NOTE_TYPE_COLORS.voice,
    gradientBg: "#D1FAE5",
  },
  {
    type: "image",
    title: "Image Note",
    description: "Add multiple images with captions",
    icon: NOTE_TYPE_ICONS.image,
    accentColor: NOTE_TYPE_COLORS.image,
    gradientBg: "#FFF7ED",
  },
  {
    type: "video",
    title: "Video Note",
    description: "Record or upload video content",
    icon: NOTE_TYPE_ICONS.video,
    accentColor: NOTE_TYPE_COLORS.video,
    gradientBg: "#FFF1F2",
  },
  {
    type: "drawing",
    title: "Drawing Note",
    description: "Handwritten notes with drawing tools",
    icon: NOTE_TYPE_ICONS.drawing,
    accentColor: NOTE_TYPE_COLORS.drawing,
    gradientBg: "#F5F3FF",
  },
  {
    type: "checklist",
    title: "Checklist",
    description: "Interactive task list with progress tracking",
    icon: NOTE_TYPE_ICONS.checklist,
    accentColor: NOTE_TYPE_COLORS.checklist,
    gradientBg: "#F0FDFA",
  },
  {
    type: "journal",
    title: "Journal",
    description: "Daily diary with mood and weather tracking",
    icon: NOTE_TYPE_ICONS.journal,
    accentColor: NOTE_TYPE_COLORS.journal,
    gradientBg: "#EEF2FF",
  },
  {
    type: "reminder",
    title: "Reminder",
    description: "Schedule tasks with notifications",
    icon: NOTE_TYPE_ICONS.reminder,
    accentColor: NOTE_TYPE_COLORS.reminder,
    gradientBg: "#FFF7ED",
  },
  {
    type: "vault",
    title: "Vault",
    description: "Secure notes with biometric protection",
    icon: NOTE_TYPE_ICONS.vault,
    accentColor: NOTE_TYPE_COLORS.vault,
    gradientBg: "#E0F2FE",
  },
  {
    type: "sticky",
    title: "Sticky Note",
    description: "Visual notes with background colors",
    icon: NOTE_TYPE_ICONS.sticky,
    accentColor: NOTE_TYPE_COLORS.sticky,
    gradientBg: "#FEFCE8",
  },
];

export function NoteTypeSelector({
  onSelectNoteType,
  onClose,
}: NoteTypeSelectorProps) {
  const colors = useThemeColors();
  const { typography } = useTypography();

  const handleSelect = (type: Note["type"]) => {
    onSelectNoteType(type);
    onClose();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[typography.h3, { color: colors.text }]}>New Note</Text>
          <Text
            style={[typography.bodySmall, { color: colors.mutedForeground }]}
          >
            Select a type to get started
          </Text>
        </View>
      </View>

      {/* Note type grid - scrollable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.grid}>
          {NOTE_TYPES.map((noteType) => (
            <TouchableOpacity
              key={noteType.type}
              style={[
                styles.typeCard,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              onPress={() => handleSelect(noteType.type as Note["type"])}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: noteType.gradientBg },
                ]}
              >
                <Ionicons
                  name={noteType.icon as any}
                  size={22}
                  color={noteType.accentColor}
                />
              </View>

              <Text style={[typography.h4, { color: colors.text }]}>
                {noteType.title}
              </Text>
              <Text
                style={[typography.caption, { color: colors.mutedForeground }]}
                numberOfLines={2}
              >
                {noteType.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Cancel */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onClose}
        activeOpacity={0.6}
      >
        <Ionicons name="close" size={18} color={colors.mutedForeground} />
        <Text
          style={[typography.buttonSmall, { color: colors.mutedForeground }]}
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    maxHeight: screenHeight * 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeCard: {
    width: "47%",
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.8,
  },
  cancelButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 12,
    gap: 6,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
