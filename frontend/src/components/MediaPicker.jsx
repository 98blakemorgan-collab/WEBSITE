import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, Images, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const mediaUrl = (p) => (p && p.startsWith("/api/") ? `${BACKEND_URL}${p}` : p);

export function PhotoControls({ onPick, accept = "image/*" }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState([]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/upload", fd);
      onPick(mediaUrl(data.path));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const openLibrary = async () => {
    setOpen(true);
    try {
      const { data } = await api.get("/admin/media");
      setPhotos(data.photos || []);
    } catch {
      setPhotos([]);
    }
  };

  return (
    <div className="flex gap-2">
      <label className="inline-flex">
        <input type="file" accept={accept} hidden onChange={upload} data-testid="photo-upload-input" />
        <Button type="button" size="sm" variant="outline" asChild className="border-[#D4AF37]/30 bg-transparent text-amber-50 cursor-pointer">
          <span>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}Upload</span>
        </Button>
      </label>
      <Button type="button" size="sm" variant="outline" onClick={openLibrary} className="border-[#D4AF37]/30 bg-transparent text-amber-50" data-testid="photo-library-btn">
        <Images className="w-4 h-4 mr-1" />Library
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50 max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Choose a photo</DialogTitle></DialogHeader>
          {photos.length === 0 ? (
            <p className="text-amber-50/50 py-8 text-center">No photos yet — upload one to build your library.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {photos.map((p) => (
                <button key={p} type="button" onClick={() => { onPick(mediaUrl(p)); setOpen(false); }} data-testid="library-photo"
                  className="aspect-square rounded-lg overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-colors">
                  <img src={mediaUrl(p)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
