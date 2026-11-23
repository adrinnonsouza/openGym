# Pump Life: implantação com Kiwify

## Planos

Crie **um produto de assinatura** na Kiwify com três planos recorrentes. Configure os preços do checkout como valores finais, pois o desconto deve valer em toda renovação:

| Plano | Preço de referência | Desconto por cobrança | Preço no checkout |
| --- | ---: | ---: | ---: |
| Mensal | R$ 29,90 | R$ 10,00 | R$ 19,90 |
| Semestral | R$ 149,00 | R$ 10,00 | R$ 139,00 |
| Anual | R$ 249,00 | R$ 10,00 | R$ 239,00 |

Não use cupom para este desconto: na Kiwify ele se aplica somente à primeira cobrança. A renovação automática requer cartão; outros meios dependem da cobrança e do pagamento a cada período.

## Configuração do servidor

Copie `.env.example` para `.env` no host Docker. Mantenha `PUMP_LIFE_BILLING=1`. Preencha `KIWIFY_PRODUCT_ID`, `KIWIFY_WEBHOOK_TOKEN` e os três `KIWIFY_CHECKOUT_*` com os dados da conta. Os links devem usar o domínio `https://pay.kiwify.com.br`. O servidor acrescenta `s1` com um identificador aleatório para vincular a venda ao perfil autenticado.

Configure `ORIGIN` para o endereço HTTPS público da aplicação e `RP_ID` para o hostname correspondente. O mesmo endereço deve servir o frontend e encaminhar `/api/*` ao contêiner Node. O diretório `./data` precisa ser persistente e ter backup: nele ficam os perfis, assinaturas e treinos.

Na Kiwify, registre um webhook para `https://SEU_HOST/api/billing/webhook` com o token configurado e os eventos de venda aprovada, renovação, cancelamento, reembolso e chargeback. Faça um evento de teste e confira os logs da Kiwify. O servidor verifica a assinatura do corpo bruto e o ID do produto; somente uma venda paga com assinatura, prazo de acesso válido e vínculo ao perfil libera o app. O retorno do checkout não libera o acesso por si só.

## Publicação e teste

1. Configure os três planos e envie os links de checkout e o ID do produto. O token do webhook deve ser colocado somente no ambiente privado do host, nunca no GitHub.
2. Execute `docker compose up -d --build` no host da aplicação e teste `/api/health`.
3. Dispare um webhook de teste da Kiwify e confirme a assinatura, os campos do evento e a renovação do acesso com os dados reais da conta.
4. Compre em ambiente de teste com uma conta comum, volte à Pump Life e confira se a tela de assinatura libera o app. Valide também uma renovação e um reembolso.
5. Só então marque o PR como pronto e publique para clientes.

A prévia `*.opengym-teste.pages.dev` da Cloudflare Pages é um frontend estático e usa o modo demo do projeto. Ela serve para revisar a interface; **não hospeda o servidor Node nem recebe webhooks**. Para um teste funcional, publique o stack Docker atrás de um Cloudflare Tunnel ou de outro proxy HTTPS. O hostname provisório precisa apontar para esse stack, e não para o Pages estático.
