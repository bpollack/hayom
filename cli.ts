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

async function edit(body: string) {
  const temp = Deno.makeTempFileSync({ suffix: ".jrnl" });
  try {
    Deno.writeTextFileSync(temp, body);
    const proc = Deno.run({ cmd: ["kak", temp] });
    const status = await proc.status();
    if (status.success) {
      return Deno.readTextFileSync(temp);
    }
  } finally {
    Deno.remove(temp);
  }
}

async function main() {
  const args = [...Deno.args];
  const config = loadConfig();

  let path;
  if (args.length > 0 && Object.hasOwn(config.journals, args[0])) {
    path = config.journals[args[0]].journal;
    args.shift();
  } else {
    path = config.journals[config.default].journal;
  }

  try {
    Deno.lstatSync(path);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      Deno.createSync(path).close();
    } else throw e;
  }

  const entries = loadEntries(path);
  const opts = flags.parse(args, {
    boolean: ["summary"],
    alias: { "s": ["summary"], "f": ["from"], "t": ["to"], "n": ["count"] },
  });

  if (
    ["from", "f", "to", "t", "on", "count", "n"].some((arg) => arg in opts) ||
    (opts._.length > 0 &&
      opts._.every((e) => typeof e === "string" && e[0] === "@"))
  ) {
    readEntries(entries, opts);
  } else {
    const rawEntry = opts._.length > 0 ? opts._.join(" ") : await edit("");
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
