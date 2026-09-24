import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, Mail, Phone, Facebook } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return toast.error("Please fill in all fields.");
    toast.success("Thank you! Your message has been sent to our box office.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <p className="eyebrow mb-4">Get in touch</p>
      <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-50 tracking-tight">Contact us.</h1>
      <p className="mt-4 text-amber-50/70 max-w-xl">Questions about tickets, membership or sponsorship? We'd love to hear from you.</p>

      <div className="mt-12 grid lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-[#181316] border border-[#D4AF37]/15 flex items-start gap-4">
            <MapPin className="w-6 h-6 text-[#D4AF37] mt-1" />
            <div><h3 className="font-serif text-lg text-amber-50">Plantagenet District Hall</h3><p className="text-sm text-amber-50/60">Memorial Drive, Mount Barker WA 6324</p></div>
          </div>
          <div className="p-6 rounded-xl bg-[#181316] border border-[#D4AF37]/15 flex items-start gap-4">
            <Mail className="w-6 h-6 text-[#D4AF37] mt-1" />
            <div><h3 className="font-serif text-lg text-amber-50">Email</h3><p className="text-sm text-amber-50/60">boxoffice@plantagenetplayers.site</p></div>
          </div>
          <div className="p-6 rounded-xl bg-[#181316] border border-[#D4AF37]/15 flex items-start gap-4">
            <Phone className="w-6 h-6 text-[#D4AF37] mt-1" />
            <div><h3 className="font-serif text-lg text-amber-50">Phone</h3><p className="text-sm text-amber-50/60">(08) 9851 0000</p></div>
          </div>
          <a href="https://www.facebook.com/plantagenetplayers" target="_blank" rel="noreferrer" className="p-6 rounded-xl bg-[#181316] border border-[#D4AF37]/15 flex items-start gap-4 hover:border-[#D4AF37]/40 transition-colors" data-testid="contact-facebook">
            <Facebook className="w-6 h-6 text-[#D4AF37] mt-1" />
            <div><h3 className="font-serif text-lg text-amber-50">Facebook</h3><p className="text-sm text-amber-50/60">facebook.com/plantagenetplayers</p></div>
          </a>
        </div>

        <form onSubmit={submit} className="p-8 rounded-2xl bg-[#241D21] border border-[#D4AF37]/25 space-y-5" data-testid="contact-form">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0D0A0B] border-[#D4AF37]/25 text-amber-50" data-testid="contact-name" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2">Email</label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-[#0D0A0B] border-[#D4AF37]/25 text-amber-50" data-testid="contact-email" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2">Message</label>
            <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="bg-[#0D0A0B] border-[#D4AF37]/25 text-amber-50" data-testid="contact-message" />
          </div>
          <Button type="submit" className="w-full h-12 rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50 font-semibold" data-testid="contact-submit">Send Message</Button>
        </form>
      </div>

      <div className="mt-8 p-8 rounded-2xl bg-[#181316] border border-[#D4AF37]/15" data-testid="venue-facilities">
        <h2 className="font-serif text-2xl text-amber-50 mb-2">The Venue &amp; Hall Hire</h2>
        <p className="text-amber-50/65 max-w-3xl leading-relaxed">Plantagenet District Hall on Memorial Drive seats up to 165 with retractable theatre-style seating, an equipped stage with in-house lighting &amp; sound, a full-service kitchen and bar with exterior serving windows, a spacious carpeted foyer and full air-conditioning. It's ideal for productions, receptions, reunions, conferences, community events and weddings.</p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[["Capacity", "Up to 165"], ["Seating", "Retractable theatre-style"], ["Stage", "Lighting & sound systems"], ["Kitchen & Bar", "Full-service"]].map(([k, v]) => (
            <div key={k} className="p-4 rounded-xl bg-[#0D0A0B] border border-[#D4AF37]/15">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]/70">{k}</p>
              <p className="text-sm text-amber-50 mt-1">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
