import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, productsQuery, type ProductRow } from "@/lib/admin-data";
import { brl } from "@/lib/menu";
import { adminHead, AdminError, btn, btnGhost, field } from "@/components/admin-ui";
import { ImageUploader } from "@/components/image-uploader";

export const Route = createFileRoute("/admin/produtos")({
  head: adminHead("Produtos"),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(productsQuery), context.queryClient.ensureQueryData(categoriesQuery)]),
  component: ProductsPage,
  errorComponent: AdminError,
});

type Addon = { id: string; name: string; price: number };
type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  available: boolean;
  featured: boolean;
  max_flavors: string;
  addons: Addon[];
  sort_order: number;
};

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const toDraft = (p: ProductRow): Draft => ({
  id: p.id,
  name: p.name,
  description: p.description ?? "",
  price: String(p.price),
  category_id: p.category_id,
  image_url: p.image_url ?? "",
  available: p.available,
  featured: p.featured,
  max_flavors: p.max_flavors == null ? "" : String(p.max_flavors),
  addons: Array.isArray(p.addons) ? (p.addons as Addon[]) : [],
  sort_order: p.sort_order,
});

function ProductsPage() {
  const qc = useQueryClient();
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const [editing, setEditing] = useState<Draft | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: productsQuery.queryKey });

  const toggle = async (p: ProductRow) => {
    await supabase.from("products").update({ available: !p.available }).eq("id", p.id);
    refresh();
  };

  const blank = (): Draft => ({
    name: "", description: "", price: "", category_id: cats[0]?.id ?? "", image_url: "",
    available: true, featured: false, max_flavors: "", addons: [], sort_order: products.length + 1,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-primary">Produtos</h1>
        <button className={btn} onClick={() => setEditing(blank())}>Novo produto</button>
      </div>
      {editing && <ProductForm key={editing.id ?? "novo"} draft={editing} cats={cats} onDone={() => { setEditing(null); refresh(); }} />}
      {cats.map((c) => {
        const list = products.filter((p) => p.category_id === c.id);
        if (!list.length) return null;
        return (
          <section key={c.id} className="mt-8">
            <h2 className="eyebrow">{c.name}</h2>
            <ul className="mt-2 divide-y divide-border border border-border bg-card">
              {list.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    {p.image_url ? <img src={p.image_url} alt="" className="h-10 w-10 object-cover" /> : <div className="photo-placeholder h-10 w-10" />}
                    <div>
                    <p className={p.available ? "" : "text-foreground/40 line-through"}>{p.name}{p.featured && " ★"}</p>
                    <p className="text-xs text-foreground/60">{brl(Number(p.price))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={p.available} onChange={() => toggle(p)} /> Disponível</label>
                    <button className={btnGhost} onClick={() => { setEditing(toDraft(p)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Editar</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ProductForm({ draft, cats, onDone }: { draft: Draft; cats: { id: string; name: string }[]; onDone: () => void }) {
  const [d, setD] = useState(draft);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD({ ...d, [k]: v });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(d.price.replace(",", "."));
    if (!d.name.trim() || !Number.isFinite(price) || price < 0) return void toast.error("Informe nome e preço válidos.");
    setBusy(true);
    const row = {
      name: d.name.trim(),
      description: d.description.trim() || null,
      price,
      category_id: d.category_id,
      image_url: d.image_url.trim() || null,
      available: d.available,
      featured: d.featured,
      max_flavors: d.max_flavors === "" ? null : Number(d.max_flavors),
      addons: d.addons.filter((a) => a.name.trim()).map((a) => ({ ...a, id: a.id || slugify(a.name), price: Number(a.price) || 0 })),
      sort_order: d.sort_order,
    };
    const { error } = d.id
      ? await supabase.from("products").update(row).eq("id", d.id)
      : await supabase.from("products").insert({ ...row, slug: `${slugify(row.name)}-${Date.now().toString(36)}` });
    setBusy(false);
    if (error) return void toast.error("Não foi possível salvar.");
    toast.success("Produto salvo.");
    onDone();
  };

  const remove = async () => {
    if (!d.id || !confirm(`Excluir "${d.name}"? Prefira desmarcar "Disponível" se for temporário.`)) return undefined;
    const { error } = await supabase.from("products").delete().eq("id", d.id);
    if (error) return void toast.error("Este produto já tem pedidos; desmarque \"Disponível\" em vez de excluir.");
    onDone();
  };

  return (
    <form onSubmit={save} className="pop-in mt-6 grid gap-3 border border-primary/40 bg-card p-5 sm:grid-cols-2">
      <h2 className="text-xl text-primary sm:col-span-2">{d.id ? "Editar produto" : "Novo produto"}</h2>
      <label className="text-sm">Nome<input className={field} value={d.name} onChange={(e) => set("name", e.target.value)} /></label>
      <label className="text-sm">Categoria
        <select className={field} value={d.category_id} onChange={(e) => set("category_id", e.target.value)}>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="text-sm sm:col-span-2">Descrição<input className={field} value={d.description} onChange={(e) => set("description", e.target.value)} /></label>
      <label className="text-sm">Preço (R$)<input inputMode="decimal" className={field} value={d.price} onChange={(e) => set("price", e.target.value)} /></label>
      <label className="text-sm">Máx. de sabores (vazio = sem escolha)<input type="number" min={0} className={field} value={d.max_flavors} onChange={(e) => set("max_flavors", e.target.value)} /></label>
      <div className="text-sm sm:col-span-2">
        <p>Foto</p>
        <div className="mt-1 grid gap-3 sm:grid-cols-[200px_1fr] sm:items-start">
          <ImageUploader value={d.image_url || null} folder="produtos" onChange={(url) => set("image_url", url ?? "")} />
          <label className="text-xs text-foreground/60">…ou cole um link<input className={field} placeholder="https://…" value={d.image_url} onChange={(e) => set("image_url", e.target.value)} /></label>
        </div>
      </div>
      <div className="sm:col-span-2">
        <p className="text-sm">Adicionais</p>
        {d.addons.map((a, i) => (
          <div key={i} className="mt-1 flex gap-2">
            <input className={`${field} mt-0`} placeholder="Nome" value={a.name} onChange={(e) => set("addons", d.addons.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <input className={`${field} mt-0 w-28`} inputMode="decimal" placeholder="Preço" value={String(a.price)} onChange={(e) => set("addons", d.addons.map((x, j) => (j === i ? { ...x, price: e.target.value as unknown as number } : x)))} />
            <button type="button" className="text-xs text-destructive underline" onClick={() => set("addons", d.addons.filter((_, j) => j !== i))}>Remover</button>
          </div>
        ))}
        <button type="button" className={`${btnGhost} mt-2`} onClick={() => set("addons", [...d.addons, { id: "", name: "", price: 0 }])}>+ Adicional</button>
      </div>
      <div className="flex gap-6 text-sm sm:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" checked={d.available} onChange={(e) => set("available", e.target.checked)} /> Disponível</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={d.featured} onChange={(e) => set("featured", e.target.checked)} /> Destaque</label>
      </div>
      <div className="flex gap-3 sm:col-span-2">
        <button disabled={busy} className={btn}>{busy ? "Salvando…" : "Salvar"}</button>
        <button type="button" className={btnGhost} onClick={onDone}>Cancelar</button>
        {d.id && <button type="button" onClick={remove} className="ml-auto text-xs text-destructive underline">Excluir</button>}
      </div>
    </form>
  );
}
