export type CipherId =
  | "caesar"
  | "xor"
  | "vigenere"
  | "railFence"
  | "atbash"
  | "base64"
  | "reverse"
  | "affine"

export type CaesarConfig = { shift: number }
export type XorConfig = { key: string }
export type VigenereConfig = { keyword: string }
export type RailFenceConfig = { rails: number }
export type AtbashConfig = Record<string, never>
export type Base64Config = Record<string, never>
export type ReverseConfig = Record<string, never>
export type AffineConfig = { a: number; b: number }

export type PipelineNode =
  | { instanceId: string; cipherId: "caesar"; config: CaesarConfig }
  | { instanceId: string; cipherId: "xor"; config: XorConfig }
  | { instanceId: string; cipherId: "vigenere"; config: VigenereConfig }
  | { instanceId: string; cipherId: "railFence"; config: RailFenceConfig }
  | { instanceId: string; cipherId: "atbash"; config: AtbashConfig }
  | { instanceId: string; cipherId: "base64"; config: Base64Config }
  | { instanceId: string; cipherId: "reverse"; config: ReverseConfig }
  | { instanceId: string; cipherId: "affine"; config: AffineConfig }

export interface StepTrace {
  instanceId: string
  cipherId: CipherId
  input: string
  output: string
}

export interface CipherMeta {
  id: CipherId
  label: string
  description: string
  isConfigurable: boolean
}
