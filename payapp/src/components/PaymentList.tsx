import type { PaymentEvent } from "../types/payment";
import { PaymentRow } from "./PaymentRow";

export function PaymentList({ payments }: { payments: PaymentEvent[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-auto">
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
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Transação
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Status Processamento
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Processado em
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-8 text-center text-sm text-gray-600"
                >
                  Nenhum evento encontrado.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <PaymentRow key={p.id_transaction} payment={p} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
