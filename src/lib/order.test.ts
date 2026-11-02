import { describe, it, expect } from "vitest";
import { cartSubtotal, lineTotal, validFlavorCount, whatsappMessage, type CartLine } from "./order";
import { getProduct } from "./menu";

const copo: CartLine = {
  key: "a", productId: "copo-medio", name: "Copo Médio", unitPrice: 20, quantity: 2,
  flavors: [], addons: [{ name: "Cascão artesanal", price: 3 }],
};

describe("pedido", () => {
  it("Copo Médio custa R$ 20 e aceita até 2 sabores", () => {
    const p = getProduct("copo-medio")!;
    expect(p.price).toBe(20);
    expect(validFlavorCount(2, p.maxFlavors)).toBe(true);
    expect(validFlavorCount(3, p.maxFlavors)).toBe(false);
  });
  it("cascão soma R$ 3 por unidade", () => {
    expect(lineTotal(copo)).toBe(46);
    expect(cartSubtotal([copo, { ...copo, key: "b", quantity: 1, addons: [] }])).toBe(66);
  });
  it("mensagem não inventa taxa de entrega", () => {
    const m = whatsappMessage([copo], { name: "Ana", phone: "1", mode: "delivery", address: "Rua X", payment: "Pix" });
    expect(m).toContain("Taxa de entrega: a combinar");
    expect(m).toContain("Aguardando confirmação");
  });
});
