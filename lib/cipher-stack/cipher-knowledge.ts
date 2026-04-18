/**
 * Offline knowledge for CipherStack Assistant — derived from registry, engine, and pipeline rules.
 * No network; used for keyword-scored retrieval only.
 */

export type KnowledgeChunk = {
  id: string
  /** Lowercase tokens for matching */
  keywords: string[]
  title: string
  body: string
}

export const CIPHER_KNOWLEDGE: KnowledgeChunk[] = [
  {
    id: "about-app",
    keywords: [
      "cipherstack",
      "vyro",
      "hackathon",
      "what is",
      "app",
      "offline",
      "assistant",
      "help",
      "hello",
      "hi",
    ],
    title: "CipherStack",
    body: `CipherStack is a node-based cascade encryption demo for the VYRO hackathon. You chain multiple ciphers, run Encrypt (forward through the chain) or Decipher (inverse order). Everything runs in your browser — no server calls for this assistant or the pipeline. The assistant only uses text stored in the app (cipher docs and rules).`,
  },
  {
    id: "pipeline-rules",
    keywords: [
      "pipeline",
      "chain",
      "nodes",
      "minimum",
      "three",
      "3",
      "run",
      "validate",
      "order",
    ],
    title: "Pipeline rules",
    body: `You need at least 3 cipher nodes in the pipeline (hackathon minimum). Order matters: encrypt applies ciphers from first to last in the chain. Decipher runs the inverses in reverse order (last cipher first). In canvas mode, left-to-right flow matches encrypt order; switching to Decipher reverses the arrow direction visually. Drag nodes to reorder; use the node inspector or expanded node to set parameters.`,
  },
  {
    id: "encrypt-decrypt",
    keywords: [
      "encrypt",
      "decrypt",
      "decipher",
      "inverse",
      "direction",
      "reverse order",
    ],
    title: "Encrypt vs decipher",
    body: `Encrypt: plaintext goes in, each cipher transforms the string in pipeline order. Decipher: ciphertext goes in; the engine applies each cipher’s inverse starting from the last node back to the first. Ciphers like Atbash, Reverse, and Base64 have fixed inverses defined in the engine. Affine and Caesar use modular arithmetic inverses where required.`,
  },
  {
    id: "canvas",
    keywords: [
      "canvas",
      "drag",
      "drop",
      "palette",
      "flow",
      "react flow",
      "graph",
    ],
    title: "Canvas mode",
    body: `Drag cipher chips from the palette onto the canvas to create nodes. Click a cipher node to expand it and edit parameters on the board. Plaintext and ciphertext I/O are nodes on the canvas. Zoom and fit controls are on the canvas corner; the minimap shows the overview. Clicking a palette chip without dragging shows a hint — you must drag onto the canvas to place a node.`,
  },
  {
    id: "list",
    keywords: ["list", "layout", "simple", "compact"],
    title: "List layout",
    body: `List mode shows the same pipeline as a vertical stack with full-width cards. Add node picks a cipher from the dropdown then “Add to pipeline”. Canvas and list share the same underlying pipeline state when you switch layouts.`,
  },
  {
    id: "caesar",
    keywords: ["caesar", "shift", "rotation", "rot"],
    title: "Caesar",
    body: `Caesar shifts Latin letters A–Z and a–z by an integer shift N; other characters are unchanged. Decrypt uses the negative shift. Default in new nodes is shift 3. This matches the classic Caesar cipher on the English alphabet.`,
  },
  {
    id: "xor",
    keywords: ["xor", "hex", "exclusive", "key"],
    title: "XOR + hex",
    body: `UTF-8 bytes are XORed with a repeating key (from your key string). Ciphertext is lowercase hexadecimal with no spaces for easy chaining. Decrypt expects valid hex of even length. The key must be non-empty for validation.`,
  },
  {
    id: "vigenere",
    keywords: ["vigenere", "vigenère", "keyword", "polyalphabetic"],
    title: "Vigenère",
    body: `Polyalphabetic substitution: each letter key letter sets a shift (A=0 … Z=25). Only letters advance the keyword index; non-letters pass through without consuming a key letter. The keyword must contain at least one letter.`,
  },
  {
    id: "rail",
    keywords: ["rail", "fence", "zigzag", "transposition", "rails"],
    title: "Rail fence",
    body: `Transposition: plaintext is written in a zigzag down R rails, then ciphertext is read row by row (concatenated). R must be at least 2. Decryption reconstructs the zigzag pattern from length and rails, then reads characters in wave order.`,
  },
  {
    id: "affine",
    keywords: ["affine", "coprime", "mod 26", "a and b", "linear"],
    title: "Affine",
    body: `On letters only: E(x) = (a·x + b) mod 26 per alphabet (upper and lower separate). a must be coprime with 26 (gcd=1), e.g. 1,3,5,7,9,11,15,17,19,21,23,25. Decryption uses the modular inverse of a mod 26. Non-letters are unchanged.`,
  },
  {
    id: "atbash",
    keywords: ["atbash", "mirror", "reverse alphabet"],
    title: "Atbash",
    body: `A↔Z and a↔z mirroring; self-inverse. Non-letters unchanged. No parameters to configure.`,
  },
  {
    id: "base64",
    keywords: ["base64", "base 64", "encoding"],
    title: "Base64",
    body: `Standard Base64 encoding of UTF-8 bytes for encrypt; decoding with whitespace stripped for decrypt. No parameters. Useful for binary-safe text stages in a chain.`,
  },
  {
    id: "reverse",
    keywords: ["reverse", "string reverse"],
    title: "Reverse",
    body: `Reverses the full Unicode string code-point wise as implemented. Self-inverse. No parameters.`,
  },
  {
    id: "validation",
    keywords: [
      "error",
      "validation",
      "cannot run",
      "locked",
      "invalid",
      "affine error",
      "xor empty",
    ],
    title: "Validation messages",
    body: `Common checks: at least 3 nodes; XOR key non-empty; Vigenère keyword has a letter; rail fence rails ≥ 2; Affine a must be coprime with 26. Fix the highlighted issue on the node card or canvas inspector.`,
  },
  {
    id: "traces",
    keywords: ["trace", "intermediate", "step", "in out", "output"],
    title: "Step traces",
    body: `After a successful run, each step records input and output strings for that cipher instance. In list mode this appears on each card; on the canvas it can appear inside the selected expanded cipher node after a run.`,
  },
]
