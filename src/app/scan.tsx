// Scan the barcode on the back of a volume, as the Android app's (web
// components/scanSheet/ScanSheet.tsx): the camera reads ISBNs on its own, a
// stack in a row; each lands on the shelf (marked yours, or a new series),
// said in a list with Undo, Edit and the questions the app has to ask. Typing
// the ISBN works when the camera can't. The phone's camera does the reading
// (expo-camera), and a buzz says a scan landed; what a scan does to the
// shelf is the web's own (core lib/scan)
import { StatusBar } from "expo-status-bar";
import ScanFrame from "@/components/ScanFrame";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import Button from "@/components/Button";
import { Input } from "@/components/Field";
import ScanEdit from "@/components/ScanEdit";
import { CheckIcon, CloseIcon, TorchIcon } from "@/core/components/icons/Icons";
import { isbnFromTyped } from "@/core/lib/barcode";
import { editScan, shelveScan, type ScanResult } from "@/core/lib/scan";
import { useShelf } from "@/store/shelf";

const Safe = withUniwind(SafeAreaView);

type Row = {
  key: number;
  isbn: string;
  result?: ScanResult;
  undone?: boolean;
  undoFailed?: boolean;
};

const volumesLabel = (volumes: number[]) =>
  volumes.length > 1
    ? `Vols. ${volumes[0]}–${volumes[volumes.length - 1]}`
    : `Vol. ${volumes[0]}`;
const NOTICE_MS = 1600;
const landed = (row: Row) =>
  !row.undone &&
  (row.result?.kind === "marked" || row.result?.kind === "added");
function flashFor(kind: ScanResult["kind"]): {
  tone: "good" | "same" | "bad";
  note: string;
} {
  if (kind === "marked" || kind === "added")
    return { tone: "good", note: "On your shelf" };
  if (kind === "already") return { tone: "same", note: "Already yours" };
  if (kind === "unsure") return { tone: "same", note: "Which volumes?" };
  if (kind === "unknown")
    return { tone: "bad", note: "Couldn't find this one" };
  return { tone: "bad", note: "That didn't save" };
}

// the scanner's dark surround and the words on it, the same in both themes
const CHROME = "#16140f";
const ON_CHROME = "#fffaf2";

export default function ScanScreen() {
  const { isbn: firstIsbn } = useLocalSearchParams<{ isbn?: string }>();
  const [permission, askPermission] = useCameraPermissions();
  const [rows, setRows] = useState<Row[]>([]);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState("");
  const [notice, setNotice] = useState("");
  const [flash, setFlash] = useState<null | {
    tone: "good" | "same" | "bad";
    title: string;
    note: string;
  }>(null);
  const [torch, setTorch] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const queue = useRef(Promise.resolve());
  const handled = useRef(new Set<string>());
  const changed = useRef(false);
  const nextKey = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain)
      void askPermission();
  }, [permission, askPermission]);

  const read = useCallback((isbn: string) => {
    const later = (fn: () => void, ms: number) =>
      timers.current.push(setTimeout(fn, ms));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (handled.current.has(isbn)) {
      setNotice("Already scanned");
      later(() => setNotice(""), NOTICE_MS);
      return;
    }
    handled.current.add(isbn);
    const key = nextKey.current++;
    setRows((now) => [{ key, isbn }, ...now]);
    queue.current = queue.current.then(async () => {
      const result = await shelveScan(isbn);
      if (result.kind === "marked" || result.kind === "added")
        changed.current = true;
      if (result.kind === "failed") handled.current.delete(isbn);
      setRows((now) => now.map((r) => (r.key === key ? { ...r, result } : r)));
      const name =
        "book" in result
          ? `${result.name} · ${volumesLabel(result.book.volumes)}`
          : result.isbn;
      setFlash({ title: name, ...flashFor(result.kind) });
      later(() => setFlash(null), 1800);
      if (result.kind === "marked" || result.kind === "added")
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
    });
  }, []);
  useEffect(() => {
    if (firstIsbn) read(firstIsbn);
  }, [firstIsbn, read]);

  const close = () => {
    if (changed.current) void useShelf.getState().load();
    router.back();
  };
  const undo = async (row: Row) => {
    if (row.result?.kind !== "marked" && row.result?.kind !== "added") return;
    const { book } = row.result;
    try {
      await row.result.undo();
      handled.current.delete(book.isbn13);
      setRows((now) =>
        now.map((r) =>
          r.key === row.key ? { ...r, undone: true, undoFailed: false } : r,
        ),
      );
    } catch {
      setRows((now) =>
        now.map((r) => (r.key === row.key ? { ...r, undoFailed: true } : r)),
      );
    }
  };
  const submitTyped = () => {
    const isbn = isbnFromTyped(typed);
    if (!isbn)
      return setTypedError(
        "That isn't an ISBN. It's the 13 digits under the barcode.",
      );
    setTypedError("");
    setTyped("");
    handled.current.delete(isbn);
    read(isbn);
  };
  const blocked = permission
    ? !permission.granted && !permission.canAskAgain
    : false;
  const showTyping = typing || blocked;
  const onShelf = rows.filter(landed).length;
  const editingRow = rows.find((r) => r.key === editing);
  const editingResult = editingRow?.result;

  return (
    // the camera's surround is dark in both themes, as a camera's is: its
    // own colours, not the theme's ink and paper (which swap in dark mode)
    <Safe
      edges={["top"]}
      className="flex-1"
      style={{ backgroundColor: CHROME }}
    >
      <StatusBar style="light" />
      <View className="h-[56px] flex-row items-center justify-between px-2">
        <Pressable
          onPress={close}
          hitSlop={8}
          className="p-2"
          accessibilityLabel="Close the scanner"
        >
          <CloseIcon color="#fffaf2" width={24} height={24} />
        </Pressable>
        <Pressable
          onPress={() => setTorch(!torch)}
          disabled={showTyping}
          hitSlop={8}
          className={`p-2 ${showTyping ? "opacity-40" : ""}`}
          accessibilityLabel="Torch"
          accessibilityState={{ selected: torch }}
        >
          <TorchIcon
            color={torch ? "#f2b630" : "#fffaf2"}
            width={24}
            height={24}
          />
        </Pressable>
      </View>
      {!showTyping ? (
        <View className="items-center gap-3 px-4">
          <View
            style={{
              width: "100%",
              aspectRatio: 1.4,
              overflow: "hidden",
              borderRadius: 18,
              backgroundColor: "#000",
            }}
          >
            {permission?.granted ? (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                enableTorch={torch}
                barcodeScannerSettings={{ barcodeTypes: ["ean13"] }}
                onCameraReady={() => setCameraOn(true)}
                onBarcodeScanned={({ data }) => {
                  if (/^97[89]\d{10}$/.test(data)) read(data);
                  else {
                    setNotice(
                      "That's the price barcode. Scan the ISBN one, its number starts 978 or 979",
                    );
                    timers.current.push(setTimeout(() => setNotice(""), 3500));
                  }
                }}
              />
            ) : null}
            <ScanFrame looking={cameraOn && !flash} />
            {flash ? (
              <View
                className={`absolute inset-x-0 bottom-0 flex-row items-center gap-2 px-3 py-2 ${flash.tone === "good" ? "bg-award-new" : flash.tone === "same" ? "bg-award-market" : "bg-accent"}`}
              >
                {flash.tone === "good" ? (
                  <CheckIcon color="#16140f" width={18} height={18} />
                ) : null}
                <Text
                  numberOfLines={1}
                  className="flex-1 font-body-semibold text-[14px] text-stamp-ink"
                >
                  {flash.title}
                </Text>
                <Text className="font-mono text-[12px] text-stamp-ink">
                  {flash.note}
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            className="text-center font-body text-[15px]"
            style={{ color: ON_CHROME }}
          >
            {!cameraOn && permission?.granted
              ? "Starting the camera…"
              : notice || "Point at the barcode on the back"}
          </Text>
          <Text
            className="text-center font-body text-[13px] opacity-70"
            style={{ color: ON_CHROME }}
          >
            Keep going for a whole stack.
          </Text>
        </View>
      ) : (
        <View className="gap-3 px-4">
          <Text className="font-body text-[15px]" style={{ color: ON_CHROME }}>
            {!blocked
              ? "Type the 13 digits under the barcode."
              : "The camera's off. Allow it for Manga Tracker in your phone's settings, or type the 13 digits under the barcode."}
          </Text>
          {blocked ? (
            <Button
              label="Allow camera"
              small
              onPress={() => void Linking.openSettings()}
            />
          ) : null}
          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <Input
                value={typed}
                onChangeText={setTyped}
                keyboardType="number-pad"
                placeholder="978…"
                onSubmitEditing={submitTyped}
                autoFocus
                invalid={Boolean(typedError)}
              />
            </View>
            <Button label="Find" kind="primary" onPress={submitTyped} />
          </View>
          {typedError ? (
            <Text className="font-body-medium text-[13.5px] text-accent">
              {typedError}
            </Text>
          ) : null}
        </View>
      )}
      <ScrollView
        className="mt-3 flex-1 rounded-t-2xl bg-paper"
        contentContainerClassName="px-4 pt-3 pb-6"
      >
        {!rows.length ? (
          <Text className="py-6 text-center font-body text-[14px] text-muted">
            Nothing scanned yet
          </Text>
        ) : null}
        {rows.map((row) => (
          <ScanRow
            key={row.key}
            row={row}
            onUndo={() => void undo(row)}
            onAddByTitle={() => router.replace("/add")}
            onEdit={() => setEditing(row.key)}
            onRetry={() => read(row.isbn)}
          />
        ))}
      </ScrollView>
      <View className="flex-row items-center justify-between gap-3 border-t border-line-soft bg-paper px-4 py-3">
        {!blocked ? (
          <Pressable onPress={() => setTyping((on) => !on)} hitSlop={6}>
            <Text className="font-body-medium text-[14px] text-ink border-b pb-[2px] border-ink self-start">
              {typing ? "Use the camera" : "Type the ISBN"}
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Text className="font-mono text-[12.5px] text-muted">
          {rows.length} scanned · {onShelf} added
        </Text>
        <Button label="Done" kind="primary" small onPress={close} />
      </View>
      {editingRow && editingResult && "book" in editingResult ? (
        <ScanEdit
          name={editingResult.name}
          volumes={editingResult.book.volumes}
          asking={
            editingResult.kind === "unsure"
              ? {
                  edition: editingResult.book.edition ?? null,
                  bookNumber: editingResult.book.bookNumber ?? null,
                }
              : undefined
          }
          onClose={() => setEditing(null)}
          onOpenSeries={
            "id" in editingResult
              ? () =>
                  router.push({
                    pathname: "/edit/[id]",
                    params: { id: String(editingResult.id) },
                  })
              : undefined
          }
          onSave={async (change) => {
            const next = await editScan(editingResult, change);
            if (next.kind === "failed") throw new Error("not saved");
            changed.current = true;
            setRows((now) =>
              now.map((r) =>
                r.key === editingRow.key
                  ? { ...r, result: next, undone: false, undoFailed: false }
                  : r,
              ),
            );
          }}
        />
      ) : null}
    </Safe>
  );
}

function ScanRow({
  row,
  onUndo,
  onAddByTitle,
  onEdit,
  onRetry,
}: {
  row: Row;
  onUndo: () => void;
  onAddByTitle: () => void;
  onEdit: () => void;
  onRetry: () => void;
}) {
  const { result } = row;
  const link = (label: string, run: () => void) => (
    <Pressable key={label} onPress={run} hitSlop={6}>
      <Text className="font-body-semibold text-[14px] text-ink border-b pb-[2px] border-ink self-start">
        {label}
      </Text>
    </Pressable>
  );
  if (!result)
    return (
      <View className="border-b border-dotted border-line-soft py-2.5">
        <Text className="font-mono text-[14px] text-ink">{row.isbn}</Text>
        <Text className="font-body text-[13px] text-muted">Looking it up…</Text>
      </View>
    );
  let title = row.isbn;
  if (result.kind === "unsure")
    title = [
      result.name,
      [result.book.edition, result.book.bookNumber].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(" · ");
  else if ("book" in result)
    title = `${result.name} · ${volumesLabel(result.book.volumes)}`;
  let note = "That didn't save";
  if (row.undoFailed) note = "Undo didn't save. Try again";
  else if (row.undone) note = "Undone";
  else if (result.kind === "marked") note = "Marked yours";
  else if (result.kind === "added")
    note = `Added to your shelf with ${volumesLabel(result.book.volumes)}`;
  else if (result.kind === "already") note = "Already yours";
  else if (result.kind === "unknown") note = "Couldn't find this one";
  else if (result.kind === "unsure") note = "Which volumes are in this book?";
  const bad =
    row.undoFailed || result.kind === "unknown" || result.kind === "failed";
  return (
    <View className="flex-row items-center gap-3 border-b border-dotted border-line-soft py-2.5">
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="font-body-medium text-[15px] text-ink"
        >
          {title}
        </Text>
        <Text
          className={`font-body text-[13px] ${bad ? "text-accent" : landed(row) ? "text-ok" : "text-muted"}`}
        >
          {note}
        </Text>
      </View>
      <View className="flex-row gap-3">
        {landed(row) ? link("Undo", onUndo) : null}
        {"id" in result && !row.undone ? link("Edit", onEdit) : null}
        {result.kind === "unsure" ? link("Say which", onEdit) : null}
        {result.kind === "unknown" ? link("Add by title", onAddByTitle) : null}
        {result.kind === "failed" ? link("Try again", onRetry) : null}
      </View>
    </View>
  );
}
