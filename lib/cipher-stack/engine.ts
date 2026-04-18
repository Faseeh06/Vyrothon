import type { PipelineNode, StepTrace } from "./types"

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y) {
    const t = y
    y = x % y
    x = t
  }
  return x || 1
}

function modInv(a: number, m: number): number {
  const aa = mod(a, m)
  for (let x = 1; x < m; x++) {
    if ((aa * x) % m === 1) return x
  }
  throw new Error("No modular inverse for affine key a")
}

/** Caesar on A–Z and a–z; other code units unchanged. */
export function caesarTransform(input: string, shift: number, decrypt: boolean) {
  const s = decrypt ? -shift : shift
  let out = ""
  for (const ch of input) {
    const c = ch.codePointAt(0)!
    if (c >= 65 && c <= 90) {
      out += String.fromCodePoint(65 + mod(c - 65 + s, 26))
    } else if (c >= 97 && c <= 122) {
      out += String.fromCodePoint(97 + mod(c - 97 + s, 26))
    } else {
      out += ch
    }
  }
  return out
}

function keyBytes(key: string): Uint8Array {
  return new TextEncoder().encode(key)
}

/** XOR UTF-8; ciphertext as lowercase hex (no spaces). */
export function xorEncryptUtf8(plain: string, key: string): string {
  if (!key) throw new Error("XOR key must be non-empty")
  const data = new TextEncoder().encode(plain)
  const kb = keyBytes(key)
  const out = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i]! ^ kb[i % kb.length]!
  }
  return Array.from(out, (b) => b.toString(16).padStart(2, "0")).join("")
}

export function xorDecryptHex(hex: string, key: string): string {
  if (!key) throw new Error("XOR key must be non-empty")
  const clean = hex.trim().toLowerCase().replace(/\s/g, "")
  if (clean.length % 2 !== 0) throw new Error("XOR ciphertext must be an even-length hex string")
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
    if (Number.isNaN(byte)) throw new Error("Invalid hex in XOR ciphertext")
    bytes[i] = byte
  }
  const kb = keyBytes(key)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = bytes[i]! ^ kb[i % kb.length]!
  }
  return new TextDecoder().decode(bytes)
}

function vigenereKeywordLetters(keyword: string): number[] {
  const shifts: number[] = []
  for (const ch of keyword) {
    const c = ch.codePointAt(0)!
    if (c >= 65 && c <= 90) shifts.push(c - 65)
    else if (c >= 97 && c <= 122) shifts.push(c - 97)
  }
  if (shifts.length === 0) throw new Error("Vigenère keyword must contain at least one letter")
  return shifts
}

/** Vigenère on A–Z and a–z independently; non-letters pass through. */
export function vigenereTransform(input: string, keyword: string, decrypt: boolean) {
  const shifts = vigenereKeywordLetters(keyword)
  let ki = 0
  let out = ""
  for (const ch of input) {
    const c = ch.codePointAt(0)!
    if (c >= 65 && c <= 90) {
      const sh = shifts[ki % shifts.length]!
      const v = decrypt ? -sh : sh
      out += String.fromCodePoint(65 + mod(c - 65 + v, 26))
      ki++
    } else if (c >= 97 && c <= 122) {
      const sh = shifts[ki % shifts.length]!
      const v = decrypt ? -sh : sh
      out += String.fromCodePoint(97 + mod(c - 97 + v, 26))
      ki++
    } else {
      out += ch
    }
  }
  return out
}

/** Rail fence: write in zigzag, read rows concatenated. */
export function railFenceEncrypt(text: string, rails: number): string {
  if (rails < 2) throw new Error("Rail fence needs at least 2 rails")
  const rail: string[][] = Array.from({ length: rails }, () => [])
  let r = 0
  let d = 1
  for (const ch of text) {
    rail[r]!.push(ch)
    if (r === 0) d = 1
    else if (r === rails - 1) d = -1
    r += d
  }
  return rail.map((row) => row.join("")).join("")
}

export function railFenceDecrypt(cipher: string, rails: number): string {
  if (rails < 2) throw new Error("Rail fence needs at least 2 rails")
  const n = cipher.length
  if (n === 0) return ""
  const pattern: number[] = []
  let row = 0
  let dir = 1
  for (let i = 0; i < n; i++) {
    pattern.push(row)
    if (row === 0) dir = 1
    else if (row === rails - 1) dir = -1
    row += dir
  }
  const counts = new Array(rails).fill(0)
  for (const p of pattern) counts[p]++
  let idx = 0
  const railStrs: string[] = []
  for (let rr = 0; rr < rails; rr++) {
    const len = counts[rr]!
    railStrs.push(cipher.slice(idx, idx + len))
    idx += len
  }
  const ptrs = new Array(rails).fill(0)
  let out = ""
  for (let i = 0; i < n; i++) {
    const rr = pattern[i]!
    out += railStrs[rr]![ptrs[rr]!]!
    ptrs[rr]!++
  }
  return out
}

/** Atbash: A↔Z, a↔z; other code units unchanged. */
export function atbashTransform(input: string) {
  let out = ""
  for (const ch of input) {
    const c = ch.codePointAt(0)!
    if (c >= 65 && c <= 90) {
      out += String.fromCodePoint(65 + (25 - (c - 65)))
    } else if (c >= 97 && c <= 122) {
      out += String.fromCodePoint(97 + (25 - (c - 97)))
    } else {
      out += ch
    }
  }
  return out
}

function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ""
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]!)
  }
  return btoa(bin)
}

function base64ToUtf8(b64: string): string {
  const clean = b64.replace(/\s/g, "")
  const bin = atob(clean)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

/** Affine on A–Z and a–z: E(x)=(a*x+b) mod 26; requires gcd(a,26)=1. */
function affineTransform(input: string, a: number, b: number, decrypt: boolean) {
  const aa = mod(a, 26)
  if (gcd(aa, 26) !== 1) throw new Error("Affine key a must be coprime with 26")
  const invA = modInv(aa, 26)
  let out = ""
  for (const ch of input) {
    const c = ch.codePointAt(0)!
    if (c >= 65 && c <= 90) {
      const x = c - 65
      const y = decrypt
        ? mod(invA * mod(x - mod(b, 26), 26), 26)
        : mod(aa * x + mod(b, 26), 26)
      out += String.fromCodePoint(65 + y)
    } else if (c >= 97 && c <= 122) {
      const x = c - 97
      const y = decrypt
        ? mod(invA * mod(x - mod(b, 26), 26), 26)
        : mod(aa * x + mod(b, 26), 26)
      out += String.fromCodePoint(97 + y)
    } else {
      out += ch
    }
  }
  return out
}

function applyForward(node: PipelineNode, input: string): string {
  switch (node.cipherId) {
    case "caesar":
      return caesarTransform(input, node.config.shift, false)
    case "xor":
      return xorEncryptUtf8(input, node.config.key)
    case "vigenere":
      return vigenereTransform(input, node.config.keyword, false)
    case "railFence":
      return railFenceEncrypt(input, node.config.rails)
    case "atbash":
      return atbashTransform(input)
    case "base64":
      return utf8ToBase64(input)
    case "reverse":
      return [...input].reverse().join("")
    case "affine":
      return affineTransform(input, node.config.a, node.config.b, false)
  }
}

function applyInverse(node: PipelineNode, input: string): string {
  switch (node.cipherId) {
    case "caesar":
      return caesarTransform(input, node.config.shift, true)
    case "xor":
      return xorDecryptHex(input, node.config.key)
    case "vigenere":
      return vigenereTransform(input, node.config.keyword, true)
    case "railFence":
      return railFenceDecrypt(input, node.config.rails)
    case "atbash":
      return atbashTransform(input)
    case "base64":
      return base64ToUtf8(input)
    case "reverse":
      return [...input].reverse().join("")
    case "affine":
      return affineTransform(input, node.config.a, node.config.b, true)
  }
}

export function runEncrypt(nodes: PipelineNode[], plaintext: string): StepTrace[] {
  const traces: StepTrace[] = []
  let x = plaintext
  for (const node of nodes) {
    const output = applyForward(node, x)
    traces.push({
      instanceId: node.instanceId,
      cipherId: node.cipherId,
      input: x,
      output,
    })
    x = output
  }
  return traces
}

export function runDecrypt(nodes: PipelineNode[], ciphertext: string): StepTrace[] {
  const traces: StepTrace[] = []
  let x = ciphertext
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]!
    const output = applyInverse(node, x)
    traces.push({
      instanceId: node.instanceId,
      cipherId: node.cipherId,
      input: x,
      output,
    })
    x = output
  }
  return traces
}
