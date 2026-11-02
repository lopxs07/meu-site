export type Category = { id: string; name: string; note?: string };
export type Addon = { id: string; name: string; price: number };
export type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  image?: string;
  available: boolean;
  featured?: boolean;
  /** Max number of flavors the customer may pick; undefined = no flavor choice */
  maxFlavors?: number;
  addons?: Addon[];
};

export const categories: Category[] = [
  { id: "sorvetes", name: "Sorvetes" },
  { id: "waffles", name: "Waffles", note: "Ambos acompanham calda de chocolate." },
  { id: "sobremesas", name: "Sobremesas especiais" },
  { id: "bebidas", name: "Bebidas" },
  { id: "milkshake", name: "Milkshake", note: "Sabores disponíveis no expositor." },
  { id: "tacas", name: "Taças especiais" },
  { id: "bolos", name: "Bolos", note: "Pergunte pelas opções de sabores do dia." },
  { id: "mini-bolos", name: "Mini bolos" },
  { id: "salgados", name: "Salgados" },
  { id: "embalagens", name: "Embalagens" },
];

const cascao: Addon = { id: "cascao", name: "Cascão artesanal", price: 3 };

type P = Omit<Product, "id" | "slug" | "available"> & { available?: boolean };
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const raw: P[] = [
  { categoryId: "sorvetes", name: "Copo Pequeno", description: "1 sabor", price: 17, maxFlavors: 1, addons: [cascao], featured: true },
  { categoryId: "sorvetes", name: "Copo Médio", description: "Até 2 sabores", price: 20, maxFlavors: 2, addons: [cascao], featured: true },
  { categoryId: "sorvetes", name: "Copo Grande", description: "Até 3 sabores", price: 25, maxFlavors: 3, addons: [cascao] },
  { categoryId: "waffles", name: "Waffle de Brownie", description: "Acompanha calda de chocolate.", price: 14 },
  { categoryId: "waffles", name: "Waffle de Chocolate Branco", description: "Acompanha calda de chocolate.", price: 14 },
  { categoryId: "sobremesas", name: "Café + Waffle com Calda de Chocolate", price: 20 },
  { categoryId: "sobremesas", name: "Taça com 2 Bolas de Sorvete + Calda + Farofa Doce + Chantilly", price: 27, maxFlavors: 2 },
  { categoryId: "sobremesas", name: "Waffle com 2 Bolas de Sorvete + Calda + Farofa Doce", price: 27, maxFlavors: 2 },
  { categoryId: "sobremesas", name: "Vulcano di Cioccolato", price: 30, featured: true },
  { categoryId: "sobremesas", name: "Petit Gâteau com Sorvete", price: 30, maxFlavors: 1 },
  { categoryId: "sobremesas", name: "Crumble de Nozes com Maçã + 1 Bola de Sorvete", price: 30, maxFlavors: 1 },
  { categoryId: "sobremesas", name: "Brownie com Calda de Chocolate + 1 Bola de Sorvete", price: 27, maxFlavors: 1 },
  { categoryId: "bebidas", name: "Café Espresso", price: 8.5 },
  { categoryId: "bebidas", name: "Café Gelado", price: 22 },
  { categoryId: "bebidas", name: "Macchiato", price: 12 },
  { categoryId: "bebidas", name: "Capuccino", price: 15 },
  { categoryId: "bebidas", name: "Affogato", price: 22, featured: true },
  { categoryId: "bebidas", name: "Água sem Gás", price: 6 },
  { categoryId: "bebidas", name: "Água com Gás", price: 6.5 },
  { categoryId: "bebidas", name: "Coca-Cola", description: "Refrigerante 200 ml", price: 8 },
  { categoryId: "bebidas", name: "Coca-Cola Zero Açúcar", description: "Refrigerante 200 ml", price: 8 },
  { categoryId: "bebidas", name: "Guaraná", description: "Refrigerante 200 ml", price: 8 },
  { categoryId: "bebidas", name: "Guaraná Zero Açúcar", description: "Refrigerante 200 ml", price: 8 },
  { categoryId: "milkshake", name: "Milkshake", description: "Sabores disponíveis no expositor.", price: 26, maxFlavors: 1 },
  { categoryId: "tacas", name: "Taça Pistache", description: "1 bola de sorvete de pistache, calda de chocolate branco, pistache picado e chantilly.", price: 27, featured: true },
  { categoryId: "tacas", name: "Taça Brownie", description: "1 bola de sorvete, brownie picado, calda de chocolate meio amargo e chantilly.", price: 27, maxFlavors: 1 },
  { categoryId: "tacas", name: "Taça Frutas Vermelhas", description: "1 bola de sorvete, calda de chocolate branco, calda de frutas vermelhas e chantilly.", price: 27, maxFlavors: 1 },
  { categoryId: "tacas", name: "Taça Zurique", description: "1 bola de sorvete, café espresso, calda de chocolate e chantilly.", price: 27, maxFlavors: 1 },
  { categoryId: "bolos", name: "Fatia de Bolo de Sorvete", description: "Pergunte pelas opções de sabores do dia.", price: 20 },
  { categoryId: "bolos", name: "Fatia de Bolo de Sorvete + Café", description: "Pergunte pelas opções de sabores do dia.", price: 26 },
  { categoryId: "mini-bolos", name: "Fatia de Bolo Brigadeiro", price: 14 },
  { categoryId: "mini-bolos", name: "Fatia de Bolo de Coco", price: 14 },
  { categoryId: "mini-bolos", name: "Torta de Abacaxi com Coco", price: 20 },
  { categoryId: "salgados", name: "Torta de Frango", price: 20 },
  { categoryId: "embalagens", name: "Pote 700 ml — Sabores tradicionais", price: 65, maxFlavors: 1 },
  { categoryId: "embalagens", name: "Pote 700 ml — Pistache, Macadâmia e Sorvetes Zero Açúcar", price: 70, maxFlavors: 1 },
  { categoryId: "embalagens", name: "Pote Individual para Viagem", price: 3 },
];

export const products: Product[] = raw.map((p) => {
  const slug = slugify(p.name);
  return { ...p, id: slug, slug, available: p.available ?? true };
});

/** Flavors are managed by the store; none are invented. Empty until registered. */
export const flavors: { id: string; name: string; available: boolean }[] = [];

export const store = {
  name: "Bendita Cremeria",
  tagline: "Sorvetes Artesanais — Gelatos & Sorbets",
  whatsapp: "", // a preencher no painel
  instagram: "https://www.instagram.com/benditacremeria",
  instagramHandle: "@benditacremeria",
  ifood:
    "https://www.ifood.com.br/delivery/sao-carlos-sp/bendita-cremeria-sorvetes-artesanais---gelatos--sorbets-centro/3966715e-e09b-4f4d-a7fb-183635416912?UTM_Medium=share",
  address: "Rua Padre Teixeira, 2216 — Centro, São Carlos - SP",
  mapsQuery: "Rua Padre Teixeira, 2216, Centro, São Carlos - SP",
  payments: ["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro"],
  delivery: true,
  pickup: true,
};

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
