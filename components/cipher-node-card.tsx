"use client"

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { labelForCipher } from "@/lib/cipher-stack/pipeline-helpers"
import type { PipelineNode, StepTrace } from "@/lib/cipher-stack/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CipherNodeCard({
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
