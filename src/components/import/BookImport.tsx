// Importing a book app's export (the web's pages/Import/BookImport.tsx):
// how to get the file, picking it (or several), the series found and matched
// with AniList, the list to tick, and adding them. The import itself lives
// in the store, so leaving the page and coming back carries on
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import Button from "@/components/Button";
import { H2, TextLink } from "@/components/Page";
import {
  editOf,
  mergeSameSeries,
  withEdits,
  withVolumes,
  type BookSeries,
  type BookSource,
} from "@/core/lib/imports/bookImport";
import { openBookFiles } from "@/core/lib/imports/openBookFiles";
import { shelfKey } from "@/core/lib/titleKey";
import {
  APP_NAME,
  foundLine,
  HOW,
  series,
} from "@/core/pages/Import/bookImportText";
import { pickCsvFiles } from "@/lib/pickFiles";
import { timeLeft, useBookImport } from "@/store/bookImport";
import { useShelf } from "@/store/shelf";
import ImportDone from "./ImportDone";
import ImportList from "./ImportList";
import {
  CompleteSets,
  FilesInImport,
  Note,
  Problem,
  ProgressBar,
  Step,
  StopButton,
  WaitingDots,
} from "./ImportParts";

const LONGEST_NAME_SHOWN = 60;

const Bullet = ({ children }: { children: string }) => (
  <View className="flex-row gap-2">
    <Text className="font-body text-[14.5px] leading-[21px] text-ink-soft">
      •
    </Text>
    <Text className="flex-1 font-body text-[14.5px] leading-[21px] text-ink-soft">
      {children}
    </Text>
  </View>
);

export default function BookImport({ source }: { source: BookSource }) {
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const imported = useBookImport();
  const shelfNow = useShelf((st) => st.manga);
  // the store holds one import; this tab's, or another app's
  const ours = imported.source === source;
  const fileNames = ours ? imported.fileNames : [];
  const found = ours ? imported.found : null;
  const {
    matches,
    choices,
    edits,
    waitingOnAniList,
    progress,
    totals,
    failed,
    finished,
  } = imported;

  useEffect(() => {
    useBookImport.getState().resume(source);
    return () => {
      const s = useBookImport.getState();
      if (s.finished && s.source === source) s.stop();
    };
  }, [source]);

  const open = async () => {
    const picked = await pickCsvFiles();
    if (!picked.length) return;
    const joining = Boolean(ours && found);
    // can't join: say why, rather than taking the files and doing nothing
    if (joining) {
      let why: string | null = null;
      if (imported.progress !== null)
        why =
          "Wait until this import has gone on your shelf, then start a new one with that file.";
      else if (imported.finished)
        why = "This import is done. Start a new one with that file.";
      else if (!imported.books.length)
        why =
          "This import was too big to keep every book, so no more files can join it after a restart. Stop it and import all your files together.";
      if (why) {
        setFileErrors([why]);
        return;
      }
    }
    const { files, kind, errors } = await openBookFiles(
      picked,
      source,
      joining ? imported.fileNames : [],
      joining ? imported.kind : null,
    );
    setFileErrors(errors);
    if (!files.length) return;
    if (joining) useBookImport.getState().addFiles(files);
    else useBookImport.getState().load(source, kind!, files);
  };

  const shown = useMemo(
    () => (found ? withEdits(found, matches, edits) : matches),
    [found, matches, edits],
  );
  const matchOf = (s: BookSeries) => shown.get(s.key);
  const keptApartFrom = (s: BookSeries) => {
    const raw = matches.get(s.key);
    return raw &&
      raw !== "failed" &&
      shown.get(s.key) === null &&
      editOf(s, edits)?.match === undefined
      ? raw.name
      : null;
  };
  const ticked = (s: BookSeries) => {
    const choice = (s.members ?? [s.key])
      .map((k) => choices.get(k))
      .find((c) => c !== undefined);
    if (choice !== undefined) return choice;
    if (s.restore) return true;
    const match = matchOf(s);
    return (
      Boolean(match && match !== "failed") && !s.planned && !s.novelPublisher
    );
  };
  const rows = found
    ? mergeSameSeries(found, (s) => {
        const match = shown.get(s.key);
        return match && match !== "failed" ? match.anilistId : null;
      }).map((s) => withVolumes(s, edits))
    : null;
  const chosen = (rows ?? []).filter(ticked);
  const tickable = (rows ?? []).filter((s) => matchOf(s) !== undefined);
  const allTicked = tickable.length > 0 && tickable.every(ticked);
  const checked = (found ?? []).filter((s) => matches.has(s.key)).length;
  const lookingUp = Boolean(found) && checked < (found?.length ?? 0);

  const start = () => void imported.add(chosen);
  const onShelf = new Set(
    (shelfNow ?? []).map((m) => shelfKey(m.name, Boolean(m.lightNovel))),
  );
  const nameOf = (s: BookSeries) => {
    const match = matchOf(s);
    return match && match !== "failed" ? match.name : s.title;
  };
  const newOnes = chosen.filter(
    (s) => !onShelf.has(shelfKey(nameOf(s), Boolean(s.lightNovel))),
  ).length;
  const leftOut = (rows ?? [])
    .filter((s) => !ticked(s))
    .map(nameOf)
    .map((name) =>
      name.length > LONGEST_NAME_SHOWN
        ? `${name.slice(0, LONGEST_NAME_SHOWN).trimEnd()}…`
        : name,
    );

  if (ours && finished && totals) {
    return (
      <ImportDone totals={totals}>
        {leftOut.length > 0 ? (
          <Note>
            Not added, as they weren't ticked: {leftOut.slice(0, 5).join(", ")}
            {leftOut.length > 5 && ` and ${leftOut.length - 5} more`}
            {leftOut.length > 5 || !leftOut.at(-1)?.endsWith("…") ? "." : ""}
          </Note>
        ) : null}
        <CompleteSets ids={totals.completeSets ?? []} />
      </ImportDone>
    );
  }

  const importing = progress !== null;
  const how = HOW[source];

  return (
    <View className="gap-6">
      <View className="gap-5">
        <Step n={1}>
          <Note>{how.step}</Note>
          {how.points?.map((point) => (
            <Bullet key={point}>{point}</Bullet>
          ))}
          {how.link ? (
            <TextLink href={how.link.href}>{how.link.label}</TextLink>
          ) : null}
        </Step>

        <Step n={2}>
          <Text className="font-body-semibold text-[15px] text-ink">
            {found ? "Add another file" : "Add the file here"}
          </Text>
          <Button
            kind="primary"
            disabled={importing}
            label={found ? "Choose another file" : "Choose your file"}
            onPress={() => void open()}
          />
          <Note>
            {found
              ? source === "csv"
                ? "Another export from the same app joins this one, matched as it goes"
                : `Another ${APP_NAME[source]} export joins this one, matched as it goes`
              : "Pick one, or several. They end in .csv"}
          </Note>
          {fileErrors.map((error) => (
            <Problem key={error}>{error}</Problem>
          ))}
          {ours && imported.stopped && !found ? (
            <Note>
              {imported.stopped.added
                ? `Stopped after adding ${series(imported.stopped.added)}. Anything already added is skipped if you import again.`
                : "Stopped. Nothing was added, and you can import again any time."}
            </Note>
          ) : null}
        </Step>

        {source === "csv" ? (
          <Note>
            Every app exports its own way, so there's no guarantee every book
            comes over exactly right. Check the list before you add it.
          </Note>
        ) : null}
      </View>

      {found ? (
        <View className="gap-4 border-t-2 border-line pt-5">
          <H2>{foundLine(rows!)}</H2>
          <FilesInImport names={fileNames} />

          {lookingUp ? (
            <View className="gap-2">
              <Note>
                {waitingOnAniList ? (
                  <>
                    AniList asked us to slow down, so we're waiting a moment
                    <WaitingDots />
                  </>
                ) : (
                  `Matching with AniList: ${checked} of ${found.length}, ${timeLeft(found.length - checked)}…`
                )}
              </Note>
              <StopButton />
            </View>
          ) : null}

          <View className="flex-row items-center justify-between gap-3">
            {lookingUp ? (
              <Note>Feel free to explore. This takes a while.</Note>
            ) : (
              <View />
            )}
            <Button
              small
              disabled={importing || !tickable.length}
              label={allTicked ? "Clear all" : "Select all"}
              onPress={() =>
                imported.chooseAll(
                  tickable.map((s) => s.key),
                  !allTicked,
                )
              }
            />
          </View>
          <ImportList
            found={found}
            rows={rows!}
            matchOf={matchOf}
            keptApartFrom={keptApartFrom}
            ticked={ticked}
            importing={importing}
            lookingUp={lookingUp}
          />

          {/* one thing a line: what happens to the file */}
          <View className="gap-1 border-t border-line-soft pt-3">
            <Bullet>
              Each series comes in once, however many books it has.
            </Bullet>
            <Bullet>
              Ticked: the manga you bought or read. Untick any to leave out.
            </Bullet>
            <Bullet>The volumes you own keep their gaps.</Bullet>
            <Bullet>
              A box set or omnibus that doesn't say its volumes is marked to
              check.
            </Bullet>
            <Bullet>
              A series already on your shelf only gets its new volumes.
            </Bullet>
            <Bullet>
              Price Paid and Date Purchased columns are kept on each book.
            </Bullet>
          </View>

          {importing ? (
            <View className="gap-3">
              <View className="flex-row items-center justify-between gap-3">
                <Note>
                  {imported.waiting
                    ? `${progress} of ${imported.adding} added. Pausing a minute, then carrying on…`
                    : `Adding ${progress} of ${imported.adding}…`}
                </Note>
                <StopButton />
              </View>
              <ProgressBar done={progress} of={imported.adding} />
            </View>
          ) : (
            <View className="flex-row flex-wrap items-center gap-3">
              <Button
                kind="primary"
                disabled={!chosen.length || lookingUp}
                label={
                  lookingUp
                    ? "Matching…"
                    : newOnes
                      ? `Add ${series(newOnes)} to my shelf`
                      : `Update ${series(chosen.length)} on my shelf`
                }
                onPress={start}
              />
              {/* while matching, Stop import above does this */}
              {!lookingUp ? <StopButton cancel /> : null}
            </View>
          )}

          {failed ? (
            <Problem>
              That stopped partway
              {totals?.added ? `, after adding ${series(totals.added)}` : ""}
              {failed === "Import failed" ? "" : ` (${failed})`}. Try again and
              anything already added will be skipped.
            </Problem>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
