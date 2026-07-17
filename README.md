# PayPortfolio

  Solução desenvolvida com React 19 + TypeScript (com hooks customizados), WebSocket para atualização em tempo real com fallback via polling HTTP, possui filtros de status e ID do contrato e apresenta erros com alertas visuais. 

  <img width="886" height="291" alt="image" src="https://github.com/user-attachments/assets/014e94cd-cdc0-4c9a-baae-d1278e3f8c24" />

<img width="886" height="291" alt="image" src="https://github.com/user-attachments/assets/73003ddf-f50e-497f-af51-a623e395b126" />
<img width="886" height="159" alt="image" src="https://github.com/user-attachments/assets/883e4f71-42be-4558-bf99-b85db5acc18b" />

##  Tecnologias utilizadas (descrição da solução)
 - React 19 + TypeScript: UI do dashboard e componentes funcionais tipados (ex.: Dashboard, Filters, PaymentList, PaymentRow)
 com modelo de dados PaymentEvent em src/types/payment.ts.

- Vite: ferramenta de build/dev, com uso de variáveis de ambiente via import.meta.env (VITE_API_BASE, VITE_API_KEY, VITE_USE_WEBSOCKET).

- React Router (BrowserRouter/Routes): navegação básica entre páginas, com rota principal para o Dashboard (src/App.tsx).

- Axios: cliente HTTP centralizado em src/lib/api.ts para consumo do backend (base URL via VITE_API_BASE e envio do header X-Api-Key via interceptador, sem hardcode).

- WebSocket (WS): hook src/hooks/useWebSocket.ts para recebimento em tempo real, incluindo normalização do payload e merge por id_transaction.

- Polling (refresh fallback): hook src/hooks/usePayments.ts que faz setInterval chamando GET /webhooks/events para atualizar a lista quando WS está indisponível.

- Componentização + hooks customizados: lógica separada entre aquisição/atualização (useWebSocket, usePayments) e apresentação (PaymentRow, ErrorBadge, etc.).

- Tailwind CSS (classes utilitárias): estilização com classes bg-red-50, border-red-200, rounded-xl, etc., garantindo alertas visuais claros e layout responsivo.
Intl.NumberFormat (pt-BR): formatação monetária no PaymentRow.

## Regras de Negócio

      [Descreva as regras que o use case deve implementar]
      Frontend (React) 
• Dashboard: Uma tela simples que liste os pagamentos recebidos em tempo real (ou via refresh).


• Filtros: Filtrar por status (Sucesso/Erro) e por ID do Contrato. 


• Visualização de Erros: Se um evento falhar na validação, ele deve aparecer com um alerta visual claro no painel. 


## Request

    [Descreva os dados de entrada, por exemplo:]

```ts
  "id_transaction": "TXN-20260717-0001",
  "id_contract": "CTR-10001",
  "amount": 1500.75,
  "payment_date": "2026-07-13T10:30:00Z",
  "status": "QUITADO"
```
