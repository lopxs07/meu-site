import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, type CategoryRow } from "@/lib/admin-data";
import { adminHead, AdminError, btn, field } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/categorias")({
  head: adminHead("Categorias"),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQuery),
  component: CategoriesPage,
  errorComponent: AdminError,
});

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function CategoriesPage() {
  const qc = useQueryClient();
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const [name, setName] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: categoriesQuery.queryKey });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = slugify(name);
    if (!id) return undefined;
    const { error } = await supabase.from("categories").insert({ id, name: name.trim(), sort_order: cats.length + 1 });
    if (error) return void toast.error("Não foi possível criar (já existe?).");
    setName("");
    refresh();
  };
  const save = async (c: CategoryRow, patch: Partial<CategoryRow>) => {
    const { error } = await supabase.from("categories").update(patch).eq("id", c.id);
    if (error) toast.error("Não foi possível salvar.");
    refresh();
  };
  const remove = async (c: CategoryRow) => {
    if (!confirm(`Excluir a categoria "${c.name}"?`)) return undefined;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) toast.error("Mova ou exclua os produtos desta categoria primeiro.");
    refresh();
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl text-primary">Categorias</h1>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <input className={`${field} mt-0`} placeholder="Nova categoria" value={name} onChange={(e) => setName(e.target.value)} />
        <button className={btn}>Adicionar</button>
      </form>
      <ul className="mt-4 space-y-2">
        {cats.map((c) => (
          <li key={c.id} className="grid gap-2 border border-border bg-card p-3 sm:grid-cols-[1fr_2fr_70px_auto_auto] sm:items-center">
            <input className={`${field} mt-0`} defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && save(c, { name: e.target.value })} />
            <input className={`${field} mt-0`} placeholder="Observação" defaultValue={c.description ?? ""} onBlur={(e) => e.target.value !== (c.description ?? "") && save(c, { description: e.target.value || null })} />
            <input type="number" title="Ordem" className={`${field} mt-0`} defaultValue={c.sort_order} onBlur={(e) => Number(e.target.value) !== c.sort_order && save(c, { sort_order: Number(e.target.value) })} />
            <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={c.active} onChange={(e) => save(c, { active: e.target.checked })} /> Visível</label>
            <button onClick={() => remove(c)} className="text-xs text-destructive underline">Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
