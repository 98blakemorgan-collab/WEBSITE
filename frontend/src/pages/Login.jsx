import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const HERO = "/venue/slider-1.jpg";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(email, password);
      navigate(u.role === "admin" ? "/admin" : "/portal");
    } catch (err) {
      setError(apiErrorMessage(err.response?.data?.detail) || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0D0A0B]">
      <div className="hidden lg:block relative grain">
        <img src={HERO} alt="Stage" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0A0B] via-[#0D0A0B]/40 to-transparent" />
        <div className="absolute bottom-10 left-10">
          <p className="eyebrow mb-2">Since 1953</p>
          <p className="font-serif text-3xl text-amber-50 max-w-sm leading-tight">Welcome back to the company.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-3 mb-10">
            <span className="w-11 h-11 rounded-full bg-[#FAF7F2] p-1.5 flex items-center justify-center ring-1 ring-[#D4AF37]/40"><img src="/pp-logo.png" alt="Plantagenet Players" className="w-full h-full object-contain" /></span>
            <span className="font-serif text-lg text-amber-50">Plantagenet Players</span>
          </Link>
          <h1 className="font-serif text-3xl text-amber-50">Sign in</h1>
          <p className="mt-2 text-sm text-amber-50/60">Access your tickets, membership and more.</p>

          <form onSubmit={submit} className="mt-8 space-y-5" data-testid="login-form">
            {error && <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/40 text-sm text-red-300" data-testid="login-error">{error}</div>}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-[#181316] border-[#D4AF37]/25 text-amber-50 h-11" data-testid="login-email" />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-[#181316] border-[#D4AF37]/25 text-amber-50 h-11" data-testid="login-password" />
            </div>
            <Button type="submit" disabled={busy} className="w-full h-12 rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50 font-semibold" data-testid="login-submit">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-amber-50/60">New here? <Link to="/register" className="text-[#D4AF37] hover:underline" data-testid="go-register">Create an account</Link></p>
        </div>
      </div>
    </div>
  );
}
