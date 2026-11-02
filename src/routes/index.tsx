import { createFileRoute, Link } from "@tanstack/react-router";
import { products, store, brl } from "@/lib/menu";
import { Seal, PhotoPlaceholder } from "@/components/site";
import { getHomeSettings, getProductImages } from "@/lib/home.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bendita Cremeria — Gelatos & Sorbets em São Carlos" },
      { name: "description", content: "Gelatos e sorbets artesanais no centro de São Carlos. Veja o cardápio e faça seu pedido." },
      { property: "og:title", content: "Bendita Cremeria — Gelatos & Sorbets" },
      { property: "og:description", content: "Gelatos e sorbets artesanais no centro de São Carlos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    const [settings, images] = await Promise.all([getHomeSettings(), getProductImages()]);
    return { settings, images };
  },
  component: Home,
});

function Home() {
  const { settings: h, images } = Route.useLoaderData();
  const featured = products.filter((p) => p.featured).slice(0, 6).map((p) => ({ ...p, image: images[p.slug] ?? p.image }));
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
          <div className="fade-up">
            <p className="eyebrow">{h?.hero_eyebrow || "Gelateria artesanal · São Carlos"}</p>
            <h1 className="mt-5 text-5xl leading-[1.05] text-primary md:text-7xl">
              Bendita <em className="text-secondary">Cremeria</em>
            </h1>
            <p className="mt-6 max-w-md text-lg text-foreground/75">
              {h?.hero_subtitle || "Gelatos & sorbets feitos à mão, com o cuidado das gelaterias italianas e o afeto de casa."}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/cardapio" className="rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-widest text-primary-foreground transition hover:opacity-90">Conheça o cardápio</Link>
              <Link to="/cardapio" className="rounded-full border border-primary px-7 py-3 text-sm uppercase tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground">Faça seu pedido</Link>
              <a href={store.ifood} target="_blank" rel="noreferrer" className="px-3 py-3 text-sm uppercase tracking-widest text-foreground/60 underline-offset-4 hover:underline">ou peça pelo iFood</a>
            </div>
          </div>
          <div className="fade-up relative mx-auto aspect-square w-full max-w-md rounded-full border border-secondary/50 p-6 [animation-delay:200ms] float-slow">
            {h?.hero_image_url ? <img src={h.hero_image_url} alt="Bendita Cremeria" className="h-full w-full rounded-full object-cover" /> : <PhotoPlaceholder className="h-full w-full rounded-full" label="Foto da casa" />}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground reveal">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <Seal className="mx-auto h-14 w-14 text-secondary" />
          <p className="eyebrow mt-6">Nossa essência</p>
          <h2 className="mt-4 text-4xl md:text-5xl">{h?.essence_title || "Cremosidade que se faz com tempo"}</h2>
          <p className="mt-6 leading-relaxed opacity-80">
            {h?.essence_text || "Na Bendita, cada sabor é produzido artesanalmente, em pequenas quantidades, para chegar ao balcão no ponto certo. Gelatos densos e sedosos, sorbets vibrantes e sobremesas pensadas para acompanhar um bom café."}
          </p>
        </div>
      </section>

      {h?.show_featured !== false && (<section className="mx-auto max-w-6xl px-5 py-20 reveal">
        <div className="flex items-end justify-between">
          <div><p className="eyebrow">Destaques</p><h2 className="mt-3 text-4xl text-primary">Para começar</h2></div>
          <Link to="/cardapio" className="text-sm uppercase tracking-widest text-primary hover:underline">Ver tudo →</Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <Link key={p.id} to="/produto/$slug" params={{ slug: p.slug }} className="group reveal transition duration-300 hover:-translate-y-1">
              {p.image ? <img src={p.image} alt={p.name} className="aspect-[4/3] w-full object-cover" /> : <PhotoPlaceholder className="aspect-[4/3] w-full transition group-hover:opacity-90" />}
              <div className="mt-4 flex justify-between gap-4">
                <h3 className="text-2xl text-foreground group-hover:text-primary">{p.name}</h3>
                <span className="text-secondary">{brl(p.price)}</span>
              </div>
              {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
            </Link>
          ))}
        </div>
      </section>)}

      <section className="border-y border-border bg-card reveal">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
          <div><p className="eyebrow">Gelato</p><h3 className="mt-3 text-3xl text-primary">À base de leite, denso e aveludado</h3><p className="mt-4 text-foreground/70">Menos ar e temperatura de serviço mais alta que o sorvete comum: o sabor aparece inteiro, a textura derrete devagar.</p></div>
          <div><p className="eyebrow">Sorbet</p><h3 className="mt-3 text-3xl text-primary">Fruta, água e frescor</h3><p className="mt-4 text-foreground/70">Sem leite, intenso e refrescante — a fruta em sua forma mais pura, para quem quer leveza.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <p className="eyebrow">Visite a Bendita</p>
        <h2 className="mt-3 text-4xl text-primary">{store.address}</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/contato" className="rounded-full border border-primary px-6 py-3 text-sm uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground">Como chegar</Link>
          <a href={store.instagram} target="_blank" rel="noreferrer" className="rounded-full border border-primary px-6 py-3 text-sm uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground">Instagram</a>
          <a href={store.ifood} target="_blank" rel="noreferrer" className="rounded-full border border-primary px-6 py-3 text-sm uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground">iFood</a>
        </div>
      </section>
    </>
  );
}
