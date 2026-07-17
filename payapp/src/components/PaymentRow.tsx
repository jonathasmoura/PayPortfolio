import type { PaymentEvent } from "../types/payment";
import { ErrorBadge } from "./ErrorBadge";

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

export function PaymentRow({ payment }: { payment: PaymentEvent }) {
  const isValidationError = payment.status === "Erro";
  const processingFailed = payment.processing_status === "Failed";
  const processingInProcess = payment.processing_status === "InProcess";

  const uiPaymentStatus = processingInProcess ? "Aguardando" : payment.status;
  const showError = isValidationError || processingFailed;

  const processedLabel = payment.processedAt
    ? new Date(payment.processedAt).toLocaleString("pt-BR")
    : "-";
  const paymentDateLabel = payment.payment_date
    ? new Date(payment.payment_date).toLocaleString("pt-BR")
    : "-";

  return (
    <tr className={showError ? "bg-red-50/60" : "bg-white"}>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">
        {payment.id_transaction}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">
        {(() => {
          const v = payment.id_contract;
          if (v === "unknown" || v === "") return "null";
          return v;
        })()}
      </td>

      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">
        {formatMoney(payment.amount)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">
        {paymentDateLabel}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm">
        {processingInProcess ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
            <span aria-hidden="true">⏳</span>
            {uiPaymentStatus}
          </span>
        ) : showError ? (
          <ErrorBadge message={payment.error ?? "Falha no processamento"} />
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
            <span aria-hidden="true">✅</span>
            Sucesso
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">
        {(() => {
          const v = payment.received_status;
          if (v === "unknown" || v === "") return "null";
          return (v ?? "null").toString();
        })()}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">
        {(() => {
          const v = payment.processing_status;
          if (v === "unknown" || v === "") return "null";
          return (v ?? "null").toString();
        })()}
      </td>

      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">
        {processedLabel}
      </td>
    </tr>
  );
}
