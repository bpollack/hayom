import { DateTime, parseDate } from "./deps.ts";
import { flags } from "./deps.ts";
import { loadConfig } from "./config.ts";
import {
  Entry,
  filterEntries,
  loadEntries,
  makeEntry,
  printEntry,
  saveEntries,
} from "./mod.ts";

function tryDate(d?: string): DateTime | undefined {
  return d ? DateTime.fromJSDate(parseDate(d)) : undefined;
}

function readEntries(entries: Entry[], opts: flags.Args) {
  let from = tryDate(opts.from);
  let to = tryDate(opts.to);
  if (opts.on) {
    const on = tryDate(opts.on);
    if (typeof on !== "object") {
      throw new Error("Bad date");
    }
    [from, to] = [on.startOf("day"), on.endOf("day")];
  }
  const tags = opts._.filter((arg) =>
    typeof arg === "string" && arg.match(/^@./)
  ) as string[];
  const limit = opts.limit;

  const filtered = filterEntries(
    entries,
    {
      from,
      to,
      limit,
      tags,
    },
  );
  let first = true;
  for (const entry of filtered) {
    if (!first && !opts.summary) {
      console.log();
    }
    first = false;
    printEntry(entry, opts.summary);
  }
}

async function edit(body: string, editor: string[]) {
  const temp = Deno.makeTempFileSync({ suffix: ".hayom" });
  try {
    Deno.writeTextFileSync(temp, body);
    const proc = Deno.run({ cmd: [...editor, temp] });
    const status = await proc.status();
    if (status.success) {
      return Deno.readTextFileSync(temp);
    }
  } finally {
    Deno.remove(temp);
  }
}

function printHelp() {
  console.log(`
usage: hayom [-j journal] ...
options:
   --summary | -s: print summary line only
   --from | -f:    from timestamp
   --to | -t:      to timestamp
   --on:           on timestamp
   --count | -n:   number of entries to print
   --journal | -j: journal to use
`);
}

async function main() {
  const args = [...Deno.args];
  const config = loadConfig();

  const opts = flags.parse(args, {
    boolean: ["summary"],
    alias: {
      "s": ["summary"],
      "f": ["from"],
      "t": ["to"],
      "n": ["count"],
      "j": ["journal"],
    },
  });

  if (opts.help) {
    printHelp();
    return;
  }

  const journal = opts.journal ?? config.default;
  const path = config.journals[journal].journal;

  try {
    Deno.lstatSync(path);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      Deno.createSync(path).close();
    } else throw e;
  }

  const entries = loadEntries(path);

  if (
    ["from", "f", "to", "t", "on", "count", "n"].some((arg) => arg in opts) ||
    (opts._.length > 0 &&
      opts._.every((e) => typeof e === "string" && e[0] === "@"))
  ) {
    readEntries(entries, opts);
  } else {
    const rawEntry = opts._.length > 0
      ? opts._.join(" ")
      : await edit("", config.editor.split(/\s/));
    if (rawEntry && rawEntry.trim() !== "") {
      const entry = makeEntry(rawEntry);
      entries.push(entry);
      saveEntries(path, entries);
    }
  }
}

if (import.meta.main) {
  main();
}
