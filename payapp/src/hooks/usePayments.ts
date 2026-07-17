import { useCallback, useEffect, useMemo, useState } from "react";
import type { PaymentEvent } from "../types/payment";
import { api } from "../lib/api";

type UsePaymentsOptions = {
  quantity?: number;
  pollingMs?: number;
  enabled?: boolean;
  status?: "Sucesso" | "Erro";
  idContract?: string;
};

export function usePayments(options: UsePaymentsOptions = {}) {
  const {
    quantity = 50,
    pollingMs = 7000,
    enabled = true,
    status,
    idContract,
  } = options;

  const [payments, setPayments] = useState<PaymentEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => {
    const p: Record<string, unknown> = { quantity };

    if (status === "Sucesso") p.status = "Processed";
    else if (status === "Erro") p.status = "Failed";

    if (idContract) p.id_contract = idContract;
    return p;
  }, [quantity, status, idContract]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/webhooks/events", { params });

      const data: unknown = res.data;
      type EventsResponse = { data?: unknown; items?: unknown };
      const itemsUnknown = Array.isArray(data)
        ? data
        : typeof data === "object" && data !== null
          ? ((data as EventsResponse).data ?? (data as EventsResponse).items)
          : undefined;

      const itemsArray = Array.isArray(itemsUnknown) ? itemsUnknown : [];

      const normalizeId = (v: unknown): string | undefined => {
        if (v === null || v === undefined) return undefined;
        return String(v);
      };

      const normalized: PaymentEvent[] = (itemsArray as unknown[]).map(
        (item) => {
          const anyItem = item as Record<string, unknown>;

          const id_transaction =
            anyItem["id_transaction"] ??
            anyItem["idTransaction"] ??
            anyItem["IdTransaction"];

          const id_contract =
            anyItem["id_contract"] ??
            anyItem["idContract"] ??
            anyItem["IdContract"];

          const receivedStatus =
            anyItem["receivedStatus"] ?? anyItem["status"] ?? anyItem["Status"];

          return {
            id_transaction:
              normalizeId(id_transaction) === "unknown"
                ? "null"
                : (normalizeId(id_transaction) ?? "-"),
            id_contract:
              normalizeId(id_contract) === "unknown"
                ? "null"
                : (normalizeId(id_contract) ?? "-"),
            amount:
              typeof anyItem["amount"] === "number"
                ? (anyItem["amount"] as number)
                : typeof anyItem["amount"] === "string"
                  ? Number(anyItem["amount"])
                  : (anyItem["amount"] as number),
            payment_date: (anyItem["payment_date"] ??
              anyItem["paymentDate"] ??
              anyItem["receivedAt"] ??
              anyItem["received_at"]) as string,
            status: (receivedStatus as PaymentEvent["status"]) ?? "Sucesso",
            received_status:
              (receivedStatus as string | undefined) === "unknown"
                ? "null"
                : (receivedStatus as string | undefined),
            processing_status: (anyItem["processing_status"] ??
              anyItem["processingStatus"]) as string | undefined,
            processedAt: (anyItem["processedAt"] ?? anyItem["processed_at"]) as
              | string
              | undefined,
            error: (anyItem["processingError"] ??
              anyItem["processing_error"] ??
              anyItem["error"]) as string | undefined,
          };
        },
      );

      setPayments(normalized);
    } catch (e: unknown) {
      const msg =
        typeof e === "object" &&
        e !== null &&
        "message" in e &&
        typeof (e as { message?: unknown }).message === "string"
          ? (e as { message: string }).message
          : null;

      setError(msg ?? "Falha ao carregar pagamentos");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (!enabled) return;

    const timeoutId = window.setTimeout(() => {
      void fetchPayments();
    }, 0);

    const intervalId = window.setInterval(() => {
      void fetchPayments();
    }, pollingMs);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [enabled, fetchPayments, pollingMs]);

  return { payments, loading, error, refetch: fetchPayments, setPayments };
}
