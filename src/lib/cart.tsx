import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CartLine } from "./order";

type Ctx = {
  lines: CartLine[];
  add: (l: Omit<CartLine, "key">) => void;
  setQty: (key: string, q: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  count: number;
};
const CartCtx = createContext<Ctx | null>(null);
const KEY = "bendita-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) setLines(JSON.parse(s));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const value: Ctx = {
    lines,
    add: (l) => setLines((prev) => [...prev, { ...l, key: crypto.randomUUID() }]),
    setQty: (key, q) =>
      setLines((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, q) } : l))),
    remove: (key) => setLines((prev) => prev.filter((l) => l.key !== key)),
    clear: () => setLines([]),
    count: lines.reduce((s, l) => s + l.quantity, 0),
  };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
