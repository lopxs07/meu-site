import { Link } from "@tanstack/react-router";
import { ShoppingBag, Instagram, MapPin } from "lucide-react";
import { store } from "@/lib/menu";
import { useCart } from "@/lib/cart";

export function Seal({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <path d="M40 46 L50 72 L60 46 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M38 46 a12 12 0 0 1 24 0 Z" fill="currentColor" opacity="0.85" />
      <text x="50" y="30" textAnchor="middle" fontSize="9" letterSpacing="2" fill="currentColor" fontFamily="Cormorant Garamond, serif">BENDITA</text>
    </svg>
  );
}

export function PhotoPlaceholder({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`photo-placeholder flex items-center justify-center text-primary/30 ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <Seal className="h-14 w-14" />
        {label && <span className="eyebrow text-primary/40">{label}</span>}
      </div>
    </div>
  );
}

export function Header() {
  const { count } = useCart();
  const nav = [
    { to: "/", label: "Início" },
    { to: "/cardapio", label: "Cardápio" },
    { to: "/contato", label: "Contato" },
  ] as const;
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2 text-primary">
          <Seal className="h-9 w-9" />
          <span className="font-serif text-xl tracking-wide">Bendita</span>
        </Link>
        <nav className="hidden gap-8 text-sm sm:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="nav-underline text-foreground/70 hover:text-primary" activeProps={{ className: "text-primary" }} activeOptions={{ exact: n.to === "/" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a href={store.ifood} target="_blank" rel="noreferrer" className="hidden text-xs uppercase tracking-widest text-foreground/70 hover:text-primary md:block">
            iFood
          </a>
          <Link to="/carrinho" className="relative flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:shadow-md" aria-label="Carrinho">
            <ShoppingBag className="h-4 w-4" />
            <span key={count} className="pop-in inline-block">{count}</span>
          </Link>
        </div>
      </div>
      <nav className="flex justify-center gap-6 border-t border-border/50 py-2 text-sm sm:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className="text-foreground/70" activeProps={{ className: "text-primary" }} activeOptions={{ exact: n.to === "/" }}>
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-chocolate text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-3 text-secondary"><Seal className="h-12 w-12" /><span className="font-serif text-2xl text-primary-foreground">Bendita Cremeria</span></div>
          <p className="mt-3 text-sm opacity-70">{store.tagline}</p>
        </div>
        <div className="text-sm opacity-80">
          <p className="eyebrow mb-3">Visite</p>
          <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0" />{store.address}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="eyebrow mb-1">Peça & siga</p>
          <a href={store.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-secondary"><Instagram className="h-4 w-4" />{store.instagramHandle}</a>
          <a href={store.ifood} target="_blank" rel="noreferrer" className="hover:text-secondary">Peça pelo iFood</a>
          <Link to="/cardapio" className="hover:text-secondary">Pedido pelo site (WhatsApp)</Link>
        </div>
      </div>
      <p className="border-t border-primary-foreground/10 py-5 text-center text-xs opacity-50">© {new Date().getFullYear()} Bendita Cremeria · São Carlos - SP</p>
    </footer>
  );
}
