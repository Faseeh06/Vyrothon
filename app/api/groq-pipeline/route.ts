import { NextResponse } from "next/server"
import { GroqPipelinePlanSchema } from "@/lib/cipher-stack/voice-pipeline-plan"

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

const SYSTEM = `You are CipherStack's voice pipeline planner. The user speaks in natural language. Infer:
- plaintext: the string to run through the pipeline (or ciphertext if mode is decrypt).
- mode: "encrypt" or "decrypt".
- run_after: true if they want to run immediately after building (default true).
- ciphers: ordered list of ciphers to chain (encrypt: first to last; decrypt is applied in reverse by the app).

You MUST return ONLY valid JSON (no markdown) with this exact shape:
{
  "plaintext": string,
  "mode": "encrypt" | "decrypt",
  "run_after": boolean,
  "ciphers": [
    { "id": "caesar", "shift": number } |
    { "id": "xor", "key": string } |
    { "id": "vigenere", "keyword": string } |
    { "id": "railFence", "rails": number } |
    { "id": "affine", "a": number, "b": number } |
    { "id": "atbash" } |
    { "id": "base64" } |
    { "id": "reverse" }
  ]
}

Rules:
- Include AT LEAST 3 ciphers in "ciphers" (the app requires a minimum of three). Add simple ciphers like reverse, atbash, or base64 if the user asked for fewer.
- Affine: "a" must be coprime with 26 (use 1,3,5,7,9,11,15,17,19,21,23,25 only).
- railFence: rails >= 2.
- xor: non-empty key string.
- vigenere: keyword must contain at least one letter.

Cipher ids (exact strings): caesar, xor, vigenere, railFence, affine, atbash, base64, reverse.`

export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY
  if (!key?.trim()) {
    return NextResponse.json({ error: "GROQ_API_KEY is not configured on the server." }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const transcript =
    typeof body === "object" && body !== null && "transcript" in body
      ? String((body as { transcript: string }).transcript ?? "").trim()
      : ""

  if (!transcript) {
    return NextResponse.json({ error: "Missing transcript." }, { status: 400 })
  }

  const model = process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant"

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `User said (may be noisy speech-to-text):\n"""${transcript}"""`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json(
        { error: `Groq API error (${res.status})`, detail: errText.slice(0, 500) },
        { status: 502 },
      )
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const raw = data.choices?.[0]?.message?.content
    if (!raw) {
      return NextResponse.json({ error: "Empty response from Groq." }, { status: 502 })
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: "Groq did not return valid JSON.", raw: raw.slice(0, 400) }, { status: 502 })
    }

    const plan = GroqPipelinePlanSchema.safeParse(parsed)
    if (!plan.success) {
      return NextResponse.json(
        { error: "Plan validation failed.", issues: plan.error.flatten(), raw: parsed },
        { status: 422 },
      )
    }

    return NextResponse.json({ plan: plan.data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed."
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
