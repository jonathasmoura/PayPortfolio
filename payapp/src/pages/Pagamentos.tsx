import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type PagamentoEvent = {
  id_transaction?: string;
  id_contract?: string;
  amount?: number;
  payment_date?: string;
  status?: "Sucesso" | "Erro" | string;
  processing_status?: string;
  processedAt?: string;
  error?: string;
};

function formatMoney(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

export default function Pagamentos() {
  const [items, setItems] = useState<PagamentoEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "Todos" | "Sucesso" | "Erro"
  >("Todos");
  const [idContractFilter, setIdContractFilter] = useState<string>("");

  const contractOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of items) {
      if (p.id_contract) set.add(p.id_contract);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const statusOk =
        statusFilter === "Todos" ? true : (p.status ?? "") === statusFilter;
      const contractOk = idContractFilter
        ? (p.id_contract ?? "") === idContractFilter
        : true;
      return statusOk && contractOk;
    });
  }, [items, statusFilter, idContractFilter]);

  useEffect(() => {
    let mounted = true;

    const fetchPagamentos = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/webhooks/pagamento");
        const data = res.data;

        // Tenta suportar formatos comuns do backend.
        // Além disso, normaliza as chaves dos ids para o formato esperado pela UI:
        // id_transaction / id_contract (string).
        // O backend pode retornar de formas diferentes.
        // Exemplo (feedback do usuário): o JSON vem como { data: { data: [...] } }.
        const parsedRaw: unknown[] = Array.isArray(data)
          ? (data as unknown[])
          : Array.isArray((data as { data?: unknown }).data)
            ? ((data as { data?: unknown }).data as unknown[])
            : Array.isArray((data as { data?: { data?: unknown } }).data?.data)
              ? ((data as { data?: { data?: unknown } }).data
                  ?.data as unknown[])
              : Array.isArray((data as { items?: unknown }).items)
                ? ((data as { items?: unknown }).items as unknown[])
                : [];

        const normalizeId = (v: unknown): string | undefined => {
          if (v === null || v === undefined) return undefined;
          return String(v);
        };

        const normalized: PagamentoEvent[] = parsedRaw.map((item) => {
          const anyItem = item as Record<string, unknown>;

          // Backend: IdTransaction / IdContract (Casing diferente)
          const id_transaction = (anyItem["id_transaction"] ??
            anyItem["idTransaction"] ??
            anyItem["IdTransaction"] ??
            anyItem["transaction_id"] ??
            anyItem["TransactionId"]) as unknown;

          const id_contract = (anyItem["id_contract"] ??
            anyItem["idContract"] ??
            anyItem["IdContract"] ??
            anyItem["contract_id"] ??
            anyItem["ContractId"]) as unknown;

          return {
            // Mantém campos quando existem no payload atual
            ...(anyItem as Omit<
              PagamentoEvent,
              "id_transaction" | "id_contract"
            >),
            id_transaction: normalizeId(id_transaction) ?? "-".toString(),
            id_contract: normalizeId(id_contract) ?? "-".toString(),

            // Normaliza amount/payload numéricos quando vierem como string
            amount:
              typeof anyItem["amount"] === "number"
                ? (anyItem["amount"] as number)
                : typeof anyItem["amount"] === "string"
                  ? Number(anyItem["amount"])
                  : (anyItem["amount"] as number),

            payment_date: (anyItem["payment_date"] ??
              anyItem["paymentDate"]) as string,

            status: (anyItem["status"] as PagamentoEvent["status"]) ?? "-",

            processing_status: (anyItem["processing_status"] ??
              anyItem["processingStatus"]) as string | undefined,

            processedAt: (anyItem["processedAt"] ?? anyItem["processed_at"]) as
              | string
              | undefined,

            error: anyItem["error"] as string | undefined,
          };
        });

        if (mounted) setItems(normalized);
      } catch (e: unknown) {
        const msg =
          typeof e === "object" &&
          e !== null &&
          "message" in e &&
          typeof (e as { message?: unknown }).message === "string"
            ? (e as { message: string }).message
            : null;
        if (mounted) setError(msg ?? "Falha ao carregar pagamentos");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchPagamentos();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tela dedicada para consumir{" "}
          <code className="rounded bg-gray-100 px-1">/webhooks/pagamento</code>.
        </p>
      </header>

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "Todos" | "Sucesso" | "Erro")
            }
          >
            <option value="Todos">Todos</option>
            <option value="Sucesso">Sucesso</option>
            <option value="Erro">Erro</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            ID do contrato
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={idContractFilter}
            onChange={(e) => setIdContractFilter(e.target.value)}
          >
            <option value="">Todos</option>
            {contractOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          Carregando...
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Id Transação
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Id Contrato
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Valor
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Data Pagamento
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-sm text-gray-600"
                >
                  Nenhum pagamento encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((p, idx) => (
                <tr key={p.id_transaction ?? `${idx}`}>
                  <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">
                    {p.id_transaction ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">
                    {p.id_contract ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">
                    {typeof p.amount === "number" ? formatMoney(p.amount) : "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">
                    {p.payment_date
                      ? new Date(p.payment_date).toLocaleString("pt-BR")
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">
                    {p.status ?? "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
