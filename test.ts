import { assertEquals } from "https://deno.land/std@0.118.0/testing/asserts.ts";

import { makeEntry } from "./mod.ts";

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
