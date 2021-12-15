import { chunk, DateTime } from "./deps.ts";

export interface Entry {
  date: DateTime;
  title: string;
  body: string;
}

export const DATE_STRING = "yyyy-MM-dd HH:mm";

export function printEntry(entry: Entry, summary: boolean | undefined) {
  console.log(
    `[${entry.date.toFormat(DATE_STRING)}] ${entry.title}`,
  );
  if (!summary) console.log(entry.body.trimEnd());
}

function parseEntry(header: string, body: string): Entry {
  const m = header.match(
    /\[(?<date>\d{4}-\d{2}-\d{2} \d{2}:\d{2})\] (?<title>.*)/,
  );
  if (m == null) throw new Error(`Bad header: ${header} (body is ${body})`);
  const [dateChunk, title] = [m.groups!["date"], m.groups!["title"]];
  const date = DateTime.fromFormat(dateChunk, DATE_STRING);
  return { date, title, body };
}

export function loadEntries(path: string): Entry[] {
  const text = Deno.readTextFileSync(path);
  const entries = text.split(/^(\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\] .*)\n/m)
    .slice(1);
  return chunk(entries, 2).map((e) => parseEntry(e[0], e[1]));
}

export function saveEntries(path: string, entries: Entry[]) {
  let file;
  const encoder = new TextEncoder();
  try {
    entries.sort((a, b) => a.date.valueOf() - b.date.valueOf());
    file = Deno.openSync(path, { write: true });
    let first = true;
    const nl = new Uint8Array([10]);
    for (const entry of entries) {
      if (!first) {
        file.writeSync(nl);
      }
      first = false;
      file.writeSync(
        encoder.encode(
          `[${entry.date.toFormat(DATE_STRING)}] ${entry.title.trim()}\n`,
        ),
      );
      const body = entry.body?.trim();
      if (body != null && body !== "") {
        file.writeSync(encoder.encode(body + "\n"));
      }
    }
  } finally {
    file?.close();
  }
}

export function makeEntry(rawText: string, created?: DateTime): Entry {
  const components = rawText.match(/([^.?!]+[.?!]*)(.*)/s);
  const title = components?.[1]?.trim() ?? "";
  const body = components?.[2]?.trim() ?? "";
  const date = created ?? DateTime.now();
  return { date, title, body };
}

interface FilterParams {
  from?: DateTime;
  to?: DateTime;
  limit?: number;
  tags?: string[];
}

export function filterEntries(entries: Entry[], params: FilterParams): Entry[] {
  const filtered = entries.filter((e) =>
    (params.from ? params.from <= e.date : true) &&
    (params.to ? params.to >= e.date : true) &&
    (params.tags
      ? params.tags.every((t) => e.title.includes(t) || e.body.includes(t))
      : true)
  );
  return params.limit ? filtered.slice(params.limit) : filtered;
}
