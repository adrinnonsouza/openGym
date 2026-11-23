# Pump Life

Aplicativo de treinos com planejamento, registro de exercícios e acompanhamento de progresso. Este repositório é a versão Pump Life do projeto [openGym](https://github.com/DuarteSantos8/openGym), licenciado sob [AGPL-3.0](LICENSE).

## Assinaturas

A Pump Life usa checkouts recorrentes da Kiwify. O preço de cada cobrança inclui R$ 10,00 de desconto:

| Plano | Preço de referência | Preço recorrente |
| --- | ---: | ---: |
| Mensal | R$ 29,90 | R$ 19,90 |
| Semestral | R$ 149,00 | R$ 139,00 |
| Anual | R$ 249,00 | R$ 239,00 |

A API libera o acesso somente depois de receber e verificar o evento de pagamento. Os links de checkout, o ID do produto e o segredo do webhook são configurados fora do repositório. Veja [o guia de implantação](docs/PUMP_LIFE_KIWIFY.md).

## Executar

Requer Docker Compose e um host HTTPS para uso público.

1. Copie `.env.example` para `.env` e configure `ORIGIN`, `RP_ID` e as variáveis `KIWIFY_*`.
2. Execute `docker compose up -d --build`.
3. Configure o webhook da Kiwify em `https://SEU_HOST/api/billing/webhook`.
4. Teste compra, renovação e reembolso antes de publicar.

A prévia da Cloudflare Pages vinculada a este repositório é estática e não executa a API de assinaturas. A versão funcional precisa do stack Docker acessível pelo mesmo domínio HTTPS do frontend.

## Código e licenças

O código derivado de openGym continua sob AGPL-3.0. A utilização das animações Gym visual nesta versão depende da licença própria informada pelo responsável pela Pump Life. Consulte também os avisos de terceiros incluídos no repositório.
