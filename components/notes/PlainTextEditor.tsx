import { NoteTagPicker } from "@/components/NoteTagPicker";
import { AnimatedLottieIcon } from "@/components/ui/AnimatedLottieIcon";
import { AppStateContext } from "@/context/AppStateContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { PlainTextNote } from "@/types/note";
import {
  DEFAULT_TOOLBAR_ITEMS,
  RichText,
  Toolbar,
  useBridgeState,
  useEditorBridge,
} from "@10play/tentap-editor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const backAnimation = require("react-useanimations/lib/arrowLeftCircle/arrowLeftCircle.json");
const menuAnimation = require("react-useanimations/lib/menu2/menu2.json");
const bookmarkAnimation = require("react-useanimations/lib/bookmark/bookmark.json");
const lockAnimation = require("react-useanimations/lib/lock/lock.json");
const shareAnimation = require("react-useanimations/lib/share/share.json");
const trashAnimation = require("react-useanimations/lib/trash/trash.json");
const folderAnimation = require("react-useanimations/lib/folder/folder.json");

const PLAIN_NOTE_TOOLBAR_ITEMS = [
  DEFAULT_TOOLBAR_ITEMS[0],
  DEFAULT_TOOLBAR_ITEMS[1],
  DEFAULT_TOOLBAR_ITEMS[6],
  DEFAULT_TOOLBAR_ITEMS[7],
];

function getWordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function formatCurrentDate(now: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(now);
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toInitialHtml(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "<p></p>";
  }

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return value;
  }

  const paragraphs = value
    .split(/\n{2,}/)
    .map((paragraph) =>
      `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  return paragraphs || "<p></p>";
}

export function PlainTextEditor({ note }: { note: PlainTextNote }) {
  const appState = useContext(AppStateContext);
  const colors = useThemeColors();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [title, setTitle] = useState(note.title);
  const [contentHtml, setContentHtml] = useState(() => toInitialHtml(note.content));
  const [plainTextContent, setPlainTextContent] = useState(() => stripHtml(note.content));
  const [now, setNow] = useState(() => new Date());
  const [showMenu, setShowMenu] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [redundantSaveTapCount, setRedundantSaveTapCount] = useState(0);
  const [lastRedundantSaveAt, setLastRedundantSaveAt] = useState<number | null>(null);
  const scheduleSnapshotRef = useRef<() => void>(() => {});

  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    editable: !isLocked,
    initialContent: contentHtml,
    onChange: () => {
      setHasUnsavedChanges(true);
      setRedundantSaveTapCount(0);
      scheduleSnapshotRef.current();
    },
  });
  const editorState = useBridgeState(editor) as { isFocused?: boolean };

  const syncEditorContent = useCallback(async () => {
    if (isWeb) {
      const nextText = plainTextContent;
      const nextHtml = toInitialHtml(nextText);
      setContentHtml(nextHtml);
      return { nextHtml, nextText };
    }

    const [nextHtml, nextText] = await Promise.all([editor.getHTML(), editor.getText()]);
    const trimmedText = nextText.trimEnd();
    setContentHtml(nextHtml);
    setPlainTextContent(trimmedText);
    return { nextHtml, nextText: trimmedText };
  }, [editor, isWeb, plainTextContent]);

  const scheduleEditorSnapshot = useCallback(() => {
    if (snapshotTimerRef.current) {
      clearTimeout(snapshotTimerRef.current);
    }

    snapshotTimerRef.current = setTimeout(() => {
      void syncEditorContent();
    }, 120);
  }, [syncEditorContent]);

  scheduleSnapshotRef.current = scheduleEditorSnapshot;

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const nextHtml = toInitialHtml(note.content);
    const nextText = stripHtml(note.content);

    setTitle(note.title);
    setContentHtml(nextHtml);
    setPlainTextContent(nextText);
    setShowMenu(false);
    setShowTagPicker(false);
    setIsLocked(false);
    setHasUnsavedChanges(false);
    setSaveMessage("");
    setRedundantSaveTapCount(0);
    setLastRedundantSaveAt(null);
    editor.setContent(nextHtml);
  }, [editor, note.content, note.id, note.title]);

  useEffect(() => {
    editor.setEditable(!isLocked);
  }, [editor, isLocked]);

  const saveNote = useCallback(async () => {
    if (!appState) {
      return;
    }

    const { nextHtml, nextText } = await syncEditorContent();
    appState.updateNote(note.id, {
      title,
      content: nextHtml,
      wordCount: getWordCount(nextText),
      characterCount: nextText.length,
      size: title.length + nextHtml.length,
      lastAutoSave: new Date().toISOString(),
    });
    setHasUnsavedChanges(false);
  }, [appState, note.id, syncEditorContent, title]);

  const showTransientSaveMessage = useCallback((message: string) => {
    setSaveMessage(message);
    if (saveMessageTimerRef.current) {
      clearTimeout(saveMessageTimerRef.current);
    }
    saveMessageTimerRef.current = setTimeout(() => {
      setSaveMessage("");
    }, 2200);
  }, []);

  useEffect(() => {
    if (!appState?.settings.autoSave || !hasUnsavedChanges) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      void saveNote();
    }, 700);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [appState?.settings.autoSave, contentHtml, hasUnsavedChanges, saveNote, title]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (snapshotTimerRef.current) {
        clearTimeout(snapshotTimerRef.current);
      }
      if (saveMessageTimerRef.current) {
        clearTimeout(saveMessageTimerRef.current);
      }
      if (hasUnsavedChanges) {
        void saveNote();
      }
    };
  }, [hasUnsavedChanges, saveNote]);

  const handleManualSave = useCallback(async () => {
    const nowTime = Date.now();

    if (hasUnsavedChanges) {
      await saveNote();
      setRedundantSaveTapCount(0);
      setLastRedundantSaveAt(nowTime);
      showTransientSaveMessage("Saved successfully");
      return;
    }

    const withinRapidWindow =
      lastRedundantSaveAt !== null && nowTime - lastRedundantSaveAt <= 2000;
    const nextTapCount = withinRapidWindow ? redundantSaveTapCount + 1 : 1;

    setRedundantSaveTapCount(nextTapCount);
    setLastRedundantSaveAt(nowTime);

    if (nextTapCount > 3) {
      showTransientSaveMessage("Your changes have already been saved");
      return;
    }

    showTransientSaveMessage("Saved successfully");
  }, [
    hasUnsavedChanges,
    lastRedundantSaveAt,
    redundantSaveTapCount,
    saveNote,
    showTransientSaveMessage,
  ]);

  const handleShare = async () => {
    const textToShare = plainTextContent || stripHtml(contentHtml);
    await Share.share({
      title: title || "Untitled note",
      message: `${title || "Untitled note"}\n\n${textToShare}`,
    });
  };

  const handleDelete = () => {
    Alert.alert("Delete note?", "This note will be moved to trash.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          appState?.deleteNote(note.id);
          router.back();
        },
      },
    ]);
  };

  const wordCount = useMemo(() => getWordCount(plainTextContent), [plainTextContent]);
  const characterCount = plainTextContent.length;
  const currentDate = useMemo(() => formatCurrentDate(now), [now]);
  const mutedText = `${colors.mutedForeground}CC`;
  const editorFocused = isWeb ? true : Boolean(editorState.isFocused);

  if (!appState) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View
          style={[
            styles.navBar,
            { borderBottomColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <AnimatedLottieIcon
            color={colors.text}
            onPress={() => {
              void saveNote().finally(() => router.back());
            }}
            size={28}
            source={backAnimation}
            style={styles.navIconButton}
          />

          <View style={styles.navCenter}>
            <Text style={[styles.dateLabel, { color: colors.text }]}>{currentDate}</Text>
            <Text style={[styles.wordCountLabel, { color: colors.mutedForeground }]}>
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              void handleManualSave();
            }}
            style={[
              styles.saveButton,
              {
                backgroundColor: hasUnsavedChanges ? colors.primary : colors.card,
                borderColor: hasUnsavedChanges ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.saveButtonText,
                { color: hasUnsavedChanges ? colors.primaryForeground : colors.text },
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>

          <AnimatedLottieIcon
            active={showMenu}
            color={colors.text}
            onPress={() => setShowMenu((current) => !current)}
            size={26}
            source={menuAnimation}
            style={styles.navIconButton}
          />
        </View>

        {saveMessage ? (
          <Animated.View
            entering={FadeIn.duration(160)}
            exiting={FadeOut.duration(140)}
            style={[
              styles.saveMessageBanner,
              {
                backgroundColor: colors.text,
                shadowColor: colors.text,
              },
            ]}
          >
            <Text style={[styles.saveMessageText, { color: colors.background }]}>
              {saveMessage}
            </Text>
          </Animated.View>
        ) : null}

        <View style={styles.headerArea}>
          <TextInput
            editable={!isLocked}
            onChangeText={(value) => {
              setTitle(value);
              setHasUnsavedChanges(true);
              setRedundantSaveTapCount(0);
            }}
            placeholder="Untitled"
            placeholderTextColor={mutedText}
            style={[styles.titleInput, { color: colors.text }]}
            value={title}
          />

          <View style={styles.tagsRow}>
            <AnimatedLottieIcon
              color={colors.mutedForeground}
              onPress={() => setShowTagPicker(true)}
              size={18}
              source={bookmarkAnimation}
            />
            <View style={styles.tagsWrap}>
              {note.tags.map((tag) => (
                <View
                  key={tag.id}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: `${tag.color}15`,
                      borderColor: `${tag.color}44`,
                    },
                  ]}
                >
                  <Text style={[styles.tagChipText, { color: colors.text }]}>{tag.name}</Text>
                </View>
              ))}
              <TouchableOpacity
                onPress={() => setShowTagPicker(true)}
                style={[styles.addTagChip, { borderColor: colors.border }]}
              >
                <Text style={[styles.addTagText, { color: colors.mutedForeground }]}>
                  + tag
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.headerDivider, { backgroundColor: colors.border }]} />
        </View>

        <View
          style={[
            styles.bodyShell,
            { opacity: showMenu ? 0.32 : 1, backgroundColor: colors.background },
          ]}
        >
          <View
            style={[
              styles.editorCard,
              {
                backgroundColor: colors.background,
                borderColor: editorFocused ? colors.primary : colors.border,
              },
            ]}
          >
            {isLocked ? (
              <View style={styles.lockedState}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
                <Text style={[styles.lockedText, { color: colors.mutedForeground }]}>
                  Note is locked
                </Text>
              </View>
            ) : null}
            {isWeb ? (
              <TextInput
                editable={!isLocked}
                multiline
                onChangeText={(value) => {
                  setPlainTextContent(value);
                  setContentHtml(toInitialHtml(value));
                  setHasUnsavedChanges(true);
                  setRedundantSaveTapCount(0);
                }}
                placeholder="Start writing..."
                placeholderTextColor={mutedText}
                style={[styles.richText, styles.webEditorInput, { color: colors.text }]}
                textAlignVertical="top"
                value={plainTextContent}
              />
            ) : (
              <RichText editor={editor} style={styles.richText} />
            )}
          </View>

          <View
            style={[
              styles.toolbarShell,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                opacity: isLocked ? 0.45 : 1,
              },
            ]}
          >
            {isWeb ? <View style={styles.toolbarPlaceholder} /> : (
              <Toolbar
                editor={editor}
                hidden={isLocked || !editorFocused}
                items={PLAIN_NOTE_TOOLBAR_ITEMS}
              />
            )}
          </View>

          <View style={styles.countRow}>
            <Text style={[styles.countText, { color: colors.mutedForeground }]}>
              {wordCount} words | {characterCount} characters
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.bottomToolbar,
            { borderTopColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <View style={styles.toolbarSide}>
            <AnimatedLottieIcon
              color={colors.text}
              onPress={handleShare}
              size={24}
              source={shareAnimation}
              style={styles.utilityIcon}
            />
          </View>
          <View style={styles.toolbarSide}>
            <AnimatedLottieIcon
              color={colors.destructive}
              onPress={handleDelete}
              size={24}
              source={trashAnimation}
              style={styles.utilityIcon}
            />
          </View>
        </View>

        {showMenu ? (
          <>
            <Pressable
              onPress={() => setShowMenu(false)}
              style={[StyleSheet.absoluteFill, { backgroundColor: "#0000000D" }]}
            />
            <Animated.View
              entering={FadeIn.duration(180)}
              style={[
                styles.menuCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  shadowColor: colors.text,
                },
              ]}
            >
              <View style={[styles.quickActionRow, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => {
                    appState.togglePin(note.id);
                    setShowMenu(false);
                  }}
                  style={[styles.quickActionButton, { backgroundColor: colors.card }]}
                >
                  <AnimatedLottieIcon
                    active
                    color={note.isPinned ? colors.primary : colors.text}
                    size={20}
                    source={bookmarkAnimation}
                  />
                  <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                    Pin note
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setIsLocked((current) => !current);
                    setShowMenu(false);
                  }}
                  style={[styles.quickActionButton, { backgroundColor: colors.card }]}
                >
                  <AnimatedLottieIcon
                    active
                    color={isLocked ? colors.primary : colors.text}
                    size={20}
                    source={lockAnimation}
                  />
                  <Text style={[styles.quickActionLabel, { color: colors.text }]}>Lock</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => {
                  appState.toggleArchive(note.id);
                  setShowMenu(false);
                }}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
              >
                <AnimatedLottieIcon active color={colors.text} size={20} source={folderAnimation} />
                <Text style={[styles.menuItemLabel, { color: colors.text }]}>Move note</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDelete} style={styles.menuItem}>
                <AnimatedLottieIcon active color={colors.destructive} size={20} source={trashAnimation} />
                <Text style={[styles.menuItemLabel, { color: colors.destructive }]}>Delete</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : null}

        {showTagPicker ? (
          <>
            <Pressable
              onPress={() => setShowTagPicker(false)}
              style={[StyleSheet.absoluteFill, { backgroundColor: "#00000018" }]}
            />
            <View style={styles.tagPickerSheet}>
              <NoteTagPicker note={note} onClose={() => setShowTagPicker(false)} />
            </View>
          </>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  navIconButton: {
    height: 34,
    width: 34,
  },
  navCenter: {
    alignItems: "center",
    flex: 1,
    gap: 3,
    marginHorizontal: 8,
  },
  saveButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minWidth: 58,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  wordCountLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  saveMessageBanner: {
    alignSelf: "center",
    borderRadius: 999,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    zIndex: 5,
    elevation: 6,
  },
  saveMessageText: {
    fontSize: 12,
    fontWeight: "600",
  },
  headerArea: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  titleInput: {
    fontSize: 21,
    fontWeight: "500",
    marginBottom: 14,
    minHeight: 34,
    outlineStyle: "none" as never,
    padding: 0,
  },
  tagsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  tagsWrap: {
    columnGap: 8,
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  tagChip: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: "500",
  },
  addTagChip: {
    borderRadius: 4,
    borderStyle: "dashed",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  addTagText: {
    fontSize: 11,
    fontWeight: "500",
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
  bodyShell: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  editorCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  lockedState: {
    alignItems: "center",
    backgroundColor: "#00000008",
    flexDirection: "row",
    gap: 8,
    left: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
    top: 14,
    zIndex: 2,
    borderRadius: 999,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: "500",
  },
  richText: {
    flex: 1,
  },
  webEditorInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: "100%",
    outlineStyle: "none" as never,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  toolbarShell: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    minHeight: 54,
    overflow: "hidden",
  },
  toolbarPlaceholder: {
    minHeight: 54,
    width: "100%",
  },
  countRow: {
    alignItems: "flex-end",
    marginTop: 10,
    minHeight: 18,
  },
  countText: {
    fontSize: 12,
    opacity: 0.7,
  },
  bottomToolbar: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toolbarSide: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  utilityIcon: {
    height: 34,
    width: 34,
  },
  menuCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 14,
    position: "absolute",
    right: 14,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    top: 58,
    width: 270,
    zIndex: 6,
  },
  quickActionRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  quickActionButton: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  menuItem: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  tagPickerSheet: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 7,
  },
});
