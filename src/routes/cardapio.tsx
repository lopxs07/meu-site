import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { categories, products, brl } from "@/lib/menu";
import { PhotoPlaceholder } from "@/components/site";
import { getProductImages } from "@/lib/home.functions";

export const Route = createFileRoute("/cardapio")({
  head: () => ({
    meta: [
      { title: "Cardápio — Bendita Cremeria" },
      { name: "description", content: "Sorvetes, waffles, sobremesas, taças, bolos, bebidas e potes para levar." },
      { property: "og:title", content: "Cardápio — Bendita Cremeria" },
      { property: "og:description", content: "Gelatos, sobremesas e cafés da Bendita Cremeria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: () => getProductImages(),
  component: Menu,
});

function Menu() {
  const images = Route.useLoaderData();
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const list = products.map((p) => ({ ...p, image: images[p.slug] ?? p.image })).filter((p) => !term || `${p.name} ${p.description ?? ""}`.toLowerCase().includes(term));
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="eyebrow">Cardápio</p>
      <h1 className="mt-3 text-5xl text-primary">Feito à mão, todos os dias</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar no cardápio…" className="mt-8 w-full max-w-md border-b border-border bg-transparent py-2 outline-none focus:border-primary" />
      <nav className="sticky top-16 z-30 -mx-5 mt-6 flex gap-5 overflow-x-auto bg-background/95 px-5 py-3 text-sm">
        {categories.map((c) => (
          <a key={c.id} href={`#${c.id}`} className="press whitespace-nowrap text-foreground/60 transition-colors hover:text-primary">{c.name}</a>
        ))}
      </nav>
      {categories.map((c) => {
        const items = list.filter((p) => p.categoryId === c.id);
        if (!items.length) return null;
        return (
          <section key={c.id} id={c.id} className="scroll-mt-32 pt-14">
            <h2 className="text-3xl text-primary">{c.name}</h2>
            {c.note && <p className="mt-1 text-sm italic text-muted-foreground">{c.note}</p>}
            <div className="mt-6 grid gap-x-10 sm:grid-cols-2">
              {items.map((p) => (
                <Link key={p.id} to="/produto/$slug" params={{ slug: p.slug }} className="group reveal flex gap-4 border-b border-border/70 py-5 transition duration-300 hover:translate-x-1">
                  {p.image ? <img src={p.image} alt="" className="h-20 w-20 shrink-0 object-cover" /> : <PhotoPlaceholder className="h-20 w-20 shrink-0 [&_svg]:h-8 [&_svg]:w-8" />}
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-serif text-xl group-hover:text-primary">{p.name}</h3>
                      <span className="shrink-0 text-secondary">{brl(p.price)}</span>
                    </div>
                    {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                    {!p.available && <p className="mt-1 text-xs uppercase tracking-widest text-destructive">Indisponível</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      {!list.length && <p className="py-20 text-center text-muted-foreground">Nenhum produto encontrado para “{q}”.</p>}
    </div>
  );
}
