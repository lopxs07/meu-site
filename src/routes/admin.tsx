import { createFileRoute, Link, Outlet, redirect, useNavigate, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getAdminUser } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login") return;
    const { user, isAdmin } = await getAdminUser();
    if (!user || !isAdmin) throw redirect({ to: "/admin/login" });
    return { adminEmail: user.email };
  },
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Pedidos" },
  { to: "/admin/produtos", label: "Produtos" },
  { to: "/admin/fotos", label: "Fotos" },
  { to: "/admin/pagina-inicial", label: "Página inicial" },
  { to: "/admin/categorias", label: "Categorias" },
  { to: "/admin/sabores", label: "Sabores" },
  { to: "/admin/configuracoes", label: "Configurações" },
  { to: "/admin/relatorios", label: "Relatórios" },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { queryClient } = Route.useRouteContext();
  if (pathname === "/admin/login") return <Outlet />;

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <p className="eyebrow">Painel administrativo</p>
        <button onClick={signOut} className="press text-sm text-foreground/70 underline transition-colors hover:text-primary">Sair</button>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: true }}
            className="chip press"
            activeProps={{ className: "chip-active" }}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div key={pathname} className="tab-enter mt-6">
        <Outlet />
      </div>
    </div>
  );
}
