# 5G NR Calculator — Aplicativo React Native + Node.js

Calculadora profissional 5G NR para engenheiros de RF. Calcula throughput PHY Layer e link budget com 7 modelos de perda de percurso (3GPP TR 38.901).

## Requisitos

- Node.js 18+ (ou 20+)
- npm 9+
- PostgreSQL (opcional — usa memória como fallback)

---

## Como rodar localmente

### Backend (API Node.js + Express)

```bash
# Na raiz do projeto
npm install
npm run dev
```

O servidor Express inicia na porta **5000**.

### Aplicativo Mobile (React Native Web)

O app mobile está embutido na mesma aplicação web, acessível em:

```
http://localhost:5000/mobile
```

Para Expo nativo (iOS/Android), siga os passos da seção "Expo Nativo" abaixo.

---

## Estrutura do Projeto

```
├── client/src/
│   ├── mobile/                      # Aplicativo React Native
│   │   ├── MobileApp.tsx            # Ponto de entrada do app mobile
│   │   ├── navigation/              # Sistema de navegação (React Navigation API)
│   │   │   └── index.tsx            # NavigationContainer + createNativeStackNavigator
│   │   ├── screens/                 # Telas do aplicativo (mínimo 3)
│   │   │   ├── HomeScreen.tsx       # Tela Principal — calculadora com TextInput
│   │   │   ├── HistoryScreen.tsx    # Tela de Histórico — FlatList + busca
│   │   │   ├── SaveScreen.tsx       # Tela de Cadastro — formulário com validação
│   │   │   └── DetailScreen.tsx     # Tela de Detalhes do cenário salvo
│   │   ├── components/              # Componentes reutilizáveis
│   │   │   ├── CalculationCard.tsx  # Card da FlatList (componente reutilizável)
│   │   │   └── LoadingIndicator.tsx # Wrapper do ActivityIndicator
│   │   └── services/
│   │       └── api.ts               # Serviço HTTP com axios
│   └── pages/
│       ├── calculator.tsx           # Calculadora web
│       └── mobile.tsx               # Página wrapper do app mobile
├── server/
│   ├── routes.ts                    # Rotas da API REST
│   ├── storage.ts                   # Camada de armazenamento (DB + memória)
│   └── app.ts                       # Configuração do Express
└── shared/
    └── schema.ts                    # Schemas Drizzle ORM
```

---

## Checklist de Requisitos Atendidos

### 1. Interface e Fundamentos (Unidade II)

- [x] **Componentes Core:** `View`, `Text`, `TextInput`, `TouchableOpacity`, `ScrollView`, `FlatList`, `ActivityIndicator` usados em todas as telas
- [x] **Estilização e Layout:** Layout responsivo via `StyleSheet.create()` com Flexbox em todos os componentes
- [x] **Gerenciamento de Estado Local:** `useState` para inputs, modais, estados de carregamento e validação em tempo real

### 2. Navegação e Estrutura de Tela (Unidade III)

- [x] **Rotas e Navegação:** 4 telas conectadas via `NavigationContainer` + `createNativeStackNavigator` (API idêntica ao React Navigation)
  - `HomeScreen` — Calculadora principal
  - `HistoryScreen` — Lista de cálculos salvos
  - `SaveScreen` — Formulário de cadastro
  - `DetailScreen` — Detalhes do cenário
- [x] **Listagens Eficientes:** `FlatList` com `keyExtractor`, `renderItem`, suporte a lista vazia e busca/filtro
- [x] **Formulários Básicos:** `SaveScreen` com validação completa — bloqueia envio se nome vazio ou < 3 chars

### 3. Integração com Backend (Unidade IV)

- [x] **API Própria (Node.js + Express):** API REST completa em `/api/calculations`
- [x] **Consumo de Dados (GET):** `axios` em `services/api.ts` buscando lista para a FlatList
- [x] **Envio de Dados (POST/DELETE):** Cadastro de novo cenário (POST) e exclusão (DELETE)
- [x] **Feedback Visual de Rede:** `ActivityIndicator` durante loading, `Alert.alert` com mensagem de erro e botão "Tentar Novamente"

### 4. Boas Práticas e Entrega

- [x] **Componentização:** Código dividido em `screens/`, `components/`, `services/`, `navigation/`
- [x] **Componentes reutilizáveis:** `CalculationCard`, `LoadingIndicator`
- [x] **README.md** com instruções completas

---

## API REST (Endpoints)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/calculations` | Lista todos os cenários salvos |
| GET | `/api/calculations/:id` | Busca um cenário por ID |
| POST | `/api/calculations` | Salva novo cenário |
| DELETE | `/api/calculations/:id` | Remove um cenário |

### Exemplo de requisição POST

```bash
curl -X POST http://localhost:5000/api/calculations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ericsson NR 3.5 GHz",
    "type": "throughput",
    "parameters": { "bwMHz": 100, "mimoLayers": 4 },
    "results": { "throughput": 1134.5, "spectralEfficiency": 15.12 }
  }'
```

---

## Funcionalidades

### Calculadora Throughput
- Configuração de largura de banda, MIMO, modulação, Code Rate, fração DL
- Cálculo em tempo real: throughput em Mbps + eficiência espectral

### Calculadora Link Budget
- 7 modelos de perda de percurso: FSPL, 3GPP UMa/UMi LOS/NLOS, RMa LOS, Indoor LOS
- Indicador de qualidade SINR: Excelente / Bom / Marginal / Ruim
- Presets de fabricantes: Ericsson, Nokia, Huawei, Samsung

### App Mobile (/mobile)
- 4 telas: Calculadora → Histórico (FlatList) → Salvar (form) → Detalhes
- Busca e filtro no histórico
- Formulário com validação de campos obrigatórios
- Indicador de carregamento e tratamento de erros de rede

---

## Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|-----------|
| Frontend Web | React + Vite + TypeScript |
| Frontend Mobile | React Native Web (`View`, `Text`, `FlatList`, etc.) |
| Navegação | React Navigation API (stack navigator customizado) |
| HTTP Client | axios |
| Backend | Node.js + Express |
| ORM | Drizzle ORM |
| Banco de Dados | PostgreSQL (fallback: in-memory) |
| Estilização Web | Tailwind CSS + shadcn/ui |
| Estilização Mobile | `StyleSheet` (React Native) |

---

## Scripts Disponíveis

```bash
npm run dev      # Inicia o servidor de desenvolvimento (Express + Vite)
npm run build    # Build de produção
npm run start    # Inicia em modo produção
npm run db:push  # Aplica alterações de schema no banco de dados
```
