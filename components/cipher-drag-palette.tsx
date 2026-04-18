"use client"

import { CIPHER_LIBRARY } from "@/lib/cipher-stack/registry"
import type { CipherId } from "@/lib/cipher-stack/types"
import { cn } from "@/lib/utils"

const DRAG_MIME = "application/x-cipherstack-cipher"

export function CipherDragPalette({ className }: { className?: string }) {
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
              e.dataTransfer.setData(DRAG_MIME, c.id)
              e.dataTransfer.setData("text/plain", c.id)
              e.dataTransfer.effectAllowed = "copy"
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
    </div>
  )
}

export function readCipherIdFromDataTransfer(dt: DataTransfer): CipherId | null {
  const v = dt.getData(DRAG_MIME) || dt.getData("text/plain")
  if (!v) return null
  const ok = CIPHER_LIBRARY.some((c) => c.id === v)
  return ok ? (v as CipherId) : null
}
