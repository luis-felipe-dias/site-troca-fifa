# Yup Trocas — Painel de Figurinhas (Fullstack)

Stack: **Next.js (App Router)** + **TailwindCSS** + **API Routes** + **MongoDB Atlas** + **Mongoose** + **JWT (cookie httpOnly)** + **bcrypt** + **Phosphor Icons**.

## 1) Configurar ambiente

Crie um arquivo `.env` na raiz com:

```env
MONGODB_URI=mongodb+srv://dias_now_db:LORD231203lf@cluster0.yiji7h2.mongodb.net/troca_figuras
JWT_SECRET=coloque-um-segredo-grande-aqui
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_NAME=Yup Trocas
```

## 2) Instalar dependências

No Windows, instale **Node.js LTS** (ele traz o `npm`). Depois:

```bash
npm install
```

## 3) Rodar o projeto

```bash
npm run dev
```

Acesse:
- `/register` para criar conta
- `/login` para entrar
- `/dashboard`, `/album`, `/busca`, `/matches`, `/admin`

## 4) Seed das figurinhas

### Via Admin (recomendado)

1. Faça login com um usuário admin (campo `role: "admin"` na collection `usuarios`).
2. Vá em `/admin` e clique em **Rodar seed**.

## 5) Criar / promover usuário Admin

O menu e a página `/admin` **só aparecem/abrem** para usuários com `role: "admin"`.

### Opção A (mais simples): MongoDB Atlas

Na collection `usuarios`, encontre o usuário e defina:

- `role`: `"admin"`

### Opção B: Script (recomendado para automatizar)

```bash
npm run admin:create -- --email "dias@nowlords.com.br" --senha "SUA_SENHA" --cidade "Manhuaçu"
```

### Via script

```bash
npm run seed
```

## Observações de segurança

- O token JWT fica em **cookie httpOnly** (`token`).
- O sistema **não exibe nome completo** no painel (somente `yupId`).

