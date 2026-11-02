import { createFileRoute } from "@tanstack/react-router";
import { store } from "@/lib/menu";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato e localização — Bendita Cremeria" },
      { name: "description", content: "Rua Padre Teixeira, 2216, Centro, São Carlos - SP." },
      { property: "og:title", content: "Contato — Bendita Cremeria" },
      { property: "og:description", content: "Onde encontrar a Bendita Cremeria em São Carlos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-2">
      <div>
        <p className="eyebrow">Contato</p>
        <h1 className="mt-3 text-5xl text-primary">Venha nos visitar</h1>
        <p className="mt-6 text-lg">{store.address}</p>
        <div className="mt-8 flex flex-col gap-3 text-sm">
          <a className="text-primary underline-offset-4 hover:underline" href={store.instagram} target="_blank" rel="noreferrer">Instagram {store.instagramHandle}</a>
          <a className="text-primary underline-offset-4 hover:underline" href={store.ifood} target="_blank" rel="noreferrer">Peça pelo iFood</a>
          {store.whatsapp && <a className="text-primary underline-offset-4 hover:underline" href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>}
          <a className="text-primary underline-offset-4 hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.mapsQuery)}`} target="_blank" rel="noreferrer">Abrir no Google Maps</a>
        </div>
      </div>
      <iframe title="Mapa" className="aspect-square w-full border border-border" loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(store.mapsQuery)}&output=embed`} />
    </div>
  );
}
