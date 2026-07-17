export type PaymentStatus = "Sucesso" | "Erro";

export type PaymentEvent = {
  id_transaction: string;
  id_contract: string;
  amount: number;
  payment_date: string; // ISO
  status: PaymentStatus; // Sucesso | Erro

  // Status recebido do backend (ex.: ESTORNADO, Processed/Failed etc.)
  received_status?: string;

  processing_status?: string;
  processedAt?: string; // ISO

  // Mensagens/erros podem vir do backend (validações, falhas etc.)
  error?: string;
};
