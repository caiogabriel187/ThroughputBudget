# Threat Model

## Project Overview

Aplicação pública de cálculo 5G NR com frontend React/React Native Web e backend Express. Em produção, o deployment web serve apenas o bundle de `client/` e expõe a API REST em `server/routes.ts`; o `expo-app/` é um artefato separado para desenvolvimento móvel e não faz parte da superfície do deployment web. O app usa sessões anônimas por cookie para isolar os cenários salvos de cada navegador, com persistência em PostgreSQL quando disponível e fallback para memória quando o banco falha. O tráfego externo usa TLS provido pela plataforma.

## Assets

- **Cenários salvos e resultados de cálculo** — nomes de cenários, parâmetros de rádio e resultados de throughput/link budget. Embora não sejam credenciais, podem conter dados operacionais ou de engenharia sensíveis do usuário.
- **Sessões anônimas por cookie** — o `userId` guardado na sessão define o isolamento entre os dados de navegadores diferentes. Comprometimento da sessão permite leitura e alteração do histórico daquele navegador.
- **Segredos de aplicação e banco** — `SESSION_SECRET`, `DATABASE_URL` e variáveis `PG*`. Comprometimento afeta integridade de sessão e acesso ao banco.
- **Capacidade do serviço** — a API pública aceita gravações e mantém limites globais (`MAX_TOTAL_RECORDS`) e por usuário. Abusos podem impedir salvamentos legítimos.
- **Logs do backend** — logs de respostas `/api` podem reter dados de cenários e mensagens de erro, então também são um ativo sensível.

## Trust Boundaries

- **Cliente web / API Express** — todo input vindo do browser é não confiável. A API deve validar payloads, aplicar limites e impor escopo por sessão.
- **App Expo / API Express** — o cliente nativo separado também cruza a mesma fronteira de confiança quando usado, mas não integra o deployment web público atual.
- **API / armazenamento de sessão** — o cookie assinado identifica a sessão; o backend é responsável por criar, validar e usar esse contexto com segurança.
- **API / banco de dados ou MemStorage** — a aplicação escreve e lê cenários persistidos; falhas de validação ou de isolamento nessa camada expõem ou corrompem dados.
- **Público / sessão autenticada anonimamente** — não há contas tradicionais; a única separação entre usuários é a posse do cookie de sessão emitido pelo servidor.
- **Produção / artefatos de desenvolvimento** — `expo-app/`, ferramentas Vite e diretórios auxiliares não devem ser tratados como superfície de produção do deployment web salvo evidência contrária.

## Scan Anchors

- Entradas de produção: `server/index-prod.ts`, `server/app.ts`, `server/routes.ts`, `client/src/main.tsx`.
- Áreas de maior risco: criação/uso de sessão em `server/app.ts`, mutações públicas e rate limiting em `server/routes.ts`, fallback de armazenamento em `server/storage.ts`, conexão com banco em `db/index.ts`.
- Superfícies públicas: `GET /api/health`, `POST /api/calculations`, leitura/atualização/remoção de cálculos em `/api/calculations/*` condicionadas à sessão do navegador.
- Áreas normalmente fora de escopo de produção: `expo-app/`, Vite dev server, diretório `mobile/` raiz, assets auxiliares.

## Threat Categories

### Spoofing

A aplicação não usa login tradicional; a identidade é a sessão anônima do navegador. O sistema deve garantir que cookies de sessão sejam assinados com segredo forte e exclusivo de produção, que o contexto da sessão não seja derivado de cabeçalhos forjáveis, e que operações mutáveis sempre executem sob a sessão correta.

### Tampering

Como o cliente é totalmente não confiável, nomes, parâmetros e resultados enviados para `/api/calculations` devem ser validados no servidor antes de gravação. O backend deve continuar tratando todo dado salvo como input não confiável e limitar alterações apenas ao conjunto pertencente à sessão atual.

### Information Disclosure

Os cenários salvos podem revelar dados operacionais de engenharia. A API deve retornar somente registros pertencentes à sessão atual e não deve vazar payloads completos, identificadores de sessão ou detalhes internos em logs e mensagens de erro acessíveis fora do contexto estritamente necessário.

### Denial of Service

O deployment é público e aceita escritas anônimas. Os controles de abuso precisam resistir a spoofing de IP, distribuição entre instâncias e criação repetida de novas sessões; caso contrário, um atacante pode preencher os limites globais de armazenamento ou gerar churn suficiente para degradar o serviço e impedir salvamentos legítimos.

### Elevation of Privilege

Não há papéis administrativos, mas ainda existe risco de acesso indevido entre sessões. Toda leitura, atualização e exclusão de cálculos deve usar escopo por `userId` da sessão no servidor, e todas as consultas ao banco devem permanecer parametrizadas para impedir injeção ou bypass de autorização.
