# CipherStack — Implementation Guide

This document translates the VYRO hackathon brief into a concrete build plan: architecture, correctness rules, and a checklist you can implement against. The repo currently uses **Next.js (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS** (see `package.json`).

---

## 0. Existing UI shell (use this — do not fight it)

The **CipherStack** experience (VYRO hackathon) splits **landing** and **builder**: `app/page.tsx` is minimal — **`HeroSection`**, cipher grid (**`WorkSection`**, id `ciphers`), **`ColophonSection`**) with **`HomeSideNav`** over `grid-bg`. The pipeline UI lives at **`app/builder/page.tsx`**.

**Visual language (match these patterns):**

- Section frame: `py-32 pl-6 md:pl-28 pr-6 md:pr-12`, optional `scroll-mt-8` when linked from the nav.
- Eyebrow: `font-mono text-[10px] uppercase tracking-[0.3em] text-accent`.
- Display title: `font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight`.
- Body copy: `font-mono text-xs text-muted-foreground leading-relaxed`.
- Cards echo `WorkSection` / shadcn: `border-border/40`, **`rounded-none`** if you want parity with the sharp editorial radius (`--radius: 0rem` in `app/globals.css`).
- Primary CTA rhythm (from `HeroSection`): outline buttons with `border-foreground/20`, `hover:border-accent hover:text-accent`, `font-mono text-xs uppercase tracking-widest`.

**shadcn / Radix primitives** live under `components/ui/`. CipherStack already consumes: `Alert`, `Badge`, `Button`, `Card` (+ header/title/description/content), `Input`, `Label`, `Select`, `Separator`, `Tabs`, `Textarea`. Prefer these over ad-hoc markup so spacing, focus rings, and a11y stay consistent.

**When extending CipherStack:** keep crypto/pipeline logic out of React components (`lib/cipher-stack/*`); use sections only for layout and state wiring.

---

## 1. Product goal (one sentence)

Users visually assemble a **linear cascade** of cipher nodes (minimum **3** nodes), run **Encrypt** or **Decrypt**, and see **per-node inputs/outputs** such that **decrypt(encrypt(plaintext)) === plaintext** for arbitrary text and valid configs.

---

## 2. Non‑negotiable requirements (spec → engineering)

| Requirement | Implementation note |
|---------------|---------------------|
| ≥ **3** nodes to allow a run | Block **Encrypt** / **Decrypt** until `pipeline.length >= 3`; show a clear empty-state message. |
| ≥ **3 configurable** cipher *types* in the library | Caesar, XOR, Vigenère, Rail Fence, Substitution, Columnar, AES, etc. **Base64 / ROT13 / Reverse** are optional extras and **do not** count toward the three. |
| Each cipher is **invertible** | Every node type exposes **forward** and **inverse** using the **same** stored config. |
| **Encrypt** order | Node 1 → Node 2 → … → Node N. |
| **Decrypt** order | Node N → Node N−1 → … → Node 1 (inverse ops). |
| Intermediate visibility | After a run, each node shows **input received** and **output produced** for that step. |
| Node CRUD + reorder | Add from library, remove, move up/down (or drag handles). Insert between nodes. |
| Independent per-node config | Keys, shifts, rails, etc. validated per node type. |

---

## 3. Core architecture (recommended)

Keep three layers separate so new ciphers do not touch the UI.

### 3.1 Cipher registry (plugin model)

Define a small interface (names illustrative):

```ts
type CipherId = "caesar" | "xor" | "vigenere" /* ... */;

interface CipherDefinition<Config> {
  id: CipherId;
  label: string;
  /** If false, do not count toward "3 configurable types" quota in docs/tests. */
  isConfigurable: boolean;
  defaultConfig: Config;
  /** Zod or custom parser — return typed config or field errors. */
  parseConfig(raw: unknown): { ok: true; config: Config } | { ok: false; errors: string[] };
  encrypt(input: string, config: Config): string;
  decrypt(input: string, config: Config): string;
}
```

- **Registry**: `Record<CipherId, CipherDefinition<any>>` + `listCiphers()` for the palette.
- **Adding a cipher**: implement definition + register once; UI reads metadata for forms.

### 3.2 Pipeline model (runtime)

```ts
interface PipelineNode {
  instanceId: string;      // uuid
  cipherId: CipherId;
  config: unknown;          // parsed copy or raw; prefer validated on change
}
```

- Store nodes as an **ordered array** (the visual graph is a **line**). Edges are implicit: `node[i].out → node[i+1].in`.
- If you later add branching, revisit the executor — the hackathon expects a **sequential** chain.

### 3.3 Executor (pure functions)

```ts
interface StepTrace {
  instanceId: string;
  cipherId: CipherId;
  input: string;
  output: string;
}

function runEncrypt(nodes: PipelineNode[], plaintext: string): StepTrace[] { /* ... */ }
function runDecrypt(nodes: PipelineNode[], ciphertext: string): StepTrace[] { /* ... */ }
```

- **Encrypt**: `let x = plaintext`; for each node in order: `y = encrypt(x)`; push trace `{ input: x, output: y }`; `x = y`.
- **Decrypt**: `let x = ciphertext`; for each node **reverse** order: `y = decrypt(x)`; push trace; `x = y`.
- **Validation**: before run, ensure `nodes.length >= 3` and every `parseConfig` succeeds.

This keeps correctness testable without the DOM.

---

## 4. String / bytes contract (avoid subtle bugs)

All ciphers chain as **`string → string`**. Agree on one of these strategies and stick to it:

1. **Text‑only ciphers** (Caesar, Vigenère, substitution): operate on Unicode code points or restrict to ASCII — document the choice.
2. **Binary‑ish ciphers** (XOR, AES): represent binary output as **standard Base64** or **hex** strings between nodes so the next node always receives a string.

**Round‑trip rule**: whatever encoding you use after a binary step, the decrypt path must decode it back to the exact string the previous inverse expects.

---

## 5. Cipher notes (correct inverses)

Implement at least **three configurable** types. Suggested set (pick ≥3):

| Cipher | Config | Forward | Inverse |
|--------|--------|---------|---------|
| Caesar | shift `k` (int) | shift letters | shift `−k` (mod alphabet) |
| XOR | key string (bytes UTF‑8) | XOR UTF‑8 bytes, output hex/Base64 | decode then XOR same key |
| Vigenère | keyword | classic Vigenère | inverse keyword shift |
| Rail fence | rails `r ≥ 2` | zigzag write | inverse permutation |
| Substitution | 26‑letter permutation | map A–Z | inverse map |
| Columnar | keyword | column order | inverse read |
| AES (e.g. Web Crypto / library) | key, IV, mode | encrypt | decrypt — **ECB/CBC** IV handling must match |

**Extras** (non‑configurable for quota): ROT13, Reverse, Base64 — each must still implement `encrypt`/`decrypt` in the same interface for chaining.

---

## 6. UI structure (maps to judging criteria)

Implemented surface: **`components/cipher-stack-section.tsx`** on **`/builder`** (`app/builder/page.tsx`). Landing **`/`** is separate (hero + details only).

| Spec expectation | Where it lives |
|------------------|----------------|
| Library of algorithms | Left column `Card` + `Select` / “Add to pipeline” |
| Sequential pipeline | Ordered `ol` of node `Card`s with “flow” separators |
| Per-node config | `Input` / number fields inside each card |
| Encrypt vs decrypt | `Tabs` (`Encrypt →` / `← Decrypt`) + single **Run pipeline** |
| Intermediate I/O | Per-node panel when a run succeeded (`StepTrace` matched by `instanceId`) |
| Reorder / remove | Chevron `Button`s + trash icon |
| Final output + copy | Read-only `Textarea` + ghost **Copy** |
| ≥ 3 nodes gate | `validateNodes` disables run + `Alert` explains |

Further polish (optional): `ScrollArea` for long pipelines, `Tooltip` on icon buttons, `Sonner` / `Toaster` for copy confirmation if you add the provider to `app/layout.tsx`.

**30‑second clarity**: numbered nodes (1…N), flow separators between cards, tab legend “Encrypt → / ← Decrypt”, header blurb on the section.

---

## 7. State management

- **React `useState` / `useReducer`** is enough for hackathon scope.
- Persist optional: `localStorage` export/import JSON `{ version, nodes: PipelineNode[] }` for “ambition” points.

---

## 8. Testing & demo script (before submit)

Automated (Vitest/Jest or simple Node script importing pure executor):

1. Random plaintext samples (ASCII, Unicode, empty — empty may be invalid by choice).
2. Random valid pipelines (length ≥ 3, mix of ciphers).
3. Assert `decryptPipeline(encryptPipeline(p)) === p`.

Manual:

1. Build 3-node pipeline, run encrypt, copy output, run decrypt, compare.
2. Reorder middle node, confirm traces update and round-trip still holds **after re‑entering** consistent configs.

---

## 9. README (submission)

In `readme.md` (separate from this file), include:

- One‑paragraph product description.
- Tech choices (Next.js, why pure executor, any crypto library).
- **Run locally**: `npm install`, `npm run dev`, URL.
- **Deploy** (Vercel recommended for Next.js).
- Known limitations (e.g. “AES only CBC with random IV per run” if applicable).

---

## 10. Implementation checklist

Use this as a Definition of Done:

- [ ] Pipeline requires **≥ 3** nodes before encrypt/decrypt runs.
- [ ] Library exposes **≥ 3 configurable** cipher types (+ optional extras).
- [ ] Each cipher: validated config UI, forward + inverse, registered in one place.
- [ ] Encrypt walks nodes **forward**; decrypt walks **backward** with inverses.
- [ ] Per-node **input/output** visible after each run.
- [ ] Add / remove / reorder / insert nodes works without breaking ids.
- [ ] Automated **round‑trip** test on representative inputs.
- [ ] `readme.md`: how to run + deploy notes.

---

## 11. Repository file layout (as implemented)

```
lib/cipher-stack/types.ts      # CipherId, PipelineNode, StepTrace, CipherMeta
lib/cipher-stack/engine.ts     # All ciphers + runEncrypt / runDecrypt
lib/cipher-stack/registry.ts   # CIPHER_LIBRARY, createNode
components/cipher-stack-section.tsx  # Builder UI (shadcn + editorial styling)
app/page.tsx                   # Landing: hero + cipher grid + colophon
app/builder/page.tsx           # Full pipeline
components/home-side-nav.tsx   # Index, Ciphers, Footer, Builder
components/work-section.tsx    # Eight cipher tiles (#ciphers)
components/colophon-section.tsx
```

You can later split `cipher-stack-section.tsx` into `components/cipher-stack/*` if the file grows; keep `lib/cipher-stack` pure for tests.

---

## 12. Timeboxing (1h 45m)

1. **0:00–0:25** — Types, registry, 3 ciphers (e.g. Caesar, XOR-as-hex, Vigenère), executor + tests.
2. **0:25–1:05** — Pipeline UI: add/remove/reorder, config forms, run + traces.
3. **1:05–1:30** — Decrypt mode, polish, empty states, copy button.
4. **1:30–1:45** — README, deploy hook, one screen recording path for judges.

If time slips, drop “nice” ciphers before dropping **round‑trip correctness** or **intermediate traces**.

---

*This guide is the single source of truth for scope and architecture while building CipherStack in this repository.*
