import { CIPHER_LIBRARY } from "@/lib/cipher-stack/registry"
import type { CipherId, PipelineNode } from "@/lib/cipher-stack/types"

export const MIN_NODES = 3

export function labelForCipher(id: CipherId) {
  return CIPHER_LIBRARY.find((c) => c.id === id)?.label ?? id
}

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

export function validateNodes(nodes: PipelineNode[]): string | null {
  if (nodes.length < MIN_NODES) {
    return `Add at least ${MIN_NODES} cipher nodes (hackathon minimum).`
  }
  for (const n of nodes) {
    if (n.cipherId === "xor" && !n.config.key.trim()) {
      return "XOR nodes need a non-empty key."
    }
    if (n.cipherId === "vigenere" && !/[a-z]/i.test(n.config.keyword)) {
      return "Vigenère nodes need a keyword with at least one letter."
    }
    if (n.cipherId === "railFence" && (!Number.isFinite(n.config.rails) || n.config.rails < 2)) {
      return "Rail fence needs an integer rails value ≥ 2."
    }
    if (n.cipherId === "affine") {
      const a = ((((n.config.a % 26) + 26) % 26) || 26) % 26
      if (a === 0 || gcd26(a, 26) !== 1) {
        return "Affine key a must be coprime with 26 (try 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25)."
      }
    }
  }
  return null
}

export function moveNode(list: PipelineNode[], index: number, dir: -1 | 1): PipelineNode[] {
  const j = index + dir
  if (j < 0 || j >= list.length) return list
  const next = [...list]
  const t = next[index]!
  next[index] = next[j]!
  next[j] = t
  return next
}

export function patchPipelineNode(nodes: PipelineNode[], instanceId: string, next: PipelineNode): PipelineNode[] {
  return nodes.map((n) => (n.instanceId === instanceId ? next : n))
}
