import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

function normalizeContractsStatus(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data
      .map((x) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object" && "id_contract" in (x as object)) {
          const maybeObj = x as { id_contract?: unknown };
          const v = maybeObj.id_contract;
          return typeof v === "string" ? v : "";
        }
        return null;
      })
      .filter((x): x is string => typeof x === "string");
  }

  if (data && typeof data === "object") {
    const maybeObj = data as {
      data?: unknown;
      items?: unknown;
      contracts?: unknown;
    };
    const maybe = maybeObj.data ?? maybeObj.items ?? maybeObj.contracts;
    return normalizeContractsStatus(maybe);
  }

  return [];
}

export function useContractsStatus() {
  const [contracts, setContracts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchContracts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/webhooks/contracts/status");
        const items = normalizeContractsStatus(res.data);
        if (mounted) setContracts(items);
      } catch (e: unknown) {
        const msg =
          typeof e === "object" &&
          e !== null &&
          "message" in e &&
          typeof (e as { message?: unknown }).message === "string"
            ? (e as { message: string }).message
            : null;
        if (mounted) setError(msg ?? "Falha ao carregar contratos");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchContracts();

    return () => {
      mounted = false;
    };
  }, []);

  return useMemo(
    () => ({ contracts, loading, error }),
    [contracts, loading, error],
  );
}
