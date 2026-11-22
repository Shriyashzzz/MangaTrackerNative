// "Your notes", as the web's NotesField: saved when they leave the box (and
// when they leave the page with it unsaved), up to 450 characters. The
// server's own reason shows when it turns one down
import { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { apiFetch, errorMessages } from "@/core/lib/api";
import { saveOrKeep } from "@/core/lib/offlineChanges";
import { useColors } from "@/lib/colors";
import { useShelf } from "@/store/shelf";

const MAX_LENGTH = 450;

const sendNotes = (id: number, notes: string) =>
  apiFetch(`/api/manga/${id}/notes`, {
    method: "PATCH",
    body: { description: notes || null },
  });

export default function NotesField({
  id,
  initial,
}: {
  id: number;
  initial: string | null;
}) {
  const c = useColors();
  const [text, setText] = useState(initial ?? "");
  const [status, setStatus] = useState<
    "" | "saving" | "saved" | "kept" | "failed"
  >("");
  const [failure, setFailure] = useState("");
  const savedText = useRef(initial ?? "");
  const latest = useRef(text);

  const save = async (value: string) => {
    const notes = value.trim();
    if (notes === savedText.current.trim()) return;
    setStatus("saving");
    try {
      let refused = "";
      const how = await saveOrKeep(
        id,
        "notes",
        savedText.current.trim() || null,
        notes || null,
        async () => {
          const res = await sendNotes(id, notes);
          if (res.status === 400) refused = (await errorMessages(res))[0] ?? "";
          return res;
        },
      ).catch((e: Error) => {
        throw new Error(refused || e.message);
      });
      savedText.current = notes;
      useShelf.setState((state) => ({
        manga:
          state.manga?.map((m) =>
            m.id === id ? { ...m, description: notes || null } : m,
          ) ?? null,
      }));
      setStatus(how);
    } catch (e) {
      const said = (e as Error).message;
      setFailure(
        said && !said.startsWith("answered")
          ? said
          : "That didn't save. Try again.",
      );
      setStatus("failed");
    }
  };

  // leaving the page with notes not saved: they're sent anyway
  useEffect(
    () => () => {
      const notes = latest.current.trim();
      if (notes !== savedText.current.trim())
        sendNotes(id, notes).catch(() => {});
    },
    [id],
  );

  return (
    <View className="gap-1 rounded-[4px] border-[1.5px] border-line-soft bg-card px-4 pt-3 pb-2">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="font-body text-[14.5px] text-ink-soft">
          Your notes
        </Text>
        <Text
          className={`shrink font-body text-[13px] ${status === "failed" ? "text-accent" : "text-muted"}`}
        >
          {status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "Saved"
              : status === "kept"
                ? "Kept on this phone"
                : status === "failed"
                  ? failure
                  : ""}
        </Text>
      </View>
      <TextInput
        value={text}
        onChangeText={(next) => {
          setText(next);
          latest.current = next;
          if (status) setStatus("");
        }}
        onBlur={() => save(text)}
        multiline
        maxLength={MAX_LENGTH}
        placeholder="Add a note…"
        placeholderTextColor={c.muted}
        accessibilityLabel="Your notes"
        style={{ minHeight: 56, textAlignVertical: "top" }}
        className="border-b border-line-soft py-1.5 font-body text-[16px] text-ink"
      />
    </View>
  );
}
