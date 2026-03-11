import { lazy, Suspense, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/lib/branding";
import type { HelpWidgetMessage } from "@/components/help-widget-panel";

const loadHelpWidgetPanel = () => import("@/components/help-widget-panel");

const LazyHelpWidgetPanel = lazy(async () => {
  const module = await loadHelpWidgetPanel();
  return { default: module.HelpWidgetPanel };
});

const SUGGESTIONS = [
  "How do I publish an app?",
  "Where do I change white-label settings?",
  "How do I export to MAUI?",
];

export function HelpWidget() {
  const { brand } = useBranding();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<HelpWidgetMessage[]>([
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
        <Suspense
          fallback={
            <div className="w-[340px] overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/95 shadow-2xl backdrop-blur-xl">
              <div className="h-16 animate-pulse border-b border-border/60 bg-muted/50" />
              <div className="space-y-3 px-4 py-4">
                <div className="h-20 rounded-2xl bg-muted/50 animate-pulse" />
                <div className="h-10 rounded-2xl bg-muted/50 animate-pulse" />
              </div>
            </div>
          }
        >
          <LazyHelpWidgetPanel
            brand={brand}
            draft={draft}
            messages={messages}
            onClose={() => setOpen(false)}
            onDraftChange={setDraft}
            onSend={send}
            suggestions={SUGGESTIONS}
          />
        </Suspense>
      ) : (
        <Button
          className="h-14 rounded-full px-5 shadow-2xl"
          onClick={() => setOpen(true)}
          onMouseEnter={() => void loadHelpWidgetPanel()}
          onFocus={() => void loadHelpWidgetPanel()}
          style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})`, color: "white" }}
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Help
        </Button>
      )}
    </div>
  );
}
