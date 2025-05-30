# 🎓 Fala Alunos - Sistema de Gestão Educacional

Sistema completo de comunicação e gestão acadêmica desenvolvido para facilitar a interação entre alunos e coordenadores.

## 🚀 Funcionalidades Principais

### 📱 **Interface do Aluno** (`aluno.html`)
- **Dashboard personalizado** com informações acadêmicas
- **Chat em tempo real** com coordenadores por categoria
- **Consulta de informações** acadêmicas e notas
- **Solicitação de documentos** e serviços
- **Central de suporte** integrada

### 🏢 **Interface Administrativa** (`index.html`)
- **Dashboard completo** com métricas e gráficos
- **Gestão de usuários** com CRUD completo
- **Kanban Board** para gerenciamento de tarefas
- **Chat administrativo** para atender alunos
- **Relatórios e estatísticas** em tempo real

### 💬 **Sistema de Chat em Tempo Real**
- **Comunicação bidirecional** entre aluno e coordenador
- **Categorias especializadas**: Acadêmico, Administrativo, Financeiro, Técnico
- **Notificações em tempo real** usando localStorage
- **Histórico de conversas** persistente
- **Status online/offline** dos usuários

## 🔧 Como Usar

### 1. **Acesso ao Sistema**
1. Abra `login.html` no navegador
2. Escolha seu perfil:
   - **Sou Aluno**: Acesso à interface estudantil
   - **Sou Administrativo**: Acesso ao painel de gestão

### 2. **Interface do Aluno**
- **Início**: Visão geral e ações rápidas
- **Chat**: Comunicação direta com coordenadores
- **Acadêmico**: Consulta de notas, disciplinas e eventos
- **Serviços**: Solicitação de documentos
- **Suporte**: Central de ajuda e FAQ

### 3. **Interface Administrativa**
- **Dashboard**: Métricas e gráficos em tempo real
- **Organograma**: Estrutura hierárquica da instituição
- **Kanban**: Gestão de tarefas e projetos
- **Usuários**: Cadastro e gerenciamento de usuários
- **Métricas**: Relatórios detalhados
- **Chat**: Atendimento aos alunos em tempo real

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Design responsivo com gradientes e animações
- **JavaScript ES6+**: Funcionalidades interativas
- **Chart.js**: Gráficos e visualizações
- **Font Awesome**: Ícones modernos
- **LocalStorage**: Persistência de dados local

## 📋 Estrutura de Arquivos

```
Fala alunos/
├── login.html          # Página de seleção de perfil
├── aluno.html          # Interface do aluno
├── index.html          # Interface administrativa
├── shared-chat.js      # Sistema de chat compartilhado
├── script.js           # Funcionalidades administrativas
├── styles.css          # Estilos globais
└── README.md           # Documentação
```

## 🔄 Sistema de Chat em Tempo Real

### **Como Funciona**
1. **Inicialização**: Cada usuário recebe um ID único
2. **Sincronização**: LocalStorage + eventos de storage para comunicação
3. **Categorias**: Mensagens organizadas por tipo de atendimento
4. **Persistência**: Histórico mantido localmente
5. **Notificações**: Alertas visuais para novas mensagens

### **Categorias de Atendimento**
- 🎓 **Acadêmico**: Matrícula, notas, disciplinas
- 📄 **Administrativo**: Documentos, processos
- 💰 **Financeiro**: Mensalidades, bolsas
- 🔧 **Técnico**: Problemas de sistema

### **Recursos do Chat**
- ✅ Mensagens em tempo real
- ✅ Indicador de digitação
- ✅ Status online/offline
- ✅ Respostas automáticas inteligentes
- ✅ Histórico de conversas
- ✅ Interface responsiva

## 🎨 Design e UX

### **Características Visuais**
- **Gradientes modernos** em roxo/azul
- **Interface responsiva** para todos os dispositivos
- **Animações suaves** e transições
- **Tipografia clara** e legível
- **Ícones intuitivos** do Font Awesome

### **Experiência do Usuário**
- **Navegação intuitiva** com menu lateral
- **Feedback visual** para todas as ações
- **Carregamento rápido** sem dependências externas
- **Acessibilidade** considerada no design

## 📊 Funcionalidades Avançadas

### **Dashboard Administrativo**
- Gráficos interativos com Chart.js
- Métricas em tempo real
- Atividades recentes
- Estatísticas de uso

### **Gestão de Usuários**
- CRUD completo (Create, Read, Update, Delete)
- Busca em tempo real
- Categorização por perfil
- Validação de formulários

### **Kanban Board**
- Drag & drop funcional
- 4 colunas: A Fazer, Em Progresso, Revisão, Concluído
- Prioridades visuais (alta, média, baixa)
- Ações por tarefa (completar, editar, excluir)

## 🔐 Segurança e Dados

- **SessionStorage**: Gerenciamento de sessão
- **LocalStorage**: Persistência de dados do chat
- **Validação**: Verificação de perfil em cada página
- **Cleanup**: Limpeza automática de dados antigos

## 🚀 Próximos Passos

Para implementação em produção, considere:

1. **Backend**: Integração com servidor real
2. **Banco de Dados**: Substituir localStorage por BD
3. **Autenticação**: Sistema de login robusto
4. **WebSockets**: Chat em tempo real verdadeiro
5. **API REST**: Endpoints para todas as operações

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- 💻 **Desktop**: Experiência completa
- 📱 **Tablet**: Layout adaptado
- 📱 **Mobile**: Interface otimizada

## 🎯 Objetivos Alcançados

✅ **Interface moderna** e intuitiva  
✅ **Chat funcional** em tempo real  
✅ **Gestão completa** de usuários e tarefas  
✅ **Design responsivo** para todos os dispositivos  
✅ **Código limpo** e bem documentado  
✅ **Experiência fluida** para alunos e administradores  

## 🚀 Como Executar

### **Executar Localmente**

1. **Instalar dependências**:
```bash
npm install
```

2. **Iniciar servidor**:
```bash
npm start
```

3. **Acessar sistema**:
- Navegue para: `http://localhost:3000`
- Escolha entre "Sou Aluno" ou "Sou Administrativo"

### **Deploy em Produção**

#### **Render.com (Backend)**
1. Conecte seu repositório GitHub ao Render.com
2. O arquivo `render.yaml` já está configurado
3. O deploy será automático

#### **Vercel/Netlify (Frontend)**
1. Faça fork do repositório
2. Conecte ao Vercel ou Netlify
3. Configure build settings se necessário

---

## 🔧 Configurações Técnicas

### **Servidor (Backend)**
- **Tecnologia**: Node.js + Express + Socket.io
- **Porta**: 3000 (local) / 10000 (produção)
- **CORS**: Configurado para permitir conexões do frontend
- **WebSocket**: Socket.io para comunicação em tempo real

### **Frontend** 
- **Tecnologias**: HTML5, CSS3, JavaScript ES6+
- **Bibliotecas**: Chart.js, Font Awesome, Socket.io Client
- **Responsivo**: Mobile-first design

---

**Desenvolvido com ❤️ para facilitar a comunicação acadêmica** 