"use client"

import { CIPHER_LIBRARY } from "@/lib/cipher-stack/registry"
import { moveNode, patchPipelineNode } from "@/lib/cipher-stack/pipeline-helpers"
import type { CipherId, PipelineNode, StepTrace } from "@/lib/cipher-stack/types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CipherNodeCard } from "@/components/cipher-node-card"

export function CipherPipelineSimple({
  nodes,
  setNodes,
  traceById,
  addCipher,
  setAddCipher,
  onAdd,
  onRemoveNode,
}: {
  nodes: PipelineNode[]
  setNodes: React.Dispatch<React.SetStateAction<PipelineNode[]>>
  traceById: Map<string, StepTrace>
  addCipher: CipherId
  setAddCipher: (id: CipherId) => void
  onAdd: () => void
  onRemoveNode: (instanceId: string) => void
}) {
  return (
    <>
      <Separator className="bg-border/60" />

      <div className="space-y-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Pipeline</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="min-w-0 flex-1 space-y-2">
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
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full shrink-0 rounded-none border-foreground/20 font-mono text-xs uppercase tracking-widest hover:border-accent hover:text-accent sm:w-auto sm:min-w-[11rem]"
            onClick={onAdd}
          >
            Add to pipeline
          </Button>
        </div>
        {nodes.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground">
            No nodes yet. Add three or more to enable a run.
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
                  onRemove={() => onRemoveNode(node.instanceId)}
                  onMove={(dir) => setNodes((prev) => moveNode(prev, index, dir))}
                  canUp={index > 0}
                  canDown={index < nodes.length - 1}
                />
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  )
}
