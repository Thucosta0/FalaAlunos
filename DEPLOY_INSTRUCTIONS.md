# 🚀 INSTRUÇÕES DE DEPLOY - Fala Alunos

## ✅ **Sistema Implementado**

O sistema de chat em tempo real foi **completamente implementado** com:

- ✅ **Servidor Node.js** (`server.js`)
- ✅ **Socket.io** para comunicação em tempo real
- ✅ **API REST** para gerenciamento de mensagens
- ✅ **Frontend atualizado** (`shared-chat.js`)
- ✅ **Configurações de deploy** (`render.yaml`)

---

## 🔧 **Como Testar Localmente**

### 1. **Instalar Dependências**
```bash
npm install
```

### 2. **Iniciar Servidor**
```bash
npm start
```

### 3. **Testar Sistema**
- Acesse: `http://localhost:3000`
- Abra em **2 abas diferentes**:
  - Aba 1: Escolha "**Sou Aluno**" → Envie mensagem
  - Aba 2: Escolha "**Sou Administrativo**" (admin/123) → Receba mensagem em tempo real

---

## 🌐 **Deploy em Produção**

### **🚀 Setup Completo: Frontend (Netlify) + Backend (Render)**

#### **1. Deploy do Backend - Render.com**

1. **Criar conta no Render.com**
2. **Conectar repositório GitHub**
3. **Criar Web Service**:
   - Repository: `Thucosta0/FalaAlunos`
   - Branch: `main`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Configurar Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`

5. **Deploy**: Automático após push
6. **URL Backend**: `https://fala-alunos-server.onrender.com`

#### **2. Deploy do Frontend - Netlify**

1. **Conectar GitHub ao Netlify**:
   - Acesse: https://app.netlify.com
   - Clique em "New site from Git"
   - Conecte sua conta GitHub
   - Selecione o repositório `FalaAlunos`

2. **Configurações de Build**:
   - **Branch**: `main`
   - **Base directory**: (deixar vazio)
   - **Build command**: (deixar vazio)
   - **Publish directory**: `.` (ponto)

3. **Configurações Automáticas**:
   - ✅ `netlify.toml` já configurado
   - ✅ `_redirects` já configurado  
   - ✅ Chat detecta Netlify automaticamente

4. **Deploy**: Automático após push
5. **URL Frontend**: `https://[seu-nome].netlify.app`

#### **3. Configurar Domínio Personalizado (Opcional)**
1. No Netlify: Settings → Domain management
2. Adicionar domínio personalizado
3. Configurar DNS conforme instruções

---

### **⚡ Deploy Rápido - Netlify**

Se você já tem conta no Netlify:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Thucosta0/FalaAlunos)

---

## 🌐 **Deploy em Produção**

### **Opção 2: Railway.app**

1. **Conectar GitHub ao Railway**
2. **Deploy from GitHub**
3. **Environment Variables**:
   - `NODE_ENV`: `production`

### **Opção 3: Heroku**

1. **Instalar Heroku CLI**
2. **Comandos**:
```bash
heroku create fala-alunos-app
git push heroku main
```

---

## 📁 **Estrutura de Arquivos**

```
fala-alunos/
├── server.js          # Servidor Node.js + Socket.io
├── package.json       # Dependências do Node.js
├── render.yaml        # Configuração para Render.com
├── shared-chat.js     # Sistema de chat em tempo real
├── login.html         # Página de login/seleção
├── aluno.html         # Interface do aluno
├── index.html         # Interface administrativa
├── script.js          # Funcionalidades do admin
├── styles.css         # Estilos globais
└── README.md          # Documentação
```

---

## 🔗 **URLs Após Deploy**

### **Backend (Servidor)**
- Render: `https://fala-alunos-server.onrender.com`
- Railway: `https://fala-alunos-server.up.railway.app`
- Heroku: `https://fala-alunos-app.herokuapp.com`

### **Frontend (GitHub Pages)**
- URL: `https://thucosta0.github.io/FalaAlunos`

---

## ⚙️ **Configuração Automática**

O sistema está configurado para:

1. **Detectar ambiente** (local/produção)
2. **URL do servidor** configurada automaticamente:
   - Local: `http://localhost:3000`
   - Produção: `https://fala-alunos-server.onrender.com`

3. **CORS configurado** para permitir conexões

---

## 🐛 **Troubleshooting**

### **Problema: Chat não conecta**
- Verificar se servidor está rodando
- Verificar URL do servidor no console do browser
- Verificar CORS no servidor

### **Problema: Deploy falha**
- Verificar `package.json`
- Verificar variáveis de ambiente
- Verificar logs do serviço

### **Problema: Autenticação Git**
```bash
# Reconfigurar credenciais
git config --global credential.helper manager-core
```

---

## 📞 **Suporte**

Para problemas ou dúvidas:
1. Verificar logs do servidor
2. Verificar console do browser (F12)
3. Testar primeiro localmente
4. Verificar configurações de CORS

---

**🎉 Sistema pronto para deploy! Chat em tempo real funcionando 100%!** 