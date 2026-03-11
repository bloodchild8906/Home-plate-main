import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBranding } from "@/lib/branding";
import { BrandMark } from "@/components/brand-mark";

const SUGGESTIONS = [
  "How do I publish an app?",
  "Where do I change white-label settings?",
  "How do I export to MAUI?",
];

export function HelpWidget() {
  const { brand } = useBranding();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: "1", from: "bot", text: "Need help? Ask about app design, publishing, or exports." },
  ]);
  const [draft, setDraft] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, from: "user", text },
      { id: `${Date.now()}-bot`, from: "bot", text: "This help widget is local for now. For complex tasks, continue in chat." },
    ]);
    setDraft("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[340px] overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/95 shadow-2xl backdrop-blur-xl">
          <div
            className="flex items-center justify-between border-b border-border/60 px-4 py-3 text-white"
            style={{ background: `linear-gradient(135deg, ${brand.secondary}, ${brand.primary})` }}
          >
            <div className="flex items-center gap-2">
              <BrandMark
                image={brand.logoImage}
                text={brand.logo}
                label={`${brand.name} logo`}
                primary={brand.primary}
                accent={brand.accent}
                className="h-9 w-9 rounded-2xl"
                imageClassName="object-contain bg-white/10 p-1.5"
                textClassName="text-[11px]"
              />
              <div>
                <div className="text-sm font-bold">{brand.name} Help</div>
                <div className="text-[11px] text-white/70">Workspace assistant</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 px-4 py-4">
            <div className="space-y-3">
              {messages.slice(-4).map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    message.from === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  onClick={() => send(item)}
                  className="rounded-full border border-border/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") send(draft);
                }}
                placeholder="Ask a question..."
                className="rounded-2xl"
              />
              <Button size="icon" className="rounded-2xl" onClick={() => send(draft)}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          className="h-14 rounded-full px-5 shadow-2xl"
          onClick={() => setOpen(true)}
          style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})`, color: "white" }}
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Help
        </Button>
      )}
    </div>
  );
}
