import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { mediaUrl } from "@/components/MediaPicker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, Copy } from "lucide-react";

export default function MediaLibrary() {
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef();

  const load = () => api.get("/admin/media").then((r) => setPhotos(r.data.photos || []));
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post("/admin/upload", fd);
      toast.success("Uploaded to library");
      load();
    } catch (err) { toast.error(err.response?.data?.detail || "Upload failed"); }
    finally { setBusy(false); e.target.value = ""; }
  };

  const remove = async (p) => {
    const id = p.split("/api/uploads/")[1];
    if (!id) return toast.error("Built-in photos can't be deleted");
    if (!window.confirm("Delete this file?")) return;
    await api.delete(`/admin/uploads/${id}`);
    toast.success("Deleted");
    load();
  };

  const copy = (p) => { navigator.clipboard?.writeText(mediaUrl(p)); toast.success("URL copied"); };

  return (
    <div data-testid="admin-media">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="font-serif text-3xl text-amber-50">Media Library</h1><p className="text-amber-50/50">All photos &amp; files stored in your site database.</p></div>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={upload} />
        <Button onClick={() => fileRef.current?.click()} disabled={busy} className="rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50" data-testid="media-upload-btn">
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}Upload
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {photos.map((p) => {
          const uploaded = p.includes("/api/uploads/");
          return (
            <div key={p} className="rounded-xl overflow-hidden border border-[#D4AF37]/15 bg-[#6B0F0F] group relative" data-testid="media-item">
              <div className="aspect-square bg-[#3D0000]"><img src={mediaUrl(p)} alt="" className="w-full h-full object-cover" /></div>
              <div className="p-2 flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-50/40">{uploaded ? "uploaded" : "built-in"}</span>
                <div className="flex gap-1">
                  <button onClick={() => copy(p)} className="text-amber-50/60 hover:text-[#D4AF37]" title="Copy URL"><Copy className="w-4 h-4" /></button>
                  {uploaded && <button onClick={() => remove(p)} className="text-amber-50/60 hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
