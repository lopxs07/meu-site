import { describe, expect, it } from "vitest";
import { summarizeOrders } from "./admin-data";

const item = (name: string, quantity: number, subtotal: number) =>
  ({ product_name: name, quantity, subtotal }) as never;

describe("summarizeOrders", () => {
  it("excludes cancelled orders from revenue and counts", () => {
    const r = summarizeOrders([
      { status: "concluido", total: 40, delivery_type: "delivery", order_items: [item("Copo Médio", 2, 40)] },
      { status: "cancelado", total: 100, delivery_type: "retirada", order_items: [item("Copo Grande", 4, 100)] },
      { status: "confirmado", total: 20, delivery_type: "retirada", order_items: [item("Copo Médio", 1, 20)] },
    ]);
    expect(r.revenue).toBe(60);
    expect(r.count).toBe(2);
    expect(r.cancelled).toBe(1);
    expect(r.averageTicket).toBe(30);
    expect(r.topProducts).toEqual([{ name: "Copo Médio", quantity: 3, revenue: 60 }]);
  });
});
