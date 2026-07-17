export function ErrorBadge({ message }: { message?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
      title={message ?? "Erro"}
    >
      <span aria-hidden="true" className="text-base leading-none">
        ⚠️
      </span>
      Erro
    </span>
  );
}
