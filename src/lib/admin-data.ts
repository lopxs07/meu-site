import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type FlavorRow = Database["public"]["Tables"]["flavors"]["Row"];
export type SettingsRow = Database["public"]["Tables"]["store_settings"]["Row"];
export type OrderWithItems = OrderRow & { order_items: OrderItemRow[] };

export const ORDER_STATUSES = [
  { id: "aguardando_confirmacao", label: "Aguardando confirmação" },
  { id: "confirmado", label: "Confirmado" },
  { id: "em_preparacao", label: "Em preparação" },
  { id: "saiu_para_entrega", label: "Saiu para entrega" },
  { id: "pronto_para_retirada", label: "Pronto para retirada" },
  { id: "concluido", label: "Concluído" },
  { id: "cancelado", label: "Cancelado" },
] as const;

export const statusLabel = (s: string) => ORDER_STATUSES.find((x) => x.id === s)?.label ?? s;

const must = <T,>(r: { data: T | null; error: { message: string } | null }): T => {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
};

export const ordersQuery = queryOptions({
  queryKey: ["admin", "orders"],
  queryFn: async () =>
    must(
      await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(300),
    ) as OrderWithItems[],
});

export const productsQuery = queryOptions({
  queryKey: ["admin", "products"],
  queryFn: async () => must(await supabase.from("products").select("*").order("category_id").order("sort_order")),
});

export const categoriesQuery = queryOptions({
  queryKey: ["admin", "categories"],
  queryFn: async () => must(await supabase.from("categories").select("*").order("sort_order")),
});

export const flavorsQuery = queryOptions({
  queryKey: ["admin", "flavors"],
  queryFn: async () => must(await supabase.from("flavors").select("*").order("name")),
});

export const settingsQuery = queryOptions({
  queryKey: ["admin", "settings"],
  queryFn: async () => must(await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle()),
});

export const reportOrdersQuery = (fromIso: string) =>
  queryOptions({
    queryKey: ["admin", "report", fromIso],
    queryFn: async () =>
      must(
        await supabase.from("orders").select("*, order_items(*)").gte("created_at", fromIso).order("created_at"),
      ) as OrderWithItems[],
  });

export { must };

/** Report totals. Cancelled orders never count toward revenue, order count or top products. */
export function summarizeOrders(orders: Pick<OrderWithItems, "status" | "total" | "delivery_type" | "order_items">[]) {
  const valid = orders.filter((o) => o.status !== "cancelado");
  const revenue = valid.reduce((s, o) => s + Number(o.total), 0);
  const products = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const o of valid)
    for (const i of o.order_items) {
      const p = products.get(i.product_name) ?? { name: i.product_name, quantity: 0, revenue: 0 };
      p.quantity += i.quantity;
      p.revenue += Number(i.subtotal);
      products.set(i.product_name, p);
    }
  return {
    count: valid.length,
    cancelled: orders.length - valid.length,
    revenue,
    averageTicket: valid.length ? revenue / valid.length : 0,
    delivery: valid.filter((o) => o.delivery_type === "delivery").length,
    pickup: valid.filter((o) => o.delivery_type !== "delivery").length,
    topProducts: [...products.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10),
  };
}
