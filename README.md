# Patuvê

App mobile para buscar vagas de emprego reais no Brasil. Usa Expo + React Native no frontend e um backend Node.js que chama a API da Anthropic com web search para encontrar vagas atualizadas.

## Estrutura do projeto

```
patuvê/
├── app/                    # Telas (Expo Router)
│   ├── _layout.tsx         # Root layout com providers
│   └── (tabs)/
│       ├── index.tsx       # Tela de busca
│       └── salvas.tsx      # Tela de vagas salvas
├── components/
│   ├── JobCard.tsx         # Card de vaga com ações
│   ├── LoadingSkeleton.tsx # Placeholder animado
│   └── SearchForm.tsx      # Formulário de busca com filtros
├── constants/
│   └── theme.ts            # Paleta de cores dark
├── context/
│   └── SavedJobsContext.tsx # Estado global de vagas salvas
├── services/
│   ├── api.ts              # Cliente HTTP (axios)
│   └── vagasService.ts     # Lógica de busca + cache AsyncStorage
├── types/
│   └── vaga.ts             # Tipos TypeScript centralizados
├── utils/
│   └── validators.ts       # Normalização e deduplicação de vagas
└── backend/
    ├── server.js           # Express + Anthropic (pipeline 3 camadas)
    ├── services/
    │   └── validadorVagas.js  # Validação de links via HEAD request
    └── utils/
        └── filtrosVagas.js    # Filtros estáticos de qualidade
```

## Como rodar localmente

### Pré-requisitos

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Chave de API da Anthropic (obtenha em https://console.anthropic.com)

### Backend

```bash
cd backend
npm install
copy .env.example .env   # Windows
# cp .env.example .env   # Mac/Linux
```

Edite `backend/.env` e defina sua chave:

```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
NODE_ENV=development
```

```bash
node server.js
```

O servidor sobe em `http://localhost:3001`. Confirme com:

```bash
curl http://localhost:3001/health
```

### App

```bash
# na raiz do projeto
npm install
cp .env.example .env
```

Edite `.env` com o IP da sua máquina na rede local (não use `localhost` — o app roda no celular):

```
EXPO_PUBLIC_BACKEND_URL=http://192.168.0.XXX:3001
```

Para descobrir seu IP: `ipconfig` (Windows) ou `ifconfig` (Mac/Linux).

```bash
npx expo start
```

Escaneie o QR code com o Expo Go no celular.

## Variáveis de ambiente

### App (raiz)

| Variável | Descrição | Exemplo |
|---|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | URL do backend acessível pelo celular | `http://192.168.0.10:3001` |

### Backend (`backend/`)

| Variável | Descrição | Padrão |
|---|---|---|
| `ANTHROPIC_API_KEY` | Chave da API Anthropic | — (obrigatório) |
| `PORT` | Porta do servidor | `3001` |
| `NODE_ENV` | Ambiente (`development` exibe detalhes de erro) | `development` |

## Como gerar o APK (Android)

```bash
# Instale o EAS CLI
npm install -g eas-cli

# Login na conta Expo
eas login

# Configure o build (primeira vez)
eas build:configure

# Gera APK de preview (instalável diretamente)
eas build --platform android --profile preview
```

O APK fica disponível para download no painel do Expo após o build.

## Pipeline de busca

O backend processa cada busca em 3 camadas:

1. **Claude + web_search** — busca vagas reais nas plataformas configuradas
2. **Filtros estáticos** (`filtrosVagas.js`) — remove URLs genéricas, duplicatas, títulos inválidos
3. **Validação de links** (`validadorVagas.js`) — faz HEAD request em cada URL (timeout 5s) para confirmar que a vaga ainda existe

Se a busca retornar menos de 5 vagas, o sistema tenta automaticamente uma segunda vez. Se retornar 0 vagas válidas após o pipeline, tenta uma busca mais ampla (sem restrição de cidade).

## Rate limiting

O backend aceita no máximo **10 requisições por minuto por IP**. Requisições acima disso retornam HTTP 429.
