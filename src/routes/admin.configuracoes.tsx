import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, type SettingsRow } from "@/lib/admin-data";
import { adminHead, AdminError, btn, field } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/configuracoes")({
  head: adminHead("Configurações"),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: SettingsPage,
  errorComponent: AdminError,
});

function SettingsPage() {
  const { data } = useSuspenseQuery(settingsQuery);
  if (!data) return <p>Configurações não encontradas.</p>;
  return <SettingsForm initial={data} />;
}

function SettingsForm({ initial }: { initial: SettingsRow }) {
  const qc = useQueryClient();
  const [s, setS] = useState(initial);
  const [fee, setFee] = useState(initial.delivery_fee?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const txt = (k: keyof SettingsRow) => ({
    value: (s[k] as string | null) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setS({ ...s, [k]: e.target.value }),
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("store_settings")
      .update({
        store_name: s.store_name,
        whatsapp: s.whatsapp?.trim() || null,
        address: s.address || null,
        instagram: s.instagram || null,
        ifood: s.ifood || null,
        opening_hours: s.opening_hours || null,
        delivery_enabled: s.delivery_enabled,
        pickup_enabled: s.pickup_enabled,
        delivery_fee: fee.trim() === "" ? null : Number(fee.replace(",", ".")),
      })
      .eq("id", 1);
    setBusy(false);
    if (error) return void toast.error("Não foi possível salvar.");
    toast.success("Configurações salvas.");
    qc.invalidateQueries({ queryKey: settingsQuery.queryKey });
  };

  return (
    <form onSubmit={save} className="max-w-xl space-y-4">
      <h1 className="text-3xl text-primary">Configurações da loja</h1>
      <label className="block text-sm">Nome da loja<input className={field} {...txt("store_name")} /></label>
      <label className="block text-sm">WhatsApp (com DDD, recebe os pedidos)<input className={field} placeholder="16 99999-9999" {...txt("whatsapp")} /></label>
      <label className="block text-sm">Endereço<input className={field} {...txt("address")} /></label>
      <label className="block text-sm">Instagram<input className={field} {...txt("instagram")} /></label>
      <label className="block text-sm">Link do iFood<input className={field} {...txt("ifood")} /></label>
      <label className="block text-sm">Horário de funcionamento<textarea rows={3} className={field} {...txt("opening_hours")} /></label>
      <label className="block text-sm">Taxa de entrega (R$) — deixe vazio para "a combinar"<input inputMode="decimal" className={field} value={fee} onChange={(e) => setFee(e.target.value)} /></label>
      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={s.delivery_enabled} onChange={(e) => setS({ ...s, delivery_enabled: e.target.checked })} /> Delivery ativo</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={s.pickup_enabled} onChange={(e) => setS({ ...s, pickup_enabled: e.target.checked })} /> Retirada ativa</label>
      </div>
      <p className="text-xs text-foreground/60">Textos e foto do topo do site ficam na aba “Página inicial”.</p>
      <button disabled={busy} className={btn}>{busy ? "Salvando…" : "Salvar"}</button>
    </form>
  );
}
