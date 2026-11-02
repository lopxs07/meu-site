import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nova senha — Bendita Cremeria" },
      { name: "description", content: "Defina uma nova senha de acesso." },
      { property: "og:title", content: "Nova senha — Bendita Cremeria" },
      { property: "og:description", content: "Defina uma nova senha de acesso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return setErr("A senha precisa ter pelo menos 8 caracteres.");
    if (pw !== pw2) return setErr("As senhas não conferem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr("Link expirado ou senha fraca. Solicite um novo link.");
    navigate({ to: "/admin", replace: true });
  };

  const field = "mt-1 w-full border border-border bg-card px-3 py-2.5 outline-none focus:border-primary";
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 px-5 py-24">
      <h1 className="text-4xl text-primary">Criar nova senha</h1>
      <label className="block text-sm">Nova senha<input type="password" autoComplete="new-password" className={field} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
      <label className="block text-sm">Repita a senha<input type="password" autoComplete="new-password" className={field} value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <button disabled={busy} className="w-full rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-widest text-primary-foreground">{busy ? "Salvando…" : "Salvar senha"}</button>
    </form>
  );
}
