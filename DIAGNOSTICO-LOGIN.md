# 🔍 Diagnóstico: Login "Credenciais Inválidas"

## ✅ Etapa 1: Verificar se o usuário admin existe

### Opção A: Com o script (recomendado)

1. **Copie a External Database URL do Render**  
   - Acesse: Render > Database > PostgreSQL > Connections
   - Copie o valor de **External Database URL**

2. **Execute o script de verificação**
   ```bash
   DATABASE_URL="postgresql://..." node check-admin-user.js
   ```
   (Substitua `...` pela URL completa copiada)

3. **Analise o resultado:**
   - ✅ Se disse "Usuário encontrado" e está "Ativo: ✅ Sim"  
     → Vá para **Etapa 3** (problema é na autenticação)
   
   - ⚠️ Se está "Ativo: ❌ Não"  
     → Vá para **Etapa 2A** (ativar usuário)
   
   - ⚠️ Se disse "Usuário admin@empresa.com NÃO encontrado"  
     → Vá para **Etapa 2B** (criar usuário com migração)

---

### Opção B: Query direta no Render

1. **Acesse o Render Dashboard**
2. **Vá em: Database > Query Editor**
3. **Cole esta query:**
   ```sql
   SELECT id, nome, email, perfil, ativo, empresa_id, criado_em
   FROM usuarios
   WHERE LOWER(email) = 'admin@empresa.com';
   ```
4. **Execute e note o resultado**

---

## ⚠️ Etapa 2: Resolver usuário ausente ou inativo

### Etapa 2A: Se o usuário existe mas está INATIVO

No **Render Query Editor**, execute:
```sql
UPDATE usuarios 
SET ativo = true 
WHERE LOWER(email) = 'admin@empresa.com';
```

Depois vá para **Etapa 3**.

---

### Etapa 2B: Se o usuário NÃO EXISTE

A migração não foi rodada no banco do Render. Opções:

**Opção 1: Executar migração localmente (recomendado)**
```bash
cd backend
DATABASE_URL="postgresql://..." npm run migrate
```
(Substitua `...` pela External Database URL do Render)

**Opção 2: Executar migração no Render**
- No console do Render (SSH), navegue para `/app/backend`
- Execute: `npm run migrate`

Depois vá para **Etapa 3**.

---

## 🔐 Etapa 3: Testar o login

### Credenciais padrão (após migração/ativação):
- **Email:** `admin@empresa.com`
- **Senha:** `admin123`

1. **Acesse a aplicação no Render**
2. **Clique em "Login"**
3. **Digite email e senha** (não deixe espaços extras)
4. **Clique em "Entrar"**

### Se ainda der erro "Credenciais Inválidas"

Verifique no backend (Render):
1. **Logs**: Abra o console do Render e procure por erros de autenticação
2. **Variáveis de Ambiente** no Render:
   - `DATABASE_URL` está correta?
   - `JWT_SECRET` está definida?
   - `NODE_ENV=production`?

Se `JWT_SECRET` estiver vazia ou incorreta, crie uma com 32 caracteres:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 🔄 Etapa 4: Resetar senha (se necessário)

Se o usuário existe, ativo, mas a senha está errada, use o **Render Query Editor**:

```sql
UPDATE usuarios 
SET senha = '$2a$10$MYhWkSU/7E8KWjP88MkuuO5rGC2L.Y0CnO1t9EbVHxGANrejU4UpC'
WHERE LOWER(email) = 'admin@empresa.com';
```

Isso define a senha para `admin123` (hash bcrypt verificado).

---

## 📋 Checklist Rápido

- [ ] Copiei a External Database URL do Render
- [ ] Executei `check-admin-user.js` ou a query de verificação
- [ ] Confirmei se o usuário existe e está ativo
- [ ] Se inativo: rodei `UPDATE ... SET ativo = true`
- [ ] Se não existe: rodei a migração com `DATABASE_URL`
- [ ] Testei o login com `admin@empresa.com` / `admin123`
- [ ] Se ainda falha: verifiquei `JWT_SECRET` no Render

---

## 🚨 Segurança

⚠️ **Atenção:** Não compartilhe a `DATABASE_URL` em chats públicos. Use-a apenas:
- Localmente
- Em CI/CD seguro
- Scripts privados

A URL contém credenciais de acesso total ao banco!

---

## ❓ Dúvidas?

Se o login ainda falhar:
1. Cole aqui os erros do **console do Render** (sem URL de banco)
2. Confirme se `NODE_ENV=production` no Render
3. Verifique se o backend está rodando (Status verde no Render)
