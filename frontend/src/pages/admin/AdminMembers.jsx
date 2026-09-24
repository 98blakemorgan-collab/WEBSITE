import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, Search, Loader2 } from "lucide-react";

const statusStyle = (s) => ({
  active: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-[#D4AF37]/15 text-[#D4AF37]",
  none: "bg-white/5 text-amber-50/40",
  expired: "bg-red-500/15 text-red-400",
}[s] || "bg-white/5 text-amber-50/40");

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/admin/members").then((r) => setMembers(r.data));
  useEffect(() => { load(); }, []);

  const openEdit = (m) => { setEdit(m); setForm({ membership_status: m.membership_status || "none", membership_type: m.membership_type || "", membership_expiry: m.membership_expiry || "" }); };

  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/admin/members/${edit.id}`, form);
      toast.success("Member updated");
      setEdit(null);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Update failed"); }
    finally { setBusy(false); }
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.name}?`)) return;
    try { await api.delete(`/admin/members/${m.id}`); toast.success("Member removed"); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Delete failed"); }
  };

  const filtered = members.filter((m) => (m.name + m.email + (m.membership_type || "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div data-testid="admin-members">
      <h1 className="font-serif text-3xl text-amber-50 mb-1">Member Management</h1>
      <p className="text-amber-50/50 mb-6">Roster of members, roles and membership status.</p>

      <div className="relative max-w-sm mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-50/40" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members…" className="pl-9 bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50" data-testid="member-search" />
      </div>

      <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#6B0F0F] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#D4AF37]/15 hover:bg-transparent">
              <TableHead className="text-amber-50/50">Name</TableHead>
              <TableHead className="text-amber-50/50">Email</TableHead>
              <TableHead className="text-amber-50/50">Type</TableHead>
              <TableHead className="text-amber-50/50">Status</TableHead>
              <TableHead className="text-amber-50/50 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id} className="border-[#D4AF37]/10 hover:bg-white/5" data-testid={`member-row-${m.id}`}>
                <TableCell className="text-amber-50 font-medium">{m.name} {m.role === "admin" && <span className="text-[10px] font-mono text-[#D4AF37]">(admin)</span>}</TableCell>
                <TableCell className="text-amber-50/60 text-sm">{m.email}</TableCell>
                <TableCell className="text-amber-50/70 text-sm">{m.membership_type || "—"}</TableCell>
                <TableCell><span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-full ${statusStyle(m.membership_status)}`}>{m.membership_status || "none"}</span></TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => openEdit(m)} size="icon" variant="ghost" className="text-amber-50/70 hover:text-[#D4AF37]" data-testid={`edit-member-${m.id}`}><Pencil className="w-4 h-4" /></Button>
                  {m.role !== "admin" && <Button onClick={() => remove(m)} size="icon" variant="ghost" className="text-amber-50/70 hover:text-red-400" data-testid={`delete-member-${m.id}`}><Trash2 className="w-4 h-4" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Edit {edit?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono uppercase text-amber-50/50">Membership Status</label>
              <Select value={form.membership_status} onValueChange={(v) => setForm({ ...form, membership_status: v })}>
                <SelectTrigger className="bg-[#550000] border-[#D4AF37]/25 mt-1" data-testid="member-status-select"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50">
                  {["none", "pending", "active", "expired"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-amber-50/50">Membership Type</label>
              <Select value={form.membership_type || "none"} onValueChange={(v) => setForm({ ...form, membership_type: v === "none" ? "" : v })}>
                <SelectTrigger className="bg-[#550000] border-[#D4AF37]/25 mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent className="bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50">
                  {["none", "On Stage", "Backstage", "Technical", "Front of House", "Patron"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-amber-50/50">Renewal Date</label>
              <Input value={form.membership_expiry} onChange={(e) => setForm({ ...form, membership_expiry: e.target.value })} placeholder="2026-12-31" className="bg-[#550000] border-[#D4AF37]/25 mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEdit(null)} className="text-amber-50/60">Cancel</Button>
            <Button onClick={save} disabled={busy} className="bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50" data-testid="save-member-btn">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
