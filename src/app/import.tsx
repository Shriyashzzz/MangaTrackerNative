// Import your list, as the web's pages/Import/Import.tsx: where it comes
// from (MyAnimeList's export file, an AniList or Kitsu username, or a book
// app's files), what was found, which lists to add, then adding them
import { openOutside } from "@/lib/openOutside";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Button from "@/components/Button";
import { Field, Input } from "@/components/Field";
import Page, { H2 } from "@/components/Page";
import BookImport from "@/components/import/BookImport";
import CheckRow from "@/components/import/CheckRow";
import ImportDone from "@/components/import/ImportDone";
import {
  Note,
  Problem,
  ProgressBar,
  Step,
} from "@/components/import/ImportParts";
import type { AccountSource } from "@/core/lib/imports/accountImport";
import type { BookSource } from "@/core/lib/imports/bookImport";
import { MAL_LISTS } from "@/core/lib/imports/malImport";
import { useListImport } from "@/core/pages/Import/useListImport";
import { pickMalFile } from "@/lib/pickFiles";
import { look } from "@/lib/platformLook";
import { bookImportBusy, savedSource, useBookImport } from "@/store/bookImport";

const EXPORT_PAGE = "https://myanimelist.net/panel.php?go=export";

const series = (n: number) => `${n} series`;

type Source = "mal" | AccountSource | BookSource;
const BOOK_SOURCES: Source[] = ["goodreads", "bookcatalogue", "csv"];
const isBookSource = (s: Source): s is BookSource => BOOK_SOURCES.includes(s);

const SOURCES: { id: Source; label: string }[] = [
  { id: "mal", label: "MyAnimeList" },
  { id: "anilist", label: "AniList" },
  { id: "kitsu", label: "Kitsu" },
  { id: "goodreads", label: "Goodreads" },
  { id: "bookcatalogue", label: "Book Catalogue" },
  { id: "csv", label: "Other app (CSV)" },
];

export default function ImportScreen() {
  const [source, setSource] = useState<Source>(
    () => useBookImport.getState().source ?? savedSource() ?? "mal",
  );
  const [username, setUsername] = useState("");
  const list = useListImport();
  const {
    items,
    fileError,
    finding,
    unticked,
    progress,
    waiting,
    totals,
    failed,
    chosen,
    countOf,
    toggle,
    start,
  } = list;
  const bookBusy = useBookImport(bookImportBusy);
  const bookSource = useBookImport((s) => s.source);

  const pickSource = (next: Source) => {
    setSource(next);
    list.reset();
  };
  const findList = () => {
    if (source === "anilist" || source === "kitsu")
      void list.findList(source, username);
  };
  const openFile = async () => {
    const file = await pickMalFile();
    if (file) await list.openFile(file);
  };

  const importing = progress !== null;
  // another source can't start while one is being added
  let busySource: Source | null = null;
  if (importing) busySource = source;
  else if (bookBusy) busySource = bookSource;

  return (
    <Page title="Import your list">
      {list.finished && totals ? (
        <ImportDone totals={totals} />
      ) : (
        <>
          <View accessibilityLabel="Where your list is" className="gap-2">
            <View className="flex-row flex-wrap gap-2">
              {SOURCES.map((s) => {
                const on = source === s.id;
                const off = busySource !== null && s.id !== busySource;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => s.id !== source && pickSource(s.id)}
                    disabled={off}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on, disabled: off }}
                    className={`min-h-[40px] grow basis-[30%] items-center justify-center overflow-hidden border px-2 ${look.buttonRadius} ${on ? "border-accent bg-accent" : "border-line-soft"} ${off ? "opacity-40" : ""}`}
                  >
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                      className={`text-center font-body-semibold text-[13.5px] ${on ? "text-on-accent" : "text-ink"}`}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {busySource ? (
              <Note>Switch apps once this import is done.</Note>
            ) : null}
          </View>

          {isBookSource(source) ? (
            <BookImport key={source} source={source} />
          ) : (
            <>
              {source !== "mal" ? (
                <Step n={1}>
                  <Field
                    label={`Your ${source === "anilist" ? "AniList" : "Kitsu"} username`}
                    error={fileError || undefined}
                  >
                    <Note>
                      We read your public manga list from{" "}
                      {source === "anilist" ? "AniList" : "Kitsu"}. No password,
                      and nothing changes there.
                    </Note>
                    <Input
                      value={username}
                      onChangeText={setUsername}
                      autoCorrect={false}
                      autoCapitalize="none"
                      editable={!finding && !importing}
                      maxLength={60}
                      returnKeyType="go"
                      onSubmitEditing={findList}
                    />
                  </Field>
                  <Button
                    kind="primary"
                    disabled={finding || importing || !username.trim()}
                    label={finding ? "Finding…" : "Find my list"}
                    onPress={findList}
                  />
                </Step>
              ) : (
                <View className="gap-5">
                  <Step n={1}>
                    <Note>
                      On the export page, choose Manga and press Export.
                    </Note>
                    <Button
                      label="Open the export page"
                      onPress={() => openOutside(EXPORT_PAGE)}
                    />
                  </Step>
                  <Step n={2}>
                    <Button
                      kind="primary"
                      disabled={importing}
                      label="Choose your file"
                      onPress={() => void openFile()}
                    />
                    <Note>It's the one ending in .xml.gz</Note>
                    {fileError ? <Problem>{fileError}</Problem> : null}
                  </Step>
                </View>
              )}

              {items ? (
                <View className="gap-4 border-t-2 border-line pt-5">
                  <View>
                    <H2>{series(items.length)} found</H2>
                    {list.fileName ? (
                      <Text className="font-mono text-[13px] text-ink-soft">
                        from {list.fileName}
                      </Text>
                    ) : null}
                  </View>

                  <View accessibilityLabel="Lists to add">
                    {MAL_LISTS.filter((l) => countOf(l.status) > 0).map((l) => (
                      <CheckRow
                        key={l.status}
                        checked={!unticked.has(l.status)}
                        disabled={importing}
                        onToggle={() => toggle(l.status)}
                        label={l.label}
                      >
                        <View className="flex-row items-baseline justify-between gap-3">
                          <Text className="font-body text-[16px] text-ink">
                            {l.label}
                          </Text>
                          <Text className="font-mono text-[14px] text-muted">
                            {countOf(l.status)}
                          </Text>
                        </View>
                      </CheckRow>
                    ))}
                  </View>

                  <Note>
                    Anything already on your shelf gets skipped. Volumes you've
                    read count as volumes you own, unless your list says what
                    you own. You can change that on each manga's page.
                  </Note>

                  {importing ? (
                    <View className="gap-3">
                      <Note>
                        {waiting
                          ? `${progress} of ${chosen.length} added. Pausing a minute, then carrying on…`
                          : `Adding ${progress} of ${chosen.length}…`}
                      </Note>
                      <ProgressBar done={progress} of={chosen.length} />
                    </View>
                  ) : (
                    <Button
                      kind="primary"
                      disabled={!chosen.length}
                      label={`Add ${series(chosen.length)} to my shelf`}
                      onPress={() => void start()}
                    />
                  )}

                  {failed ? (
                    <Problem>
                      That stopped partway
                      {totals?.added
                        ? `, after adding ${series(totals.added)}`
                        : ""}
                      . Try again and anything already added will be skipped.
                    </Problem>
                  ) : null}
                </View>
              ) : null}
            </>
          )}
        </>
      )}
    </Page>
  );
}
