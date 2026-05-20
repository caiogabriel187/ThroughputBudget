# Calculadora 5G NR — App Mobile (Expo + Node.js)

Aplicativo mobile React Native com **Expo SDK 54** para cálculo de **Throughput DL** e **Link Budget** em redes 5G NR, conectado a uma API REST construída com **Node.js + Express**.

---

## Requisitos do Sistema

- [Node.js](https://nodejs.org/) 18 ou superior
- [VS Code](https://code.visualstudio.com/) (recomendado)
- [Expo Go](https://expo.dev/client) instalado no celular (Android ou iOS)
- Celular e computador na **mesma rede Wi-Fi**

---

## Parte 1 — Backend (Node.js + Express)

O backend é a pasta raiz do projeto (fora de `expo-app/`).

### 1.1 Instalar dependências do backend

```bash
# Na pasta raiz do projeto (onde está o package.json do servidor)
npm install
```

### 1.2 Rodar o servidor localmente

```bash
npm run dev
```

O servidor iniciará na porta **5000**. Você verá:
```
[express] serving on port 5000
```

### 1.3 Endpoints disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/calculations` | Lista todos os cenários salvos |
| `GET` | `/api/calculations/:id` | Retorna um cenário específico |
| `POST` | `/api/calculations` | Salva um novo cenário |
| `PUT` | `/api/calculations/:id` | Renomeia um cenário existente |
| `DELETE` | `/api/calculations/:id` | Remove um cenário |
| `GET` | `/api/health` | Verifica status do servidor |

### 1.4 Exemplo de requisição POST

```json
POST /api/calculations
{
  "name": "Cenário Macro Urbano",
  "type": "throughput",
  "parameters": { "bwMHz": "100", "scs": "30", "mimoLayers": "4" },
  "results": { "throughputMbps": "1256.3", "prbs": "66" }
}
```

---

## Parte 2 — Frontend (React Native + Expo)

### 2.1 Abrir a pasta do app no VS Code

```
Arquivo → Abrir Pasta → selecione a pasta expo-app/
```

### 2.2 Instalar dependências do frontend

No terminal integrado do VS Code (`Ctrl + '`):

```bash
npm install
```

### 2.3 Configurar a URL do backend

Edite `src/services/api.ts` e substitua `BASE_URL` pelo IP da sua máquina:

```ts
// Descubra seu IP: Windows → ipconfig | Mac/Linux → ifconfig
const BASE_URL = 'http://192.168.x.x:5000';
```

> Se estiver usando a versão publicada no Replit, a URL já está configurada. Caso rode o backend localmente, use o IP da sua máquina na rede local.

### 2.4 Iniciar o Expo

```bash
npx expo start
```

Um QR Code aparecerá no terminal. Abra o app **Expo Go** no celular e escaneie o código.

### 2.5 Rodar no emulador (opcional)

```bash
npx expo start --android   # Requer Android Studio instalado
npx expo start --ios       # Requer Mac com Xcode
```

---

## Estrutura do Projeto

### Backend (pasta raiz)

```
server/
├── index-dev.ts         # Entry point de desenvolvimento
├── routes.ts            # Rotas da API REST (GET/POST/PUT/DELETE)
├── storage.ts           # Interface de storage + MemStorage
└── db-storage.ts        # Storage com PostgreSQL (Drizzle ORM)
shared/
└── schema.ts            # Tipos e schemas compartilhados (Zod + Drizzle)
```

### Frontend (pasta expo-app/)

```
expo-app/
├── App.tsx                      # Navegação principal (Stack + Bottom Tabs)
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Calculadora Throughput e Link Budget
│   │   ├── HistoryScreen.tsx    # Histórico com FlatList + busca + filtros
│   │   ├── SaveScreen.tsx       # Formulário com validação
│   │   └── DetailScreen.tsx     # Detalhes + renomear + remover cenário
│   ├── components/
│   │   └── CalculationCard.tsx  # Componente reutilizável para a lista
│   └── services/
│       └── api.ts               # Serviço axios — chamadas à API backend
└── package.json
```

---

## Telas do Aplicativo

| Tela | Rota | Descrição |
|------|------|-----------|
| **Throughput** | Tab 1 | Calcula throughput DL com parâmetros 5G NR (PRBs, MIMO, modulação) |
| **Link Budget** | Tab 2 | Calcula link budget com 6 modelos de perda (FSPL, UMa, UMi, Indoor) |
| **Histórico** | Tab 3 | Lista cenários salvos com busca por nome e filtro por tipo |
| **Salvar** | Stack | Formulário com validação para nomear e salvar o cálculo atual |
| **Detalhes** | Stack | Exibe parâmetros completos, renomear cenário (PUT) e remover (DELETE) |

---

## Checklist de Requisitos Acadêmicos

### 1. Interface e Fundamentos (Unidade II)

- [x] **Componentes Core**: `View`, `Text`, `TextInput`, `TouchableOpacity`, `Image` — todos usados em múltiplas telas
- [x] **Estilização e Layout**: 100% via `StyleSheet.create()` com Flexbox (`flexDirection`, `flex`, `justifyContent`, `alignItems`, `flexWrap`)
- [x] **Gerenciamento de Estado Local**: `useState` para todos os inputs dos formulários, estados de loading, modal de renomear, filtro de busca

### 2. Navegação e Estrutura de Tela (Unidade III)

- [x] **Rotas e Navegação**: `@react-navigation/native` com `NavigationContainer`, `createNativeStackNavigator` (Stack) + `createBottomTabNavigator` (Tabs) — **5 telas distintas**
- [x] **Listagens Eficientes**: `FlatList` com `keyExtractor` e `renderItem` em `HistoryScreen`, com `RefreshControl` para pull-to-refresh
- [x] **Formulários com Validação**: `SaveScreen` valida nome obrigatório (mín. 3, máx. 80 caracteres) antes de submeter; `DetailScreen` valida o campo de renomear

### 3. Integração com Backend (Unidade IV)

- [x] **API Própria (Node.js + Express)**: servidor em `server/routes.ts` com 5 endpoints REST completos
- [x] **Consumo de Dados (GET)**: `HistoryScreen` busca a lista via `axios` (`GET /api/calculations`) ao focar na tela (`useFocusEffect`)
- [x] **Envio de Dados**:
  - `POST /api/calculations` — `SaveScreen` envia o formulário para salvar novo cenário
  - `PUT /api/calculations/:id` — `DetailScreen` renomeia o cenário via Modal + TextInput
  - `DELETE /api/calculations/:id` — `HistoryScreen` e `DetailScreen` removem cenários com confirmação `Alert`
- [x] **Feedback Visual de Rede**: `ActivityIndicator` em `SaveScreen` (salvamento) e `DetailScreen` (renomear); `Alert.alert` trata erros de conexão em todas as telas

### 4. Boas Práticas e Entrega (Critérios Gerais)

- [x] **Componentização**: `CalculationCard` em `src/components/` — componente reutilizável usado na `FlatList` do histórico
- [x] **Versionamento e Entrega**: projeto entregue via repositório com este `README.md` contendo instruções completas para frontend e backend

---

## Tecnologias Utilizadas

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React Native (Expo) | SDK 54 |
| Linguagem | TypeScript | 5.8 |
| Navegação | React Navigation v7 | ^7.x |
| HTTP Client | axios | ^1.7 |
| Backend | Node.js + Express | 18+ |
| Validação | Zod | ^3.x |
| ORM | Drizzle ORM | ^0.30 |
| Banco de Dados | PostgreSQL (fallback: memória) | — |
