import { AppStateContext } from "@/context/AppStateContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { ReminderNote } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    Platform,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BaseNoteEditor } from "./BaseNoteEditor";

interface ReminderEditorProps {
  note: ReminderNote;
}

const PRIORITY_OPTIONS = [
  { key: "low", label: "Low", color: "#10B981" },
  { key: "medium", label: "Medium", color: "#F59E0B" },
  { key: "high", label: "High", color: "#EF4444" },
];

const REPEAT_OPTIONS = [
  { key: "once", label: "Once" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

export function ReminderEditor({ note }: ReminderEditorProps) {
  const appState = useContext(AppStateContext);
  const colors = useThemeColors();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [dueDate, setDueDate] = useState(
    note.dueDate ? new Date(note.dueDate) : new Date(),
  );
  const [dueTime, setDueTime] = useState(
    note.dueTime ? new Date(`2000-01-01T${note.dueTime}`) : new Date(),
  );
  const [repeat, setRepeat] = useState(note.repeat || "once");
  const [priority, setPriority] = useState(note.priority || "medium");
  const [notify, setNotify] = useState(note.notify !== false);

  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === "ios");
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === "ios");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    if (note.dueDate) setDueDate(new Date(note.dueDate));
    if (note.dueTime) setDueTime(new Date(`2000-01-01T${note.dueTime}`));
    setRepeat(note.repeat || "once");
    setPriority(note.priority || "medium");
    setNotify(note.notify !== false);
  }, [note.id]);

  const handleSave = () => {
    if (!appState) return;
    const formattedDate = dueDate.toISOString().split("T")[0];
    const formattedTime = `${dueTime.getHours().toString().padStart(2, "0")}:${dueTime.getMinutes().toString().padStart(2, "0")}`;

    appState.updateNote(note.id, {
      title,
      content,
      dueDate: formattedDate,
      dueTime: formattedTime,
      repeat,
      priority,
      notify,
    });
  };

  const calculateTimeRemaining = useCallback(() => {
    const now = currentTime;
    const reminderDateTime = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
      dueTime.getHours(),
      dueTime.getMinutes(),
    );

    if (reminderDateTime <= now) return "Past due";

    const diff = reminderDateTime.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  }, [dueDate, dueTime, currentTime]);

  return (
    <BaseNoteEditor note={note} onSave={handleSave} showToolbar={false}>
      <View style={styles.container}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What needs to be done?"
          placeholderTextColor={colors.mutedForeground + "80"}
          style={[styles.titleInput, { color: colors.text }]}
        />

        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Add more details..."
          placeholderTextColor={colors.mutedForeground + "60"}
          style={[styles.descriptionInput, { color: colors.text }]}
          multiline
        />

        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            DUE DATE & TIME
          </Text>

          <View style={styles.pickerContainer}>
            <View style={styles.pickerRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.pickerLabel, { color: colors.text }]}>
                Date
              </Text>
              {Platform.OS === "android" && (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[
                    styles.androidPicker,
                    { backgroundColor: colors.muted },
                  ]}
                >
                  <Text style={{ color: colors.text }}>
                    {dueDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              )}
              {(showDatePicker || Platform.OS === "ios") && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "default" : "default"}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (date) setDueDate(date);
                  }}
                  style={styles.datePicker}
                />
              )}
            </View>

            <View style={styles.pickerRow}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.pickerLabel, { color: colors.text }]}>
                Time
              </Text>
              {Platform.OS === "android" && (
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  style={[
                    styles.androidPicker,
                    { backgroundColor: colors.muted },
                  ]}
                >
                  <Text style={{ color: colors.text }}>
                    {dueTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </TouchableOpacity>
              )}
              {(showTimePicker || Platform.OS === "ios") && (
                <DateTimePicker
                  value={dueTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, date) => {
                    setShowTimePicker(Platform.OS === "ios");
                    if (date) setDueTime(date);
                  }}
                  style={styles.timePicker}
                />
              )}
            </View>
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            REPEAT
          </Text>
          <View style={styles.optionsRow}>
            {REPEAT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.optionTag,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  repeat === opt.key && {
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setRepeat(opt.key as any)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: repeat === opt.key ? colors.primary : colors.text,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            PRIORITY
          </Text>
          <View style={styles.optionsRow}>
            {PRIORITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.optionTag,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  priority === opt.key && {
                    backgroundColor: opt.color + "20",
                    borderColor: opt.color,
                  },
                ]}
                onPress={() => setPriority(opt.key as any)}
              >
                <View
                  style={[styles.priorityDot, { backgroundColor: opt.color }]}
                />
                <Text
                  style={[
                    styles.optionText,
                    { color: priority === opt.key ? opt.color : colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.section,
            styles.switchRow,
            { borderTopColor: colors.border },
          ]}
        >
          <View>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.mutedForeground, marginBottom: 4 },
              ]}
            >
              NOTIFICATIONS
            </Text>
            <Text
              style={[styles.switchSubtext, { color: colors.mutedForeground }]}
            >
              Get alerted when it's time
            </Text>
          </View>
          <Switch
            value={notify}
            onValueChange={setNotify}
            trackColor={{ false: colors.border, true: colors.primary + "80" }}
            thumbColor={notify ? colors.primary : "#f4f3f4"}
          />
        </View>

        <View
          style={[
            styles.countdownContainer,
            { backgroundColor: colors.primary + "10" },
          ]}
        >
          <Ionicons name="timer-outline" size={24} color={colors.primary} />
          <Text style={[styles.countdownText, { color: colors.primary }]}>
            {calculateTimeRemaining()}
          </Text>
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
  titleInput: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    padding: 0,
    borderWidth: 0,
    outlineStyle: 'none' as any,
  },
  descriptionInput: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    padding: 0,
    borderWidth: 0,
    outlineStyle: 'none' as any,
  },
  section: {
    paddingVertical: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 15,
  },
  pickerContainer: {
    gap: 15,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  datePicker: {
    width: 120,
  },
  timePicker: {
    width: 100,
  },
  androidPicker: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchSubtext: {
    fontSize: 12,
  },
  countdownContainer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
