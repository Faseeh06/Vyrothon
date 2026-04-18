import { CIPHER_KNOWLEDGE } from "./cipher-knowledge"

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0)
}

function scoreChunk(query: string, tokens: string[], chunk: (typeof CIPHER_KNOWLEDGE)[0]): number {
  const q = query.toLowerCase().trim()
  if (!q) return 0
  let s = 0
  const title = chunk.title.toLowerCase()
  const body = chunk.body.toLowerCase()

  for (const kw of chunk.keywords) {
    if (q.includes(kw)) s += 5
    for (const t of tokens) {
      if (t === kw || kw.startsWith(t) || t.startsWith(kw)) s += 2
    }
  }
  for (const t of tokens) {
    if (t.length < 2) continue
    if (title.includes(t)) s += 3
    const n = body.split(t).length - 1
    if (n > 0) s += Math.min(4, n + 1)
  }
  if (q.length > 2 && body.includes(q)) s += 6
  return s
}

const OFFLINE_NOTICE =
  "**Offline** — answers use only built-in CipherStack docs (no external AI or network)."

/**
 * Returns a markdown-flavored reply string for the user query.
 */
export function getCipherAssistantReply(rawQuery: string): string {
  const query = rawQuery.trim()
  if (!query) {
    return [
      OFFLINE_NOTICE,
      "",
      "Ask me about any cipher (Caesar, XOR, Vigenère, rail fence, Affine, Atbash, Base64, Reverse), how the pipeline or canvas works, or encrypt vs decipher.",
    ].join("\n")
  }

  const tokens = tokenize(query)
  const scored = CIPHER_KNOWLEDGE.map((chunk) => ({
    chunk,
    score: scoreChunk(query, tokens, chunk),
  })).sort((a, b) => b.score - a.score)

  const best = scored[0]!
  if (best.score < 2) {
    return [
      OFFLINE_NOTICE,
      "",
      "I couldn’t match that to a specific topic. Try naming a cipher (e.g. **Affine**, **rail fence**), or ask about **pipeline**, **canvas**, **encrypt**, or **decipher**.",
      "",
      "**Available ciphers:** Caesar, XOR + hex, Vigenère, Rail fence, Affine, Atbash, Base64, Reverse.",
    ].join("\n")
  }

  const picked = scored.filter((x) => x.score >= Math.max(2, best.score * 0.45)).slice(0, 3)

  const parts: string[] = [OFFLINE_NOTICE, ""]
  for (const { chunk } of picked) {
    parts.push(`**${chunk.title}**`, chunk.body, "")
  }
  return parts.join("\n").trimEnd()
}
