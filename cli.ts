import { DateTime, parseDate } from "./deps.ts";
import { flags } from "./deps.ts";
import { loadConfig } from "./config.ts";
import {
  Entry,
  filterEntries,
  FilterParams,
  makeEntry,
  parseEntries,
  printEntry,
  saveEntries,
} from "./mod.ts";

function tryDate(d?: string): DateTime | undefined {
  return d ? DateTime.fromJSDate(parseDate(d)) : undefined;
}

function printFilteredEntries(
  entries: Entry[],
  params: FilterParams,
  summary: boolean,
) {
  const filtered = filterEntries(entries, params);
  let first = true;
  for (const entry of filtered) {
    if (!first && !summary) {
      console.log();
    }
    first = false;
    printEntry(entry, summary);
  }
}

async function edit(
  body: string,
  editor: string[],
): Promise<string | undefined> {
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
   --count | -n:   number of entries to print
   --from | -f:    from timestamp
   --journal | -j: journal to use
   --on:           on timestamp
   --summary | -s: print summary line only
   --to | -t:      to timestamp
`);
}

async function main() {
  const args = [...Deno.args];
  const config = loadConfig();

  const opts = flags.parse(args, {
    boolean: ["summary"],
    alias: {
      "f": ["from"],
      "j": ["journal"],
      "n": ["count"],
      "s": ["summary"],
      "t": ["to"],
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

  const entries = parseEntries(Deno.readTextFileSync(path));

  if (
    ["from", "f", "to", "t", "on", "count", "n"].some((arg) => arg in opts) ||
    (opts._.length > 0 &&
      opts._.every((e) => typeof e === "string" && e[0] === "@"))
  ) {
    let from = tryDate(opts.from);
    let to = tryDate(opts.to);
    if (opts.on) {
      const on = tryDate(opts.on);
      if (typeof on !== "object") {
        throw new Error("Bad date");
      }
      [from, to] = [on.startOf("day"), on.endOf("day")];
    }
    const tags = <string[]> opts._.filter((arg) =>
      typeof arg === "string" && arg.match(/^@./)
    );
    printFilteredEntries(entries, {
      from,
      to,
      tags,
      limit: opts.count,
    }, opts.summary);
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
