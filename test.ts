import { assertEquals } from "https://deno.land/std@0.145.0/testing/asserts.ts";

import { makeEntry, parseEntries, renderEntry } from "./mod.ts";

Deno.test("make sure we can generate simple entries", () => {
  const raw = "This is a simple test";
  const entry = makeEntry(raw);
  assertEquals(entry.title, "This is a simple test");
  assertEquals(entry.body, "");
});

Deno.test("make sure we can generate entries with a period", () => {
  const raw = "This is a simple test.";
  const entry = makeEntry(raw);
  assertEquals(entry.title, "This is a simple test.");
  assertEquals(entry.body, "");
});

Deno.test("make sure we can generate complex entries", () => {
  const raw = "This is a simple test!  How can you not understand that?!";
  const entry = makeEntry(raw);
  assertEquals(entry.title, "This is a simple test!");
  assertEquals(entry.body, "How can you not understand that?!");
});

Deno.test("test multiline entries", () => {
  const raw =
    "This is a simple test?!  I guess so.\nBut how can you be sure?  What should we\nbe doing?!";
  const entry = makeEntry(raw);
  assertEquals(entry.title, "This is a simple test?!");
  assertEquals(
    entry.body,
    "I guess so.\nBut how can you be sure?  What should we\nbe doing?!",
  );
});

Deno.test("test multiparse with a single entry", () => {
  const raw =
    "This is a simple test?!  I guess so.\nBut how can you be sure?  What should we\nbe doing?!";
  const cleanEntry = makeEntry(raw);
  const parsedEntry = parseEntries(renderEntry(cleanEntry))[0];
  assertEquals(parsedEntry.title, "This is a simple test?!");
  assertEquals(
    parsedEntry.body,
    "I guess so.\nBut how can you be sure?  What should we\nbe doing?!",
  );
});

Deno.test("round trip of multiple entries", () => {
  const multiple = `[1999-12-31 23:59] This is it!
It's about to be the new century! I can't wait!

[2000-01-01 00:00] Oh Cthulhu oh crap oh spaghetti
Everything has collapsed, society is imploding.

[2000-01-01 00:01] Every man for himself.
That means you're on your own, my little hamster.  Good luck and godspeed.
`;
  const entries = parseEntries(multiple);
  assertEquals(entries.length, 3);
  assertEquals(entries[0].title, "This is it!");
  assertEquals(
    entries[1].body,
    "Everything has collapsed, society is imploding.",
  );
  assertEquals(entries.map(renderEntry).join("\n"), multiple);
});
