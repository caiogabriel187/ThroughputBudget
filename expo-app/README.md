# Calculadora 5G NR — App Mobile (React Native + Android Studio)

Aplicativo mobile React Native com **Expo SDK 53** para cálculo de **Throughput DL** e **Link Budget** em redes 5G NR, conectado a uma API REST construída com **Node.js + Express**, pronto para rodar no **Android Studio**.

---

## Requisitos do Sistema

- **Node.js** 18 ou superior — [nodejs.org](https://nodejs.org/)
- **Android Studio** (versão Hedgehog ou superior) — [developer.android.com/studio](https://developer.android.com/studio)
- **JDK 17** (já vem embutido no Android Studio em `Android Studio/jbr`)
- **Android SDK** 35 (instale via Android Studio → SDK Manager)

---

## Parte 1 — Configuração do Ambiente (Windows)

### 1.1 Instalar o Android Studio

Durante a instalação, marque as opções:
- **Android SDK**
- **Android SDK Platform**
- **Android Virtual Device**

### 1.2 Configurar variáveis de ambiente

Abra **"Variáveis de ambiente"** no Windows e adicione em **Variáveis do sistema**:

| Variável | Valor |
|----------|-------|
| `JAVA_HOME` | `C:\Program Files\Android\Android Studio\jbr` |
| `ANDROID_HOME` | `C:\Users\<SEU_USUARIO>\AppData\Local\Android\Sdk` |

Em **Path**, adicione:
```
%JAVA_HOME%\bin
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
```

**Feche e reabra o terminal**, depois confirme:

```bash
java -version
adb --version
```

### 1.3 Criar um emulador

1. Android Studio → **More Actions → Virtual Device Manager**
2. **Create Device** → escolha Pixel 7 → **Next**
3. Selecione imagem **API 35 (Android 15)** → **Download** → **Finish**
4. Clique no ▶ para iniciar o emulador

---

## Parte 2 — Backend (Node.js + Express)

Na pasta raiz do projeto (fora de `expo-app/`):

```bash
npm install
npm run dev
```

Servidor inicia na **porta 5000**:
```
[express] serving on port 5000
```

### Endpoints disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/calculations` | Lista todos os cenários |
| `GET` | `/api/calculations/:id` | Retorna um cenário |
| `POST` | `/api/calculations` | Cria novo cenário |
| `PUT` | `/api/calculations/:id` | Renomeia cenário |
| `DELETE` | `/api/calculations/:id` | Remove cenário |
| `GET` | `/api/health` | Status do servidor |

---

## Parte 3 — Frontend (Expo + Android Studio)

### 3.1 Abrir a pasta `expo-app/` no VS Code

```
Arquivo → Abrir Pasta → expo-app/
```

### 3.2 Instalar dependências

```bash
npm install
```

### 3.3 Configurar a URL do backend

Edite `src/services/api.ts` e ajuste a `BASE_URL`:

```ts
// Descubra seu IP local:
//   Windows → ipconfig (procure "Endereço IPv4")
//   Mac/Linux → ifconfig
const BASE_URL = 'http://192.168.X.X:5000';
```

> ⚠️ **Importante:** o emulador Android **não acessa `localhost`** — precisa do IP da rede ou do endereço especial `10.0.2.2:5000` que aponta para o `localhost` do PC host:
> ```ts
> const BASE_URL = 'http://10.0.2.2:5000';
> ```

### 3.4 Gerar o projeto nativo Android (uma vez)

```bash
npx expo prebuild --platform android --clean
```

Esse comando cria a pasta `android/` com o projeto Gradle pronto para o Android Studio. Pode demorar alguns minutos na primeira vez.

### 3.5 Abrir no Android Studio

1. Android Studio → **File → Open**
2. Navegue até `expo-app/android/` e clique **OK**
3. Aguarde o **Gradle Sync** terminar (canto inferior direito)
4. Inicie o emulador
5. Clique no botão **▶ Run 'app'** na barra superior

O app será compilado e instalado automaticamente no emulador.

### 3.6 Alternativa via terminal

Se preferir compilar pelo terminal (sem abrir o Android Studio):

```bash
npx expo run:android
```

Com o emulador rodando, esse comando compila e instala o app.

---

## Solução de Problemas

### Erro "JAVA_HOME is not set"

Você não configurou as variáveis de ambiente. Volte à **seção 1.2** e configure `JAVA_HOME`, depois **feche e reabra todos os terminais**.

### Erro "SDK location not found"

Crie o arquivo `expo-app/android/local.properties` com o conteúdo:

```
sdk.dir=C:\\Users\\<SEU_USUARIO>\\AppData\\Local\\Android\\Sdk
```

(Use barras duplas `\\` no caminho — Windows exige.)

### Build falha com erro de dependências antigas

```bash
cd expo-app
rm -rf node_modules .expo android package-lock.json
npm install
npx expo prebuild --platform android --clean
```

(No Windows, apague as pastas manualmente pelo Explorer.)

### App abre mas não carrega o histórico

Verifique a `BASE_URL` em `src/services/api.ts`. Para emulador, use `http://10.0.2.2:5000`. Para celular físico, use o IP do PC na rede Wi-Fi.

### Gradle Sync trava no Android Studio

Em **File → Settings → Build → Gradle**, certifique-se de que o **Gradle JDK** está apontando para `Android Studio default JDK` (jbr).

---

## Estrutura do Projeto

```
expo-app/
├── App.tsx                      # Stack + Bottom Tabs (React Navigation)
├── app.json                     # Configuração do Expo + plugin de build Android
├── index.js                     # registerRootComponent
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Calculadora Throughput + Link Budget
│   │   ├── HistoryScreen.tsx    # FlatList com histórico e busca
│   │   ├── SaveScreen.tsx       # Formulário com validação
│   │   └── DetailScreen.tsx     # Detalhes + renomear + remover
│   ├── components/
│   │   └── CalculationCard.tsx  # Componente reutilizável
│   └── services/
│       └── api.ts               # axios — GET/POST/PUT/DELETE
└── android/                     # Gerado por `npx expo prebuild`
```

---

## Checklist de Requisitos Acadêmicos

### 1. Interface e Fundamentos
- [x] **Componentes Core**: `View`, `Text`, `TextInput`, `TouchableOpacity`, `Image`, `FlatList`, `Modal`, `ActivityIndicator`
- [x] **Estilização**: 100% via `StyleSheet.create()` com Flexbox
- [x] **Estado Local**: `useState` em todos os formulários e modais

### 2. Navegação e Estrutura
- [x] **Navegação**: React Navigation v7 — Stack + Bottom Tabs — **5 telas**
- [x] **FlatList**: `HistoryScreen` com `keyExtractor`, `renderItem`, `RefreshControl`
- [x] **Formulários com Validação**: `SaveScreen` valida nome (3–80 chars); `DetailScreen` valida renomear

### 3. Integração com Backend
- [x] **API Express**: 5 endpoints REST em `server/routes.ts`
- [x] **GET**: `HistoryScreen` busca lista via axios
- [x] **POST/PUT/DELETE**: criar, renomear e remover cenários
- [x] **Feedback Visual**: `ActivityIndicator` durante chamadas; `Alert` em erros de rede

### 4. Boas Práticas
- [x] **Componentização**: `CalculationCard` em `src/components/`
- [x] **Versionamento**: projeto entregue com README completo

---

## Tecnologias

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React Native (Expo) | SDK 53 |
| Linguagem | TypeScript | 5.8 |
| Navegação | React Navigation v7 | ^7.x |
| HTTP Client | axios | ^1.7 |
| Build Android | Gradle + AGP | API 35 |
| JDK | OpenJDK | 17 (jbr) |
| Backend | Node.js + Express | 18+ |
