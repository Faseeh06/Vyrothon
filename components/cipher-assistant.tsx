"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Bot, MessageCircle, Send, X } from "lucide-react"
import { getCipherAssistantReply } from "@/lib/cipher-stack/cipher-chat"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const WELCOME = [
  "I'm your **offline** CipherStack helper. I only use docs baked into this app — fast, private, no network.",
  "",
  "Ask about **Caesar**, **XOR**, **Vigenère**, **rail fence**, **Affine**, **Atbash**, **Base64**, **Reverse**, or how the **pipeline**, **canvas**, **encrypt**, and **decipher** modes work.",
].join("\n")

function renderTextWithBold(text: string) {
  const lines = text.split("\n")
  return lines.map((line, li) => (
    <span key={li} className="block min-h-[1em]">
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
        const m = part.match(/^\*\*(.+)\*\*$/)
        if (m) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {m[1]}
            </strong>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  ))
}

export function CipherAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: WELCOME },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (open) scrollToBottom()
  }, [open, messages, scrollToBottom])

  const send = useCallback(() => {
    const q = input.trim()
    if (!q) return
    setInput("")
    const reply = getCipherAssistantReply(q)
    setMessages((prev) => [...prev, { role: "user", text: q }, { role: "assistant", text: reply }])
  }, [input])

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      {open && (
        <div className="pointer-events-auto flex h-[min(520px,75vh)] w-[min(100vw-2rem,400px)] flex-col overflow-hidden border border-border/60 bg-card/95 shadow-2xl backdrop-blur-md dark:bg-card/90">
          <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Bot className="size-4 text-accent" aria-hidden />
              Cipher assistant
              <span className="rounded-none border border-border/60 px-1.5 py-px text-[9px] text-muted-foreground">
                Offline
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-none"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              <X className="size-4" />
            </Button>
          </div>
          <ScrollArea className="min-h-0 flex-1 px-3 py-3">
            <div className="space-y-4 pr-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {messages.map((m, i) => (
                <div
                  key={`${i}-${m.role}`}
                  className={cn(
                    "rounded-none border px-3 py-2",
                    m.role === "user"
                      ? "ml-6 border-accent/40 bg-accent/10 text-foreground"
                      : "mr-4 border-border/40 bg-muted/20",
                  )}
                >
                  {renderTextWithBold(m.text)}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
          <div className="border-t border-border/50 p-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Ask about a cipher or the pipeline…"
              rows={2}
              className="mb-2 resize-none rounded-none border-border/50 bg-background/80 font-mono text-xs"
              aria-label="Message to assistant"
            />
            <Button
              type="button"
              className="w-full rounded-none font-mono text-[10px] uppercase tracking-widest"
              onClick={send}
              disabled={!input.trim()}
            >
              <Send className="mr-2 size-3.5" />
              Send
            </Button>
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "pointer-events-auto size-14 shrink-0 rounded-full border border-border/50 shadow-xl",
          "bg-accent text-accent-foreground hover:bg-accent/90",
        )}
        aria-expanded={open}
        aria-label={open ? "Close cipher assistant" : "Open cipher assistant"}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </Button>
    </div>
  )
}
