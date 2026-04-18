"use client"

import { useCallback, useEffect, type DragEvent, type MouseEvent } from "react"
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useUpdateNodeInternals,
  useReactFlow,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { cn } from "@/lib/utils"
import { labelForCipher } from "@/lib/cipher-stack/pipeline-helpers"
import type { CipherId, PipelineNode } from "@/lib/cipher-stack/types"
import { readCipherIdFromDataTransfer } from "@/components/cipher-drag-palette"

/** Theme accent — must be a real color for SVG stroke/markers (not `hsl(var(--accent))` when --accent is oklch). */
const FLOW_STROKE = "oklch(0.72 0.18 145)"

export const FLOW_INPUT_ID = "__flow_input__"
export const FLOW_OUTPUT_ID = "__flow_output__"

const edgeStyle = {
  type: "smoothstep" as const,
  style: { stroke: FLOW_STROKE, strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: FLOW_STROKE,
  },
}

function FlowInputNode({
  data,
}: NodeProps<{
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}>) {
  return (
    <div className="w-[min(100vw,280px)] border border-border/50 bg-card/95 p-3 shadow-sm">
      <Handle
        type="target"
        position={Position.Right}
        id="r-in"
        style={{ top: "32%" }}
        className="!h-2.5 !w-2.5 !border-border !bg-accent"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="r-out"
        style={{ top: "68%" }}
        className="!h-2.5 !w-2.5 !border-border !bg-accent"
      />
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{data.label}</p>
      <textarea
        value={data.value}
        placeholder={data.placeholder}
        onChange={(e) => data.onChange(e.target.value)}
        rows={4}
        spellCheck={false}
        className="nodrag nopan nowheel w-full resize-y rounded-none border border-border/40 bg-background/80 px-2 py-1.5 font-mono text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-accent"
      />
    </div>
  )
}

function FlowOutputNode({
  data,
}: NodeProps<{
  label: string
  value: string
  runEpoch?: number
  placeholder: string
  onCopy?: () => void
  canCopy: boolean
}>) {
  return (
    <div className="w-[min(100vw,280px)] border border-border/50 bg-card/95 p-3 shadow-sm">
      <Handle
        type="target"
        position={Position.Left}
        id="l-in"
        style={{ top: "32%" }}
        className="!h-2.5 !w-2.5 !border-border !bg-accent"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="l-out"
        style={{ top: "68%" }}
        className="!h-2.5 !w-2.5 !border-border !bg-accent"
      />
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{data.label}</p>
        {data.onCopy && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              data.onCopy?.()
            }}
            disabled={!data.canCopy}
            className="nodrag font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent disabled:opacity-40"
          >
            Copy
          </button>
        )}
      </div>
      <textarea
        readOnly
        key={String(data.runEpoch ?? 0)}
        value={data.value ?? ""}
        placeholder={data.placeholder}
        rows={4}
        className="w-full resize-y rounded-none border border-border/40 bg-muted/20 px-2 py-1.5 font-mono text-xs text-foreground/90 outline-none"
      />
    </div>
  )
}

function FlowCipherNode({
  data,
}: NodeProps<{
  title: string
  index: number
  selected: boolean
  onRemove: () => void
}>) {
  return (
    <>
      <Handle type="target" position={Position.Left} id="l-in" style={{ top: "30%" }} className="!h-2.5 !w-2.5 !border-border !bg-accent" />
      <Handle type="source" position={Position.Left} id="l-out" style={{ top: "70%" }} className="!h-2.5 !w-2.5 !border-border !bg-accent" />
      <Handle type="target" position={Position.Right} id="r-in" style={{ top: "30%" }} className="!h-2.5 !w-2.5 !border-border !bg-accent" />
      <Handle type="source" position={Position.Right} id="r-out" style={{ top: "70%" }} className="!h-2.5 !w-2.5 !border-border !bg-accent" />
      <div
        className={cn(
          "min-w-[160px] max-w-[220px] border bg-card/95 px-3 py-2 font-mono text-xs shadow-sm backdrop-blur-sm",
          data.selected ? "border-accent ring-1 ring-accent/50" : "border-border/50",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">#{data.index + 1}</span>
          <button
            type="button"
            className="leading-none text-destructive hover:text-destructive/80"
            onClick={(e) => {
              e.stopPropagation()
              data.onRemove()
            }}
            aria-label="Remove node"
          >
            ×
          </button>
        </div>
        <div className="mt-1 truncate text-foreground">{data.title}</div>
      </div>
    </>
  )
}

const nodeTypes = {
  cipher: FlowCipherNode,
  ioInput: FlowInputNode,
  ioOutput: FlowOutputNode,
} satisfies NodeTypes

function buildEncryptEdges(pipelineNodes: PipelineNode[]): Edge[] {
  if (pipelineNodes.length === 0) {
    return [
      {
        id: "e-io",
        source: FLOW_INPUT_ID,
        target: FLOW_OUTPUT_ID,
        sourceHandle: "r-out",
        targetHandle: "l-in",
        ...edgeStyle,
      },
    ]
  }
  const edges: Edge[] = []
  let prev = FLOW_INPUT_ID
  for (let i = 0; i < pipelineNodes.length; i++) {
    const id = pipelineNodes[i]!.instanceId
    edges.push({
      id: `e-f-${prev}-${id}`,
      source: prev,
      target: id,
      sourceHandle: prev === FLOW_INPUT_ID ? "r-out" : "r-out",
      targetHandle: "l-in",
      animated: true,
      ...edgeStyle,
    })
    prev = id
  }
  edges.push({
    id: `e-f-${prev}-out`,
    source: prev,
    target: FLOW_OUTPUT_ID,
    sourceHandle: "r-out",
    targetHandle: "l-in",
    animated: true,
    ...edgeStyle,
  })
  return edges
}

function buildDecryptEdges(pipelineNodes: PipelineNode[]): Edge[] {
  if (pipelineNodes.length === 0) {
    return [
      {
        id: "e-io-rev",
        source: FLOW_OUTPUT_ID,
        target: FLOW_INPUT_ID,
        sourceHandle: "l-out",
        targetHandle: "r-in",
        animated: true,
        ...edgeStyle,
      },
    ]
  }
  const rev = [...pipelineNodes].reverse()
  const edges: Edge[] = []
  let prev = FLOW_OUTPUT_ID
  for (let i = 0; i < rev.length; i++) {
    const id = rev[i]!.instanceId
    edges.push({
      id: `e-r-${prev}-${id}`,
      source: prev,
      target: id,
      sourceHandle: prev === FLOW_OUTPUT_ID ? "l-out" : "l-out",
      targetHandle: "r-in",
      animated: true,
      ...edgeStyle,
    })
    prev = id
  }
  edges.push({
    id: `e-r-${prev}-in`,
    source: prev,
    target: FLOW_INPUT_ID,
    sourceHandle: "l-out",
    targetHandle: "r-in",
    animated: true,
    ...edgeStyle,
  })
  return edges
}

const COL = 280
const Y = 100

function layoutXCipher(i: number) {
  return 40 + 300 + i * COL
}

type CanvasInnerProps = {
  pipelineNodes: PipelineNode[]
  setPipelineNodes: React.Dispatch<React.SetStateAction<PipelineNode[]>>
  onRemoveNode: (instanceId: string) => void
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  flowMode: "encrypt" | "decrypt"
  onDropCipher: (cipherId: CipherId, position: { x: number; y: number }) => void
  pendingDrop: { id: string; x: number; y: number } | null
  onPendingDropConsumed: () => void
  inputText: string
  setInputText: (v: string) => void
  inputLabel: string
  inputPlaceholder: string
  finalOutput: string
  outputLabel: string
  outputPlaceholder: string
  onCopyOutput?: () => void
  canCopyOutput: boolean
  /** Incremented after each successful encrypt/decrypt so the output node refreshes reliably. */
  runEpoch: number
}

function CanvasInner({
  pipelineNodes,
  setPipelineNodes,
  onRemoveNode,
  selectedId,
  setSelectedId,
  flowMode,
  onDropCipher,
  pendingDrop,
  onPendingDropConsumed,
  inputText,
  setInputText,
  inputLabel,
  inputPlaceholder,
  finalOutput,
  outputLabel,
  outputPlaceholder,
  onCopyOutput,
  canCopyOutput,
  runEpoch,
}: CanvasInnerProps) {
  const { getNodes, fitView, screenToFlowPosition } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    updateNodeInternals(FLOW_OUTPUT_ID)
  }, [finalOutput, runEpoch, updateNodeInternals])

  const removeNode = useCallback(
    (instanceId: string) => {
      onRemoveNode(instanceId)
    },
    [onRemoveNode],
  )

  useEffect(() => {
    const n = pipelineNodes.length
    const outX = layoutXCipher(n) + 300

    setNodes((prev) => {
      const posById = new Map(prev.map((node) => [node.id, node.position]))
      const inputNode: Node = {
        id: FLOW_INPUT_ID,
        type: "ioInput",
        position: posById.get(FLOW_INPUT_ID) ?? { x: 40, y: Y },
        draggable: true,
        selectable: true,
        data: {
          label: inputLabel,
          value: inputText,
          onChange: setInputText,
          placeholder: inputPlaceholder,
        },
      }
      const cipherNodes: Node[] = pipelineNodes.map((p, i) => ({
        id: p.instanceId,
        type: "cipher",
        position:
          pendingDrop?.id === p.instanceId
            ? { x: pendingDrop.x, y: pendingDrop.y }
            : (posById.get(p.instanceId) ?? { x: layoutXCipher(i), y: Y }),
        data: {
          title: labelForCipher(p.cipherId),
          index: i,
          selected: p.instanceId === selectedId,
          onRemove: () => removeNode(p.instanceId),
        },
      }))
      const outputNode: Node = {
        id: FLOW_OUTPUT_ID,
        type: "ioOutput",
        position: posById.get(FLOW_OUTPUT_ID) ?? { x: outX, y: Y },
        draggable: true,
        selectable: true,
        data: {
          label: outputLabel,
          value: finalOutput,
          runEpoch,
          placeholder: outputPlaceholder,
          onCopy: onCopyOutput,
          canCopy: canCopyOutput,
        },
      }
      return [inputNode, ...cipherNodes, outputNode]
    })
  }, [
    pipelineNodes,
    selectedId,
    setNodes,
    removeNode,
    pendingDrop,
    inputText,
    setInputText,
    inputLabel,
    inputPlaceholder,
    finalOutput,
    outputLabel,
    outputPlaceholder,
    onCopyOutput,
    canCopyOutput,
    runEpoch,
  ])

  useEffect(() => {
    if (!pendingDrop) return
    if (pipelineNodes.some((n) => n.instanceId === pendingDrop.id)) {
      onPendingDropConsumed()
    }
  }, [pendingDrop, pipelineNodes, onPendingDropConsumed])

  useEffect(() => {
    setEdges(flowMode === "encrypt" ? buildEncryptEdges(pipelineNodes) : buildDecryptEdges(pipelineNodes))
  }, [pipelineNodes, setEdges, flowMode])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      fitView({ padding: 0.15, duration: 220 })
    })
    return () => cancelAnimationFrame(id)
  }, [pipelineNodes.length, flowMode, fitView])

  const onNodeDragStop = useCallback(() => {
    const nds = getNodes().filter((n) => n.type === "cipher")
    const sorted = [...nds].sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y)
    setPipelineNodes((prev) => {
      const map = new Map(prev.map((p) => [p.instanceId, p]))
      return sorted.map((node) => map.get(node.id)).filter(Boolean) as PipelineNode[]
    })
  }, [getNodes, setPipelineNodes])

  const onNodeClick = useCallback(
    (_: MouseEvent, node: Node) => {
      if (node.id === FLOW_INPUT_ID || node.id === FLOW_OUTPUT_ID) {
        setSelectedId(null)
        return
      }
      setSelectedId(node.id)
    },
    [setSelectedId],
  )

  const onPaneClick = useCallback(() => {
    setSelectedId(null)
  }, [setSelectedId])

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      const cipherId = readCipherIdFromDataTransfer(e.dataTransfer)
      if (!cipherId) return
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      onDropCipher(cipherId, pos)
    },
    [screenToFlowPosition, onDropCipher],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStop={onNodeDragStop}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      nodesConnectable={false}
      elevateEdgesOnSelect
      minZoom={0.25}
      maxZoom={1.75}
      className="bg-muted/10 [&_.react-flow__edge-path]:stroke-[oklch(0.72_0.18_145)]"
    >
      <Background gap={22} size={1} className="!bg-transparent" color="hsl(0 0% 22%)" />
      <Controls className="!rounded-none !border-border/50 !bg-card/90 !shadow-none" />
      <MiniMap
        className="!rounded-none !border-border/50 !bg-card/80"
        zoomable
        pannable
        maskColor="oklch(0.08 0 0 / 0.65)"
      />
    </ReactFlow>
  )
}

export type CipherPipelineCanvasProps = CanvasInnerProps

export function CipherPipelineCanvas(props: CipherPipelineCanvasProps) {
  return (
    <div className="h-[min(560px,70vh)] min-h-[320px] w-full border border-border/40 bg-muted/5">
      <ReactFlowProvider>
        <CanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  )
}
