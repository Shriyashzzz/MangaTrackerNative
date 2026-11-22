// What a row of "Your books" can do besides its price and date (the web's
// pages/Details/BookActions.tsx): a ⋮ sheet (Lend…, Got it back, Remove
// book), the lend question, and the question before removing several
import Tap from "@/components/Tap";
import { useState } from "react";
import { Modal, Text, TextInput, View } from "react-native";
import {
  HandIcon,
  MoreIcon,
  ReturnIcon,
  TrashIcon,
} from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import Button from "./Button";
import MenuSheet from "./MenuSheet";

export function BookMenu({
  name,
  lentTo,
  onLend,
  onBack,
  onRemove,
}: {
  name: string;
  lentTo: string | null;
  onLend: () => void;
  onBack: () => void;
  onRemove: () => void;
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tap
        feel="round"
        onPress={() => setOpen(true)}
        hitSlop={8}
        accessibilityLabel={`More for ${name}`}
        className="p-2"
      >
        <MoreIcon color={c.inkSoft} width={20} height={20} />
      </Tap>
      <MenuSheet
        open={open}
        onClose={() => setOpen(false)}
        title={name}
        items={[
          ...(lentTo
            ? [
                {
                  label: `Got it back from ${lentTo}`,
                  icon: ReturnIcon,
                  onPress: onBack,
                },
              ]
            : []),
          {
            label: lentTo ? "Lend to someone else…" : "Lend…",
            icon: HandIcon,
            onPress: onLend,
          },
          {
            label: "Remove book",
            icon: TrashIcon,
            onPress: onRemove,
            danger: true,
          },
        ]}
      />
    </>
  );
}

// a question in the middle of the screen, as Android asks one
function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Tap
        feel="none"
        className="flex-1 items-center justify-center bg-black/40 px-6"
        onPress={onClose}
      >
        <Tap
          feel="none"
          className="w-full max-w-[400px] gap-3 rounded-[16px] border border-line-soft bg-card p-5"
          onPress={() => {}}
        >
          <Text className="font-display text-[20px] text-ink">{title}</Text>
          {children}
        </Tap>
      </Tap>
    </Modal>
  );
}

// "Who has Omnibus 12?": one name for one book or several, with the names
// they've lent to before a tap away
export function LendDialog({
  what,
  pastNames,
  onLend,
  onClose,
}: {
  what: string;
  pastNames: string[];
  onLend: (name: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const c = useColors();
  const [who, setWho] = useState("");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const lend = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setFailed(false);
    if (await onLend(trimmed)) onClose();
    else {
      setFailed(true);
      setSaving(false);
    }
  };
  return (
    <Dialog title={`Who has ${what}?`} onClose={onClose}>
      <TextInput
        value={who}
        onChangeText={setWho}
        placeholder="A name"
        placeholderTextColor={c.muted}
        maxLength={40}
        autoFocus
        onSubmitEditing={() => void lend(who)}
        accessibilityLabel="Who has it"
        className="rounded-[2px] border-[1.5px] border-line-soft bg-paper px-3 py-2.5 font-body text-[16px] text-ink"
      />
      {pastNames.length ? (
        <View className="flex-row flex-wrap gap-2">
          {pastNames.map((name) => (
            <Button
              key={name}
              label={name}
              small
              disabled={saving}
              onPress={() => void lend(name)}
            />
          ))}
        </View>
      ) : null}
      {failed ? (
        <Text className="font-body text-[14px] text-accent">
          That didn't save. Try again.
        </Text>
      ) : null}
      <View className="flex-row justify-end gap-3">
        <Button label="Cancel" small disabled={saving} onPress={onClose} />
        <Button
          label={saving ? "Saving…" : "Lend"}
          kind="primary"
          small
          disabled={saving || !who.trim()}
          onPress={() => void lend(who)}
        />
      </View>
    </Dialog>
  );
}

// "Remove 3 books?": what goes, before it goes
export function RemoveBooksDialog({
  count,
  names,
  volumes,
  onRemove,
  onClose,
}: {
  count: number;
  names: string;
  volumes: string;
  onRemove: () => Promise<boolean>;
  onClose: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [failed, setFailed] = useState(false);
  const remove = async () => {
    setRemoving(true);
    setFailed(false);
    if (await onRemove()) onClose();
    else {
      setFailed(true);
      setRemoving(false);
    }
  };
  return (
    <Dialog
      title={`Remove ${count === 1 ? "this book" : `${count} books`}?`}
      onClose={removing ? () => {} : onClose}
    >
      <Text className="font-body text-[15px] text-ink-soft">
        {names} {count === 1 ? "comes" : "come"} off your shelf, with {volumes}.
      </Text>
      {failed ? (
        <Text className="font-body text-[14px] text-accent">
          That didn't remove them. Try again.
        </Text>
      ) : null}
      <View className="flex-row justify-end gap-3">
        <Button label="Cancel" small disabled={removing} onPress={onClose} />
        <Button
          label={removing ? "Removing…" : "Remove"}
          kind="danger"
          small
          disabled={removing}
          onPress={() => void remove()}
        />
      </View>
    </Dialog>
  );
}
