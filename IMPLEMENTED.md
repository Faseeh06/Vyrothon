# What is implemented

## Product

- **Landing** (`/`): **hero**, **Ciphers** grid (eight algorithm cards with short descriptions), **footer** (colophon); links to **`/builder`**.
- **Builder** (`/builder`): **Cascade pipeline** — ordered nodes; output of node *i* is input of *i+1*.
- **Minimum 3 nodes** before Encrypt or Decrypt runs; validation message if fewer.
- **Encrypt**: forward through nodes 1 → *N*; **Decrypt**: inverse operations *N* → 1.
- **Per-node I/O**: after a successful run, each card shows that step’s input and output strings.
- **Reorder / remove**: move up/down, delete node; add from library dropdown.

## Ciphers (8 in library; ≥ 3 configurable types for the brief)

| Node       | Config        | Notes |
|------------|---------------|--------|
| Caesar     | shift         | A–Z / a–z |
| XOR + hex  | key           | UTF-8 XOR → lowercase hex |
| Vigenère   | keyword       | Letter stream |
| Rail fence | rails (≥ 2)   | Zigzag transposition |
| Affine     | a, b          | gcd(a,26)=1; letters only |
| Atbash     | —             | Self-inverse |
| Base64     | —             | UTF-8 ↔ Base64 |
| Reverse    | —             | Self-inverse |

## Code layout

- **`lib/cipher-stack/types.ts`** — node types, traces, metadata.
- **`lib/cipher-stack/engine.ts`** — transforms + `runEncrypt` / `runDecrypt`.
- **`lib/cipher-stack/registry.ts`** — library list + `createNode` defaults.
- **`components/cipher-stack-section.tsx`** — builder UI (used on `/builder`).
- **`app/builder/page.tsx`** — builder route; **`app/page.tsx`** — landing only.
- **`components/home-side-nav.tsx`**, **`work-section.tsx`** (cipher tiles, `#ciphers`), **`colophon-section.tsx`** — landing only.

## Site shell

- **Home** rail nav: Index, Details, link to **Builder** (`/builder`).
- Metadata / readme describe CipherStack / VYRO.

## Not in scope (unless you add later)

- More ciphers (e.g. AES), export/import of pipelines, automated tests in CI, drag-and-drop beyond the linear list.
