import { useEffect, useMemo, useRef, useState } from "react";
import type { PaymentEvent } from "../types/payment";
import { usePayments } from "./usePayments";

type UseWebSocketOptions = {
  enabled?: boolean;
  wsPath?: string; // ex: /ws/notifications
  statusFilter?: "Todos" | "Sucesso" | "Erro";
  idContractFilter?: string;
  // Se o WS falhar, usa polling (usePayments).
};

function toWsUrl(httpBase: string, wsPath: string) {
  // https://host:7052 -> wss://host:7052
  if (httpBase.endsWith("/")) httpBase = httpBase.slice(0, -1);
  if (wsPath && !wsPath.startsWith("/")) wsPath = `/${wsPath}`;

  if (httpBase.startsWith("https://")) {
    return `wss://${httpBase.slice("https://".length)}${wsPath}`;
  }
  if (httpBase.startsWith("http://")) {
    return `ws://${httpBase.slice("http://".length)}${wsPath}`;
  }
  return `${httpBase}${wsPath}`;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    enabled = true,
    wsPath = "/ws/notifications",
    statusFilter,
    idContractFilter,
  } = options;

  const API_BASE = import.meta.env.VITE_API_BASE ?? "https://localhost:7052";

  // Fallback polling: habilitado quando WS desabilitado ou ainda não conectado.
  const { payments, loading, error, refetch, setPayments } = usePayments({
    enabled: enabled,
    pollingMs: 9000,
    quantity: 50,
    status: statusFilter && statusFilter !== "Todos" ? statusFilter : undefined,
    idContract: idContractFilter || undefined,
  });

  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);

  void statusFilter;
  void idContractFilter;

  const wsUrl = useMemo(() => toWsUrl(API_BASE, wsPath), [API_BASE, wsPath]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setWsError(null);
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onerror = () => {
        setWsError("Falha de conexão WebSocket");
        setWsConnected(false);
      };

      ws.onmessage = (event) => {
        // Espera payload: pagamento/evento ou lista de eventos
        // Formatos comuns: { data: [...] } ou {...}
        try {
          const parsed = JSON.parse(event.data as string);

          const normalizeId = (v: unknown): string | undefined => {
            if (v === null || v === undefined) return undefined;
            return String(v);
          };

          // Normaliza chaves de ids vindas do backend (ex.: IdTransaction/IdContract)
          const normalizePayment = (p: unknown): PaymentEvent => {
            const anyItem = p as Record<string, unknown>;
            console.log("normalizePayment anyItem", anyItem);
            const id_transaction = normalizeId(
              anyItem["TransactionId"] ?? anyItem["idTransaction"],
            );

            const id_contract = normalizeId(
              anyItem["ContractId"] ?? anyItem["idContract"],
            );
            console.log("normalizePayment", {
              id_transaction,
              id_contract,
              anyItem,
            });
            const receivedStatus: unknown =
              anyItem["receivedStatus"] ??
              anyItem["status"] ??
              anyItem["Status"];

            const processingError: unknown =
              anyItem["processingError"] ??
              anyItem["processing_error"] ??
              anyItem["error"];

            const processingStatus: unknown =
              anyItem["processing_status"] ??
              anyItem["processingStatus"] ??
              anyItem["ProcessingStatus"];

            return {
              id_transaction:
                id_transaction === "unknown" ? "null" : (id_transaction ?? "-"),
              id_contract:
                id_contract === "unknown" ? "null" : (id_contract ?? "-"),
              amount:
                typeof anyItem["amount"] === "number"
                  ? (anyItem["amount"] as number)
                  : typeof anyItem["amount"] === "string"
                    ? Number(anyItem["amount"])
                    : Number(anyItem["amount"]),
              // dashboard já utiliza `payment_date` para exibir a data
              payment_date: (anyItem["payment_date"] ??
                anyItem["paymentDate"] ??
                anyItem["receivedAt"] ??
                anyItem["received_at"]) as string,
              status: (receivedStatus as PaymentEvent["status"]) ?? "Sucesso",
              // Para a coluna "Transação" no Dashboard
              received_status:
                (receivedStatus as string | undefined) === "unknown"
                  ? "null"
                  : (receivedStatus as string | undefined),
              // Regra: o status do filtro vem de processingStatus (Processed/Failed)
              processing_status:
                (processingStatus as string | undefined) === "unknown"
                  ? "null"
                  : ((processingStatus as string | undefined) ?? "null"),
              processedAt: (anyItem["processedAt"] ??
                anyItem["processed_at"]) as string | undefined,

              error: processingError as string | undefined,
            };
          };

          const parsedObject =
            typeof parsed === "object" && parsed !== null
              ? (parsed as Record<string, unknown>)
              : {};

          const rawIncoming: unknown[] = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsedObject.data)
              ? (parsedObject.data as unknown[])
              : Array.isArray(parsedObject.items)
                ? (parsedObject.items as unknown[])
                : parsed
                  ? [parsed]
                  : [];

          const incoming: PaymentEvent[] = rawIncoming.map(normalizePayment);

          if (incoming.length === 0) return;

          // Merge simples por id_transaction
          setPayments((prev) => {
            const map = new Map<string, PaymentEvent>();
            for (const p of prev) map.set(p.id_transaction, p);
            for (const p of incoming) map.set(p.id_transaction, p);
            return Array.from(map.values()).sort((a, b) => {
              const da = a.processedAt ?? a.payment_date;
              const db = b.processedAt ?? b.payment_date;
              return new Date(db).getTime() - new Date(da).getTime();
            });
          });
        } catch {
          // Se payload não for JSON, faz fallback no polling.
          setWsError("Payload WebSocket inválido");
          void refetch();
        }
      };
    } catch {
      // Evita setState síncrono dentro do effect em alguns cenários (linter/React).
      window.setTimeout(() => {
        setWsError("Falha ao iniciar WebSocket");
        setWsConnected(false);
      }, 0);
    }

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, wsUrl, refetch, setPayments]);

  return {
    payments,
    loading: loading && !wsConnected,
    error: wsError ?? error,
    wsConnected,
  };
}
