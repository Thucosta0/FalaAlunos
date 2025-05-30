// ========== SISTEMA DE CHAT EM TEMPO REAL ==========
// Este arquivo gerencia a comunicação entre interfaces do aluno e coordenador

class RealTimeChatManager {
    constructor() {
        this.userType = sessionStorage.getItem('userProfile') || 'student';
        this.userId = this.generateUserId();
        this.userName = this.getUserName();
        
        // Recuperar categoria anterior ou usar padrão
        this.currentCategory = this.getCurrentCategory();
        
        this.socket = null;
        this.isConnected = false;
        this.messageListeners = [];
        
        // URL do servidor (configurar conforme ambiente)
        this.serverUrl = this.getServerUrl();
        
        console.log(`💾 Estado recuperado - Categoria: ${this.currentCategory}`);
        
        this.init();
    }

    // Inicializar conexão
    async init() {
        try {
            // Verificar conectividade com o servidor
            await this.testServerConnectivity();
            
            // Carregar Socket.io
            await this.loadSocketIO();
            
            // Conectar ao servidor
            this.connect();
            
            console.log(`Chat Manager iniciado - Tipo: ${this.userType}, ID: ${this.userId}`);
        } catch (error) {
            console.error('Erro ao inicializar chat:', error);
            this.showError('Erro ao conectar com o servidor de chat');
        }
    }

    // Testar conectividade com o servidor
    async testServerConnectivity() {
        try {
            console.log(`🔍 Testando conectividade com: ${this.serverUrl}`);
            
            const response = await fetch(`${this.serverUrl}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 10000
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Servidor está funcionando:', data);
                return true;
            } else {
                throw new Error(`Servidor retornou status: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Falha no teste de conectividade:', error);
            throw new Error(`Servidor não está acessível: ${error.message}`);
        }
    }

    // Carregar biblioteca Socket.io
    loadSocketIO() {
        return new Promise((resolve, reject) => {
            if (window.io) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Conectar ao servidor
    connect() {
        console.log(`🔌 Tentando conectar em: ${this.serverUrl}`);
        
        this.socket = io(this.serverUrl, {
            transports: ['polling', 'websocket'], // Polling primeiro para melhor compatibilidade
            timeout: 20000,
            forceNew: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            maxReconnectionAttempts: 5
        });

        // Eventos de conexão
        this.socket.on('connect', () => {
            console.log('✅ Conectado ao servidor de chat');
            console.log('🔗 ID da conexão:', this.socket.id);
            this.isConnected = true;
            this.registerUser();
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Desconectado do servidor de chat. Motivo:', reason);
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Erro de conexão:', error);
            console.error('🔍 URL tentada:', this.serverUrl);
            this.showError(`Falha na conexão: ${error.message || error}`);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Reconectado após ${attemptNumber} tentativas`);
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('❌ Erro na reconexão:', error);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('❌ Falha na reconexão - todas as tentativas esgotadas');
            this.showError('Não foi possível conectar ao servidor. Recarregue a página.');
        });

        // Eventos de mensagens
        this.socket.on('newMessage', (message) => {
            this.handleNewMessage(message);
        });

        this.socket.on('userTyping', (data) => {
            this.handleTypingIndicator(data);
        });

        this.socket.on('activeUsers', (users) => {
            this.updateActiveUsers(users);
        });

        this.socket.on('messagesCleared', () => {
            this.clearMessages();
        });

        // Eventos para chats dinâmicos
        this.socket.on('newChat', (chat) => {
            this.handleNewChat(chat);
        });

        this.socket.on('chatUpdated', (chat) => {
            this.handleChatUpdated(chat);
        });

        this.socket.on('chatDeleted', (data) => {
            this.handleChatDeleted(data.chatId);
        });
    }

    // Registrar usuário no servidor
    registerUser() {
        if (!this.socket || !this.isConnected) return;

        const userData = {
            type: this.userType,
            name: this.userName,
            category: this.currentCategory
        };

        this.socket.emit('register', userData);
    }

    // Enviar mensagem
    sendMessage(category, message, recipientType = null) {
        if (!this.socket || !this.isConnected) {
            this.showError('Não conectado ao servidor');
            return false;
        }

        if (!message.trim()) return false;

        const messageData = {
            message: message.trim(),
            category: category || this.currentCategory,
            senderType: this.userType,
            recipientType: recipientType
        };

        this.socket.emit('sendMessage', messageData);
        
        // Criar objeto de mensagem para salvar localmente
        const localMessage = {
            id: Date.now(), // ID temporário até o servidor confirmar
            message: messageData.message,
            category: messageData.category,
            senderType: this.userType,
            senderName: this.userName,
            timestamp: new Date().toISOString()
        };
        
        // Salvar mensagem enviada no localStorage imediatamente
        this.saveMessageToStorage(localMessage);
        
        return true;
    }

    // Indicador de digitação
    setTyping(category, isTyping) {
        if (!this.socket || !this.isConnected) return;

        this.socket.emit('typing', {
            category: category || this.currentCategory,
            isTyping: isTyping
        });
    }

    // Carregar mensagens de uma categoria
    async loadMessages(category) {
        try {
            const response = await fetch(`${this.serverUrl}/api/messages/${category}`);
            if (response.ok) {
                const messages = await response.json();
                return messages;
            } else {
                throw new Error('Falha ao carregar mensagens');
            }
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
            return [];
        }
    }

    // Criar novo chat
    async createChat(chatData) {
        try {
            const response = await fetch(`${this.serverUrl}/api/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...chatData,
                    createdBy: this.userName,
                    createdByType: this.userType
                })
            });

            if (response.ok) {
                const chat = await response.json();
                console.log('Novo chat criado:', chat);
                return chat;
            } else {
                throw new Error('Falha ao criar chat');
            }
        } catch (error) {
            console.error('Erro ao criar chat:', error);
            this.showError('Erro ao criar novo chat');
            return null;
        }
    }

    // Carregar lista de chats
    async loadChats() {
        try {
            const response = await fetch(`${this.serverUrl}/api/chats`);
            if (response.ok) {
                const chats = await response.json();
                return chats;
            } else {
                throw new Error('Falha ao carregar chats');
            }
        } catch (error) {
            console.error('Erro ao carregar chats:', error);
            return [];
        }
    }

    // Atualizar chat
    async updateChat(chatId, updateData) {
        try {
            const response = await fetch(`${this.serverUrl}/api/chats/${chatId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const chat = await response.json();
                return chat;
            } else {
                throw new Error('Falha ao atualizar chat');
            }
        } catch (error) {
            console.error('Erro ao atualizar chat:', error);
            return null;
        }
    }

    // Excluir chat
    async deleteChat(chatId) {
        try {
            const response = await fetch(`${this.serverUrl}/api/chats/${chatId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                throw new Error('Falha ao excluir chat');
            }
        } catch (error) {
            console.error('Erro ao excluir chat:', error);
            return null;
        }
    }

    // Manipular nova mensagem
    handleNewMessage(message) {
        console.log('Nova mensagem recebida:', message);
        
        // Salvar mensagem automaticamente no localStorage
        this.saveMessageToStorage(message);
        
        // Notificar listeners
        this.messageListeners.forEach(listener => {
            if (typeof listener === 'function') {
                listener(message);
            }
        });

        // Mostrar notificação visual se não estiver na categoria ativa
        if (message.category !== this.currentCategory && message.senderType !== this.userType) {
            this.showNotification(`Nova mensagem em ${this.getCategoryName(message.category)}`);
        }

        // Atualizar interface automaticamente
        this.updateChatInterface(message);
        
        // Auto-scroll para o fim das mensagens
        setTimeout(() => {
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 100);
    }

    // Salvar mensagem no localStorage
    saveMessageToStorage(message) {
        try {
            const key = `chat_messages_${message.category}`;
            let messages = JSON.parse(localStorage.getItem(key) || '[]');
            
            // Verificar se a mensagem já existe (evitar duplicatas)
            const exists = messages.some(msg => {
                return msg.id === message.id || 
                       (msg.message === message.message && 
                        msg.timestamp === message.timestamp && 
                        msg.senderType === message.senderType);
            });
            
            if (!exists) {
                const messageToSave = {
                    id: message.id || Date.now() + Math.random(),
                    message: message.message,
                    category: message.category,
                    senderType: message.senderType,
                    senderName: message.senderName,
                    timestamp: message.timestamp || new Date().toISOString()
                };
                
                messages.push(messageToSave);
                
                // Ordenar por timestamp
                messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                
                // Salvar no localStorage
                localStorage.setItem(key, JSON.stringify(messages));
                console.log(`💾 Mensagem salva no localStorage - Categoria: ${message.category}, Total: ${messages.length}`);
            } else {
                console.log('🔄 Mensagem duplicada ignorada');
            }
        } catch (error) {
            console.error('Erro ao salvar mensagem no localStorage:', error);
        }
    }

    // Carregar mensagens do localStorage
    loadMessagesFromStorage(category) {
        try {
            const key = `chat_messages_${category}`;
            const messages = JSON.parse(localStorage.getItem(key) || '[]');
            console.log(`📂 Carregadas ${messages.length} mensagens do localStorage - Categoria: ${category}`);
            return messages;
        } catch (error) {
            console.error('Erro ao carregar mensagens do localStorage:', error);
            return [];
        }
    }

    // Sincronizar mensagens com o servidor (MELHORADA)
    async syncMessagesWithServer(category) {
        try {
            console.log(`🔄 Sincronizando mensagens da categoria: ${category}`);
            
            // Buscar mensagens do servidor
            const serverMessages = await this.loadMessages(category);
            console.log(`📡 Mensagens do servidor: ${serverMessages.length}`);
            
            // Buscar mensagens do localStorage
            const localMessages = this.loadMessagesFromStorage(category);
            console.log(`💾 Mensagens locais: ${localMessages.length}`);
            
            // Combinar e remover duplicatas de forma mais eficiente
            const allMessagesMap = new Map();
            
            // Adicionar mensagens locais primeiro
            localMessages.forEach(msg => {
                const key = `${msg.timestamp}_${msg.senderType}_${msg.message.substring(0, 50)}`;
                allMessagesMap.set(key, msg);
            });
            
            // Adicionar mensagens do servidor (sobrescreve se houver conflito)
            serverMessages.forEach(msg => {
                const key = `${msg.timestamp}_${msg.senderType}_${msg.message.substring(0, 50)}`;
                allMessagesMap.set(key, msg);
            });
            
            // Converter de volta para array e ordenar
            const allMessages = Array.from(allMessagesMap.values())
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            // Salvar mensagens combinadas no localStorage
            const storageKey = `chat_messages_${category}`;
            localStorage.setItem(storageKey, JSON.stringify(allMessages));
            
            console.log(`✅ Sincronização completa - ${allMessages.length} mensagens na categoria ${category}`);
            return allMessages;
            
        } catch (error) {
            console.error('Erro na sincronização:', error);
            // Em caso de erro, retornar apenas as mensagens locais
            return this.loadMessagesFromStorage(category);
        }
    }

    // Salvar estado da categoria atual
    saveCurrentCategory(category) {
        try {
            localStorage.setItem('chat_current_category', category);
            localStorage.setItem('chat_last_access', new Date().toISOString());
        } catch (error) {
            console.error('Erro ao salvar categoria atual:', error);
        }
    }

    // Recuperar estado da categoria atual
    getCurrentCategory() {
        try {
            return localStorage.getItem('chat_current_category') || 'academic';
        } catch (error) {
            console.error('Erro ao recuperar categoria atual:', error);
            return 'academic';
        }
    }

    // Limpar cache de mensagens
    clearMessagesCache(category = null) {
        try {
            if (category) {
                localStorage.removeItem(`chat_messages_${category}`);
                console.log(`🗑️ Cache da categoria ${category} limpo`);
            } else {
                // Limpar todas as categorias
                const keys = Object.keys(localStorage).filter(key => key.startsWith('chat_messages_'));
                keys.forEach(key => localStorage.removeItem(key));
                console.log('🗑️ Todo cache de mensagens limpo');
            }
        } catch (error) {
            console.error('Erro ao limpar cache:', error);
        }
    }

    // Manipular indicador de digitação
    handleTypingIndicator(data) {
        if (data.category === this.currentCategory && data.userId !== this.socket.id) {
            this.showTypingIndicator(data);
        }
    }

    // Manipular novo chat criado
    handleNewChat(chat) {
        console.log('Novo chat criado:', chat);
        
        // Emitir evento para interfaces específicas
        window.dispatchEvent(new CustomEvent('newChatCreated', { 
            detail: chat 
        }));
        
        this.showNotification(`Novo chat criado: ${chat.title}`);
    }

    // Manipular chat atualizado
    handleChatUpdated(chat) {
        console.log('Chat atualizado:', chat);
        
        // Emitir evento para interfaces específicas
        window.dispatchEvent(new CustomEvent('chatUpdated', { 
            detail: chat 
        }));
    }

    // Manipular chat excluído
    handleChatDeleted(chatId) {
        console.log('Chat excluído:', chatId);
        
        // Emitir evento para interfaces específicas
        window.dispatchEvent(new CustomEvent('chatDeleted', { 
            detail: { chatId } 
        }));
    }

    // Atualizar usuários ativos
    updateActiveUsers(users) {
        console.log('Usuários ativos:', users);
        
        // Atualizar estatísticas na interface
        const coordCard = document.querySelectorAll('.stat-card .stat-number')[1];
        if (coordCard) {
            coordCard.textContent = users.admins.length.toString();
        }

        // Emitir evento customizado para interfaces específicas
        window.dispatchEvent(new CustomEvent('activeUsersUpdated', { 
            detail: users 
        }));
    }

    // Atualizar interface do chat
    updateChatInterface(message) {
        // Implementação específica por página
        if (typeof window.updateChatMessages === 'function') {
            window.updateChatMessages(message);
        }
    }

    // Mostrar indicador de digitação
    showTypingIndicator(data) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        // Remover indicadores existentes
        const existingTyping = messagesContainer.querySelector('.typing-message');
        if (existingTyping) {
            existingTyping.remove();
        }

        // Adicionar novo indicador
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message received typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;

        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Remover após 3 segundos
        setTimeout(() => {
            if (typingDiv.parentNode) {
                typingDiv.remove();
            }
        }, 3000);
    }

    // Limpar mensagens
    clearMessages() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '<div class="message-date">Mensagens limpas</div>';
        }
    }

    // Adicionar listener para mensagens
    addMessageListener(callback) {
        this.messageListeners.push(callback);
    }

    // Atualizar status de conexão na interface
    updateConnectionStatus(isConnected) {
        const statusElements = document.querySelectorAll('.connection-status');
        statusElements.forEach(element => {
            element.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
            element.textContent = isConnected ? 'Conectado' : 'Desconectado';
        });
    }

    // Gerar ID único do usuário
    generateUserId() {
        let userId = sessionStorage.getItem('chatUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('chatUserId', userId);
        }
        return userId;
    }

    // Obter nome do usuário
    getUserName() {
        if (this.userType === 'admin') {
            return 'Administrador';
        } else {
            return sessionStorage.getItem('studentName') || 'Aluno';
        }
    }

    // Obter nome da categoria
    getCategoryName(category) {
        const categoryNames = {
            academic: 'Suporte Acadêmico',
            administrative: 'Processos Administrativos',
            financial: 'Questões Financeiras',
            technical: 'Suporte Técnico',
            general: 'Informações Gerais'
        };
        return categoryNames[category] || category;
    }

    // Mostrar notificação
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'chat-notification';
        notification.innerHTML = `
            <i class="fas fa-comment"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #667eea;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Mostrar erro
    showError(message) {
        console.error('Chat Error:', message);
        
        const errorNotification = document.createElement('div');
        errorNotification.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        errorNotification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            max-width: 300px;
        `;

        document.body.appendChild(errorNotification);

        setTimeout(() => {
            if (errorNotification.parentElement) {
                errorNotification.remove();
            }
        }, 8000);
    }

    // Desconectar
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Verificar se está conectado
    isOnline() {
        return this.isConnected && this.socket && this.socket.connected;
    }

    // Definir categoria atual
    setCurrentCategory(category) {
        this.currentCategory = category;
        
        // Salvar categoria atual no localStorage
        this.saveCurrentCategory(category);
        
        console.log(`📂 Categoria atual alterada para: ${category}`);
    }

    // Determinar URL do servidor baseado no ambiente
    getServerUrl() {
        const hostname = window.location.hostname;
        
        // Ambiente local
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        
        // Render - usar o mesmo domínio
        if (hostname.includes('onrender.com')) {
            return window.location.origin; // https://falaalunos.onrender.com
        }
        
        // Netlify ou outros hosts de produção
        if (hostname.includes('netlify.app') || hostname.includes('netlify.com')) {
            return 'https://falaalunos.onrender.com';
        }
        
        // GitHub Pages
        if (hostname.includes('github.io')) {
            return 'https://falaalunos.onrender.com';
        }
        
        // Outros domínios personalizados
        return 'https://falaalunos.onrender.com';
    }
}

// Instância global do chat manager
let chatManager = null;

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se deve inicializar o chat
    const userProfile = sessionStorage.getItem('userProfile');
    
    if (userProfile === 'admin' || userProfile === 'student') {
        chatManager = new RealTimeChatManager();
        
        // Disponibilizar globalmente
        window.chatManager = chatManager;
        
        console.log('🚀 Chat em tempo real inicializado');
    }
});

// Limpar ao sair da página
window.addEventListener('beforeunload', function() {
    if (chatManager) {
        chatManager.disconnect();
    }
});

// Função global para enviar mensagem (compatibilidade)
function sendMessage() {
    const input = document.getElementById('messageInput');
    if (!input || !chatManager) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Enviar através do chat manager
    const success = chatManager.sendMessage(chatManager.currentCategory, message);
    
    if (success) {
        input.value = '';
        
        // Adicionar à interface imediatamente (otimização UI)
        addMessageToInterface({
            message: message,
            senderType: chatManager.userType,
            senderName: chatManager.userName,
            timestamp: new Date().toISOString()
        });
    }
}

// Função para adicionar mensagem à interface
function addMessageToInterface(messageData) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${messageData.senderType === chatManager.userType ? 'sent' : 'received'}`;
    
    const time = new Date(messageData.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    if (messageData.senderType === chatManager.userType) {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-bubble">${messageData.message}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">${messageData.message}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Função para atualizar mensagens do chat (callback global)
window.updateChatMessages = function(message) {
    addMessageToInterface(message);
};

// Gerenciar indicador de digitação no input
let typingTimer = null;

// Adicionar listener para input de mensagem
document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('messageInput');
    if (messageInput && chatManager) {
        messageInput.addEventListener('input', function() {
            if (!chatManager.isOnline()) return;
            
            // Indicar que está digitando
            chatManager.setTyping(chatManager.currentCategory, true);
            
            // Limpar timer anterior
            if (typingTimer) {
                clearTimeout(typingTimer);
            }
            
            // Parar de indicar digitação após 2 segundos
            typingTimer = setTimeout(() => {
                chatManager.setTyping(chatManager.currentCategory, false);
            }, 2000);
        });
        
        messageInput.addEventListener('blur', function() {
            if (chatManager.isOnline()) {
                chatManager.setTyping(chatManager.currentCategory, false);
            }
        });
    }
});

// Função para carregar mensagens persistidas na interface
window.loadPersistedMessages = async function(category) {
    if (!chatManager) {
        console.warn('Chat manager não disponível para carregar mensagens persistidas');
        return [];
    }
    
    console.log(`🔄 Carregando mensagens persistidas para categoria: ${category}`);
    
    try {
        // Primeiro, tentar sincronizar com servidor
        const messages = await chatManager.syncMessagesWithServer(category);
        
        // Limpar container de mensagens
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            
            // Se não há mensagens, mostrar mensagem de boas-vindas
            if (messages.length === 0) {
                const welcomeMessage = getWelcomeMessage(category);
                if (welcomeMessage) {
                    addMessageToInterface(welcomeMessage);
                }
            } else {
                // Adicionar indicador de data se há mensagens
                const today = new Date().toLocaleDateString('pt-BR');
                const dateDiv = document.createElement('div');
                dateDiv.className = 'message-date';
                dateDiv.textContent = today;
                messagesContainer.appendChild(dateDiv);
                
                // Adicionar mensagens à interface
                messages.forEach(message => {
                    addMessageToInterface(message);
                });
            }
            
            // Auto-scroll para o fim
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
            
            console.log(`✅ ${messages.length} mensagens carregadas na interface`);
        }
        
        return messages;
        
    } catch (error) {
        console.error('Erro ao carregar mensagens persistidas:', error);
        
        // Fallback: tentar carregar apenas do localStorage
        try {
            const localMessages = chatManager.loadMessagesFromStorage(category);
            const messagesContainer = document.getElementById('chatMessages');
            
            if (messagesContainer && localMessages.length > 0) {
                messagesContainer.innerHTML = '';
                localMessages.forEach(message => {
                    addMessageToInterface(message);
                });
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            
            return localMessages;
        } catch (fallbackError) {
            console.error('Erro no fallback de carregamento:', fallbackError);
            return [];
        }
    }
};

// Função para obter mensagem de boas-vindas por categoria
function getWelcomeMessage(category) {
    const welcomeMessages = {
        academic: {
            message: 'Olá! Bem-vindo ao suporte acadêmico. Como posso ajudá-lo hoje?',
            senderType: 'admin',
            senderName: 'Maria Silva - Coordenadora Acadêmica',
            timestamp: new Date().toISOString()
        },
        administrative: {
            message: 'Olá! Sou João Santos, responsável pelos processos administrativos. Em que posso ajudá-lo?',
            senderType: 'admin',
            senderName: 'João Santos - Coordenador Administrativo',
            timestamp: new Date().toISOString()
        },
        financial: {
            message: 'Olá! Este é o suporte financeiro. Como posso ajudá-lo com questões financeiras?',
            senderType: 'admin',
            senderName: 'Carlos Lima - Coordenador Financeiro',
            timestamp: new Date().toISOString()
        },
        technical: {
            message: 'Olá! Sou Ana Costa, do suporte técnico. Como posso ajudá-lo?',
            senderType: 'admin',
            senderName: 'Ana Costa - Coordenadora Técnica',
            timestamp: new Date().toISOString()
        },
        general: {
            message: 'Olá! Bem-vindo ao suporte geral. Como posso ajudá-lo?',
            senderType: 'admin',
            senderName: 'Coordenação Geral',
            timestamp: new Date().toISOString()
        }
    };
    
    return welcomeMessages[category] || welcomeMessages.general;
}

// Função para restaurar estado completo do chat
window.restoreChatState = async function() {
    if (!chatManager) return;
    
    console.log('🔄 Restaurando estado completo do chat...');
    
    try {
        // Recuperar categoria atual
        const currentCategory = chatManager.getCurrentCategory();
        
        // Definir categoria no chat manager
        chatManager.setCurrentCategory(currentCategory);
        
        // Carregar mensagens da categoria atual
        await window.loadPersistedMessages(currentCategory);
        
        // Selecionar categoria na interface (se existir)
        const categoryElement = document.querySelector(`[data-category="${currentCategory}"]`);
        if (categoryElement) {
            // Remover active de outras categorias
            document.querySelectorAll('.chat-category').forEach(cat => {
                cat.classList.remove('active');
            });
            // Adicionar active à categoria atual
            categoryElement.classList.add('active');
        }
        
        console.log(`✅ Estado do chat restaurado - Categoria: ${currentCategory}`);
        
    } catch (error) {
        console.error('Erro ao restaurar estado do chat:', error);
    }
}; 