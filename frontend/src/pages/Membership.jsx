import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useContent } from "@/context/ContentContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Drama, Wrench, Users, HandHeart, Loader2 } from "lucide-react";

const parts = [
  { icon: Drama, title: "On Stage", desc: "Acting, singing, dancing and ensemble roles." },
  { icon: Wrench, title: "Backstage", desc: "Sets, props, costumes, stage crew and make-up." },
  { icon: Users, title: "Technical", desc: "Lighting, sound, projection and show operation." },
  { icon: HandHeart, title: "Front of House", desc: "Tickets, hospitality, publicity and welcome." },
];

const interestOptions = ["Acting", "Singing", "Dancing", "Set Building", "Costumes", "Lighting", "Sound", "Publicity", "Hospitality"];
const types = ["On Stage", "Backstage", "Technical", "Front of House", "Patron"];

export default function Membership() {
  const { user, refresh } = useAuth();
  const { content } = useContent();
  const mc = content.membership || {};
  const navigate = useNavigate();
  const [type, setType] = useState("On Stage");
  const [interests, setInterests] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && user !== false && user.membership_type) setType(user.membership_type);
    if (user && user !== false && user.interests?.length) setInterests(user.interests);
  }, [user]);

  const toggle = (i) => setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const apply = async () => {
    if (!user || user === false) {
      toast.info("Please sign in or create an account to apply.");
      navigate("/login");
      return;
    }
    setBusy(true);
    try {
      await api.post("/membership/apply", { membership_type: type, interests, message });
      await refresh();
      toast.success("Application submitted! We'll be in touch soon.");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not submit application");
    } finally {
      setBusy(false);
    }
  };

  const status = user && user !== false ? user.membership_status : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <p className="eyebrow mb-4">Find your part</p>
      <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-50 tracking-tight">{mc.title || "You don't have to act."}</h1>
      <p className="mt-4 text-amber-50/70 max-w-2xl">{mc.description || "Theatre needs all kinds of people. Experience is welcome; curiosity is enough. Choose how you'd like to be involved."}</p>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {parts.map((p) => (
          <div key={p.title} className="p-7 rounded-2xl bg-[#6B0F0F] border border-[#D4AF37]/15">
            <p.icon className="w-8 h-8 text-[#D4AF37] mb-5" />
            <h3 className="font-serif text-xl text-amber-50">{p.title}</h3>
            <p className="mt-2 text-sm text-amber-50/60 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <h2 className="font-serif text-3xl text-amber-50">Apply for membership</h2>
          <p className="mt-3 text-amber-50/65 leading-relaxed">
            Membership connects you with a warm community of makers and performers. Fill in the form
            and our committee will reach out with the next steps and season details.
          </p>
          {status && status !== "none" && (
            <div className="mt-6 p-4 rounded-xl bg-[#8B1E26]/15 border border-[#8B1E26]/40 text-amber-50/90 text-sm" data-testid="membership-status-banner">
              Your membership status: <span className="font-semibold uppercase text-[#D4AF37]">{status}</span>
            </div>
          )}
        </div>

        <div className="p-8 rounded-2xl bg-[#7A1616] border border-[#D4AF37]/25" data-testid="membership-form">
          <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2">I'd like to help with</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-[#550000] border-[#D4AF37]/25 text-amber-50" data-testid="membership-type-select"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50">
              {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-3 mt-6">Interests</label>
          <div className="grid grid-cols-2 gap-3">
            {interestOptions.map((i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-amber-50/80 cursor-pointer">
                <Checkbox checked={interests.includes(i)} onCheckedChange={() => toggle(i)} className="border-[#D4AF37]/40 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:text-slate-950" data-testid={`interest-${i}`} />
                {i}
              </label>
            ))}
          </div>

          <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2 mt-6">Anything you'd like us to know?</label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="bg-[#550000] border-[#D4AF37]/25 text-amber-50" placeholder="Tell us a little about yourself…" data-testid="membership-message" />

          <Button onClick={apply} disabled={busy} className="w-full mt-6 h-12 rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50 font-semibold" data-testid="membership-submit">
            {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : "Submit Application"}
          </Button>
        </div>
      </div>
    </div>
  );
}
