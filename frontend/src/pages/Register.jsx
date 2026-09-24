import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const HERO = "/venue/slide-6.jpg";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate("/portal");
    } catch (err) {
      setError(apiErrorMessage(err.response?.data?.detail) || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#550000]">
      <div className="flex items-center justify-center p-6 sm:p-12 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-3 mb-10">
            <span className="w-11 h-11 rounded-full bg-[#FAF7F2] p-1.5 flex items-center justify-center ring-1 ring-[#D4AF37]/40"><img src="/pp-logo.png" alt="Plantagenet Players" className="w-full h-full object-contain" /></span>
            <span className="font-serif text-lg text-amber-50">Plantagenet Players</span>
          </Link>
          <h1 className="font-serif text-3xl text-amber-50">Join the company</h1>
          <p className="mt-2 text-sm text-amber-50/60">Create an account to book tickets and manage membership.</p>

          <form onSubmit={submit} className="mt-8 space-y-5" data-testid="register-form">
            {error && <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/40 text-sm text-red-300" data-testid="register-error">{error}</div>}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2">Full name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50 h-11" data-testid="register-name" />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50 h-11" data-testid="register-email" />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2">Phone (optional)</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50 h-11" data-testid="register-phone" />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2">Password</label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50 h-11" data-testid="register-password" />
            </div>
            <Button type="submit" disabled={busy} className="w-full h-12 rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50 font-semibold" data-testid="register-submit">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-amber-50/60">Already a member? <Link to="/login" className="text-[#D4AF37] hover:underline" data-testid="go-login">Sign in</Link></p>
        </div>
      </div>
      <div className="hidden lg:block relative order-1 lg:order-2 grain">
        <img src={HERO} alt="Stage" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#550000] via-[#550000]/40 to-transparent" />
      </div>
    </div>
  );
}
