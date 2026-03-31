# Deploy do Patuvê Backend no Railway

## Pré-requisitos

- Conta criada em railway.app
- Projeto com a pasta `backend/` pronta (package.json, server.js, Procfile)
- Chave da API Anthropic em mãos

---

## Passo a passo

### 1. Subir o projeto no GitHub (se ainda não tiver)

O Railway faz deploy direto do GitHub. Se o projeto ainda não está lá:

```bash
# Na raiz do projeto Patuvê:
git init
git add .
git commit -m "feat: versão inicial"
git remote add origin https://github.com/SEU_USUARIO/patuve.git
git push -u origin main
```

> Se não quiser usar GitHub, pule para a opção "Deploy from local" abaixo.

---

### 2. Criar o projeto no Railway

1. Acesse [railway.app](https://railway.app) e logue na conta
2. Clique em **"New Project"**
3. Escolha **"Deploy from GitHub repo"**
   - Autorize o Railway a acessar seus repositórios se solicitado
   - Selecione o repositório `patuve`
   - **Root Directory:** defina como `/backend`
     (Railway vai usar apenas a pasta backend, ignorando o app Expo)
4. Aguarde o build terminar — leva 1–2 minutos
   - O Railway detecta o `Procfile` e roda `node server.js` automaticamente

**Alternativa sem GitHub — Deploy from local:**
```bash
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
```

---

### 3. Configurar variáveis de ambiente

1. No painel do projeto Railway, clique na aba **"Variables"**
2. Adicione:

| Variável | Valor |
|----------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` (sua chave real) |

> `PORT` **não precisa ser adicionado** — Railway injeta automaticamente.

---

### 4. Obter a URL pública

1. Vá em **"Settings" → "Networking" → "Generate Domain"**
2. Railway gera uma URL no formato:
   ```
   https://patuve-backend.up.railway.app
   ```
3. Copie essa URL

---

### 5. Atualizar o app Expo

No arquivo `.env` na **raiz do projeto** (não dentro de `/backend`):

```env
EXPO_PUBLIC_BACKEND_URL=https://patuve-backend.up.railway.app
```

> Em desenvolvimento local, troque de volta para o IP da máquina quando necessário.

---

### 6. Verificar o deploy

Abra no navegador — deve retornar JSON:

```
https://patuve-backend.up.railway.app/
→ { "app": "Patuvê Backend", "status": "ok" }

https://patuve-backend.up.railway.app/health
→ { "status": "ok", "timestamp": "...", "version": "1.0.0" }
```

---

## Teste local antes do deploy

```bash
cd backend
node server.js
# Em outro terminal:
curl http://localhost:3015/health
```

Resposta esperada:
```json
{ "status": "ok", "timestamp": "2025-...", "version": "1.0.0" }
```

---

## Logs e monitoramento

- No painel Railway, aba **"Deployments"** → clique no deploy ativo → **"View Logs"**
- Os logs mostram cada busca no formato:
  ```
  [pipeline] cargo="..." cidade="..." validas=8 tempo_ms=7432 timeout=false
  ```

---

## Redeploy automático

Após o primeiro deploy configurado com GitHub:
- Qualquer `git push` para `main` aciona um novo deploy automaticamente
- Zero downtime — Railway faz rolling deploy
