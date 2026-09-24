import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Lightbulb, Zap, Clock } from "lucide-react";

const HERO = "https://images.pexels.com/photos/7709689/pexels-photo-7709689.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const empty = { name: "", manufacturer: "", model: "", fixture_type: "Profile", quantity: 1, dmx_address: "", dmx_channels: 1, power_watts: 0, lamp_hours: 0, location: "LX 1", status: "In Service", notes: "" };
const types = ["Fresnel", "Profile", "PAR", "LED Wash", "Moving Head", "Cyc", "Follow Spot"];
const locations = ["FOH Bar 1", "FOH Bar 2", "LX 1", "LX 2", "LX 3", "Bridge", "Stage Floor", "Store"];
const statuses = ["In Service", "Maintenance", "Faulty", "Retired"];

const statusStyle = (s) => ({
  "In Service": "bg-emerald-500/15 text-emerald-400",
  "Maintenance": "bg-[#D4AF37]/15 text-[#D4AF37]",
  "Faulty": "bg-red-500/15 text-red-400",
  "Retired": "bg-white/5 text-amber-50/40",
}[s] || "bg-white/5 text-amber-50/40");

export default function AdminFixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/admin/fixtures").then((r) => setFixtures(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (f) => { setEditing(f.id); setForm({ ...f }); setOpen(true); };

  const save = async () => {
    setBusy(true);
    const payload = { ...form, quantity: Number(form.quantity), dmx_channels: Number(form.dmx_channels), power_watts: Number(form.power_watts), lamp_hours: Number(form.lamp_hours) };
    try {
      if (editing) await api.put(`/admin/fixtures/${editing}`, payload);
      else await api.post("/admin/fixtures", payload);
      toast.success(editing ? "Fixture updated" : "Fixture added");
      setOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.detail || "Save failed"); }
    finally { setBusy(false); }
  };

  const remove = async (id) => { if (!window.confirm("Delete this fixture?")) return; await api.delete(`/admin/fixtures/${id}`); toast.success("Fixture deleted"); load(); };

  const totalPower = fixtures.reduce((s, f) => s + (f.power_watts || 0) * (f.quantity || 1), 0);
  const inService = fixtures.filter((f) => f.status === "In Service").length;

  return (
    <div data-testid="admin-fixtures">
      <div className="relative rounded-2xl overflow-hidden mb-8 h-40">
        <img src={HERO} alt="Lighting rig" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0A0B] to-[#0D0A0B]/30" />
        <div className="absolute inset-0 flex flex-col justify-center px-8">
          <p className="eyebrow mb-1">Technical inventory</p>
          <h1 className="font-serif text-3xl text-amber-50">Lighting Fixture Assets</h1>
          <p className="text-amber-50/60 text-sm mt-1">Track fixtures, DMX addressing, lamp hours and maintenance status.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
        <div className="p-5 rounded-2xl bg-[#181316] border border-[#D4AF37]/15"><div className="flex justify-between mb-2"><span className="text-xs font-mono uppercase text-amber-50/50">Fixtures</span><Lightbulb className="w-4 h-4 text-[#D4AF37]" /></div><p className="font-serif text-2xl text-amber-50">{fixtures.length}</p></div>
        <div className="p-5 rounded-2xl bg-[#181316] border border-[#D4AF37]/15"><div className="flex justify-between mb-2"><span className="text-xs font-mono uppercase text-amber-50/50">In Service</span><Lightbulb className="w-4 h-4 text-emerald-400" /></div><p className="font-serif text-2xl text-emerald-400">{inService}</p></div>
        <div className="p-5 rounded-2xl bg-[#181316] border border-[#D4AF37]/15"><div className="flex justify-between mb-2"><span className="text-xs font-mono uppercase text-amber-50/50">Total Load</span><Zap className="w-4 h-4 text-[#D4AF37]" /></div><p className="font-serif text-2xl text-amber-50">{(totalPower / 1000).toFixed(1)}<span className="text-sm text-amber-50/50 ml-1">kW</span></p></div>
        <div className="p-5 rounded-2xl bg-[#181316] border border-[#D4AF37]/15 flex items-center justify-center"><Button onClick={openNew} className="rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50 w-full" data-testid="new-fixture-btn"><Plus className="w-4 h-4 mr-2" />Add Fixture</Button></div>
      </div>

      <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#181316] overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[#D4AF37]/15 hover:bg-transparent">
              <TableHead className="text-amber-50/50">Fixture</TableHead>
              <TableHead className="text-amber-50/50">Type</TableHead>
              <TableHead className="text-amber-50/50">Qty</TableHead>
              <TableHead className="text-amber-50/50">DMX</TableHead>
              <TableHead className="text-amber-50/50">Location</TableHead>
              <TableHead className="text-amber-50/50">Lamp Hrs</TableHead>
              <TableHead className="text-amber-50/50">Status</TableHead>
              <TableHead className="text-amber-50/50 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fixtures.map((f) => (
              <TableRow key={f.id} className="border-[#D4AF37]/10 hover:bg-white/5" data-testid={`fixture-row-${f.id}`}>
                <TableCell><div className="text-amber-50 font-medium">{f.name}</div><div className="text-xs text-amber-50/50 font-mono">{f.manufacturer} {f.model}</div></TableCell>
                <TableCell className="text-amber-50/70 text-sm">{f.fixture_type}</TableCell>
                <TableCell className="text-amber-50/70">{f.quantity}</TableCell>
                <TableCell className="font-mono text-sm text-[#D4AF37]">{f.dmx_address || "—"}{f.dmx_channels ? ` /${f.dmx_channels}ch` : ""}</TableCell>
                <TableCell className="text-amber-50/70 text-sm font-mono">{f.location}</TableCell>
                <TableCell className="text-amber-50/70 text-sm font-mono flex items-center gap-1"><Clock className="w-3 h-3 text-amber-50/40" />{f.lamp_hours}h</TableCell>
                <TableCell><span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-full ${statusStyle(f.status)}`}>{f.status}</span></TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button onClick={() => openEdit(f)} size="icon" variant="ghost" className="text-amber-50/70 hover:text-[#D4AF37]" data-testid={`edit-fixture-${f.id}`}><Pencil className="w-4 h-4" /></Button>
                  <Button onClick={() => remove(f.id)} size="icon" variant="ghost" className="text-amber-50/70 hover:text-red-400" data-testid={`delete-fixture-${f.id}`}><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#181316] border-[#D4AF37]/25 text-amber-50 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-2xl">{editing ? "Edit Fixture" : "Add Fixture"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-xs font-mono uppercase text-amber-50/50">Name / Label</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0D0A0B] border-[#D4AF37]/25 mt-1" data-testid="fixture-name-input" /></div>
            <div><label className="text-xs font-mono uppercase text-amber-50/50">Manufacturer</label><Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="bg-[#0D0A0B] border-[#D4AF37]/25 mt-1" /></div>
            <div><label className="text-xs font-mono uppercase text-amber-50/50">Model</label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="bg-[#0D0A0B] border-[#D4AF37]/25 mt-1" /></div>
            <div>
              <label className="text-xs font-mono uppercase text-amber-50/50">Type</label>
              <Select value={form.fixture_type} onValueChange={(v) => setForm({ ...form, fixture_type: v })}>
                <SelectTrigger className="bg-[#0D0A0B] border-[#D4AF37]/25 mt-1" data-testid="fixture-type-select"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#181316] border-[#D4AF37]/25 text-amber-50">{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-mono uppercase text-amber-50/50">Quantity</label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="bg-[#0D0A0B] border-[#D4AF37]/25 mt-1" /></div>
            <div><label className="text-xs font-mono uppercase text-amber-50/50">DMX Address</label><Input value={form.dmx_address} onChange={(e) => setForm({ ...form, dmx_address: e.target.value })} placeholder="A001" className="bg-[#0D0A0B] border-[#D4AF37]/25 mt-1 font-mono" /></div>
            <div><label className="text-xs font-mono uppercase text-amber-50/50">DMX Channels</label><Input type="number" value={form.dmx_channels} onChange={(e) => setForm({ ...form, dmx_channels: e.target.value })} className="bg-[#0D0A0B] border-[#D4AF37]/25 mt-1" /></div>
            <div><label className="text-xs font-mono uppercase text-amber-50/50">Power (W)</label><Input type="number" value={form.power_watts} onChange={(e) => setForm({ ...form, power_watts: e.target.value })} className="bg-[#0D0A0B] border-[#D4AF37]/25 mt-1" /></div>
            <div><label className="text-xs font-mono uppercase text-amber-50/50">Lamp Hours</label><Input type="number" value={form.lamp_hours} onChange={(e) => setForm({ ...form, lamp_hours: e.target.value })} className="bg-[#0D0A0B] border-[#D4AF37]/25 mt-1" /></div>
            <div>
              <label className="text-xs font-mono uppercase text-amber-50/50">Location</label>
              <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                <SelectTrigger className="bg-[#0D0A0B] border-[#D4AF37]/25 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#181316] border-[#D4AF37]/25 text-amber-50">{locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-amber-50/50">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-[#0D0A0B] border-[#D4AF37]/25 mt-1" data-testid="fixture-status-select"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#181316] border-[#D4AF37]/25 text-amber-50">{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><label className="text-xs font-mono uppercase text-amber-50/50">Notes</label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="bg-[#0D0A0B] border-[#D4AF37]/25 mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-amber-50/60">Cancel</Button>
            <Button onClick={save} disabled={busy} className="bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50" data-testid="save-fixture-btn">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Fixture"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
