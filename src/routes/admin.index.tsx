import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUSES, ordersQuery, statusLabel, type OrderWithItems } from "@/lib/admin-data";
import { brl } from "@/lib/menu";
import { adminHead, AdminError, btnGhost, field } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/")({
  head: adminHead("Pedidos"),
  loader: ({ context }) => context.queryClient.ensureQueryData(ordersQuery),
  component: OrdersPage,
  errorComponent: AdminError,
});

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.25].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.2, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
  } catch {
    /* sound unavailable */
  }
}

function OrdersPage() {
  const qc = useQueryClient();
  const { data: orders } = useSuspenseQuery(ordersQuery);
  const [filter, setFilter] = useState("ativos");
  const [sound, setSound] = useState(true);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  useEffect(() => {
    const ch = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (p) => {
        if (p.eventType === "INSERT") {
          if (soundRef.current) beep();
          toast.success(`Novo pedido ${(p.new as { order_number?: string }).order_number ?? ""}`);
        }
        qc.invalidateQueries({ queryKey: ordersQuery.queryKey });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const shown = orders.filter((o) =>
    filter === "todos" ? true : filter === "ativos" ? !["concluido", "cancelado"].includes(o.status) : o.status === filter,
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl text-primary">Pedidos</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sound} onChange={(e) => { setSound(e.target.checked); if (e.target.checked) beep(); }} /> Som de novo pedido
          </label>
          <select className={`${field} mt-0 w-auto`} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ativos">Em andamento</option>
            <option value="todos">Todos</option>
            {ORDER_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="mt-10 text-foreground/60">Nenhum pedido aqui. Novos pedidos aparecem automaticamente.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {shown.map((o) => <OrderCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order: o }: { order: OrderWithItems }) {
  const qc = useQueryClient();
  const setStatus = async (status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", o.id);
    if (error) return void toast.error("Não foi possível atualizar o status.");
    qc.invalidateQueries({ queryKey: ordersQuery.queryKey });
  };
  const phone = o.customer_phone.replace(/\D/g, "");
  return (
    <article className="border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{o.order_number} · {o.customer_name}</p>
          <p className="text-xs text-foreground/60">{new Date(o.created_at).toLocaleString("pt-BR")}</p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs">{statusLabel(o.status)}</span>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {o.order_items.map((i) => (
          <li key={i.id}>
            {i.quantity}x {i.product_name} — {brl(Number(i.subtotal))}
            {i.flavors.length > 0 && <span className="block text-xs text-foreground/60">Sabores: {i.flavors.join(", ")}</span>}
            {i.notes && <span className="block text-xs text-foreground/60">Obs.: {i.notes}</span>}
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-border pt-2 text-sm">
        <p>{o.delivery_type === "delivery" ? `Delivery: ${o.delivery_address ?? ""} ${o.delivery_complement ?? ""}` : "Retirada na loja"}</p>
        {o.delivery_reference && <p className="text-foreground/60">Ref.: {o.delivery_reference}</p>}
        <p>Pagamento: {o.payment_method}</p>
        {o.notes && <p>Obs.: {o.notes}</p>}
        <p className="mt-1 font-medium">Total: {brl(Number(o.total))}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select className={`${field} mt-0 w-auto`} value={o.status} onChange={(e) => setStatus(e.target.value)}>
          {ORDER_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <a className={btnGhost} href={`https://wa.me/${phone.length <= 11 ? "55" + phone : phone}`} target="_blank" rel="noreferrer">WhatsApp</a>
      </div>
    </article>
  );
}
