export const field = "mt-1 w-full border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary";
export const btn = "rounded-full bg-primary px-5 py-2 text-xs uppercase tracking-widest text-primary-foreground transition hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60";
export const btnGhost = "rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-widest text-foreground/80 transition hover:border-primary hover:text-primary active:scale-95";

export const adminHead = (title: string) => () => ({
  meta: [
    { title: `${title} — Painel Bendita` },
    { name: "description", content: `${title} no painel da Bendita Cremeria.` },
    { property: "og:title", content: `${title} — Painel Bendita` },
    { property: "og:description", content: `${title} no painel administrativo.` },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ],
});

export function AdminError({ error }: { error: unknown }) {
  return <p role="alert" className="text-destructive">Erro ao carregar: {error instanceof Error ? error.message : String(error)}</p>;
}
