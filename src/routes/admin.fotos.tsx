import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, productsQuery, type ProductRow } from "@/lib/admin-data";
import { brl } from "@/lib/menu";
import { adminHead, AdminError } from "@/components/admin-ui";
import { ImageUploader } from "@/components/image-uploader";

export const Route = createFileRoute("/admin/fotos")({
  head: adminHead("Fotos dos produtos"),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(productsQuery), context.queryClient.ensureQueryData(categoriesQuery)]),
  component: PhotosPage,
  errorComponent: AdminError,
});

function PhotosPage() {
  const qc = useQueryClient();
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const [filter, setFilter] = useState<"todos" | "sem-foto">("todos");

  const setImage = async (p: ProductRow, url: string | null) => {
    const { error } = await supabase.from("products").update({ image_url: url }).eq("id", p.id);
    if (error) return void toast.error("Não foi possível salvar a foto.");
    if (!url) toast.success("Foto removida.");
    await qc.invalidateQueries({ queryKey: productsQuery.queryKey });
  };

  const missing = products.filter((p) => !p.image_url).length;
  const shown = filter === "sem-foto" ? products.filter((p) => !p.image_url) : products;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl text-primary">Fotos dos produtos</h1>
          <p className="mt-1 text-sm text-foreground/60">Clique numa foto ou arraste uma imagem para enviar. JPG, PNG ou WEBP até 5 MB.</p>
        </div>
        <div className="flex gap-2">
          {(["todos", "sem-foto"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`chip press ${filter === f ? "chip-active" : ""}`}>
              {f === "todos" ? `Todos (${products.length})` : `Sem foto (${missing})`}
            </button>
          ))}
        </div>
      </div>
      {cats.map((c) => {
        const list = shown.filter((p) => p.category_id === c.id);
        if (!list.length) return null;
        return (
          <section key={`${c.id}-${filter}`} className="mt-8">
            <h2 className="eyebrow">{c.name}</h2>
            <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((p, i) => (
                <div key={p.id} className="stagger-in lift-card border border-border bg-card p-3" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                  <ImageUploader value={p.image_url} folder="produtos" onChange={(url) => setImage(p, url)} />
                  <p className="mt-3 text-sm leading-snug">{p.name}</p>
                  <p className="text-xs text-foreground/60">{brl(Number(p.price))}</p>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {!shown.length && <p className="fade-up mt-10 text-center text-foreground/60">Todos os produtos já têm foto. 🎉</p>}
    </div>
  );
}
