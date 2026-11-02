import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, type SettingsRow } from "@/lib/admin-data";
import { adminHead, AdminError, btn, field } from "@/components/admin-ui";
import { ImageUploader } from "@/components/image-uploader";
import { Seal } from "@/components/site";

export const Route = createFileRoute("/admin/pagina-inicial")({
  head: adminHead("Página inicial"),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: HomeEditorPage,
  errorComponent: AdminError,
});

const DEFAULTS = {
  hero_eyebrow: "Gelateria artesanal · São Carlos",
  hero_subtitle: "Gelatos & sorbets feitos à mão, com o cuidado das gelaterias italianas e o afeto de casa.",
  essence_title: "Cremosidade que se faz com tempo",
  essence_text:
    "Na Bendita, cada sabor é produzido artesanalmente, em pequenas quantidades, para chegar ao balcão no ponto certo. Gelatos densos e sedosos, sorbets vibrantes e sobremesas pensadas para acompanhar um bom café.",
};

function HomeEditorPage() {
  const { data } = useSuspenseQuery(settingsQuery);
  if (!data) return <p>Configurações não encontradas.</p>;
  return <HomeEditor initial={data} />;
}

type Fields = Pick<SettingsRow, "hero_eyebrow" | "hero_subtitle" | "hero_image_url" | "essence_title" | "essence_text" | "show_featured">;

function HomeEditor({ initial }: { initial: SettingsRow }) {
  const qc = useQueryClient();
  const [s, setS] = useState<Fields>({
    hero_eyebrow: initial.hero_eyebrow,
    hero_subtitle: initial.hero_subtitle,
    hero_image_url: initial.hero_image_url,
    essence_title: initial.essence_title,
    essence_text: initial.essence_text,
    show_featured: initial.show_featured,
  });
  const [busy, setBusy] = useState(false);
  const txt = (k: keyof typeof DEFAULTS) => ({
    value: s[k] ?? "",
    placeholder: DEFAULTS[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setS({ ...s, [k]: e.target.value }),
  });

  const persist = async (next: Fields, quiet = false) => {
    setBusy(true);
    const { error } = await supabase
      .from("store_settings")
      .update({
        hero_eyebrow: next.hero_eyebrow?.trim() || null,
        hero_subtitle: next.hero_subtitle?.trim() || null,
        hero_image_url: next.hero_image_url || null,
        essence_title: next.essence_title?.trim() || null,
        essence_text: next.essence_text?.trim() || null,
        show_featured: next.show_featured,
      })
      .eq("id", 1);
    setBusy(false);
    if (error) return void toast.error("Não foi possível salvar.");
    if (!quiet) toast.success("Página inicial atualizada.");
    qc.invalidateQueries({ queryKey: settingsQuery.queryKey });
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    void persist(s);
  };

  const setHeroImage = async (url: string | null) => {
    const next = { ...s, hero_image_url: url };
    setS(next);
    await persist(next, true);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl text-primary">Página inicial</h1>
          <a href="/" target="_blank" rel="noreferrer" className="press inline-flex items-center gap-1 text-xs uppercase tracking-widest text-foreground/60 hover:text-primary">
            Ver site <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="text-xs text-foreground/60">Campos vazios usam o texto padrão (mostrado em cinza).</p>

        <fieldset className="stagger-in space-y-4 border border-border bg-card p-5">
          <legend className="eyebrow px-2">Topo do site</legend>
          <div>
            <p className="text-sm">Foto principal</p>
            <ImageUploader value={s.hero_image_url} folder="inicio" onChange={setHeroImage} round className="mx-auto mt-2 max-w-[220px] [&_.upload-drop]:aspect-square" />
          </div>
          <label className="block text-sm">Frase acima do título<input className={field} {...txt("hero_eyebrow")} /></label>
          <label className="block text-sm">Texto de apresentação<textarea rows={3} className={field} {...txt("hero_subtitle")} /></label>
        </fieldset>

        <fieldset className="stagger-in space-y-4 border border-border bg-card p-5 [animation-delay:80ms]">
          <legend className="eyebrow px-2">Nossa essência</legend>
          <label className="block text-sm">Título<input className={field} {...txt("essence_title")} /></label>
          <label className="block text-sm">Texto<textarea rows={5} className={field} {...txt("essence_text")} /></label>
        </fieldset>

        <label className="stagger-in flex items-center gap-2 text-sm [animation-delay:160ms]">
          <input type="checkbox" checked={s.show_featured} onChange={(e) => setS({ ...s, show_featured: e.target.checked })} /> Mostrar produtos em destaque
        </label>
        <button disabled={busy} className={btn}>{busy ? "Salvando…" : "Salvar alterações"}</button>
      </form>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="eyebrow">Prévia</p>
        <div className="preview-frame mt-3 overflow-hidden border border-border">
          <div className="grid items-center gap-6 bg-background p-6 sm:grid-cols-2">
            <div key={`${s.hero_eyebrow}${s.hero_subtitle}`} className="fade-up">
              <p className="eyebrow">{s.hero_eyebrow || DEFAULTS.hero_eyebrow}</p>
              <p className="mt-2 font-serif text-3xl leading-tight text-primary">Bendita <em className="text-secondary">Cremeria</em></p>
              <p className="mt-3 text-sm text-foreground/75">{s.hero_subtitle || DEFAULTS.hero_subtitle}</p>
            </div>
            <div className="mx-auto aspect-square w-full max-w-[180px] rounded-full border border-secondary/50 p-2">
              {s.hero_image_url ? (
                <img key={s.hero_image_url} src={s.hero_image_url} alt="" className="pop-in h-full w-full rounded-full object-cover" />
              ) : (
                <div className="photo-placeholder h-full w-full rounded-full" />
              )}
            </div>
          </div>
          <div className="bg-primary p-6 text-center text-primary-foreground">
            <Seal className="mx-auto h-8 w-8 text-secondary" />
            <p className="mt-2 font-serif text-2xl">{s.essence_title || DEFAULTS.essence_title}</p>
            <p className="mt-2 line-clamp-4 text-xs opacity-80">{s.essence_text || DEFAULTS.essence_text}</p>
          </div>
          <div className={`grid grid-cols-3 gap-2 bg-background p-4 transition-all duration-500 ${s.show_featured ? "opacity-100" : "max-h-0 overflow-hidden p-0 opacity-0"}`}>
            {[0, 1, 2].map((i) => <div key={i} className="photo-placeholder aspect-[4/3]" />)}
          </div>
        </div>
      </aside>
    </div>
  );
}
