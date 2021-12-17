# Hayom

Hayom is a rewrite (and gradual reimagining) of [jrnl][jrnl]. At a base level,
it's not written in Python, and therefore doesn't do your choice of breaking
constantly when the system Python gets changed, or having to maintain your own
pyenv/virtualenv/what-have-you. Beyond that, it has more consistent command-line
options, while still retaining a human-first command-line interface.

The file format of Hayom is identical to jrnl, so it's easy to point both tools
to the same file if you wish (at least for now) and use them interchangeably.
Over time, this likely will change in a subtle and fairly backwards-compatible
way, for the basic reason that I want a blank line between the entry title and
the entry body. But for now, you're golden.

## Installation

    deno install -n hayom --allow-env --allow-read --allow-write --allow-run \
        https://git.sr.ht/~bmp/hayom/blob/main/cli.ts

## Usage

Writing entries with Hayom is designed to be as easy as possible so there is no
friction. For short entries, it's trivial to just write what you want directly
on the command line:

    hayom Today, I ate some pancakes. They were delicious.

Everything up to the end of the first sentence (demarcated by `.`, `?`, or `!`)
will be considered the entry title. It's fine to have just a title.

For longer entries, just type `hayom`, and it'll pop up an editor. Hayom will
honor the `editor` setting in its config file first, `$EDITOR` second, and
attempt to use `nano` last.

If there's sufficient interest, I will switch the default to [`ed`][ed].

To read entries, you must specify at least one filtering command. These commands
are:

- `--from`/`-f`: the earliest timestamp to include
- `--to`/`-t`: the last timestamp to include
- `--summary`/`-s`: show just entry titles, not bodies
- `--count`/`-n`: how many entries to show
- `--on`: show entries made on a specific day

You can additionally specify tags (formatted as `@tagname`) to filter entries.

All of the time-based commands take natural English, not just dates. For
example, the following command line gives you all the entries between last month
and this month that were about `@bob`'s `@tpsreport`:

    hayom -f '2 months ago' -t 'this month' @bob @tpsreport

Or, if you're curious what you did last Tuesday, it's as easy as writing:

    hayom --on 'last Tuesday'

## Editing

For any of the filtering commands, if you add `-e`/`--edit`, those entries will
pop up in your editor. There, you can add extra entries, change timestamps,
delete entries, and whatever else floats your boat. For example, to edit
everything I wrote yesterday, I might do

    hayom -f yesterday -e

If you cancel your editor without saving, the journal will be left as-is.

## Multiple Journals

You can have multiple journals. If you do, simply specify the journal you want
with the `--journal` or `-j` command. E.g., if you had `personal` and `work`
journals, you might do

    hayom -j work Finally filed my stupid @tpsreport
    hayom -j personal Sent out a pile of résumés today

If you don't specify a journal, hayom will use the default.

## Configuration

Hayom works fine with no configuration file. If you do that, it will make a
journal called `.hayom` in your `$HOME`. Alternatively, you can create a file
called `$XDG_CONFIG_HOME/hayom/hayom.toml` (Linux and macOS) or
`%APPDATA%\hayom\hayom.toml` (Windows) with your configuration options. An
example configuration file might look like:

    editor = "kak"
    default = "personal"

    [journals.work]
    journal = "/home/benjamin/journals/work.txt"

    [journals.personal]
    journal = "/home/benjamin/journals/personal.txt"

## Submitting Patches

If you feel comfortable using `git send-email`, please kick your patches off to
[the hayom-devel mailing list](mailto:~bmp/hayom-devel@lists.sr.ht). If you
prefer GitHub, I absolutely pay attention to PRs that come in via
[the GitHub mirror][github].

[jrnl]: https://jrnl.sh
[github]: https://github.com/bpollack/hayom
[ed]: https://www.gnu.org/fun/jokes/ed-msg.en.html
