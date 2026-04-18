"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Mic, MicOff, Sparkles } from "lucide-react"
import { buildPipelineNodesFromPlan } from "@/lib/cipher-stack/voice-pipeline-plan"
import type { GroqPipelinePlan } from "@/lib/cipher-stack/voice-pipeline-plan"
import type { PipelineNode } from "@/lib/cipher-stack/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type SpeechRecCtor = new () => SpeechRecognition

function getSpeechRecognitionClass(): SpeechRecCtor | null {
  if (typeof window === "undefined") return null
  const w = window as Window &
    typeof globalThis & {
      SpeechRecognition?: SpeechRecCtor
      webkitSpeechRecognition?: SpeechRecCtor
    }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type VoiceApplyPayload = {
  nodes: PipelineNode[]
  inputText: string
  ioMode: "encrypt" | "decrypt"
  run: boolean
}

type CanvasVoiceControlProps = {
  onApply: (payload: VoiceApplyPayload) => void
  className?: string
}

export function CanvasVoiceControl({ onApply, className }: CanvasVoiceControlProps) {
  const [supported, setSupported] = useState<boolean | null>(null)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRun, setAutoRun] = useState(true)
  const recRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    setSupported(!!getSpeechRecognitionClass())
  }, [])

  const stopListening = useCallback(() => {
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null
    setListening(false)
  }, [])

  const startListening = useCallback(() => {
    setError(null)
    const Ctor = getSpeechRecognitionClass()
    if (!Ctor) {
      setError("Speech recognition is not supported in this browser. Try Chrome or Edge.")
      return
    }
    const rec = new Ctor()
    rec.lang = "en-US"
    rec.interimResults = true
    rec.continuous = true
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let text = ""
      for (let i = 0; i < ev.results.length; i++) {
        text += ev.results[i]![0]!.transcript
      }
      setTranscript(text.trim())
    }
    rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
      if (ev.error === "aborted") return
      setError(ev.error === "not-allowed" ? "Microphone permission denied." : `Speech: ${ev.error}`)
      stopListening()
    }
    rec.onend = () => {
      setListening(false)
      recRef.current = null
    }
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      setError("Could not start microphone.")
    }
  }, [stopListening])

  useEffect(() => () => stopListening(), [stopListening])

  const runGroq = useCallback(
    async (text: string) => {
      const t = text.trim()
      if (!t) {
        setError("Add a transcript first (voice or type).")
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/groq-pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: t }),
        })
        const data = (await res.json()) as { plan?: GroqPipelinePlan; error?: string; detail?: string }
        if (!res.ok) {
          setError(data.error ?? data.detail ?? `Request failed (${res.status})`)
          return
        }
        if (!data.plan) {
          setError("No plan returned.")
          return
        }
        const nodes = buildPipelineNodesFromPlan(data.plan)
        onApply({
          nodes,
          inputText: data.plan.plaintext,
          ioMode: data.plan.mode,
          run: autoRun && (data.plan.run_after ?? true),
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error.")
      } finally {
        setLoading(false)
      }
    },
    [autoRun, onApply],
  )

  return (
    <div
      className={cn(
        "space-y-2 border border-border/50 bg-muted/10 p-2.5 font-mono text-[10px] text-muted-foreground",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="text-[9px] uppercase tracking-[0.2em] text-accent">Voice (canvas)</span>
        <label className="flex cursor-pointer items-center gap-1.5 text-[9px] uppercase tracking-widest">
          <input
            type="checkbox"
            checked={autoRun}
            onChange={(e) => setAutoRun(e.target.checked)}
            className="accent-accent"
          />
          Auto-run
        </label>
      </div>
      <p className="leading-snug text-[9px]">
        Speak or type a pipeline, then <span className="text-foreground/90">Build with Groq</span>. Server needs{" "}
        <code className="text-foreground/80">GROQ_API_KEY</code>.
      </p>

      {supported === false && (
        <Alert className="rounded-none border-border/60 bg-card/40 py-2">
          <AlertTitle className="text-[10px]">Speech unavailable</AlertTitle>
          <AlertDescription className="text-[9px]">Type below and use Build with Groq.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="rounded-none py-2">
          <AlertTitle className="text-[10px]">Voice / AI</AlertTitle>
          <AlertDescription className="text-[9px]">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant={listening ? "secondary" : "outline"}
          size="sm"
          className="h-8 rounded-none px-2.5 font-mono text-[9px] uppercase tracking-widest"
          disabled={supported === false}
          onClick={() => (listening ? stopListening() : startListening())}
        >
          {listening ? (
            <>
              <MicOff className="mr-1.5 size-3" /> Stop
            </>
          ) : (
            <>
              <Mic className="mr-1.5 size-3" /> Mic
            </>
          )}
        </Button>
      </div>

      <div className="space-y-1">
        <Label className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          Transcript
        </Label>
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={2}
          placeholder="Voice or type your pipeline…"
          className="min-h-[52px] rounded-none font-mono text-[10px] leading-snug"
          spellCheck={false}
        />
      </div>

      <Button
        type="button"
        size="sm"
        className="h-8 w-full rounded-none font-mono text-[9px] uppercase tracking-widest"
        disabled={loading || !transcript.trim()}
        onClick={() => runGroq(transcript)}
      >
        {loading ? (
          <>
            <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Groq…
          </>
        ) : (
          <>
            <Sparkles className="mr-1.5 size-3.5" /> Build with Groq
          </>
        )}
      </Button>
    </div>
  )
}
