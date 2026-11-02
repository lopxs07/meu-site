import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getProduct, flavors, brl, categories } from "@/lib/menu";
import { useCart } from "@/lib/cart";
import { PhotoPlaceholder } from "@/components/site";
import { getProductImages } from "@/lib/home.functions";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ params }) => {
    const p = getProduct(params.slug);
    if (!p) throw notFound();
    const images = await getProductImages();
    return { ...p, image: images[p.slug] ?? p.image };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} — Bendita Cremeria` : "Produto — Bendita Cremeria" },
      { name: "description", content: loaderData?.description ?? "Produto do cardápio da Bendita Cremeria." },
      { property: "og:title", content: loaderData?.name ?? "Bendita Cremeria" },
      { property: "og:description", content: loaderData?.description ?? "Cardápio da Bendita Cremeria." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const p = Route.useLoaderData();
  const cart = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [sel, setSel] = useState<string[]>([]);
  const [addons, setAddons] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const activeFlavors = flavors.filter((f) => f.available);
  const cat = categories.find((c) => c.id === p.categoryId);
  const unit = p.price + (p.addons ?? []).filter((a) => addons.includes(a.id)).reduce((s, a) => s + a.price, 0);

  const toggleFlavor = (name: string) => {
    if (sel.includes(name)) return setSel(sel.filter((s) => s !== name));
    if (p.maxFlavors && sel.length >= p.maxFlavors) return toast.error(`Escolha até ${p.maxFlavors} sabor(es).`);
    setSel([...sel, name]);
  };

  const add = () => {
    cart.add({
      productId: p.id, name: p.name, unitPrice: p.price, quantity: qty, flavors: sel,
      addons: (p.addons ?? []).filter((a) => addons.includes(a.id)).map(({ name, price }) => ({ name, price })),
      note: note.trim() || undefined,
    });
    toast.success("Adicionado ao carrinho", { action: { label: "Ver carrinho", onClick: () => navigate({ to: "/carrinho" }) } });
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-2">
      {p.image ? <img src={p.image} alt={p.name} className="pop-in aspect-square w-full object-cover" /> : <PhotoPlaceholder className="aspect-square w-full" label="Foto em breve" />}
      <div className="fade-up">
        <Link to="/cardapio" className="eyebrow hover:text-primary">← {cat?.name}</Link>
        <h1 className="mt-4 text-4xl text-primary md:text-5xl">{p.name}</h1>
        <p className="mt-3 text-2xl text-secondary">{brl(p.price)}</p>
        {p.description && <p className="mt-4 text-foreground/75">{p.description}</p>}

        {p.maxFlavors !== undefined && (
          <div className="mt-8">
            <p className="eyebrow">Sabores {p.maxFlavors ? `· até ${p.maxFlavors}` : ""}</p>
            {activeFlavors.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFlavors.map((f) => (
                  <button key={f.id} onClick={() => toggleFlavor(f.name)} className={`rounded-full border px-4 py-1.5 text-sm ${sel.includes(f.name) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{f.name}</button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm italic text-muted-foreground">Pergunte pelos sabores do dia — escreva sua preferência na observação abaixo.</p>
            )}
          </div>
        )}

        {p.addons?.length ? (
          <div className="mt-8">
            <p className="eyebrow">Adicionais</p>
            {p.addons.map((a) => (
              <label key={a.id} className="mt-3 flex cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" className="accent-primary" checked={addons.includes(a.id)} onChange={(e) => setAddons(e.target.checked ? [...addons, a.id] : addons.filter((x) => x !== a.id))} />
                {a.name} <span className="text-secondary">+ {brl(a.price)}</span>
              </label>
            ))}
          </div>
        ) : null}

        <div className="mt-8">
          <p className="eyebrow">Observação</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={2} className="mt-2 w-full border border-border bg-card p-3 text-sm outline-none focus:border-primary" placeholder="Ex.: sabores preferidos, sem chantilly…" />
        </div>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex items-center border border-border">
            <button className="px-4 py-3" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Diminuir">−</button>
            <span className="w-8 text-center">{qty}</span>
            <button className="px-4 py-3" onClick={() => setQty(qty + 1)} aria-label="Aumentar">+</button>
          </div>
          <button disabled={!p.available} onClick={add} className="flex-1 rounded-full bg-primary py-3 text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-40">
            {p.available ? `Adicionar · ${brl(unit * qty)}` : "Indisponível"}
          </button>
        </div>
      </div>
    </div>
  );
}
