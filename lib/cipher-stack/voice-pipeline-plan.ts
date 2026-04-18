import { z } from "zod"
import { MIN_NODES } from "@/lib/cipher-stack/pipeline-helpers"
import { createNode } from "@/lib/cipher-stack/registry"
import type { CipherId, PipelineNode } from "@/lib/cipher-stack/types"

const cipherIds = [
  "caesar",
  "xor",
  "vigenere",
  "railFence",
  "affine",
  "atbash",
  "base64",
  "reverse",
] as const

export const GroqCipherItemSchema = z.object({
  id: z.enum(cipherIds),
  shift: z.number().optional(),
  key: z.string().optional(),
  keyword: z.string().optional(),
  rails: z.number().optional(),
  a: z.number().optional(),
  b: z.number().optional(),
})

export const GroqPipelinePlanSchema = z.object({
  plaintext: z.string(),
  mode: z.enum(["encrypt", "decrypt"]),
  run_after: z.boolean().optional().default(true),
  ciphers: z.array(GroqCipherItemSchema).min(1),
})

export type GroqPipelinePlan = z.infer<typeof GroqPipelinePlanSchema>

function gcd26(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y) {
    const t = y
    y = x % y
    x = t
  }
  return x || 1
}

/** Ensure Affine a is valid; fallback to 5 */
function sanitizeAffineA(a: number): number {
  const aa = ((((a % 26) + 26) % 26) || 26) % 26
  if (aa === 0 || gcd26(aa, 26) !== 1) return 5
  return aa
}

/**
 * Turn a validated Groq plan into pipeline nodes (≥ MIN_NODES), with safe defaults.
 */
export function buildPipelineNodesFromPlan(plan: GroqPipelinePlan): PipelineNode[] {
  const nodes: PipelineNode[] = []
  for (const item of plan.ciphers) {
    const instanceId = crypto.randomUUID()
    const base = createNode(item.id as CipherId, instanceId)
    switch (item.id) {
      case "caesar":
        nodes.push({
          ...base,
          cipherId: "caesar",
          config: { shift: Number.isFinite(item.shift) ? item.shift! : 3 },
        })
        break
      case "xor":
        nodes.push({
          ...base,
          cipherId: "xor",
          config: { key: (item.key && item.key.trim()) || "key" },
        })
        break
      case "vigenere":
        nodes.push({
          ...base,
          cipherId: "vigenere",
          config: { keyword: item.keyword && /[a-z]/i.test(item.keyword) ? item.keyword : "key" },
        })
        break
      case "railFence":
        nodes.push({
          ...base,
          cipherId: "railFence",
          config: {
            rails: Math.max(2, Number.isFinite(item.rails) ? Math.floor(item.rails!) : 3),
          },
        })
        break
      case "affine":
        nodes.push({
          ...base,
          cipherId: "affine",
          config: {
            a: sanitizeAffineA(Number.isFinite(item.a) ? item.a! : 5),
            b: Number.isFinite(item.b) ? Math.floor(item.b!) : 8,
          },
        })
        break
      case "atbash":
        nodes.push(base)
        break
      case "base64":
        nodes.push(base)
        break
      case "reverse":
        nodes.push(base)
        break
    }
  }

  const padIds: CipherId[] = ["reverse", "atbash", "base64"]
  let pi = 0
  while (nodes.length < MIN_NODES) {
    const id = padIds[pi % padIds.length]!
    pi++
    nodes.push(createNode(id, crypto.randomUUID()))
  }

  return nodes
}
