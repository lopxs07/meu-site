import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { flavorsQuery } from "@/lib/admin-data";
import { adminHead, AdminError, btn, field } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/sabores")({
  head: adminHead("Sabores"),
  loader: ({ context }) => context.queryClient.ensureQueryData(flavorsQuery),
  component: FlavorsPage,
  errorComponent: AdminError,
});

function FlavorsPage() {
  const qc = useQueryClient();
  const { data: flavors } = useSuspenseQuery(flavorsQuery);
  const [name, setName] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: flavorsQuery.queryKey });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return undefined;
    const { error } = await supabase.from("flavors").insert({ name: name.trim() });
    if (error) return void toast.error("Não foi possível adicionar.");
    setName("");
    refresh();
  };
  const toggle = async (id: string, available: boolean) => {
    await supabase.from("flavors").update({ available }).eq("id", id);
    refresh();
  };
  const remove = async (id: string, n: string) => {
    if (!confirm(`Excluir o sabor "${n}"?`)) return undefined;
    await supabase.from("flavors").delete().eq("id", id);
    refresh();
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl text-primary">Sabores</h1>
      <p className="mt-1 text-sm text-foreground/60">Desmarque um sabor quando ele acabar no expositor.</p>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <input className={`${field} mt-0`} placeholder="Novo sabor" value={name} onChange={(e) => setName(e.target.value)} />
        <button className={btn}>Adicionar</button>
      </form>
      {flavors.length === 0 && <p className="mt-6 text-foreground/60">Nenhum sabor cadastrado ainda.</p>}
      <ul className="mt-4 divide-y divide-border border border-border bg-card">
        {flavors.map((f) => (
          <li key={f.id} className="flex items-center justify-between px-4 py-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={f.available} onChange={(e) => toggle(f.id, e.target.checked)} />
              <span className={f.available ? "" : "text-foreground/40 line-through"}>{f.name}</span>
            </label>
            <button onClick={() => remove(f.id, f.name)} className="text-xs text-destructive underline">Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
