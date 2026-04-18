"use client"

import dynamic from "next/dynamic"
import { useCallback, useMemo, useState } from "react"
import { LayoutGrid, List } from "lucide-react"
import { runDecrypt, runEncrypt } from "@/lib/cipher-stack/engine"
import { createNode } from "@/lib/cipher-stack/registry"
import { validateNodes } from "@/lib/cipher-stack/pipeline-helpers"
import type { CipherId, PipelineNode, StepTrace } from "@/lib/cipher-stack/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CanvasVoiceControl, type VoiceApplyPayload } from "@/components/canvas-voice-control"
import { CipherDragPalette } from "@/components/cipher-drag-palette"
import { CipherNodeCard } from "@/components/cipher-node-card"
import { CipherPipelineSimple } from "@/components/cipher-pipeline-simple"

const CipherPipelineCanvas = dynamic(
  () => import("@/components/cipher-pipeline-canvas").then((m) => m.CipherPipelineCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(520px,60vh)] min-h-[280px] items-center justify-center border border-border/40 bg-muted/20 font-mono text-xs text-muted-foreground">
        Loading canvas…
      </div>
    ),
  },
)

function PipelineAlerts({
  validationMessage,
  runError,
}: {
  validationMessage: string | null
  runError: string | null
}) {
  return (
    <>
      {validationMessage && (
        <Alert className="rounded-none border-border/60 bg-card/50">
          <AlertTitle className="font-mono text-xs uppercase tracking-widest">Pipeline locked</AlertTitle>
          <AlertDescription className="font-mono text-xs">{validationMessage}</AlertDescription>
        </Alert>
      )}
      {runError && (
        <Alert variant="destructive" className="rounded-none">
          <AlertTitle className="font-mono text-xs uppercase tracking-widest">Run error</AlertTitle>
          <AlertDescription className="font-mono text-xs">{runError}</AlertDescription>
        </Alert>
      )}
    </>
  )
}

function FinalOutputBlock({
  finalOutput,
  copied,
  onCopy,
}: {
  finalOutput: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Final output
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-none font-mono text-[10px] uppercase tracking-widest"
          onClick={onCopy}
          disabled={!finalOutput}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <Textarea
        readOnly
        value={finalOutput}
        placeholder="Run the pipeline to see ciphertext or recovered plaintext."
        rows={3}
        className="rounded-none font-mono text-sm text-muted-foreground"
      />
    </div>
  )
}

export function CipherStackSection() {
  const [builderView, setBuilderView] = useState<"simple" | "canvas">("canvas")
  const [nodes, setNodes] = useState<PipelineNode[]>([])
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null)
  const [addCipher, setAddCipher] = useState<CipherId>("caesar")
  const [pendingDrop, setPendingDrop] = useState<{ id: string; x: number; y: number } | null>(null)
  const [ioMode, setIoMode] = useState<"encrypt" | "decrypt">("encrypt")
  const [inputText, setInputText] = useState("hello")
  const [lastRun, setLastRun] = useState<{
    direction: "encrypt" | "decrypt"
    traces: StepTrace[]
  } | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  /** Bumps after each successful run so the canvas output node always re-renders (decrypt included). */
  const [runEpoch, setRunEpoch] = useState(0)

  const traceById = useMemo(() => {
    const m = new Map<string, StepTrace>()
    lastRun?.traces.forEach((t) => m.set(t.instanceId, t))
    return m
  }, [lastRun])

  const finalOutput = useMemo(() => {
    if (!lastRun?.traces?.length) return ""
    const last = lastRun.traces[lastRun.traces.length - 1]
    return typeof last?.output === "string" ? last.output : ""
  }, [lastRun])

  const validationMessage = validateNodes(nodes)

  const handleRemoveNode = useCallback((instanceId: string) => {
    setNodes((prev) => prev.filter((n) => n.instanceId !== instanceId))
    setLastRun(null)
    setRunError(null)
    setSelectedCanvasId((s) => (s === instanceId ? null : s))
  }, [])

  const handleAdd = () => {
    const id = crypto.randomUUID()
    setNodes((prev) => [...prev, createNode(addCipher, id)])
    setLastRun(null)
    setRunError(null)
  }

  const handleDropCipher = useCallback((cipherId: CipherId, position: { x: number; y: number }) => {
    const id = crypto.randomUUID()
    setPendingDrop({ id, x: position.x, y: position.y })
    setNodes((prev) => [...prev, createNode(cipherId, id)])
    setSelectedCanvasId(id)
    setLastRun(null)
    setRunError(null)
  }, [])

  const handleClearCanvas = useCallback(() => {
    setNodes([])
    setInputText("")
    setLastRun(null)
    setRunError(null)
    setSelectedCanvasId(null)
    setPendingDrop(null)
  }, [])

  const runPipelineNow = useCallback(
    (pipelineNodes: PipelineNode[], text: string, mode: "encrypt" | "decrypt") => {
      setRunError(null)
      const v = validateNodes(pipelineNodes)
      if (v) {
        setRunError(v)
        setLastRun(null)
        return
      }
      try {
        if (mode === "encrypt") {
          setLastRun({ direction: "encrypt", traces: runEncrypt(pipelineNodes, text) })
        } else {
          setLastRun({ direction: "decrypt", traces: runDecrypt(pipelineNodes, text) })
        }
        setRunEpoch((e) => e + 1)
      } catch (e) {
        setLastRun(null)
        setRunError(e instanceof Error ? e.message : "Pipeline failed.")
      }
    },
    [],
  )

  const handleRun = useCallback(() => {
    runPipelineNow(nodes, inputText, ioMode)
  }, [nodes, inputText, ioMode, runPipelineNow])

  const copyFinal = useCallback(async () => {
    if (!finalOutput) return
    try {
      await navigator.clipboard.writeText(finalOutput)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setRunError("Could not copy to clipboard.")
    }
  }, [finalOutput])

  const handleVoiceApply = useCallback(
    (p: VoiceApplyPayload) => {
      setNodes(p.nodes)
      setInputText(p.inputText)
      setIoMode(p.ioMode)
      setLastRun(null)
      setRunError(null)
      setSelectedCanvasId(null)
      setPendingDrop(null)
      if (p.run) {
        queueMicrotask(() => runPipelineNow(p.nodes, p.inputText, p.ioMode))
      }
    },
    [runPipelineNow],
  )

  return (
    <section id="cipher-stack" className="relative scroll-mt-8 py-32 pl-6 md:pl-28 pr-6 md:pr-12">
      <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Builder</span>
          <h2 className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">PIPELINE</h2>
        </div>
        <p className="max-w-md font-mono text-xs text-muted-foreground leading-relaxed">
          Build a chain of ciphers (five configurable, three parameter-free). Switch between a compact list and a
          flow canvas: drag ciphers from the palette, connect with arrows, then run encrypt or decipher.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Layout</span>
          <ToggleGroup
            type="single"
            value={builderView}
            onValueChange={(v) => {
              if (v === "simple" || v === "canvas") setBuilderView(v)
            }}
            variant="outline"
            className="w-full justify-stretch sm:w-auto"
          >
            <ToggleGroupItem value="simple" aria-label="List layout" className="gap-2 px-4 font-mono text-xs uppercase tracking-widest">
              <List className="size-3.5 opacity-70" />
              List
            </ToggleGroupItem>
            <ToggleGroupItem value="canvas" aria-label="Flow canvas" className="gap-2 px-4 font-mono text-xs uppercase tracking-widest">
              <LayoutGrid className="size-3.5 opacity-70" />
              Canvas
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="space-y-8">
        {builderView === "simple" ? (
          <>
            <Tabs value={ioMode} onValueChange={(v) => setIoMode(v as "encrypt" | "decrypt")}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="h-10 rounded-none bg-muted/50 p-1">
                  <TabsTrigger value="encrypt" className="rounded-none font-mono text-xs uppercase tracking-widest">
                    Encrypt →
                  </TabsTrigger>
                  <TabsTrigger value="decrypt" className="rounded-none font-mono text-xs uppercase tracking-widest">
                    ← Decrypt
                  </TabsTrigger>
                </TabsList>
                <Button
                  type="button"
                  onClick={handleRun}
                  disabled={!!validationMessage}
                  className="rounded-none font-mono text-xs uppercase tracking-widest"
                >
                  Run pipeline
                </Button>
              </div>

              <TabsContent value="encrypt" className="mt-6 space-y-4">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Plaintext in
                </Label>
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                  className="rounded-none font-mono text-sm"
                  spellCheck={false}
                />
              </TabsContent>
              <TabsContent value="decrypt" className="mt-6 space-y-4">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Ciphertext in
                </Label>
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                  className="rounded-none font-mono text-sm"
                  spellCheck={false}
                />
              </TabsContent>
            </Tabs>

            <PipelineAlerts validationMessage={validationMessage} runError={runError} />
            <FinalOutputBlock finalOutput={finalOutput} copied={copied} onCopy={copyFinal} />

            <CipherPipelineSimple
              nodes={nodes}
              setNodes={setNodes}
              traceById={traceById}
              addCipher={addCipher}
              setAddCipher={setAddCipher}
              onAdd={handleAdd}
              onRemoveNode={handleRemoveNode}
            />
          </>
        ) : (
          <>
            <PipelineAlerts validationMessage={validationMessage} runError={runError} />

            <div className="space-y-4">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Flow canvas</h3>
              <p className="max-w-2xl font-mono text-[11px] text-muted-foreground leading-relaxed">
                Drag a cipher chip onto the board (new nodes are selected automatically).{" "}
                <span className="text-foreground/90">Click a cipher node</span> to expand it and edit parameters on the
                canvas—shift, keyword, Affine a/b, rails—same as list view. Use ↑ ↓ on the node to reorder the pipeline.
                Arrows follow encrypt order (left → right); use <span className="text-foreground/90">Decipher</span> to
                reverse flow. Drag nodes to reposition.
              </p>
              <CanvasVoiceControl onApply={handleVoiceApply} />
              <CipherDragPalette />
              <CipherPipelineCanvas
                pipelineNodes={nodes}
                setPipelineNodes={setNodes}
                onRemoveNode={handleRemoveNode}
                selectedId={selectedCanvasId}
                setSelectedId={setSelectedCanvasId}
                flowMode={ioMode}
                onDropCipher={handleDropCipher}
                pendingDrop={pendingDrop}
                onPendingDropConsumed={() => setPendingDrop(null)}
                inputText={inputText}
                setInputText={setInputText}
                inputLabel={ioMode === "encrypt" ? "Plaintext in" : "Ciphertext in"}
                inputPlaceholder={ioMode === "encrypt" ? "Type plaintext…" : "Paste ciphertext…"}
                finalOutput={finalOutput}
                outputLabel={ioMode === "encrypt" ? "Ciphertext out" : "Plaintext out"}
                outputPlaceholder="Run pipeline to see output here."
                onCopyOutput={copyFinal}
                canCopyOutput={!!finalOutput}
                runEpoch={runEpoch}
                stepTraces={traceById}
              />
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Pipeline mode</span>
                <ToggleGroup
                  type="single"
                  value={ioMode}
                  onValueChange={(v) => {
                    if (v === "encrypt" || v === "decrypt") setIoMode(v)
                  }}
                  variant="outline"
                  className="w-full justify-stretch sm:w-auto"
                >
                  <ToggleGroupItem value="encrypt" className="font-mono text-xs uppercase tracking-widest">
                    Encrypt →
                  </ToggleGroupItem>
                  <ToggleGroupItem value="decrypt" className="font-mono text-xs uppercase tracking-widest">
                    ← Decipher
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearCanvas}
                  className="rounded-none border-border/60 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                >
                  Clear canvas
                </Button>
                <Button
                  type="button"
                  onClick={handleRun}
                  disabled={!!validationMessage}
                  className="rounded-none font-mono text-xs uppercase tracking-widest sm:min-w-[10rem]"
                >
                  Run pipeline
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
