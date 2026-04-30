import { NoteTagPicker } from "@/components/NoteTagPicker";
import { AnimatedLottieIcon } from "@/components/ui/AnimatedLottieIcon";
import { AppStateContext } from "@/context/AppStateContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { PlainTextNote } from "@/types/note";
import { ensureBlockDocument } from "@/utils/blocks/migrate";
import { getBlockDerivedMetrics, serializeBlocksToPlainText } from "@/utils/blocks/serialize";
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
const shareAnimation = require("react-useanimations/lib/share/share.json");
const trashAnimation = require("react-useanimations/lib/trash/trash.json");

const PLAIN_NOTE_TOOLBAR_ITEMS = [
  DEFAULT_TOOLBAR_ITEMS[0],
  DEFAULT_TOOLBAR_ITEMS[1],
  DEFAULT_TOOLBAR_ITEMS[6],
  DEFAULT_TOOLBAR_ITEMS[7],
];
const NAV_BAR_HEIGHT = 56;

function formatCurrentDate(now: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(now);
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function toInitialHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "<p></p>";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return value;
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("") || "<p></p>";
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function PlainTextEditor({ note }: { note: PlainTextNote }) {
  const appState = useContext(AppStateContext);
  const colors = useThemeColors();
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsavedChangesRef = useRef(false);
  const saveNoteRef = useRef<() => Promise<void>>(async () => {});
  const hydratedNoteIdRef = useRef<string | null>(null);

  const initialPlain = useMemo(() => {
    const doc = ensureBlockDocument(note.blocks, note.content);
    return serializeBlocksToPlainText(doc) || stripHtml(note.content);
  }, [note.blocks, note.content]);

  const [title, setTitle] = useState(note.title);
  const [plainTextContent, setPlainTextContent] = useState(initialPlain);
  const [contentHtml, setContentHtml] = useState(() => toInitialHtml(initialPlain));
  const [now, setNow] = useState(() => new Date());
  const [showMenu, setShowMenu] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [redundantSaveTapCount, setRedundantSaveTapCount] = useState(0);
  const [lastRedundantSaveAt, setLastRedundantSaveAt] = useState<number | null>(null);

  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    editable: !isLocked,
    initialContent: contentHtml,
    onChange: () => {
      setHasUnsavedChanges(true);
      setRedundantSaveTapCount(0);
      if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
      snapshotTimerRef.current = setTimeout(async () => {
        if (isWeb) return;
        const [nextHtml, nextText] = await Promise.all([editor.getHTML(), editor.getText()]);
        setContentHtml(nextHtml);
        setPlainTextContent(nextText.trimEnd());
      }, 120);
    },
  });
  const editorState = useBridgeState(editor) as { isFocused?: boolean };

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hydratedNoteIdRef.current === note.id) return;
    hydratedNoteIdRef.current = note.id;
    const nextPlain = serializeBlocksToPlainText(ensureBlockDocument(note.blocks, note.content)) || stripHtml(note.content);
    const nextHtml = toInitialHtml(nextPlain);
    setTitle(note.title);
    setPlainTextContent(nextPlain);
    setContentHtml(nextHtml);
    setIsLocked(false);
    setHasUnsavedChanges(false);
    setRedundantSaveTapCount(0);
    setLastRedundantSaveAt(null);
    editor.setContent(nextHtml);
  }, [editor, note.id, note.title, note.content, note.blocks]);

  useEffect(() => {
    setShowMenu(false);
    setShowTagPicker(false);
    setSaveMessage("");
    setRedundantSaveTapCount(0);
    setLastRedundantSaveAt(null);
  }, [note.id]);

  useEffect(() => {
    editor.setEditable(!isLocked);
  }, [editor, isLocked]);

  const syncEditorContent = useCallback(async () => {
    if (isWeb) {
      const nextText = plainTextContent;
      const nextHtml = toInitialHtml(nextText);
      setContentHtml(nextHtml);
      return { nextText, nextHtml };
    }
    const [nextHtml, nextText] = await Promise.all([editor.getHTML(), editor.getText()]);
    const trimmed = nextText.trimEnd();
    setContentHtml(nextHtml);
    setPlainTextContent(trimmed);
    return { nextText: trimmed, nextHtml };
  }, [editor, isWeb, plainTextContent]);

  const saveNote = useCallback(async () => {
    if (!appState) return;
    const { nextText } = await syncEditorContent();
    const blockDocument = ensureBlockDocument(undefined, nextText);
    const { derivedContent, wordCount, characterCount, size } = getBlockDerivedMetrics(blockDocument, title);

    appState.updateNote(note.id, {
      title,
      blocks: blockDocument,
      content: derivedContent,
      wordCount,
      characterCount,
      size,
      lastAutoSave: new Date().toISOString(),
    });
    setHasUnsavedChanges(false);
  }, [appState, note.id, syncEditorContent, title]);
  saveNoteRef.current = saveNote;

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  const showTransientSaveMessage = useCallback((message: string) => {
    setSaveMessage(message);
    if (saveMessageTimerRef.current) clearTimeout(saveMessageTimerRef.current);
    saveMessageTimerRef.current = setTimeout(() => setSaveMessage(""), 2200);
  }, []);

  useEffect(() => {
    if (!appState?.settings.autoSave || !hasUnsavedChanges) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => void saveNote(), 700);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [appState?.settings.autoSave, hasUnsavedChanges, saveNote]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
      if (saveMessageTimerRef.current) clearTimeout(saveMessageTimerRef.current);
      if (hasUnsavedChangesRef.current) void saveNoteRef.current();
    };
  }, []);

  const handleManualSave = useCallback(async () => {
    const nowTime = Date.now();
    if (hasUnsavedChanges) {
      await saveNote();
      setRedundantSaveTapCount(0);
      setLastRedundantSaveAt(nowTime);
      showTransientSaveMessage("Saved successfully");
      return;
    }
    const withinRapidWindow = lastRedundantSaveAt !== null && nowTime - lastRedundantSaveAt <= 2000;
    const nextTapCount = withinRapidWindow ? redundantSaveTapCount + 1 : 1;
    setRedundantSaveTapCount(nextTapCount);
    setLastRedundantSaveAt(nowTime);
    showTransientSaveMessage(nextTapCount > 3 ? "Your changes have already been saved" : "Saved successfully");
  }, [hasUnsavedChanges, lastRedundantSaveAt, redundantSaveTapCount, saveNote, showTransientSaveMessage]);

  const handleShare = async () => {
    await Share.share({ title: title || "Untitled note", message: `${title || "Untitled note"}\n\n${plainTextContent}` });
  };

  const handleDelete = () => {
    Alert.alert("Delete note?", "This note will be moved to trash.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { appState?.deleteNote(note.id); router.back(); } },
    ]);
  };

  if (!appState) return null;

  const wordCount = getBlockDerivedMetrics(ensureBlockDocument(undefined, plainTextContent), title).wordCount;
  const characterCount = plainTextContent.length;
  const currentDate = formatCurrentDate(now);
  const mutedText = `${colors.mutedForeground}CC`;
  const editorFocused = isWeb ? true : Boolean(editorState.isFocused);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
        <View style={[styles.navBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <AnimatedLottieIcon color={colors.text} onPress={() => void saveNote().finally(() => router.back())} size={28} source={backAnimation} style={styles.navIconButton} />
          <View style={styles.navCenter}>
            <Text style={[styles.dateLabel, { color: colors.text }]}>{currentDate}</Text>
            <Text style={[styles.wordCountLabel, { color: colors.mutedForeground }]}>{wordCount} {wordCount === 1 ? "word" : "words"}</Text>
          </View>
          <TouchableOpacity onPress={() => void handleManualSave()} style={[styles.saveButton, { backgroundColor: hasUnsavedChanges ? colors.primary : colors.card, borderColor: hasUnsavedChanges ? colors.primary : colors.border }]}>
            <Text style={[styles.saveButtonText, { color: hasUnsavedChanges ? colors.primaryForeground : colors.text }]}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMenu((c) => !c)} style={styles.navIconButton} activeOpacity={0.7}>
            <AnimatedLottieIcon active={showMenu} color={colors.text} size={26} source={menuAnimation} />
          </TouchableOpacity>
        </View>

        {saveMessage ? (
          <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(140)} style={[styles.saveMessageBanner, { backgroundColor: colors.text, shadowColor: colors.text }]}>
            <Text style={[styles.saveMessageText, { color: colors.background }]}>{saveMessage}</Text>
          </Animated.View>
        ) : null}

        <View style={styles.headerArea}>
          <TextInput
            editable={!isLocked}
            onChangeText={(value) => { setTitle(value); setHasUnsavedChanges(true); setRedundantSaveTapCount(0); }}
            placeholder="Untitled"
            placeholderTextColor={mutedText}
            style={[styles.titleInput, { color: colors.text }]}
            value={title}
          />
          <View style={styles.tagsRow}>
            <TouchableOpacity onPress={() => setShowTagPicker(true)} style={styles.tagIconButton}>
              <Ionicons name="pricetag-outline" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={styles.tagsWrap}>
              {note.tags.map((tag) => (
                <View key={tag.id} style={[styles.tagChip, { backgroundColor: `${tag.color}15`, borderColor: `${tag.color}44` }]}>
                  <Text style={[styles.tagChipText, { color: colors.text }]}>{tag.name}</Text>
                </View>
              ))}
              <TouchableOpacity onPress={() => setShowTagPicker(true)} style={[styles.addTagChip, { borderColor: colors.border }]}>
                <Text style={[styles.addTagText, { color: colors.mutedForeground }]}>+ tag</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.bodyShell, { opacity: showMenu ? 0.32 : 1, backgroundColor: colors.background }]}>
          <View style={[styles.editorCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {isLocked ? (
              <View style={styles.lockedState}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
                <Text style={[styles.lockedText, { color: colors.mutedForeground }]}>Note is locked</Text>
              </View>
            ) : null}
            {isWeb ? (
              <TextInput
                editable={!isLocked}
                multiline
                onChangeText={(value) => { setPlainTextContent(value); setContentHtml(toInitialHtml(value)); setHasUnsavedChanges(true); setRedundantSaveTapCount(0); }}
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
          <View style={[styles.toolbarShell, { backgroundColor: colors.background, borderColor: colors.border, opacity: isLocked ? 0.45 : 1 }]}>
            {isWeb ? <View style={styles.toolbarPlaceholder} /> : (
              <Toolbar editor={editor} hidden={isLocked || !editorFocused} items={PLAIN_NOTE_TOOLBAR_ITEMS} />
            )}
          </View>
          <View style={styles.countRow}>
            <Text style={[styles.countText, { color: colors.mutedForeground }]}>{wordCount} words | {characterCount} characters</Text>
          </View>
        </View>

        <View style={[styles.bottomToolbar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <View style={styles.toolbarSide}>
            <AnimatedLottieIcon color={colors.text} onPress={handleShare} size={24} source={shareAnimation} style={styles.utilityIcon} />
          </View>
          <View style={styles.toolbarSide}>
            <AnimatedLottieIcon color={colors.destructive} onPress={handleDelete} size={24} source={trashAnimation} style={styles.utilityIcon} />
          </View>
        </View>

        {showMenu ? (
          <>
            <Pressable onPress={() => setShowMenu(false)} style={[StyleSheet.absoluteFill, styles.menuBackdrop, { backgroundColor: "#0000000D" }]} />
            <Animated.View entering={FadeIn.duration(180)} style={[styles.menuCard, { backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.text }]}>
              <View style={[styles.quickActionRow, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => { setShowMenu(false); Alert.alert("Scan", "Scan is not available yet for plain text notes."); }} style={[styles.quickActionButton, { backgroundColor: colors.card }]}><Ionicons name="scan-outline" size={20} color={colors.text} /><Text style={[styles.quickActionLabel, { color: colors.text }]}>Scan</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { appState.togglePin(note.id); setShowMenu(false); }} style={[styles.quickActionButton, { backgroundColor: colors.card }]}><Ionicons name={note.isPinned ? "pin" : "pin-outline"} size={20} color={note.isPinned ? colors.primary : colors.text} /><Text style={[styles.quickActionLabel, { color: colors.text }]}>Pin Note</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { setIsLocked((c) => !c); setShowMenu(false); }} style={[styles.quickActionButton, { backgroundColor: colors.card }]}><Ionicons name={isLocked ? "lock-closed" : "lock-closed-outline"} size={20} color={isLocked ? colors.primary : colors.text} /><Text style={[styles.quickActionLabel, { color: colors.text }]}>Lock</Text></TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => { setShowMenu(false); Alert.alert("Find in note", "Find in note is coming soon."); }} style={[styles.menuItem, { borderBottomColor: colors.border }]}><Ionicons name="search-outline" size={20} color={colors.text} /><Text style={[styles.menuItemLabel, { color: colors.text }]}>Find in Note</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowMenu(false); appState.toggleArchive(note.id); Alert.alert("Moved", "Note moved to archived notes."); }} style={[styles.menuItem, { borderBottomColor: colors.border }]}><Ionicons name="folder-outline" size={20} color={colors.text} /><Text style={[styles.menuItemLabel, { color: colors.text }]}>Move Note</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.menuItemDelete}><Ionicons name="trash-outline" size={20} color={colors.destructive} /><Text style={[styles.menuItemLabel, { color: colors.destructive }]}>Delete</Text></TouchableOpacity>
            </Animated.View>
          </>
        ) : null}

        {showTagPicker ? (
          <>
            <Pressable onPress={() => setShowTagPicker(false)} style={[StyleSheet.absoluteFill, { backgroundColor: "#00000018" }]} />
            <View style={styles.tagPickerSheet}><NoteTagPicker note={note} onClose={() => setShowTagPicker(false)} /></View>
          </>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { alignItems: "center", borderBottomWidth: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10 },
  navIconButton: { height: 34, width: 34 },
  navCenter: { alignItems: "center", flex: 1, gap: 3, marginHorizontal: 8 },
  saveButton: { alignItems: "center", borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, justifyContent: "center", minWidth: 58, paddingHorizontal: 12, paddingVertical: 7 },
  saveButtonText: { fontSize: 12, fontWeight: "600" },
  dateLabel: { fontSize: 11, fontWeight: "500", letterSpacing: 0.2 },
  wordCountLabel: { fontSize: 10, fontWeight: "500" },
  saveMessageBanner: { alignSelf: "center", borderRadius: 999, marginTop: 10, paddingHorizontal: 14, paddingVertical: 8, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 18, zIndex: 5, elevation: 6 },
  saveMessageText: { fontSize: 12, fontWeight: "600" },
  headerArea: { paddingHorizontal: 18, paddingTop: 12 },
  titleInput: { fontSize: 21, fontWeight: "500", marginBottom: 14, minHeight: 34, outlineStyle: "none" as never, padding: 0 },
  tagsRow: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 12 },
  tagIconButton: { alignItems: "center", justifyContent: "center", height: 22, width: 22 },
  tagsWrap: { columnGap: 8, flex: 1, flexDirection: "row", flexWrap: "wrap", rowGap: 8 },
  tagChip: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  tagChipText: { fontSize: 11, fontWeight: "500" },
  addTagChip: { borderRadius: 4, borderStyle: "dashed", borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  addTagText: { fontSize: 11, fontWeight: "500" },
  bodyShell: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  editorCard: { borderRadius: 18, borderWidth: 0, flex: 1, overflow: "hidden", position: "relative" },
  lockedState: { alignItems: "center", backgroundColor: "#00000008", flexDirection: "row", gap: 8, left: 16, paddingHorizontal: 10, paddingVertical: 6, position: "absolute", top: 14, zIndex: 2, borderRadius: 999 },
  lockedText: { fontSize: 12, fontWeight: "500" },
  richText: { flex: 1 },
  webEditorInput: { fontSize: 16, lineHeight: 24, minHeight: "100%", outlineStyle: "none" as never, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16 },
  toolbarShell: { borderRadius: 16, borderWidth: 0, marginTop: 12, minHeight: 54, overflow: "hidden" },
  toolbarPlaceholder: { minHeight: 54, width: "100%" },
  countRow: { alignItems: "flex-end", marginTop: 10, minHeight: 18 },
  countText: { fontSize: 12, opacity: 0.7 },
  bottomToolbar: { alignItems: "center", borderTopWidth: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  toolbarSide: { alignItems: "center", flexDirection: "row", gap: 8 },
  utilityIcon: { height: 34, width: 34 },
  menuCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, elevation: 14, position: "absolute", right: 14, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.14, shadowRadius: 26, top: 58, width: 292, zIndex: 6 },
  quickActionRow: { borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 10, padding: 12 },
  quickActionButton: { alignItems: "center", borderRadius: 14, flex: 1, gap: 6, paddingHorizontal: 8, paddingVertical: 10 },
  quickActionLabel: { fontSize: 11, fontWeight: "500", textAlign: "center" },
  menuItem: { alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  menuItemDelete: { alignItems: "center", flexDirection: "row", gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  menuItemLabel: { fontSize: 14, fontWeight: "500" },
  menuBackdrop: { top: NAV_BAR_HEIGHT },
  tagPickerSheet: { bottom: 0, left: 0, position: "absolute", right: 0, zIndex: 7 },
});
