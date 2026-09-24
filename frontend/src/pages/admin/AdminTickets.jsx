import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ticket, DollarSign } from "lucide-react";

function fmt(iso) { try { return new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return iso; } }

export default function AdminTickets() {
  const [txns, setTxns] = useState([]);

  useEffect(() => { api.get("/admin/transactions").then((r) => setTxns(r.data)); }, []);

  const paid = txns.filter((t) => t.payment_status === "paid");
  const revenue = paid.reduce((s, t) => s + (t.amount || 0), 0);
  const ticketCount = paid.reduce((s, t) => s + (t.quantity || 0), 0);

  return (
    <div data-testid="admin-tickets">
      <h1 className="font-serif text-3xl text-amber-50 mb-1">Ticket Sales</h1>
      <p className="text-amber-50/50 mb-6">Every checkout and confirmed sale across all productions.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-8">
        <div className="p-6 rounded-2xl bg-[#181316] border border-[#D4AF37]/15">
          <div className="flex items-center justify-between mb-3"><span className="text-xs font-mono uppercase text-amber-50/50">Revenue</span><DollarSign className="w-5 h-5 text-[#D4AF37]" /></div>
          <p className="font-serif text-3xl text-amber-50">${revenue.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="p-6 rounded-2xl bg-[#181316] border border-[#D4AF37]/15">
          <div className="flex items-center justify-between mb-3"><span className="text-xs font-mono uppercase text-amber-50/50">Tickets Sold</span><Ticket className="w-5 h-5 text-[#8B1E26]" /></div>
          <p className="font-serif text-3xl text-amber-50">{ticketCount}</p>
        </div>
        <div className="p-6 rounded-2xl bg-[#181316] border border-[#D4AF37]/15">
          <div className="flex items-center justify-between mb-3"><span className="text-xs font-mono uppercase text-amber-50/50">Transactions</span><Ticket className="w-5 h-5 text-[#D4AF37]" /></div>
          <p className="font-serif text-3xl text-amber-50">{txns.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#181316] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#D4AF37]/15 hover:bg-transparent">
              <TableHead className="text-amber-50/50">Date</TableHead>
              <TableHead className="text-amber-50/50">Show</TableHead>
              <TableHead className="text-amber-50/50">Section</TableHead>
              <TableHead className="text-amber-50/50">Qty</TableHead>
              <TableHead className="text-amber-50/50">Buyer</TableHead>
              <TableHead className="text-amber-50/50">Amount</TableHead>
              <TableHead className="text-amber-50/50">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {txns.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-amber-50/40 py-10">No transactions yet.</TableCell></TableRow>
            ) : txns.map((t) => (
              <TableRow key={t.session_id} className="border-[#D4AF37]/10 hover:bg-white/5" data-testid={`txn-row-${t.session_id}`}>
                <TableCell className="text-amber-50/60 text-sm font-mono">{fmt(t.created_at)}</TableCell>
                <TableCell className="text-amber-50">{t.show_title}</TableCell>
                <TableCell className="text-amber-50/70 text-sm">{t.tier_name}</TableCell>
                <TableCell className="text-amber-50/70">{t.quantity}</TableCell>
                <TableCell className="text-amber-50/60 text-sm">{t.buyer_email || "Guest"}</TableCell>
                <TableCell className="text-amber-50 font-medium">${Number(t.amount).toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-full ${t.payment_status === "paid" ? "bg-emerald-500/15 text-emerald-400" : t.payment_status === "pending" ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "bg-red-500/15 text-red-400"}`}>{t.payment_status}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
