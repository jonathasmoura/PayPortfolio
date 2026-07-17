import { useMemo, useState } from "react";
import type { PaymentEvent } from "../types/payment";
import { useWebSocket } from "../hooks/useWebSocket";
import { Filters } from "./Filters";
import { PaymentList } from "./PaymentList";

export function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<
    "Todos" | "Sucesso" | "Erro"
  >("Todos");

  const [idContractFilter, setIdContractFilter] = useState("");

  const useWsEnabled =
    (import.meta.env.VITE_USE_WEBSOCKET ?? "true") === "true";

  const { payments, loading, error, wsConnected } = useWebSocket({
    enabled: useWsEnabled,
    statusFilter,
    idContractFilter,
  });

  const contractOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of payments) set.add(p.id_contract);
    return Array.from(set);
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const processingStatusOk =
        statusFilter === "Todos"
          ? true
          : statusFilter === "Sucesso"
            ? p.processing_status === "Processed"
            : p.processing_status === "Failed";

      const contractOk = idContractFilter
        ? p.id_contract === idContractFilter
        : true;

      return processingStatusOk && contractOk;
    });
  }, [payments, statusFilter, idContractFilter]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="mb-4 flex flex-col gap-2 md:mb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard PayPort
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Eventos de pagamentos em tempo real (com fallback de polling).
          </p>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">WS:</span>{" "}
          {useWsEnabled
            ? wsConnected
              ? "Conectado"
              : "Reconectando/Off"
            : "Desabilitado"}
        </div>
      </header>

      <Filters
        statusFilter={statusFilter}
        idContractFilter={idContractFilter}
        onStatusChange={setStatusFilter}
        onIdContractChange={setIdContractFilter}
        contractOptions={contractOptions}
      />

      <div className="mt-4">
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
            Carregando eventos...
          </div>
        ) : null}

        <PaymentList payments={filtered as PaymentEvent[]} />
      </div>
    </div>
  );
}
