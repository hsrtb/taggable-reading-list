# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Firefox extension (Manifest V3) called "Taggable Reading List". No build step — plain JS loaded directly by Firefox. No tests, no linter, no package manager.

## Loading the extension

In Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → select `manifest.json`.

After editing source files, reload the extension from the same page (or use the Reload button next to the extension entry).

## Architecture

All persistent data lives in `browser.storage.local` under the key `saves`: an array of `{url, title, date, tags?}` objects. Entries are sorted newest-first. Tabs saved in one session share the same `date` value (Unix ms, rounded to the nearest second) — this is how "blocks" are defined.

**`common.js`** — loaded by both the background script and the readinglist page. Provides `storageapi` (alias for `browser.storage.local`) and `is_dup()` (deduplication by URL or title).

**`background.js`** — the service worker. Handles the toolbar button click and the two keyboard commands (`Alt+Shift+2` to show the list, `Alt+Shift+3` to save tabs). `save_tabs()` reads the current window's tabs, deduplicates against existing storage, appends new entries, opens/focuses the reading list page, then closes the saved tabs. There is a two-flag handshake (`console_message_ready` / `page_ready_for_message`) to deal with the race between `browser.tabs.remove()` completing and the reading list page finishing its load — whichever finishes first sets its flag, and whichever finishes second sends the message.

**`readinglist.html` / `readinglist.js`** — the UI. On load, enforces single-instance (redirects to the existing page if a second copy is opened). Renders saves grouped into blocks by date using `generate_table()` / `generate_tr()`. Handles: opening links (click = new tab, shift-click = new window, both delete the entry), per-entry title and tag editing, block-level tag bulk-add, tag-click filtering, text-field filtering, show/hide URLs, import/export (JSON), and a stats view (hostname/tag/date frequency tables).

The readinglist page sends an empty `{}` message on load to signal to the background script that it is ready to receive a console message (the handshake described above).

Tags are stored as arrays of strings; semicolon-separated in the edit input. Tag filtering supports prefix hierarchy: filtering on `foo` also matches `foo/bar`.
