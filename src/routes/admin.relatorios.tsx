import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { reportOrdersQuery, summarizeOrders } from "@/lib/admin-data";
import { brl } from "@/lib/menu";
import { adminHead, AdminError } from "@/components/admin-ui";

const PERIODS = { hoje: "Hoje", "7d": "7 dias", "30d": "30 dias" } as const;
type Period = keyof typeof PERIODS;

function fromIso(p: Period) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (p === "7d") d.setDate(d.getDate() - 6);
  if (p === "30d") d.setDate(d.getDate() - 29);
  return d.toISOString();
}

export const Route = createFileRoute("/admin/relatorios")({
  validateSearch: (s: Record<string, unknown>): { periodo: Period } => ({
    periodo: s["periodo"] === "7d" || s["periodo"] === "30d" ? s["periodo"] : "hoje",
  }),
  loaderDeps: ({ search }) => ({ periodo: search.periodo }),
  head: adminHead("Relatórios"),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(reportOrdersQuery(fromIso(deps["periodo"]))),
  component: ReportsPage,
  errorComponent: AdminError,
});

function ReportsPage() {
  const { periodo } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data } = useSuspenseQuery(reportOrdersQuery(fromIso(periodo)));
  const r = summarizeOrders(data);
  const cards = [
    ["Faturamento", brl(r.revenue)],
    ["Pedidos", String(r.count)],
    ["Ticket médio", brl(r.averageTicket)],
    ["Delivery / Retirada", `${r.delivery} / ${r.pickup}`],
    ["Cancelados", String(r.cancelled)],
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-primary">Relatórios</h1>
        <div className="flex gap-2">
          {(Object.keys(PERIODS) as Period[]).map((p) => (
            <button key={p} onClick={() => navigate({ search: { periodo: p } })}
              className={`rounded-full border px-4 py-1.5 text-sm ${p === periodo ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
              {PERIODS[p]}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(([k, v]) => (
          <div key={k} className="border border-border bg-card p-4">
            <p className="eyebrow">{k}</p>
            <p className="mt-2 text-2xl text-primary">{v}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-8 text-xl text-primary">Mais vendidos</h2>
      {r.topProducts.length === 0 ? <p className="mt-2 text-foreground/60">Sem vendas no período.</p> : (
        <table className="mt-2 w-full max-w-xl text-sm">
          <tbody>
            {r.topProducts.map((p) => (
              <tr key={p.name} className="border-b border-border"><td className="py-2">{p.name}</td><td className="text-right">{p.quantity} un.</td><td className="text-right">{brl(p.revenue)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-6 text-xs text-foreground/50">Pedidos cancelados não entram no faturamento.</p>
    </div>
  );
}
