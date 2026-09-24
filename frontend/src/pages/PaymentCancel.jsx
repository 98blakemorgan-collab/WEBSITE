import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center" data-testid="payment-cancel">
      <XCircle className="w-16 h-16 text-amber-50/40 mx-auto" />
      <h1 className="mt-6 font-serif text-3xl text-amber-50">Checkout cancelled</h1>
      <p className="mt-3 text-amber-50/60">No worries — your seats are still available. You can try again whenever you're ready.</p>
      <Button asChild className="mt-8 rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50"><Link to="/shows">Back to What's On</Link></Button>
    </div>
  );
}
