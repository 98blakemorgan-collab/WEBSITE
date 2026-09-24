import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Mail, Users, Loader2, Eye } from "lucide-react";

const audiences = [
  { key: "all", label: "All members" },
  { key: "active", label: "Active members only" },
  { key: "buyers", label: "All ticket buyers" },
  { key: "marketing", label: "Marketing subscribers" },
  { key: "On Stage", label: "On Stage" },
  { key: "Backstage", label: "Backstage" },
  { key: "Technical", label: "Technical" },
  { key: "Front of House", label: "Front of House" },
];

const templates = [
  { name: "Audition Call", subject: "Auditions open for our next production!", body: "Dear members,\n\nWe're thrilled to announce auditions for our upcoming production. Whether you're a seasoned performer or curious first-timer, we'd love to see you.\n\nDate: \nVenue: Plantagenet Hall\n\nBreak a leg,\nPlantagenet Players Committee" },
  { name: "Show Announcement", subject: "Tickets now on sale!", body: "Dear friends,\n\nTickets for our next show are now on sale. Book early to secure the best seats.\n\nSee you at the theatre,\nPlantagenet Players" },
  { name: "Newsletter", subject: "Plantagenet Players — Season Update", body: "Hello everyone,\n\nHere's what's happening behind the curtain this season...\n\nWarm regards,\nThe Committee" },
];

export default function AdminEmail() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  const load = () => api.get("/admin/campaigns").then((r) => setCampaigns(r.data));
  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!subject || !body) return toast.error("Subject and body are required.");
    setBusy(true);
    try {
      const { data } = await api.post("/admin/campaigns", { subject, body, audience });
      toast.success(`Sent to ${data.recipient_count} recipient(s)`);
      setSubject(""); setBody(""); setPreview(false);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Send failed"); }
    finally { setBusy(false); }
  };

  const applyTemplate = (t) => { setSubject(t.subject); setBody(t.body); };

  return (
    <div data-testid="admin-email">
      <h1 className="font-serif text-3xl text-amber-50 mb-1">Bulk Email</h1>
      <p className="text-amber-50/50 mb-2">Compose announcements, newsletters and show calls to member groups.</p>
      <div className="mb-6 inline-block px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs text-[#D4AF37] font-mono">DEMO: delivery is MOCKED — recipients & campaign history are recorded, no live email sent.</div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#6B0F0F] border border-[#D4AF37]/15 space-y-5">
          <div>
            <label className="text-xs font-mono uppercase text-amber-50/50">Audience</label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className="bg-[#550000] border-[#D4AF37]/25 mt-1 text-amber-50" data-testid="email-audience-select"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50">
                {audiences.map((a) => <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-amber-50/50">Subject</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-[#550000] border-[#D4AF37]/25 mt-1 text-amber-50" data-testid="email-subject-input" />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-amber-50/50">Message</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="bg-[#550000] border-[#D4AF37]/25 mt-1 text-amber-50 font-sans" data-testid="email-body-input" />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setPreview(!preview)} variant="outline" className="border-[#D4AF37]/30 bg-transparent text-amber-50" data-testid="email-preview-btn"><Eye className="w-4 h-4 mr-2" />{preview ? "Hide" : "Preview"}</Button>
            <Button onClick={send} disabled={busy} className="bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50 flex-1" data-testid="email-send-btn">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Send Campaign</>}</Button>
          </div>
          {preview && (
            <div className="p-6 rounded-xl bg-[#550000] border border-[#D4AF37]/25" data-testid="email-preview">
              <p className="text-xs font-mono uppercase text-[#D4AF37]/70 mb-2">Preview</p>
              <h4 className="font-serif text-lg text-amber-50">{subject || "(no subject)"}</h4>
              <div className="mt-3 text-sm text-amber-50/70 whitespace-pre-wrap">{body || "(empty)"}</div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#6B0F0F] border border-[#D4AF37]/15">
            <h3 className="font-serif text-lg text-amber-50 mb-4">Templates</h3>
            <div className="space-y-2">
              {templates.map((t) => (
                <button key={t.name} onClick={() => applyTemplate(t)} className="w-full text-left px-4 py-3 rounded-lg bg-[#550000] border border-[#D4AF37]/15 hover:border-[#D4AF37]/40 text-sm text-amber-50/80 transition-colors" data-testid={`template-${t.name.replace(/\s/g, "-")}`}>
                  <Mail className="w-4 h-4 inline mr-2 text-[#D4AF37]" />{t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-[#6B0F0F] border border-[#D4AF37]/15">
            <h3 className="font-serif text-lg text-amber-50 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-[#D4AF37]" />Recent Campaigns</h3>
            {campaigns.length === 0 ? <p className="text-sm text-amber-50/40">No campaigns sent yet.</p> : (
              <div className="space-y-3">
                {campaigns.slice(0, 6).map((c) => (
                  <div key={c.id} className="text-sm border-b border-[#D4AF37]/10 pb-3 last:border-0" data-testid={`campaign-${c.id}`}>
                    <p className="text-amber-50 truncate">{c.subject}</p>
                    <p className="text-xs text-amber-50/40 font-mono mt-0.5">{c.recipient_count} recipients · {c.audience}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
