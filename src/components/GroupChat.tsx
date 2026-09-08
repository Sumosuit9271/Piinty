import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface Member {
  id: string;
  display_name: string;
  avatar_url?: string | null;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface GroupChatProps {
  groupId: string;
  members: Member[];
}

export const GroupChat = ({ groupId, members }: GroupChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!groupId) return;

    const load = async () => {
      const { data, error } = await supabase
        .from("group_messages")
        .select("id, user_id, content, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!error && data) setMessages(data as Message[]);
    };
    load();

    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const nameFor = (id: string) =>
    members.find((m) => m.id === id)?.display_name || "Someone";
  const avatarFor = (id: string) =>
    members.find((m) => m.id === id)?.avatar_url || undefined;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !userId || sending) return;
    setSending(true);
    const { error } = await supabase.from("group_messages").insert({
      group_id: groupId,
      user_id: userId,
      content: text.slice(0, 500),
    });
    setSending(false);
    if (error) {
      toast({
        title: "Message not sent",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setInput("");
  };

  return (
    <section className="animate-fade-up">
      <div className="mb-4">
        <h2 className="font-display text-2xl">Group chat</h2>
        <p className="text-sm text-muted-foreground">Sort out the rounds here.</p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div ref={scrollRef} className="max-h-80 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages yet — say hello!
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.user_id === userId;
              return (
                <div
                  key={m.id}
                  className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={avatarFor(m.user_id)} />
                    <AvatarFallback className="text-xs">
                      {nameFor(m.user_id).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
                    {!mine && (
                      <p className="text-[11px] text-muted-foreground mb-0.5 px-1">
                        {nameFor(m.user_id)}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm break-words ${
                        mine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border/60 p-3 flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            maxLength={500}
            className="rounded-full"
          />
          <Button
            size="icon"
            className="rounded-full shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
