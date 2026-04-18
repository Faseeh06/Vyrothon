"use client"

import { useCallback, useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { runDecrypt, runEncrypt } from "@/lib/cipher-stack/engine"
import { CIPHER_LIBRARY, createNode } from "@/lib/cipher-stack/registry"
import type { CipherId, PipelineNode, StepTrace } from "@/lib/cipher-stack/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

const MIN_NODES = 3

function labelForCipher(id: CipherId) {
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

function validateNodes(nodes: PipelineNode[]): string | null {
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

function moveNode(list: PipelineNode[], index: number, dir: -1 | 1): PipelineNode[] {
  const j = index + dir
  if (j < 0 || j >= list.length) return list
  const next = [...list]
  const t = next[index]!
  next[index] = next[j]!
  next[j] = t
  return next
}

function patchPipelineNode(nodes: PipelineNode[], instanceId: string, next: PipelineNode): PipelineNode[] {
  return nodes.map((n) => (n.instanceId === instanceId ? next : n))
}

export function CipherStackSection() {
  const [nodes, setNodes] = useState<PipelineNode[]>([])
  const [addCipher, setAddCipher] = useState<CipherId>("caesar")
  const [ioMode, setIoMode] = useState<"encrypt" | "decrypt">("encrypt")
  const [inputText, setInputText] = useState("hello")
  const [lastRun, setLastRun] = useState<{
    direction: "encrypt" | "decrypt"
    traces: StepTrace[]
  } | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const traceById = useMemo(() => {
    const m = new Map<string, StepTrace>()
    lastRun?.traces.forEach((t) => m.set(t.instanceId, t))
    return m
  }, [lastRun])

  const finalOutput = lastRun?.traces.length
    ? lastRun.traces[lastRun.traces.length - 1]!.output
    : ""

  const validationMessage = validateNodes(nodes)

  const handleAdd = () => {
    const id = crypto.randomUUID()
    setNodes((prev) => [...prev, createNode(addCipher, id)])
    setLastRun(null)
    setRunError(null)
  }

  const handleRemove = (instanceId: string) => {
    setNodes((prev) => prev.filter((n) => n.instanceId !== instanceId))
    setLastRun(null)
    setRunError(null)
  }

  const handleRun = () => {
    setRunError(null)
    const v = validateNodes(nodes)
    if (v) {
      setRunError(v)
      setLastRun(null)
      return
    }
    try {
      if (ioMode === "encrypt") {
        const traces = runEncrypt(nodes, inputText)
        setLastRun({ direction: "encrypt", traces })
      } else {
        const traces = runDecrypt(nodes, inputText)
        setLastRun({ direction: "decrypt", traces })
      }
    } catch (e) {
      setLastRun(null)
      setRunError(e instanceof Error ? e.message : "Pipeline failed.")
    }
  }

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

  return (
    <section id="cipher-stack" className="relative scroll-mt-8 py-32 pl-6 md:pl-28 pr-6 md:pr-12">
      <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Builder</span>
          <h2 className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">PIPELINE</h2>
        </div>
        <p className="max-w-md font-mono text-xs text-muted-foreground leading-relaxed">
          Pick from eight ciphers (five configurable, three parameter-free). Encrypt runs forward; decrypt applies
          inverses backward. Use at least three nodes, then inspect each step below.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/80 shadow-none rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Library
              </CardTitle>
              <CardDescription className="font-mono text-[11px] leading-relaxed">
                Caesar, XOR, Vigenère, rail fence, affine — plus Atbash, Base64, reverse. Add nodes in plaintext order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {CIPHER_LIBRARY.map((c) => (
                <div
                  key={c.id}
                  className="border border-border/40 p-3 text-xs font-mono text-muted-foreground leading-relaxed"
                >
                  <span className="text-foreground">{c.label}</span> — {c.description}
                </div>
              ))}
              <Separator className="bg-border/60" />
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Add node
                </Label>
                <Select value={addCipher} onValueChange={(v) => setAddCipher(v as CipherId)}>
                  <SelectTrigger className="w-full rounded-none font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(320px,55vh)] overflow-y-auto rounded-none">
                    {CIPHER_LIBRARY.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="font-mono text-xs">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-none border-foreground/20 font-mono text-xs uppercase tracking-widest hover:border-accent hover:text-accent"
                  onClick={handleAdd}
                >
                  Add to pipeline
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
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
                onClick={copyFinal}
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

          <Separator className="bg-border/60" />

          <div className="space-y-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Pipeline</h3>
            {nodes.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">
                No nodes yet. Add three or more from the library to enable a run.
              </p>
            ) : (
              <ol className="space-y-4">
                {nodes.map((node, index) => (
                  <li key={node.instanceId} className="relative">
                    {index > 0 && (
                      <div
                        className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent/80"
                        aria-hidden
                      >
                        <span className="h-px flex-1 bg-accent/30" />
                        <span>flow</span>
                        <span className="h-px flex-1 bg-accent/30" />
                      </div>
                    )}
                    <CipherNodeCard
                      index={index}
                      node={node}
                      trace={traceById.get(node.instanceId)}
                      onChange={(next) =>
                        setNodes((prev) => patchPipelineNode(prev, node.instanceId, next))
                      }
                      onRemove={() => handleRemove(node.instanceId)}
                      onMove={(dir) => setNodes((prev) => moveNode(prev, index, dir))}
                      canUp={index > 0}
                      canDown={index < nodes.length - 1}
                    />
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function CipherNodeCard({
  index,
  node,
  trace,
  onChange,
  onRemove,
  onMove,
  canUp,
  canDown,
}: {
  index: number
  node: PipelineNode
  trace?: StepTrace
  onChange: (n: PipelineNode) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
  canUp: boolean
  canDown: boolean
}) {
  return (
    <Card
      className={cn(
        "border-border/40 bg-card/90 shadow-none rounded-none transition-colors",
        trace && "border-accent/40",
      )}
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">Node {index + 1}</span>
            <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase tracking-wider">
              {labelForCipher(node.cipherId)}
            </Badge>
          </div>
          <CardTitle className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground">
            {labelForCipher(node.cipherId)}
          </CardTitle>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="rounded-none"
            disabled={!canUp}
            onClick={() => onMove(-1)}
            aria-label="Move up"
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="rounded-none"
            disabled={!canDown}
            onClick={() => onMove(1)}
            aria-label="Move down"
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="rounded-none text-destructive hover:text-destructive"
            onClick={onRemove}
            aria-label="Remove node"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {node.cipherId === "caesar" && (
          <div className="space-y-2">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Shift</Label>
            <Input
              type="number"
              className="rounded-none font-mono text-sm"
              value={Number.isFinite(node.config.shift) ? node.config.shift : 0}
              onChange={(e) =>
                onChange({
                  ...node,
                  config: { shift: Number.parseInt(e.target.value, 10) || 0 },
                })
              }
            />
          </div>
        )}
        {node.cipherId === "xor" && (
          <div className="space-y-2">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Key</Label>
            <Input
              className="rounded-none font-mono text-sm"
              value={node.config.key}
              onChange={(e) => onChange({ ...node, config: { key: e.target.value } })}
              spellCheck={false}
            />
          </div>
        )}
        {node.cipherId === "vigenere" && (
          <div className="space-y-2">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Keyword</Label>
            <Input
              className="rounded-none font-mono text-sm"
              value={node.config.keyword}
              onChange={(e) => onChange({ ...node, config: { keyword: e.target.value } })}
              spellCheck={false}
            />
          </div>
        )}
        {node.cipherId === "railFence" && (
          <div className="space-y-2">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Rails</Label>
            <Input
              type="number"
              min={2}
              className="rounded-none font-mono text-sm"
              value={Number.isFinite(node.config.rails) ? node.config.rails : 2}
              onChange={(e) =>
                onChange({
                  ...node,
                  config: { rails: Math.max(2, Number.parseInt(e.target.value, 10) || 2) },
                })
              }
            />
          </div>
        )}
        {node.cipherId === "affine" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">a</Label>
              <Input
                type="number"
                className="rounded-none font-mono text-sm"
                value={node.config.a}
                onChange={(e) =>
                  onChange({
                    ...node,
                    config: { ...node.config, a: Number.parseInt(e.target.value, 10) || 1 },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">b</Label>
              <Input
                type="number"
                className="rounded-none font-mono text-sm"
                value={node.config.b}
                onChange={(e) =>
                  onChange({
                    ...node,
                    config: { ...node.config, b: Number.parseInt(e.target.value, 10) || 0 },
                  })
                }
              />
            </div>
          </div>
        )}
        {(node.cipherId === "atbash" || node.cipherId === "base64" || node.cipherId === "reverse") && (
          <p className="font-mono text-[11px] text-muted-foreground">No parameters — forward and inverse are fixed.</p>
        )}

        {trace && (
          <div className="space-y-2 border border-border/30 p-3 font-mono text-[11px] leading-relaxed">
            <div>
              <span className="text-muted-foreground">In · </span>
              <span className="break-all text-foreground/90">{trace.input}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Out · </span>
              <span className="break-all text-accent">{trace.output}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
