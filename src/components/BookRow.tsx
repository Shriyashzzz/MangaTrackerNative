// One row of "Your books" (the web's pages/Details/BookRow.tsx): the book's
// name, who it's lent to (a chip), what they paid and the day they bought
// it. Lend, Got it back and Remove are in its ⋮ sheet (BookActions). While
// selecting several, a tick takes the ⋮'s place; a long press on the row
// starts selecting. The price is saved when they leave the box
import Tap from "@/components/Tap";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { CheckIcon } from "@/core/components/icons/Icons";
import { centsOf, dayOf } from "@/core/lib/books";
import {
  moneyText,
  rowName,
  type BookRow as Row,
} from "@/core/pages/Details/yourBooksRows";
import { useColors } from "@/lib/colors";
import { BookMenu } from "./BookActions";

export type Purchase = {
  paidCents?: number | null;
  boughtOn?: string | null;
  lentTo?: string | null;
};

// "Nov 3", or "Nov 3, 2025" from another year
const sinceText = (day: string) => {
  const date = new Date(`${day.slice(0, 10)}T12:00:00Z`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...(date.getUTCFullYear() === new Date().getFullYear()
      ? {}
      : { year: "numeric" }),
  });
};
const dayText = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function BookRow({
  row,
  onSave,
  onRemove,
  onLend,
  select,
  onLongPress,
}: {
  row: Row;
  onSave: (row: Row, change: Purchase) => void;
  onRemove: (row: Row) => void;
  onLend: (row: Row) => void;
  select?: { picked: boolean; onToggle: () => void };
  onLongPress?: () => void;
}) {
  const c = useColors();
  // what's typed in the price box, until it's saved; null: the saved one
  const [draft, setDraft] = useState<string | null>(null);
  const [notAnAmount, setNotAnAmount] = useState(false);
  const [pickingDay, setPickingDay] = useState(false);
  const name = rowName(row);
  const savedCents = row.book?.paidCents ?? null;
  const lentTo = row.book?.lentTo ?? null;
  const lentOn = row.book?.lentOn ?? null;
  const boughtOn = dayOf(row.book?.boughtOn);

  const savePrice = (text: string) => {
    const typed = text.trim();
    const cents = typed ? centsOf(typed) : null;
    // not an amount ("twelve"): kept as typed, with a word, never dropped
    if (typed && cents === null) {
      setNotAnAmount(true);
      return;
    }
    setNotAnAmount(false);
    setDraft(null);
    if (cents === savedCents) return;
    onSave(row, { paidCents: cents });
  };

  return (
    <Tap
      onPress={select?.onToggle}
      onLongPress={select ? undefined : onLongPress}
      delayLongPress={400}
      className={`flex-row items-start gap-2 border-b border-dotted border-line-soft py-3 ${select?.picked ? "bg-accent-wash" : ""}`}
    >
      <View className="min-w-0 flex-1 gap-2">
        <View className="flex-row flex-wrap items-baseline gap-x-2">
          <Text className="font-body-medium text-[15.5px] text-ink">
            {name}
          </Text>
          {row.book?.isbn13 ? (
            <Text className="font-mono text-[11.5px] text-muted">
              ISBN {row.book.isbn13}
            </Text>
          ) : null}
        </View>
        {lentTo ? (
          <Tap
            onPress={() => onSave(row, { lentTo: null })}
            accessibilityLabel={`Lent to ${lentTo}. Got it back?`}
            className="self-start rounded-full border-[1.5px] border-accent px-2.5 py-1"
          >
            <Text className="font-mono text-[11.5px] text-accent-ink">
              ● Lent to {lentTo}
              {lentOn ? ` · since ${sinceText(lentOn)}` : ""}
            </Text>
          </Tap>
        ) : null}
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="flex-row items-center rounded-[2px] border-[1.5px] border-line-soft bg-paper px-2">
            <Text className="font-mono text-[13px] text-muted">$</Text>
            <TextInput
              value={draft ?? moneyText(savedCents)}
              onChangeText={setDraft}
              onBlur={() => savePrice(draft ?? moneyText(savedCents))}
              keyboardType="decimal-pad"
              placeholder="paid"
              placeholderTextColor={c.muted}
              accessibilityLabel={`What you paid for ${name}`}
              style={{ minWidth: 72 }}
              className="py-1.5 pl-1 font-mono text-[14px] text-ink"
            />
          </View>
          <Tap
            onPress={() => setPickingDay(true)}
            accessibilityLabel={`The day you bought ${name}`}
            className="rounded-[2px] border-[1.5px] border-line-soft bg-paper px-2.5 py-2"
          >
            <Text
              className={`font-mono text-[13px] ${boughtOn ? "text-ink" : "text-muted"}`}
            >
              {boughtOn ? dayText(boughtOn) : "Bought on"}
            </Text>
          </Tap>
          {boughtOn ? (
            <Tap
              onPress={() => onSave(row, { boughtOn: null })}
              hitSlop={6}
              accessibilityLabel="Clear the day"
            >
              <Text className="font-body text-[13px] text-muted border-b pb-[2px] border-muted self-start">
                clear
              </Text>
            </Tap>
          ) : null}
        </View>
        {notAnAmount ? (
          <Text className="font-body text-[13px] text-accent">
            Type an amount, like 12.99
          </Text>
        ) : null}
      </View>
      {select ? (
        <View
          accessibilityRole="checkbox"
          accessibilityState={{ checked: select.picked }}
          className={`mt-1 h-6 w-6 items-center justify-center rounded-[3px] border-2 ${select.picked ? "border-accent bg-accent" : "border-line bg-paper"}`}
        >
          {select.picked ? (
            <CheckIcon color={c.paper} width={16} height={16} />
          ) : null}
        </View>
      ) : (
        <BookMenu
          name={name}
          lentTo={lentTo}
          onLend={() => onLend(row)}
          onBack={() => onSave(row, { lentTo: null })}
          onRemove={() => onRemove(row)}
        />
      )}
      {pickingDay ? (
        <DateTimePicker
          value={boughtOn ? new Date(`${boughtOn}T12:00:00`) : new Date()}
          mode="date"
          maximumDate={new Date(2099, 11, 31)}
          onChange={(event, date) => {
            setPickingDay(false);
            if (event.type === "set" && date)
              onSave(row, { boughtOn: isoDay(date) });
          }}
        />
      ) : null}
    </Tap>
  );
}
