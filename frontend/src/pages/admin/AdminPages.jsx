import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useContent } from "@/context/ContentContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Save, ArrowUp, ArrowDown } from "lucide-react";
import { PhotoControls } from "@/components/MediaPicker";

const TABS = [
  { key: "home", label: "Home" },
  { key: "story", label: "Our Story" },
  { key: "membership", label: "Membership" },
  { key: "contact", label: "Contact" },
  { key: "documents", label: "Documents" },
  { key: "sponsors", label: "Sponsors" },
];

const SCHEMA = {
  home: [
    { k: "eyebrow", t: "text", label: "Hero eyebrow (small label)" },
    { k: "title_line1", t: "text", label: "Hero title" },
    { k: "title_highlight", t: "text", label: "Hero title — highlighted word" },
    { k: "subtitle", t: "area", label: "Hero subtitle" },
    { k: "slides", t: "images", label: "Hero slider photos (rotating)" },
    { k: "find_part_title", t: "text", label: "'Find your part' title" },
    { k: "find_part_desc", t: "area", label: "'Find your part' description" },
    { k: "heritage_text", t: "area", label: "Heritage paragraph" },
  ],
  story: [
    { k: "hero_image", t: "image", label: "Header image" },
    { k: "intro", t: "area", label: "Intro paragraph" },
    { k: "timeline", t: "objects", label: "History timeline", fields: [{ k: "year", label: "Year" }, { k: "text", label: "Description", area: true }], blank: { year: "", text: "" } },
    { k: "gallery", t: "images", label: "Photo gallery" },
  ],
  membership: [
    { k: "title", t: "text", label: "Heading" },
    { k: "description", t: "area", label: "Description" },
  ],
  contact: [
    { k: "hall_name", t: "text", label: "Venue name" },
    { k: "address", t: "text", label: "Address" },
    { k: "email", t: "text", label: "Email" },
    { k: "phone", t: "text", label: "Phone" },
    { k: "facebook", t: "text", label: "Facebook URL" },
    { k: "venue_desc", t: "area", label: "Venue & hall-hire description" },
  ],
  sponsors: [
    { k: "items", t: "objects", label: "Sponsors", fields: [{ k: "name", label: "Name" }, { k: "tier", label: "Tier" }, { k: "logo", label: "Logo URL" }, { k: "url", label: "Website URL" }], blank: { name: "", tier: "", logo: "", url: "" } },
  ],
  documents: [
    { k: "constitution_url", t: "file", label: "Constitution (upload a PDF or paste a link)" },
    { k: "agm_url", t: "file", label: "Latest AGM minutes (upload a PDF or paste a link)" },
  ],
};

const inputCls = "bg-[#550000] border-[#D4AF37]/25 text-amber-50 mt-1";

function ImageList({ value = [], onChange, label }) {
  const set = (i, v) => onChange(value.map((x, idx) => (idx === i ? v : x)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <label className="text-xs font-mono uppercase tracking-wider text-amber-50/60">{label}</label>
      <p className="text-[11px] text-amber-50/40 mt-1 mb-2">Paste an image URL. You can reuse the theatre's photos, e.g. <code className="text-[#D4AF37]/80">/venue/slide-4.jpg</code></p>
      <div className="space-y-2">
        {value.map((src, i) => (
          <div key={i} className="flex items-center gap-3" data-testid={`img-row-${i}`}>
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#550000] border border-[#D4AF37]/15 shrink-0">
              {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : null}
            </div>
            <Input value={src} onChange={(e) => set(i, e.target.value)} className={inputCls + " flex-1"} placeholder="/venue/slide-4.jpg or https://…" />
            <PhotoControls onPick={(u) => set(i, u)} />
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} className="text-amber-50/40 hover:text-amber-50"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => move(i, 1)} className="text-amber-50/40 hover:text-amber-50"><ArrowDown className="w-3.5 h-3.5" /></button>
            </div>
            <Button size="icon" variant="ghost" className="text-amber-50/60 hover:text-red-400" onClick={() => onChange(value.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
      <Button size="sm" variant="ghost" className="text-[#D4AF37] mt-2" onClick={() => onChange([...value, ""])}><Plus className="w-4 h-4 mr-1" />Add photo</Button>
    </div>
  );
}

function ObjectList({ value = [], onChange, label, fields, blank }) {
  const set = (i, k, v) => onChange(value.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  return (
    <div>
      <label className="text-xs font-mono uppercase tracking-wider text-amber-50/60">{label}</label>
      <div className="space-y-4 mt-2">
        {value.map((item, i) => (
          <div key={i} className="p-4 rounded-xl bg-[#550000] border border-[#D4AF37]/15 relative" data-testid={`obj-row-${i}`}>
            <div className="grid sm:grid-cols-2 gap-3">
              {fields.map((f) => (
                <div key={f.k} className={f.area ? "sm:col-span-2" : ""}>
                  <label className="text-[10px] font-mono uppercase text-amber-50/50">{f.label}</label>
                  {f.area
                    ? <Textarea value={item[f.k] || ""} onChange={(e) => set(i, f.k, e.target.value)} rows={2} className={inputCls} />
                    : <Input value={item[f.k] || ""} onChange={(e) => set(i, f.k, e.target.value)} className={inputCls} />}
                  {f.k === "logo" && <div className="mt-2"><PhotoControls onPick={(u) => set(i, "logo", u)} /></div>}
                </div>
              ))}
            </div>
            <Button size="icon" variant="ghost" className="absolute top-2 right-2 text-amber-50/60 hover:text-red-400" onClick={() => onChange(value.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
      <Button size="sm" variant="ghost" className="text-[#D4AF37] mt-2" onClick={() => onChange([...value, { ...blank }])}><Plus className="w-4 h-4 mr-1" />Add item</Button>
    </div>
  );
}

export default function AdminPages() {
  const { content, refresh } = useContent();
  const [tab, setTab] = useState("home");
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(content[tab] || {})));
  }, [tab, content]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/admin/content/${tab}`, { data: form });
      await refresh();
      toast.success("Page updated — changes are live");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const fields = SCHEMA[tab];

  return (
    <div data-testid="admin-pages">
      <h1 className="font-serif text-3xl text-amber-50 mb-1">Edit Pages</h1>
      <p className="text-amber-50/50 mb-6">Update the words, photos and sponsors on your public website. Changes go live instantly.</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} data-testid={`pagetab-${t.key}`}
            className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors ${tab === t.key ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37]" : "bg-transparent text-amber-50/70 border-[#D4AF37]/25 hover:border-[#D4AF37]/60"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl space-y-6 p-6 sm:p-8 rounded-2xl bg-[#6B0F0F] border border-[#D4AF37]/15">
        {fields.map((f) => {
          if (f.t === "text")
            return (
              <div key={f.k}>
                <label className="text-xs font-mono uppercase tracking-wider text-amber-50/60">{f.label}</label>
                <Input value={form[f.k] || ""} onChange={(e) => setField(f.k, e.target.value)} className={inputCls} data-testid={`field-${f.k}`} />
              </div>
            );
          if (f.t === "area")
            return (
              <div key={f.k}>
                <label className="text-xs font-mono uppercase tracking-wider text-amber-50/60">{f.label}</label>
                <Textarea value={form[f.k] || ""} onChange={(e) => setField(f.k, e.target.value)} rows={3} className={inputCls} data-testid={`field-${f.k}`} />
              </div>
            );
          if (f.t === "image")
            return (
              <div key={f.k}>
                <label className="text-xs font-mono uppercase tracking-wider text-amber-50/60">{f.label}</label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#550000] border border-[#D4AF37]/15 shrink-0">
                    {form[f.k] ? <img src={form[f.k]} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <Input value={form[f.k] || ""} onChange={(e) => setField(f.k, e.target.value)} className={"bg-[#550000] border-[#D4AF37]/25 text-amber-50 flex-1"} placeholder="/venue/slide-5.jpg or https://…" data-testid={`field-${f.k}`} />
                  <PhotoControls onPick={(u) => setField(f.k, u)} />
                </div>
              </div>
            );
          if (f.t === "images")
            return <ImageList key={f.k} label={f.label} value={form[f.k] || []} onChange={(v) => setField(f.k, v)} />;
          if (f.t === "file")
            return (
              <div key={f.k}>
                <label className="text-xs font-mono uppercase tracking-wider text-amber-50/60">{f.label}</label>
                <div className="flex items-center gap-3 mt-1">
                  <Input value={form[f.k] || ""} onChange={(e) => setField(f.k, e.target.value)} className="bg-[#550000] border-[#D4AF37]/25 text-amber-50 flex-1" placeholder="https://… or upload" data-testid={`field-${f.k}`} />
                  <PhotoControls accept="application/pdf,image/*" onPick={(u) => setField(f.k, u)} />
                </div>
                {form[f.k] ? <a href={form[f.k]} target="_blank" rel="noreferrer" className="text-xs text-[#D4AF37] mt-1 inline-block">Preview current file →</a> : null}
              </div>
            );
          if (f.t === "objects")
            return <ObjectList key={f.k} label={f.label} fields={f.fields} blank={f.blank} value={form[f.k] || []} onChange={(v) => setField(f.k, v)} />;
          return null;
        })}

        <div className="pt-4 border-t border-[#D4AF37]/15">
          <Button onClick={save} disabled={busy} className="rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50 px-8" data-testid="save-page-btn">
            {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save changes</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
