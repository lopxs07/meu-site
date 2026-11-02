import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/product-images";
import { PhotoPlaceholder } from "@/components/site";

type Props = {
  value: string | null;
  folder: "produtos" | "inicio";
  onChange: (url: string | null) => void | Promise<void>;
  className?: string;
  round?: boolean;
};

export function ImageUploader({ value, folder, onChange, className = "", round }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const send = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file, folder);
      await onChange(url);
      toast.success("Foto enviada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar a imagem.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const shape = round ? "rounded-full" : "";
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void send(e.dataTransfer.files[0]); }}
        className={`upload-drop group relative block aspect-[4/3] w-full overflow-hidden ${shape} ${drag ? "upload-drop-active" : ""}`}
        aria-label={value ? "Trocar foto" : "Enviar foto"}
      >
        {value ? (
          <img key={value} src={value} alt="" className={`pop-in h-full w-full object-cover ${shape}`} />
        ) : (
          <PhotoPlaceholder className={`h-full w-full ${shape}`} />
        )}
        <span className={`upload-overlay ${shape} ${busy ? "opacity-100" : ""}`}>
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          <span className="text-xs uppercase tracking-widest">{busy ? "Enviando…" : value ? "Trocar foto" : "Enviar foto"}</span>
        </span>
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => void send(e.target.files?.[0])} />
      {value && !busy && (
        <button type="button" onClick={() => void onChange(null)} className="press mt-2 inline-flex items-center gap-1 text-xs text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Remover foto
        </button>
      )}
    </div>
  );
}
