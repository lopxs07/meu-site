import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useCart } from "@/lib/cart";
import { brl, store } from "@/lib/menu";
import { cartSubtotal, whatsappMessage, whatsappUrl, type Checkout } from "@/lib/order";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar pedido — Bendita Cremeria" },
      { name: "description", content: "Informe seus dados e envie o pedido pelo WhatsApp." },
      { property: "og:title", content: "Finalizar pedido — Bendita Cremeria" },
      { property: "og:description", content: "Envie seu pedido pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutPage,
});

const schema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome").max(80),
    phone: z.string().trim().regex(/^[\d\s()+-]{10,20}$/, "Telefone inválido"),
    mode: z.enum(["delivery", "retirada"]),
    address: z.string().trim().max(200).optional(),
    complement: z.string().trim().max(100).optional(),
    reference: z.string().trim().max(150).optional(),
    payment: z.string().min(1, "Escolha a forma de pagamento"),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.mode !== "delivery" || (d.address && d.address.length >= 5), { path: ["address"], message: "Informe o endereço de entrega" });

const field = "mt-1 w-full border border-border bg-card px-3 py-2.5 outline-none focus:border-primary";

function CheckoutPage() {
  const { lines, clear } = useCart();
  const [f, setF] = useState<Checkout>({ name: "", phone: "", mode: store.delivery ? "delivery" : "retirada", payment: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ msg: string } | null>(null);
  const set = (k: keyof Checkout) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  if (done)
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="eyebrow">Status: Aguardando confirmação</p>
        <h1 className="mt-4 text-4xl text-primary">Resumo do pedido pronto</h1>
        <p className="mt-4 text-foreground/70">Enviar a mensagem pelo WhatsApp não confirma o pedido — a Bendita responderá confirmando.</p>
        <pre className="mt-8 whitespace-pre-wrap border border-border bg-card p-5 text-left text-sm">{done.msg}</pre>
        {store.whatsapp ? (
          <a href={whatsappUrl(store.whatsapp, done.msg)} target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-widest text-primary-foreground">Abrir WhatsApp novamente</a>
        ) : (
          <p className="mt-6 text-sm text-destructive">O WhatsApp da loja ainda não foi configurado. Peça pelo <a className="underline" href={store.ifood} target="_blank" rel="noreferrer">iFood</a> enquanto isso.</p>
        )}
      </div>
    );

  if (!lines.length)
    return (
      <div className="mx-auto max-w-xl px-5 py-28 text-center">
        <h1 className="text-4xl text-primary">Nada para finalizar</h1>
        <Link to="/cardapio" className="mt-8 inline-block rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-widest text-primary-foreground">Ver cardápio</Link>
      </div>
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    const msg = whatsappMessage(lines, r.data as Checkout);
    if (store.whatsapp) window.open(whatsappUrl(store.whatsapp, msg), "_blank");
    clear();
    setDone({ msg });
  };

  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1 text-xs text-destructive">{errors[k]}</p> : null);

  return (
    <form onSubmit={submit} noValidate className="mx-auto grid max-w-5xl gap-12 px-5 py-14 md:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <h1 className="text-5xl text-primary">Finalizar pedido</h1>
        <label className="block text-sm">Nome<input className={field} value={f.name} onChange={set("name")} /><Err k="name" /></label>
        <label className="block text-sm">Telefone<input className={field} inputMode="tel" placeholder="(16) 9 0000-0000" value={f.phone} onChange={set("phone")} /><Err k="phone" /></label>
        <div className="flex gap-3 text-sm">
          {store.delivery && <button type="button" onClick={() => setF({ ...f, mode: "delivery" })} className={`flex-1 border py-3 ${f.mode === "delivery" ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>Delivery</button>}
          {store.pickup && <button type="button" onClick={() => setF({ ...f, mode: "retirada" })} className={`flex-1 border py-3 ${f.mode === "retirada" ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>Retirada na loja</button>}
        </div>
        {f.mode === "delivery" ? (
          <>
            <label className="block text-sm">Endereço<input className={field} value={f.address ?? ""} onChange={set("address")} /><Err k="address" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">Complemento<input className={field} value={f.complement ?? ""} onChange={set("complement")} /></label>
              <label className="block text-sm">Referência<input className={field} value={f.reference ?? ""} onChange={set("reference")} /></label>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Retirada em {store.address}.</p>
        )}
        <label className="block text-sm">Forma de pagamento
          <select className={field} value={f.payment} onChange={set("payment")}>
            <option value="">Selecione…</option>
            {store.payments.map((p) => <option key={p}>{p}</option>)}
          </select><Err k="payment" />
        </label>
        <label className="block text-sm">Observações<textarea rows={3} className={field} value={f.notes ?? ""} onChange={set("notes")} /></label>
      </div>
      <aside className="h-fit border border-border bg-card p-6">
        <p className="eyebrow">Resumo</p>
        {lines.map((l) => <p key={l.key} className="mt-3 flex justify-between text-sm"><span>{l.quantity}x {l.name}</span></p>)}
        <div className="mt-5 flex justify-between border-t border-border pt-4 text-lg"><span>Total</span><span>{brl(cartSubtotal(lines))}</span></div>
        {f.mode === "delivery" && <p className="text-xs text-muted-foreground">+ taxa de entrega a combinar</p>}
        <button className="mt-6 w-full rounded-full bg-primary py-3 text-sm uppercase tracking-widest text-primary-foreground">Enviar pelo WhatsApp</button>
      </aside>
    </form>
  );
}
