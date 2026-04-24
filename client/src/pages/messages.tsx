import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Users } from "lucide-react";
import { api, getCachedUser } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useSearch } from "wouter";

export default function Messages() {
  const me = getCachedUser();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const preselectId = params.get("to");
  const preselectName = params.get("name");

  const [connections, setConnections] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.users.connections().catch(() => []),
      api.messages.list().catch(() => []),
    ]).then(([conns, msgs]) => {
      setConnections(conns);
      setAllMessages(msgs);
      // Auto-open thread if navigated from connections page
      if (preselectId && preselectName) {
        setActiveUser({ id: preselectId, name: decodeURIComponent(preselectName) });
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeUser) return;
    api.messages.thread(activeUser.id).then(setMessages).catch(() => setMessages([]));
    // Poll for new messages every 5s while conversation is open
    const t = setInterval(() => {
      api.messages.thread(activeUser.id).then(setMessages).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [activeUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !activeUser) return;
    const msg = await api.messages.send(activeUser.id, text.trim());
    setMessages(prev => [...prev, msg]);
    setText("");
    // Update thread list
    api.messages.list().then(setAllMessages).catch(() => {});
  };

  // Build thread list — show connections, highlight ones with messages
  const getLastMsg = (userId: string) => {
    const msgs = allMessages.filter((m: any) => m.fromId === userId || m.toId === userId);
    return msgs.length > 0 ? msgs[0] : null;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Left: connections list */}
        <Card className="md:col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-sm text-muted-foreground">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading && <p className="text-xs text-center text-muted-foreground py-4">Loading...</p>}
            {!loading && connections.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No connections yet.</p>
                <p className="text-xs mt-1">Connect with people first.</p>
              </div>
            )}
            {connections.map(u => {
              const initials = (u.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase();
              const lastMsg = getLastMsg(u.id);
              const isActive = activeUser?.id === u.id;
              return (
                <button key={u.id} onClick={() => setActiveUser({ id: u.id, name: u.name })}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors hover:bg-muted/60 ${isActive ? "bg-muted" : ""}`}>
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lastMsg ? lastMsg.text : u.headline || u.company || "Say hello!"}
                    </p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Right: chat window */}
        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {activeUser ? (
            <>
              <CardHeader className="pb-3 shrink-0 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {activeUser.name.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-base">{activeUser.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground pt-8">No messages yet. Say hello! 👋</p>
                )}
                {messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.fromId === me?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${m.fromId === me?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p>{m.text}</p>
                      <p className={`text-xs mt-1 ${m.fromId === me?.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </CardContent>
              <div className="p-3 border-t flex gap-2 shrink-0">
                <Input placeholder="Type a message..." value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()} />
                <Button onClick={handleSend} size="icon"><Send className="h-4 w-4" /></Button>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose someone from the left to start chatting</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
