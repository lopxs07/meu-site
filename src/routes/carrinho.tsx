import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/menu";
import { cartSubtotal, lineTotal } from "@/lib/order";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Seu carrinho — Bendita Cremeria" },
      { name: "description", content: "Revise seu pedido antes de finalizar." },
      { property: "og:title", content: "Carrinho — Bendita Cremeria" },
      { property: "og:description", content: "Revise seu pedido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQty, remove } = useCart();
  if (!lines.length)
    return (
      <div className="mx-auto max-w-xl px-5 py-28 text-center">
        <h1 className="text-4xl text-primary">Seu carrinho está vazio</h1>
        <p className="mt-3 text-muted-foreground">Que tal um gelato?</p>
        <Link to="/cardapio" className="mt-8 inline-block rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-widest text-primary-foreground">Ver cardápio</Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-5xl text-primary">Carrinho</h1>
      <ul className="mt-8 divide-y divide-border border-y border-border">
        {lines.map((l) => (
          <li key={l.key} className="flex flex-wrap items-start gap-4 py-5">
            <div className="min-w-0 flex-1">
              <p className="font-serif text-xl">{l.name}</p>
              {l.flavors.length > 0 && <p className="text-sm text-muted-foreground">Sabores: {l.flavors.join(", ")}</p>}
              {l.addons.map((a) => <p key={a.name} className="text-sm text-muted-foreground">+ {a.name}</p>)}
              {l.note && <p className="text-sm italic text-muted-foreground">“{l.note}”</p>}
            </div>
            <div className="flex items-center border border-border">
              <button className="px-3 py-1" onClick={() => setQty(l.key, l.quantity - 1)} aria-label="Diminuir">−</button>
              <span className="w-6 text-center text-sm">{l.quantity}</span>
              <button className="px-3 py-1" onClick={() => setQty(l.key, l.quantity + 1)} aria-label="Aumentar">+</button>
            </div>
            <span className="w-24 text-right text-secondary">{brl(lineTotal(l))}</span>
            <button onClick={() => remove(l.key)} aria-label="Remover" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-between text-lg"><span>Subtotal</span><span>{brl(cartSubtotal(lines))}</span></div>
      <p className="text-sm text-muted-foreground">Taxa de entrega, se houver, será combinada no WhatsApp.</p>
      <div className="mt-8 flex flex-wrap justify-between gap-3">
        <Link to="/cardapio" className="rounded-full border border-primary px-6 py-3 text-sm uppercase tracking-widest text-primary">Continuar comprando</Link>
        <Link to="/checkout" className="rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-widest text-primary-foreground">Finalizar pedido</Link>
      </div>
    </div>
  );
}
