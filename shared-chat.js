// ========== SISTEMA DE CHAT EM TEMPO REAL ==========
// Este arquivo gerencia a comunicação entre interfaces do aluno e coordenador

class RealTimeChatManager {
    constructor() {
        this.userType = sessionStorage.getItem('userProfile') || 'student';
        this.userId = this.generateUserId();
        this.userName = this.getUserName();
        this.currentCategory = 'academic';
        this.socket = null;
        this.isConnected = false;
        this.messageListeners = [];
        
        // URL do servidor (configurar conforme ambiente)
        this.serverUrl = this.getServerUrl();
        
        this.init();
    }

    // Inicializar conexão
    async init() {
        try {
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
        this.socket = io(this.serverUrl, {
            transports: ['websocket', 'polling']
        });

        // Eventos de conexão
        this.socket.on('connect', () => {
            console.log('✅ Conectado ao servidor de chat');
            this.isConnected = true;
            this.registerUser();
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Desconectado do servidor de chat');
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Erro de conexão:', error);
            this.showError('Falha na conexão com o servidor');
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

    // Manipular nova mensagem
    handleNewMessage(message) {
        console.log('Nova mensagem recebida:', message);
        
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

        // Atualizar interface
        this.updateChatInterface(message);
    }

    // Manipular indicador de digitação
    handleTypingIndicator(data) {
        if (data.category === this.currentCategory && data.userId !== this.socket.id) {
            this.showTypingIndicator(data);
        }
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
    }

    // Determinar URL do servidor baseado no ambiente
    getServerUrl() {
        const hostname = window.location.hostname;
        
        // Ambiente local
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        
        // Netlify ou outros hosts de produção
        if (hostname.includes('netlify.app') || hostname.includes('netlify.com')) {
            return 'https://fala-alunos-server.onrender.com';
        }
        
        // GitHub Pages
        if (hostname.includes('github.io')) {
            return 'https://fala-alunos-server.onrender.com';
        }
        
        // Outros domínios personalizados
        return 'https://fala-alunos-server.onrender.com';
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