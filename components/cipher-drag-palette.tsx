"use client"

import { useEffect, useRef, useState } from "react"
import { CIPHER_LIBRARY } from "@/lib/cipher-stack/registry"
import type { CipherId } from "@/lib/cipher-stack/types"
import { cn } from "@/lib/utils"

const DRAG_MIME = "application/x-cipherstack-cipher"

const TAP_HINT =
  "Drag and drop this chip onto the canvas — click alone doesn’t add a node. Hold, drag, then release on the board."

export function CipherDragPalette({ className }: { className?: string }) {
  const [tapHint, setTapHint] = useState<string | null>(null)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didDragRef = useRef(false)

  const clearHintTimer = () => {
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current)
      hintTimerRef.current = null
    }
  }

  const showTapHint = () => {
    clearHintTimer()
    setTapHint(TAP_HINT)
    hintTimerRef.current = setTimeout(() => setTapHint(null), 8000)
  }

  useEffect(() => () => clearHintTimer(), [])

  return (
    <div className={cn("space-y-2", className)}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Drag ciphers onto the canvas</p>
      <div
        className="flex flex-wrap gap-2 border border-border/40 bg-muted/10 p-3"
        role="list"
        aria-label="Cipher palette"
      >
        {CIPHER_LIBRARY.map((c) => (
          <button
            key={c.id}
            type="button"
            draggable
            role="listitem"
            title={c.description}
            onDragStart={(e) => {
              didDragRef.current = true
              setTapHint(null)
              clearHintTimer()
              e.dataTransfer.setData(DRAG_MIME, c.id)
              e.dataTransfer.setData("text/plain", c.id)
              e.dataTransfer.effectAllowed = "copy"
            }}
            onDragEnd={() => {
              window.setTimeout(() => {
                didDragRef.current = false
              }, 0)
            }}
            onClick={() => {
              if (didDragRef.current) return
              showTapHint()
            }}
            className={cn(
              "cursor-grab touch-none border border-border/50 bg-card/90 px-2.5 py-1.5 text-left font-mono text-[11px] text-foreground transition-colors",
              "hover:border-accent/60 hover:text-accent active:cursor-grabbing",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p
        role="status"
        aria-live="polite"
        className={cn(
          "font-mono text-[11px] leading-snug text-accent transition-all duration-200",
          tapHint ? "min-h-[2.75rem] py-1 opacity-100" : "max-h-0 min-h-0 overflow-hidden py-0 opacity-0",
        )}
      >
        {tapHint}
      </p>
    </div>
  )
}

export function readCipherIdFromDataTransfer(dt: DataTransfer): CipherId | null {
  const v = dt.getData(DRAG_MIME) || dt.getData("text/plain")
  if (!v) return null
  const ok = CIPHER_LIBRARY.some((c) => c.id === v)
  return ok ? (v as CipherId) : null
}
