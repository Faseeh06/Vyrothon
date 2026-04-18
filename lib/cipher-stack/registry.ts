import type { CipherId, CipherMeta, PipelineNode } from "./types"

export const CIPHER_LIBRARY: CipherMeta[] = [
  {
    id: "caesar",
    label: "Caesar",
    description: "Shift Latin letters (A–Z, a–z) by N; other characters unchanged.",
    isConfigurable: true,
  },
  {
    id: "xor",
    label: "XOR + hex",
    description: "UTF-8 XOR with repeating key; output is lowercase hex for chaining.",
    isConfigurable: true,
  },
  {
    id: "vigenere",
    label: "Vigenère",
    description: "Polyalphabetic substitution on letters; keyword letters set shifts.",
    isConfigurable: true,
  },
  {
    id: "railFence",
    label: "Rail fence",
    description: "Zigzag write across R rails, then read rows — classic transposition.",
    isConfigurable: true,
  },
  {
    id: "affine",
    label: "Affine",
    description: "E(x)=(a·x+b) mod 26 on letters; a must be coprime with 26.",
    isConfigurable: true,
  },
  {
    id: "atbash",
    label: "Atbash",
    description: "A↔Z and a↔z mirror; self-inverse.",
    isConfigurable: false,
  },
  {
    id: "base64",
    label: "Base64",
    description: "UTF-8 to standard Base64 text; next node sees printable ASCII.",
    isConfigurable: false,
  },
  {
    id: "reverse",
    label: "Reverse",
    description: "Reverses the full string; self-inverse.",
    isConfigurable: false,
  },
]

export function createNode(cipherId: CipherId, instanceId: string): PipelineNode {
  switch (cipherId) {
    case "caesar":
      return { instanceId, cipherId: "caesar", config: { shift: 3 } }
    case "xor":
      return { instanceId, cipherId: "xor", config: { key: "abc" } }
    case "vigenere":
      return { instanceId, cipherId: "vigenere", config: { keyword: "key" } }
    case "railFence":
      return { instanceId, cipherId: "railFence", config: { rails: 3 } }
    case "affine":
      return { instanceId, cipherId: "affine", config: { a: 5, b: 8 } }
    case "atbash":
      return { instanceId, cipherId: "atbash", config: {} }
    case "base64":
      return { instanceId, cipherId: "base64", config: {} }
    case "reverse":
      return { instanceId, cipherId: "reverse", config: {} }
  }
}
