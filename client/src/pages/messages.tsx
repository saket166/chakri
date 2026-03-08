import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users } from "lucide-react";
import { getProfile, getDMs, sendDM, getAllDMThreads, getRequests, type DirectMessage } from "@/lib/userStore";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const profile = getProfile();
  const [threads, setThreads] = useState(getAllDMThreads());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeName, setActiveName] = useState("");
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Build list of people we can message: permanent connections + active referral partners
  const reqs = getRequests();
  const connectedPeople: { id: string; name: string; context: string }[] = [];

  // From permanent connections (stored as IDs — we get names from DM history or referral history)
  profile.permanentConnections.forEach(pid => {
    const fromReq = reqs.find(r => r.requesterId === pid || r.acceptedById === pid);
    const name = fromReq ? (fromReq.requesterId === pid ? fromReq.requesterName : fromReq.acceptedByName || pid) : pid;
    if (!connectedPeople.find(c => c.id === pid))
      connectedPeople.push({ id: pid, name, context: "Permanent connection" });
  });

  // From active referral connections
  reqs.filter(r => r.connectionActive && (r.requesterId === profile.id || r.acceptedById === profile.id)).forEach(r => {
    const otherId = r.requesterId === profile.id ? r.acceptedById! : r.requesterId;
    const otherName = r.requesterId === profile.id ? (r.acceptedByName || "Referee") : r.requesterName;
    if (!connectedPeople.find(c => c.id === otherId))
      connectedPeople.push({ id: otherId, name: otherName, context: `Active referral · ${r.targetCompany}` });
  });

  useEffect(() => {
    const handler = () => setThreads(getAllDMThreads());
    window.addEventListener("chakri_dm_updated", handler);
    return () => window.removeEventListener("chakri_dm_updated", handler);
  }, []);

  useEffect(() => {
    if (activeId) setMessages(getDMs(activeId));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, threads]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const openThread = (id: string, name: string) => { setActiveId(id); setActiveName(name); setMessages(getDMs(id)); };

  const handleSend = () => {
    if (!text.trim() || !activeId) return;
    sendDM(activeId, activeName, text.trim());
    setText("");
    setMessages(getDMs(activeId));
    setThreads(getAllDMThreads());
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Sidebar: thread list + connectable people */}
        <Card className="md:col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-sm text-muted-foreground">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* Connected people you can start a convo with */}
            {connectedPeople.map(p => {
              const hasThread = threads.find(t => t.userId === p.id);
              return (
                <button key={p.id} onClick={() => openThread(p.id, p.name)}
                  className={"w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors hover:bg-muted/60 " + (activeId === p.id ? "bg-muted" : "")}>
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                      {p.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{hasThread ? hasThread.lastMsg.text : p.context}</p>
                  </div>
                </button>
              );
            })}
            {connectedPeople.length === 0 && threads.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No connections yet.</p>
                <p className="text-xs mt-1">Complete a referral to unlock messaging.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat window */}
        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {activeId ? (
            <>
              <CardHeader className="pb-3 shrink-0 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {activeName.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{activeName}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {connectedPeople.find(c => c.id === activeId)?.context || "Connection"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground pt-8">No messages yet. Say hello! 👋</p>
                )}
                {messages.map(m => (
                  <div key={m.id} className={"flex " + (m.fromId === profile.id ? "justify-end" : "justify-start")}>
                    <div className={"max-w-[75%] px-4 py-2 rounded-2xl text-sm " + (m.fromId === profile.id ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      <p>{m.text}</p>
                      <p className={"text-xs mt-1 " + (m.fromId === profile.id ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {formatDistanceToNow(new Date(m.sentAt), { addSuffix: true })}
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
