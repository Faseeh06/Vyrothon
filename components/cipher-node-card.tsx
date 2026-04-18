"use client"

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { labelForCipher } from "@/lib/cipher-stack/pipeline-helpers"
import type { PipelineNode, StepTrace } from "@/lib/cipher-stack/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CipherParameterFields } from "@/components/cipher-parameter-fields"

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
        <CipherParameterFields node={node} onChange={onChange} trace={trace} variant="card" />
      </CardContent>
    </Card>
  )
}
