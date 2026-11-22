// A text box that works wherever it's put. Inside a sheet it has to be the
// sheet's own kind: that's what tells the sheet the keyboard is up, so the
// sheet lifts over it (a plain box there leaves the sheet, and what's being
// typed, hidden behind the keyboard). Anywhere else it's the plain one.
// Anything that can end up in a sheet draws this, not TextInput
import type { ComponentProps } from "react";
import { TextInput } from "react-native";
import { SheetTextInput, useInSheet } from "./Sheet";

export type TextBoxProps = ComponentProps<typeof TextInput>;

export default function TextBox(props: TextBoxProps) {
  const inSheet = useInSheet();
  if (!inSheet) return <TextInput {...props} />;
  // the sheet's box takes the same props; only its ref's type differs
  const Box = SheetTextInput as unknown as typeof TextInput;
  return <Box {...props} />;
}
