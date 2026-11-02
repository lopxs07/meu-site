import { supabase } from "@/integrations/supabase/client";

export const IMAGE_BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
/** Signed links are stored on the product, so they must outlive normal use (~10 years). */
const LINK_SECONDS = 60 * 60 * 24 * 365 * 10;

/** Returns an error message in Portuguese, or null when the file can be uploaded. */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) return "Use uma imagem JPG, PNG, WEBP ou GIF.";
  if (file.size > MAX_IMAGE_BYTES) return "A imagem precisa ter no máximo 5 MB.";
  return null;
}

export async function uploadImage(file: File, folder: "produtos" | "inicio"): Promise<string> {
  const problem = validateImageFile(file);
  if (problem) throw new Error(problem);
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw new Error("Não foi possível enviar a imagem.");
  const signed = await supabase.storage.from(IMAGE_BUCKET).createSignedUrl(path, LINK_SECONDS);
  if (signed.error || !signed.data) throw new Error("Imagem enviada, mas o link não foi gerado.");
  return signed.data.signedUrl;
}
