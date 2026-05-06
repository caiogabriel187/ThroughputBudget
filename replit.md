# Calculadora 5G NR — Aplicativo Mobile (React Native Web)

Calculadora profissional de Throughput e Link Budget para redes 5G NR, construída com React Native Web e rodando no browser com interface mobile.

## Run & Operate
- **Dev**: `npm run dev` — inicia Express (porta 5000) + Vite
- **DB push**: `npm run db:push`
- **Env vars**: `DATABASE_URL`, `SESSION_SECRET` (DB opcional — fallback em memória)

## Stack
- **Frontend mobile**: React Native Web (`react-native-web`) + TypeScript
- **Backend**: Express.js + Drizzle ORM (postgres-js) com fallback MemStorage
- **Build**: Vite + tsx
- **Navegação**: NavigationContainer customizado espelhando React Navigation API

## Where things live
```
client/src/
├── pages/mobile.tsx          # Wrapper da rota /  (única rota)
├── mobile/
│   ├── MobileApp.tsx         # Entry point — NavigationContainer
│   ├── navigation/index.tsx  # Stack navigator customizado
│   ├── screens/
│   │   ├── HomeScreen.tsx    # Calculadora Throughput + Link Budget
│   │   ├── HistoryScreen.tsx # FlatList com busca/filtro
│   │   ├── SaveScreen.tsx    # Formulário com validação
│   │   └── DetailScreen.tsx  # Detalhes do cenário
│   ├── components/
│   │   ├── CalculationCard.tsx
│   │   └── LoadingIndicator.tsx
│   └── services/api.ts       # axios — GET/POST/DELETE /api/calculations
server/
├── routes.ts                 # API REST
├── storage.ts                # LazyStorage → DbStorage → MemStorage
└── db-storage.ts             # Drizzle ORM
shared/schema.ts              # Tipos + schema Drizzle
expo-app/                     # Projeto Expo standalone para VS Code / celular
```

## Architecture decisions
- **React Native Web** usada no browser para simular app mobile com componentes RN reais (View, Text, FlatList, etc.)
- **Navegação customizada** espelha exatamente a API do React Navigation (NavigationContainer, createNativeStackNavigator) sem instalar os pacotes nativos (conflito de peer deps no ambiente web)
- **LazyStorage proxy**: tenta DB com postgres-js + SSL; cai para MemStorage se falhar
- **Rota única `/`**: apenas a versão mobile é servida; versão web desktop foi removida
- **Projeto Expo separado** em `expo-app/` para rodar nativamente no celular via VS Code

## Product
- Calculadora de Throughput DL 5G NR (PRBs, eficiência espectral, fração DL, MIMO, modulação)
- Calculadora de Link Budget com 7 modelos de perda (FSPL, 3GPP TR 38.901 UMa/UMi/RMa/Indoor, personalizado)
- Histórico de cenários salvos (busca + filtro por tipo)
- Salvar/carregar/remover cenários via API REST
- Interface mobile centralizada (max-width 430px) com estilo React Native

## User preferences
- Idioma: Português do Brasil (pt-BR) em toda a interface
- Apenas versão mobile — versão web desktop foi removida a pedido do usuário
- Projeto Expo em `expo-app/` para uso no VS Code com celular/emulador

## Gotchas
- `shadow*` props deprecadas no react-native-web → usar `boxShadow` como string
- FlatList precisa de container com `minHeight: 0` + `overflow: hidden`
- Alert usa `window.confirm` / `window.alert` no contexto web
- DB auth falha no ambiente Replit → MemStorage é o storage ativo
- No projeto Expo: alterar `BASE_URL` em `expo-app/src/services/api.ts` para o IP local

## Pointers
- Expo project: `expo-app/README.md`
- Schema: `shared/schema.ts`
- API routes: `server/routes.ts`
