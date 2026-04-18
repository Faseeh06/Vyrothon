# What’s left (optional / polish)

## Submission hygiene

- **Deployed URL** in `readme.md` once you host it (Vercel or similar).
- **Real repo link** in credits / `readme.md` (colophon still has a placeholder line for GitHub).

## Product / UX

- **Insert node at position** — today new nodes append only; “add between” would match the brief’s *insert* wording more literally.
- **Drag-and-drop reorder** — arrows work; DnD would match a “node graph” feel if judges expect it.
- **Guided empty state** — e.g. one-click “add demo pipeline (3 nodes)” for first-time users.

## Depth (ambition points)

- **More ciphers** with inverses (rail fence, substitution, columnar, AES via Web Crypto, …).
- **Config-free extras** (Base64, reverse, ROT13) — do not count toward the “3 configurable” rule but improve demos.
- **Export / import** pipeline JSON (localStorage or file download).
- **Stronger validation UX** — field-level errors, disable run until configs parse, clearer XOR hex mistakes.

## Quality

- **Automated round-trip tests** (`vitest` or similar) calling `runEncrypt` / `runDecrypt` on random pipelines and plaintext.
- **CI** — `lint` + `build` (and tests if added) on push.

## Docs

- Keep **`IMPLEMENTED.md`** / **`REMAINING.md`** in sync when you ship or cut scope.
