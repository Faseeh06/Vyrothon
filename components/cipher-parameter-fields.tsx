"use client"

import { cn } from "@/lib/utils"
import type { PipelineNode, StepTrace } from "@/lib/cipher-stack/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Shared cipher config + optional step trace — used by list `CipherNodeCard` and canvas `FlowCipherNode`.
 */
export function CipherParameterFields({
  node,
  onChange,
  trace,
  variant = "card",
}: {
  node: PipelineNode
  onChange: (n: PipelineNode) => void
  trace?: StepTrace
  variant?: "card" | "canvas"
}) {
  const canvas = variant === "canvas"
  const labelCn = canvas
    ? "font-mono text-[9px] uppercase tracking-widest text-muted-foreground"
    : "font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
  const inputCn = canvas
    ? "h-8 rounded-none font-mono text-xs nodrag nopan"
    : "rounded-none font-mono text-sm"
  const wrapCn = canvas ? "nodrag nopan nowheel space-y-2.5" : "space-y-4"

  return (
    <div className={wrapCn}>
      {node.cipherId === "caesar" && (
        <div className="space-y-1.5">
          <Label className={labelCn}>Shift</Label>
          <Input
            type="number"
            className={inputCn}
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
        <div className="space-y-1.5">
          <Label className={labelCn}>Key</Label>
          <Input
            className={inputCn}
            value={node.config.key}
            onChange={(e) => onChange({ ...node, config: { key: e.target.value } })}
            spellCheck={false}
          />
        </div>
      )}
      {node.cipherId === "vigenere" && (
        <div className="space-y-1.5">
          <Label className={labelCn}>Keyword</Label>
          <Input
            className={inputCn}
            value={node.config.keyword}
            onChange={(e) => onChange({ ...node, config: { keyword: e.target.value } })}
            spellCheck={false}
          />
        </div>
      )}
      {node.cipherId === "railFence" && (
        <div className="space-y-1.5">
          <Label className={labelCn}>Rails</Label>
          <Input
            type="number"
            min={2}
            className={inputCn}
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
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className={labelCn}>a</Label>
            <Input
              type="number"
              className={inputCn}
              value={node.config.a}
              onChange={(e) =>
                onChange({
                  ...node,
                  config: { ...node.config, a: Number.parseInt(e.target.value, 10) || 1 },
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelCn}>b</Label>
            <Input
              type="number"
              className={inputCn}
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
        <p className={cn("text-muted-foreground", canvas ? "font-mono text-[10px] leading-snug" : "font-mono text-[11px]")}>
          No parameters — forward and inverse are fixed.
        </p>
      )}

      {trace && (
        <div
          className={cn(
            "space-y-1.5 border border-border/30 font-mono leading-relaxed",
            canvas ? "max-h-28 overflow-y-auto p-2 text-[10px]" : "p-3 text-[11px]",
          )}
        >
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
    </div>
  )
}
