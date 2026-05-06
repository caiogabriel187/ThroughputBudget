# Calculadora 5G NR — App Mobile (Expo)

Aplicativo mobile com React Native + Expo para cálculo de **Throughput** e **Link Budget** em redes 5G NR.

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [VS Code](https://code.visualstudio.com/)
- [Expo Go](https://expo.dev/client) instalado no celular (Android ou iOS)

## Como rodar

### 1. Abra esta pasta no VS Code

```
Arquivo → Abrir Pasta → selecione a pasta `expo-app`
```

### 2. Instale as dependências

Abra o terminal no VS Code (`Ctrl + \``) e rode:

```bash
npm install
```

### 3. Configure o servidor backend

Edite o arquivo `src/services/api.ts` e altere a `BASE_URL` para o IP da máquina onde o servidor está rodando:

```ts
const BASE_URL = 'http://SEU_IP_LOCAL:5000';
```

Para descobrir seu IP local:
- Windows: `ipconfig` no terminal
- Mac/Linux: `ifconfig` ou `ip addr`

> O servidor backend (pasta raiz do projeto) precisa estar rodando com `npm run dev`.

### 4. Inicie o Expo

```bash
npx expo start
```

Isso abrirá um QR Code no terminal. Aponte a câmera do celular para o QR Code usando o app **Expo Go**.

### 5. Rodar no emulador (opcional)

- Android: `npx expo start --android` (requer Android Studio)
- iOS: `npx expo start --ios` (requer Mac + Xcode)

---

## Estrutura do Projeto

```
expo-app/
├── App.tsx                    # Ponto de entrada — navegação Stack + Tabs
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Calculadora (Throughput e Link Budget)
│   │   ├── HistoryScreen.tsx  # Histórico com FlatList + busca + filtros
│   │   ├── SaveScreen.tsx     # Formulário com validação + ActivityIndicator
│   │   └── DetailScreen.tsx   # Detalhes do cenário salvo
│   ├── components/
│   │   └── CalculationCard.tsx # Card reutilizável para a FlatList
│   └── services/
│       └── api.ts             # Serviço axios para API backend
├── package.json
├── app.json
└── babel.config.js
```

## Telas

| Tela | Descrição |
|------|-----------|
| **Throughput** | Calcula throughput DL com todos parâmetros 5G NR |
| **Link Budget** | Calcula link budget com 6 modelos de perda de percurso |
| **Histórico** | Lista cenários salvos com busca, filtro e swipe para deletar |
| **Salvar** | Formulário com validação de nome e resumo do cálculo |
| **Detalhes** | Exibe todos os parâmetros e resultados de um cenário |

## Checklist Acadêmico (React Native)

- [x] `View`, `Text`, `TextInput`, `TouchableOpacity` em todas as telas
- [x] `FlatList` com `keyExtractor` e `renderItem` (HistoryScreen)
- [x] `ActivityIndicator` durante salvamento (SaveScreen)
- [x] `StyleSheet` + Flexbox em toda a estilização
- [x] `useState` para gerenciamento de estado local
- [x] `@react-navigation/native` com `NavigationContainer`
- [x] `createNativeStackNavigator` para Stack Navigator
- [x] `createBottomTabNavigator` para Tab Navigator
- [x] `useNavigation`, `useRoute`, `useFocusEffect`
- [x] 4+ telas distintas
- [x] `axios` para todas as chamadas de API
- [x] Validação de formulário com mensagens de erro
- [x] `Alert.alert` para erros e confirmações
- [x] Componentização em `src/components/`
- [x] Backend Node.js/Express com CRUD completo
