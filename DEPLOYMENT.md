# 🚀 Guia de Deployment - Vercel

## Preparação Pré-Deployment

### ✅ Checklist Completado
- [x] Git repositório inicializado
- [x] Commit inicial criado
- [x] `.env.example` configurado
- [x] `.gitignore` atualizado
- [x] `vercel.json` configurado
- [x] Segurança: 20 vulnerabilidades corrigidas
- [x] Build: Testado e validado
- [x] Supabase: Credenciais configuradas

---

## 🔧 Configuração Vercel

### 1. Preparar para GitHub
```bash
git remote add origin https://github.com/SEU_USUARIO/confeccao-pro.git
git branch -M main
git push -u origin main
```

### 2. Conectar ao Vercel
- Acesse: https://vercel.com/new
- Selecione: "Import Git Repository"
- Escolha seu repositório
- Vercel detectará automaticamente Next.js/Vite

### 3. Definir Variáveis de Ambiente
Na página de settings do seu projeto no Vercel, adicione:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
GEMINI_API_KEY=sua-chave-gemini (opcional)
```

### 4. Build Settings
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

---

## 📋 Configuração Supabase para Produção

### 1. Configurar CORS
```sql
-- No SQL Editor do Supabase:
ALTER TABLE public.auth.users 
SET 
auth.jwt_secret = 'sua-chave-jwt';
```

### 2. Configurar RLS (Row Level Security)
```sql
-- Exemplo para tabela de usuários:
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);
```

### 3. Configurar Domínios de Autenticação
- Ir para: Supabase → Authentication → URL Configuration
- Adicionar seu domínio Vercel: `https://seu-app.vercel.app`

---

## 🔐 Segurança em Produção

### Variáveis Sensíveis
- ✅ **Nunca** commitar `.env` ou `.env.local`
- ✅ Sempre usar Vercel Environment Variables
- ✅ Usar `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor

### Headers de Segurança
Vercel adiciona automaticamente:
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`

---

## 📊 Monitoramento

### Performance
- Vercel Analytics: https://vercel.com/docs/analytics
- Web Vitals: Monitore LCP, FID, CLS

### Logs
- Vercel Dashboard → Logs
- Servidor: `npm run dev` para local
- Produção: Vercel Logs

---

## 🐛 Troubleshooting

### Build falha
```bash
npm run build  # Teste localmente primeiro
npm run lint   # Verifique erros TypeScript
```

### Supabase não conecta
1. Verifique as variáveis de ambiente no Vercel
2. Teste a URL: `curl https://seu-projeto.supabase.co`
3. Verifique credenciais em Supabase → Settings → API

### Erro 404 em rotas dinâmicas
O `vercel.json` já está configurado para:
- `/api/*` → `server.ts`
- `/*` → `index.html` (SPA)

---

## 📚 Próximos Passos

1. **Push para GitHub:**
   ```bash
   git push origin main
   ```

2. **Conectar Vercel:**
   - Vercel detectará automaticamente
   - Configure Environment Variables
   - Deploy automático no push

3. **Testar em Produção:**
   - Verifique login/logout
   - Teste funcionalidades principais
   - Monitore performance

---

## 💬 Suporte

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Vite Docs:** https://vitejs.dev

---

**Status:** ✅ Pronto para Deploy!
