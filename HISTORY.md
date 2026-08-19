# About this repository's history

Watify was built between **July 2025 and October 2025**, with a deployment push in
April 2026 and a landing-page and refactoring pass in June–August 2026.

During the original build I committed infrequently — large batches of work landed
in a handful of commits, so the day-to-day shape of the project was never recorded
in git. This repository restores that detail. **Every commit here corresponds to a
file state that actually existed on this machine at the timestamp shown.** Nothing
was invented to pad the history.

## Where the history comes from

Two sources of evidence, replayed together in timestamp order:

1. **The original repository's commits.** Their trees, messages, and author dates
   are preserved exactly.
2. **VS Code local history.** VS Code keeps a snapshot of every file save, with a
   timestamp. 101 of these snapshots survived for tracked project files, covering
   35 files across 11 working days in July–October 2025. Each one is a real
   intermediate state of a real file at a real moment.

## How the trees were assembled

The project state at any time *T* is the tree of the most recent real commit at or
before *T*, with each file replaced by its most recent snapshot at or before *T*.

Two consequences worth stating plainly:

- A file with no snapshot between two real commits is carried forward unchanged.
  That is an assumption, not evidence — the file may have been edited in ways no
  snapshot captured.
- Snapshots taken before the first commit (31 July – 1 August 2025) are replayed
  against a tree containing only the files known to exist at that point, so the
  earliest commits show a deliberately partial project.

## Commit messages

Commits that correspond to an original commit keep its original message. Where the
saved snapshots had already produced exactly the tree that a later commit
introduced, that commit's hand-written message was moved onto the snapshot commit
that first reached the state, rather than being dropped.

The remaining messages are generated descriptions of the actual diff (`Add`,
`Expand`, `Update`, plus the names of functions introduced). They describe what
changed; they are not what I typed at the time, because at the time I did not
commit these steps at all.

## What was left out

- Real credentials. A Supabase database password and project reference appeared in
  committed config files in the original repository. Both are replaced with
  placeholders throughout this history, so the values do not appear in any commit
  here. (They should still be treated as compromised and rotated — they were
  public in the original repository.)
- Environment files (`.env`, `backend/.env`, `frontend/.env`) — gitignored, never
  committed, and excluded here.
- Roughly 28 one-off WhatsApp debugging scripts that were written, saved, and
  never committed (`diagnose-whatsapp-issue.js`, `test-group-workarounds.js`,
  `test-broadcast-messaging.js`, and similar). They exist in the snapshot record
  and are a fair picture of how much of this project was spent fighting the
  WhatsApp Web API, but including them would leave files in the tree that the
  project never actually carried.

## Verification

The reconstruction is checked two ways:

- Every commit that corresponds to an original commit reproduces that commit's
  tree byte-for-byte (modulo the credential redaction above).
- The final tree matches the current state of the project exactly.
