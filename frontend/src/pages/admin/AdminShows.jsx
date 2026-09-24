import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { PhotoControls } from "@/components/MediaPicker";

const empty = {
  title: "", tagline: "", description: "", genre: "Community Production", poster_url: "",
  venue: "Plantagenet District Hall, Memorial Drive, Mount Barker", status: "upcoming",
  performances: [""], ticket_tiers: [{ name: "General Admission", price: 25, capacity: 100 }],
  director: "", duration: "", synopsis: "", cast: [], crew: [],
};

export default function AdminShows() {
  const [shows, setShows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/shows").then((r) => setShows(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s) => {
    setEditing(s.id);
    setForm({
      ...s,
      performances: s.performances?.length ? s.performances : [""],
      ticket_tiers: s.ticket_tiers?.length ? s.ticket_tiers.map((t) => ({ name: t.name, price: t.price, capacity: t.capacity })) : empty.ticket_tiers,
      director: s.director || "", duration: s.duration || "", synopsis: s.synopsis || "",
      cast: s.cast || [], crew: s.crew || [],
    });
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    const payload = {
      ...form,
      performances: form.performances.filter((p) => p),
      ticket_tiers: form.ticket_tiers.filter((t) => t.name).map((t) => ({ name: t.name, price: Number(t.price), capacity: Number(t.capacity) })),
      cast: (form.cast || []).filter((c) => c.actor || c.role),
      crew: (form.crew || []).filter((c) => c.name || c.role),
    };
    try {
      if (editing) await api.put(`/admin/shows/${editing}`, payload);
      else await api.post("/admin/shows", payload);
      toast.success(editing ? "Show updated" : "Show created");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this show?")) return;
    await api.delete(`/admin/shows/${id}`);
    toast.success("Show deleted");
    load();
  };

  const setTier = (i, k, v) => setForm((f) => ({ ...f, ticket_tiers: f.ticket_tiers.map((t, idx) => idx === i ? { ...t, [k]: v } : t) }));
  const setPerf = (i, v) => setForm((f) => ({ ...f, performances: f.performances.map((p, idx) => idx === i ? v : p) }));
  const setCast = (i, k, v) => setForm((f) => ({ ...f, cast: f.cast.map((c, idx) => idx === i ? { ...c, [k]: v } : c) }));
  const setCrew = (i, k, v) => setForm((f) => ({ ...f, crew: f.crew.map((c, idx) => idx === i ? { ...c, [k]: v } : c) }));

  return (
    <div data-testid="admin-shows">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="font-serif text-3xl text-amber-50">Show Management</h1><p className="text-amber-50/50">Create and manage productions, showtimes and ticket prices.</p></div>
        <Button onClick={openNew} className="rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50" data-testid="new-show-btn"><Plus className="w-4 h-4 mr-2" />New Show</Button>
      </div>

      <div className="grid gap-4">
        {shows.map((s) => (
          <div key={s.id} className="flex items-center gap-5 p-4 rounded-xl bg-[#6B0F0F] border border-[#D4AF37]/15" data-testid={`admin-show-${s.id}`}>
            <img src={s.poster_url} alt={s.title} className="w-20 h-20 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-xl text-amber-50 truncate">{s.title}</h3>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${s.status === "current" ? "bg-[#8B1E26] text-amber-50" : s.status === "upcoming" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-white/5 text-amber-50/40"}`}>{s.status}</span>
              </div>
              <p className="text-sm text-amber-50/50 truncate">{s.tagline}</p>
              <p className="text-xs font-mono text-amber-50/40 mt-1">{s.ticket_tiers?.map((t) => `${t.name} $${t.price} (${t.sold}/${t.capacity})`).join(" · ")}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => openEdit(s)} size="icon" variant="ghost" className="text-amber-50/70 hover:text-[#D4AF37]" data-testid={`edit-show-${s.id}`}><Pencil className="w-4 h-4" /></Button>
              <Button onClick={() => remove(s.id)} size="icon" variant="ghost" className="text-amber-50/70 hover:text-red-400" data-testid={`delete-show-${s.id}`}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-2xl">{editing ? "Edit Show" : "New Show"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-mono uppercase text-amber-50/50">Title</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-[#550000] border-[#D4AF37]/25 mt-1" data-testid="show-title-input" /></div>
              <div><label className="text-xs font-mono uppercase text-amber-50/50">Genre</label><Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className="bg-[#550000] border-[#D4AF37]/25 mt-1" /></div>
            </div>
            <div><label className="text-xs font-mono uppercase text-amber-50/50">Tagline</label><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="bg-[#550000] border-[#D4AF37]/25 mt-1" /></div>
            <div><label className="text-xs font-mono uppercase text-amber-50/50">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#550000] border-[#D4AF37]/25 mt-1" rows={3} data-testid="show-desc-input" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-mono uppercase text-amber-50/50">Poster</label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#550000] border border-[#D4AF37]/15 shrink-0">{form.poster_url ? <img src={form.poster_url} alt="" className="w-full h-full object-cover" /> : null}</div>
                  <Input value={form.poster_url} onChange={(e) => setForm({ ...form, poster_url: e.target.value })} className="bg-[#550000] border-[#D4AF37]/25 flex-1" placeholder="URL or upload" />
                </div>
                <div className="mt-2"><PhotoControls onPick={(u) => setForm((f) => ({ ...f, poster_url: u }))} /></div>
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-amber-50/50">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-[#550000] border-[#D4AF37]/25 mt-1" data-testid="show-status-select"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50">
                    <SelectItem value="upcoming">Upcoming</SelectItem><SelectItem value="current">Now Showing</SelectItem><SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-amber-50/50">Performances (ISO datetime)</label>
              {form.performances.map((p, i) => (
                <Input key={i} value={p} onChange={(e) => setPerf(i, e.target.value)} placeholder="2026-07-17T19:30:00" className="bg-[#550000] border-[#D4AF37]/25 mt-1 font-mono text-sm" />
              ))}
              <Button size="sm" variant="ghost" className="text-[#D4AF37] mt-1" onClick={() => setForm((f) => ({ ...f, performances: [...f.performances, ""] }))}>+ Add performance</Button>
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-amber-50/50">Ticket Tiers</label>
              {form.ticket_tiers.map((t, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mt-1">
                  <Input value={t.name} onChange={(e) => setTier(i, "name", e.target.value)} placeholder="Section" className="bg-[#550000] border-[#D4AF37]/25" />
                  <Input type="number" value={t.price} onChange={(e) => setTier(i, "price", e.target.value)} placeholder="Price" className="bg-[#550000] border-[#D4AF37]/25" />
                  <Input type="number" value={t.capacity} onChange={(e) => setTier(i, "capacity", e.target.value)} placeholder="Capacity" className="bg-[#550000] border-[#D4AF37]/25" />
                </div>
              ))}
              <Button size="sm" variant="ghost" className="text-[#D4AF37] mt-1" onClick={() => setForm((f) => ({ ...f, ticket_tiers: [...f.ticket_tiers, { name: "", price: 0, capacity: 0 }] }))}>+ Add tier</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-mono uppercase text-amber-50/50">Director</label><Input value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} className="bg-[#550000] border-[#D4AF37]/25 mt-1" data-testid="show-director-input" /></div>
              <div><label className="text-xs font-mono uppercase text-amber-50/50">Running time</label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="bg-[#550000] border-[#D4AF37]/25 mt-1" placeholder="2 hrs incl. interval" /></div>
            </div>
            <div><label className="text-xs font-mono uppercase text-amber-50/50">Synopsis (extra info shown on the show page)</label><Textarea value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} className="bg-[#550000] border-[#D4AF37]/25 mt-1" rows={3} /></div>
            <div>
              <label className="text-xs font-mono uppercase text-amber-50/50">Cast</label>
              {(form.cast || []).map((c, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 mt-1 items-center">
                  <Input value={c.actor} onChange={(e) => setCast(i, "actor", e.target.value)} placeholder="Performer" className="bg-[#550000] border-[#D4AF37]/25" />
                  <Input value={c.role} onChange={(e) => setCast(i, "role", e.target.value)} placeholder="Role / character" className="bg-[#550000] border-[#D4AF37]/25" />
                  <Button size="icon" variant="ghost" className="text-amber-50/60 hover:text-red-400" onClick={() => setForm((f) => ({ ...f, cast: f.cast.filter((_, idx) => idx !== i) }))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button size="sm" variant="ghost" className="text-[#D4AF37] mt-1" data-testid="add-cast-btn" onClick={() => setForm((f) => ({ ...f, cast: [...(f.cast || []), { actor: "", role: "" }] }))}>+ Add cast member</Button>
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-amber-50/50">Creative &amp; Crew</label>
              {(form.crew || []).map((c, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 mt-1 items-center">
                  <Input value={c.role} onChange={(e) => setCrew(i, "role", e.target.value)} placeholder="Role (e.g. Director)" className="bg-[#550000] border-[#D4AF37]/25" />
                  <Input value={c.name} onChange={(e) => setCrew(i, "name", e.target.value)} placeholder="Name" className="bg-[#550000] border-[#D4AF37]/25" />
                  <Button size="icon" variant="ghost" className="text-amber-50/60 hover:text-red-400" onClick={() => setForm((f) => ({ ...f, crew: f.crew.filter((_, idx) => idx !== i) }))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button size="sm" variant="ghost" className="text-[#D4AF37] mt-1" data-testid="add-crew-btn" onClick={() => setForm((f) => ({ ...f, crew: [...(f.crew || []), { name: "", role: "" }] }))}>+ Add crew member</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-amber-50/60">Cancel</Button>
            <Button onClick={save} disabled={busy} className="bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50" data-testid="save-show-btn">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Show"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
