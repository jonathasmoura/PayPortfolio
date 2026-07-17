import { useMemo } from "react";

type Props = {
  statusFilter: "Todos" | "Sucesso" | "Erro";
  idContractFilter: string;
  onStatusChange: (v: "Todos" | "Sucesso" | "Erro") => void;
  onIdContractChange: (v: string) => void;
  contractOptions: string[];
};

export function Filters({
  statusFilter,
  idContractFilter,
  onStatusChange,
  onIdContractChange,
  contractOptions,
}: Props) {
  const sortedContracts = useMemo(() => {
    return [...contractOptions].sort((a, b) => a.localeCompare(b));
  }, [contractOptions]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-end">
      <div className="flex-1">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) =>
            onStatusChange(e.target.value as "Todos" | "Sucesso" | "Erro")
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
          onChange={(e) => onIdContractChange(e.target.value)}
        >
          <option value="">Todos</option>
          {sortedContracts.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
