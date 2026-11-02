import { brl } from "./menu";

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  flavors: string[];
  addons: { name: string; price: number }[];
  note?: string | undefined;
};

export const lineTotal = (l: CartLine) =>
  (l.unitPrice + l.addons.reduce((s, a) => s + a.price, 0)) * l.quantity;

export const cartSubtotal = (lines: CartLine[]) => lines.reduce((s, l) => s + lineTotal(l), 0);

export function validFlavorCount(selected: number, max?: number) {
  if (max === undefined) return selected === 0;
  return selected <= max;
}

export type Checkout = {
  name: string;
  phone: string;
  mode: "delivery" | "retirada";
  address?: string;
  complement?: string;
  reference?: string;
  payment: string;
  notes?: string;
};

export function whatsappMessage(lines: CartLine[], c: Checkout, orderRef?: string) {
  const out: string[] = [];
  out.push(`*Novo pedido — Bendita Cremeria*${orderRef ? ` (${orderRef})` : ""}`);
  out.push("");
  for (const l of lines) {
    out.push(`${l.quantity}x ${l.name} — ${brl(lineTotal(l))}`);
    if (l.flavors.length) out.push(`   Sabores: ${l.flavors.join(", ")}`);
    for (const a of l.addons) out.push(`   + ${a.name} (${brl(a.price)})`);
    if (l.note) out.push(`   Obs.: ${l.note}`);
  }
  out.push("");
  out.push(`*Subtotal:* ${brl(cartSubtotal(lines))}`);
  if (c.mode === "delivery") out.push("Taxa de entrega: a combinar");
  out.push("");
  out.push(`*Cliente:* ${c.name}`);
  out.push(`*Telefone:* ${c.phone}`);
  out.push(`*Modalidade:* ${c.mode === "delivery" ? "Delivery" : "Retirada na loja"}`);
  if (c.mode === "delivery") {
    out.push(`*Endereço:* ${c.address}`);
    if (c.complement) out.push(`Complemento: ${c.complement}`);
    if (c.reference) out.push(`Referência: ${c.reference}`);
  }
  out.push(`*Pagamento:* ${c.payment}`);
  if (c.notes) out.push(`*Observações:* ${c.notes}`);
  out.push("");
  out.push("Status: Aguardando confirmação");
  return out.join("\n");
}

export const whatsappUrl = (number: string, msg: string) =>
  `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
