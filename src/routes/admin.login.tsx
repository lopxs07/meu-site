import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminUser } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso administrativo — Bendita Cremeria" },
      { name: "description", content: "Área restrita da equipe Bendita Cremeria." },
      { property: "og:title", content: "Acesso administrativo — Bendita Cremeria" },
      { property: "og:description", content: "Área restrita da equipe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

const field = "mt-1 w-full border border-border bg-card px-3 py-2.5 outline-none focus:border-primary";
const btn = "w-full rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-60";

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      return setMsg({ ok: false, text: "E-mail ou senha incorretos." });
    }
    const { isAdmin } = await getAdminUser();
    setBusy(false);
    if (!isAdmin) {
      await supabase.auth.signOut();
      return setMsg({ ok: false, text: "Esta conta não tem acesso administrativo." });
    }
    navigate({ to: "/admin", replace: true });
  };

  const forgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    setMsg(error ? { ok: false, text: "Não foi possível enviar. Tente novamente." } : { ok: true, text: "Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha." });
  };

  return (
    <div className="mx-auto max-w-sm px-5 py-24">
      <p className="eyebrow">Área restrita</p>
      <h1 className="mt-3 text-4xl text-primary">{mode === "login" ? "Painel Bendita" : "Recuperar senha"}</h1>
      <form onSubmit={mode === "login" ? login : forgot} className="mt-8 space-y-4">
        <label className="block text-sm">E-mail<input type="email" required autoComplete="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {mode === "login" && (
          <label className="block text-sm">Senha<input type="password" required autoComplete="current-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        )}
        {msg && <p className={`text-sm ${msg.ok ? "text-foreground/70" : "text-destructive"}`}>{msg.text}</p>}
        <button disabled={busy} className={btn}>{busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Enviar link"}</button>
      </form>
      <button type="button" onClick={() => { setMode(mode === "login" ? "forgot" : "login"); setMsg(null); }} className="mt-5 text-sm text-foreground/60 underline">
        {mode === "login" ? "Esqueci minha senha / primeiro acesso" : "Voltar para o login"}
      </button>
    </div>
  );
}
