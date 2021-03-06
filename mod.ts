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

export function parseEntries(bodies: string): Entry[] {
  const entries = bodies.split(/^(\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\] .*)\n/m);
  if (entries[0].trim() === "") entries.splice(0, 1);
  return chunk(entries, 2).map((e) => parseEntry(e[0], e[1].trim()));
}

export function renderEntry(entry: Entry): string {
  let text = `[${entry.date.toFormat(DATE_STRING)}] ${entry.title.trim()}\n`;
  const body = entry.body?.trim();
  if (body != null && body !== "") {
    text += body + "\n";
  }
  return text;
}

export function saveEntries(path: string, entries: Entry[]) {
  let file;
  const encoder = new TextEncoder();
  try {
    entries.sort((a, b) => a.date.valueOf() - b.date.valueOf());
    file = Deno.openSync(path, { write: true });
    Deno.ftruncateSync(file.rid);
    let first = true;
    const nl = new Uint8Array([10]);
    for (const entry of entries) {
      if (!first) {
        file.writeSync(nl);
      }
      first = false;
      file.writeSync(encoder.encode(renderEntry(entry)));
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

export interface FilterParams {
  from?: DateTime;
  to?: DateTime;
  limit?: number;
  tags?: string[];
}

export function matchesFilter(entry: Entry, params: FilterParams) {
  return (params.from ? params.from <= entry.date : true) &&
    (params.to ? params.to >= entry.date : true) &&
    (params.tags
      ? params.tags.every((t) =>
        entry.title.includes(t) || entry.body.includes(t)
      )
      : true);
}

export function filterEntries(entries: Entry[], params: FilterParams): Entry[] {
  const filtered = entries.filter((e) => matchesFilter(e, params));
  return params.limit ? filtered.slice(params.limit) : filtered;
}
