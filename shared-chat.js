// ========== SISTEMA DE CHAT COMPARTILHADO ==========
// Este arquivo gerencia a comunicação entre interfaces do aluno e coordenador

class ChatManager {
    constructor() {
        this.userType = sessionStorage.getItem('userProfile') || 'student';
        this.userId = this.generateUserId();
        this.listeners = new Map();
        this.isOnline = true;
        
        // Inicializar sistema
        this.init();
    }

    // Inicializar sistema de chat
    init() {
        // Marcar usuário como online
        this.setUserOnline();
        
        // Configurar sincronização em tempo real
        this.setupRealTimeSync();
        
        // Configurar cleanup ao sair
        this.setupCleanup();
        
        console.log(`Chat Manager iniciado - Tipo: ${this.userType}, ID: ${this.userId}`);
    }

    // Gerar ID único do usuário
    generateUserId() {
        const existing = sessionStorage.getItem('userId');
        if (existing) return existing;
        
        const id = `${this.userType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('userId', id);
        return id;
    }

    // Marcar usuário como online
    setUserOnline() {
        const onlineUsers = this.getOnlineUsers();
        onlineUsers[this.userId] = {
            type: this.userType,
            lastSeen: Date.now(),
            status: 'online'
        };
        localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
    }

    // Obter usuários online
    getOnlineUsers() {
        try {
            return JSON.parse(localStorage.getItem('onlineUsers') || '{}');
        } catch {
            return {};
        }
    }

    // Configurar sincronização em tempo real
    setupRealTimeSync() {
        // Atualizar status a cada 5 segundos
        setInterval(() => {
            if (this.isOnline) {
                this.setUserOnline();
                this.checkForNewMessages();
                this.cleanupOfflineUsers();
            }
        }, 5000);

        // Escutar mudanças no localStorage (mensagens de outras abas/janelas)
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('chat_')) {
                this.handleStorageUpdate(e);
            }
        });
    }

    // Configurar cleanup ao sair
    setupCleanup() {
        const cleanup = () => {
            this.setUserOffline();
        };

        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('unload', cleanup);
        
        // Cleanup periódico de usuários offline
        setInterval(() => {
            this.cleanupOfflineUsers();
        }, 30000);
    }

    // Marcar usuário como offline
    setUserOffline() {
        const onlineUsers = this.getOnlineUsers();
        if (onlineUsers[this.userId]) {
            onlineUsers[this.userId].status = 'offline';
            onlineUsers[this.userId].lastSeen = Date.now();
            localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
        }
        this.isOnline = false;
    }

    // Limpar usuários offline há mais de 2 minutos
    cleanupOfflineUsers() {
        const onlineUsers = this.getOnlineUsers();
        const cutoff = Date.now() - (2 * 60 * 1000); // 2 minutos
        
        Object.keys(onlineUsers).forEach(userId => {
            if (onlineUsers[userId].lastSeen < cutoff) {
                delete onlineUsers[userId];
            }
        });
        
        localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
    }

    // Enviar mensagem
    sendMessage(category, message, recipientType = null) {
        const messageData = {
            id: this.generateMessageId(),
            category: category,
            message: message,
            senderId: this.userId,
            senderType: this.userType,
            recipientType: recipientType,
            timestamp: new Date().toISOString(),
            read: false,
            type: this.userType === 'student' ? 'sent' : 'received'
        };

        // Salvar mensagem
        this.saveMessage(category, messageData);
        
        // Notificar outros usuários
        this.notifyNewMessage(category, messageData);
        
        return messageData;
    }

    // Salvar mensagem no localStorage
    saveMessage(category, messageData) {
        const key = `chat_${category}`;
        let messages = this.getMessages(category);
        messages.push(messageData);
        
        // Manter apenas as últimas 100 mensagens
        if (messages.length > 100) {
            messages = messages.slice(-100);
        }
        
        localStorage.setItem(key, JSON.stringify(messages));
        
        // Atualizar contador de mensagens não lidas
        this.updateUnreadCount(category);
    }

    // Obter mensagens de uma categoria
    getMessages(category) {
        try {
            return JSON.parse(localStorage.getItem(`chat_${category}`) || '[]');
        } catch {
            return [];
        }
    }

    // Marcar mensagens como lidas
    markMessagesAsRead(category, userId = null) {
        const messages = this.getMessages(category);
        let updated = false;
        
        messages.forEach(msg => {
            if (!msg.read && (!userId || msg.senderId === userId)) {
                msg.read = true;
                updated = true;
            }
        });
        
        if (updated) {
            localStorage.setItem(`chat_${category}`, JSON.stringify(messages));
            this.updateUnreadCount(category);
        }
    }

    // Atualizar contador de mensagens não lidas
    updateUnreadCount(category) {
        const messages = this.getMessages(category);
        const unread = messages.filter(msg => 
            !msg.read && 
            msg.senderType !== this.userType
        ).length;
        
        // Salvar contador
        const unreadCounts = this.getUnreadCounts();
        unreadCounts[category] = unread;
        localStorage.setItem('unreadCounts', JSON.stringify(unreadCounts));
        
        // Atualizar interface se houver listener
        if (this.listeners.has('unreadUpdate')) {
            this.listeners.get('unreadUpdate')(category, unread);
        }
    }

    // Obter contadores de mensagens não lidas
    getUnreadCounts() {
        try {
            return JSON.parse(localStorage.getItem('unreadCounts') || '{}');
        } catch {
            return {};
        }
    }

    // Gerar ID único para mensagem
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Notificar nova mensagem
    notifyNewMessage(category, messageData) {
        // Adicionar timestamp da última atividade
        localStorage.setItem(`lastActivity_${category}`, Date.now().toString());
        
        // Disparar evento customizado
        const event = new CustomEvent('newMessage', {
            detail: { category, messageData }
        });
        window.dispatchEvent(event);
    }

    // Verificar novas mensagens
    checkForNewMessages() {
        const categories = ['academic', 'administrative', 'financial', 'technical'];
        
        categories.forEach(category => {
            const lastCheck = parseInt(sessionStorage.getItem(`lastCheck_${category}`) || '0');
            const lastActivity = parseInt(localStorage.getItem(`lastActivity_${category}`) || '0');
            
            if (lastActivity > lastCheck) {
                // Há nova atividade
                sessionStorage.setItem(`lastCheck_${category}`, Date.now().toString());
                
                if (this.listeners.has('newMessage')) {
                    this.listeners.get('newMessage')(category);
                }
            }
        });
    }

    // Manipular atualizações do localStorage
    handleStorageUpdate(e) {
        if (e.key.startsWith('chat_')) {
            const category = e.key.replace('chat_', '');
            
            // Verificar se há mensagens novas
            if (e.newValue !== e.oldValue) {
                this.updateUnreadCount(category);
                
                if (this.listeners.has('messageUpdate')) {
                    this.listeners.get('messageUpdate')(category);
                }
            }
        }
    }

    // Adicionar listener para eventos
    addEventListener(event, callback) {
        this.listeners.set(event, callback);
    }

    // Remover listener
    removeEventListener(event) {
        this.listeners.delete(event);
    }

    // Obter estatísticas do chat
    getChatStats() {
        const categories = ['academic', 'administrative', 'financial', 'technical'];
        const onlineUsers = this.getOnlineUsers();
        
        const stats = {
            totalMessages: 0,
            unreadMessages: 0,
            onlineCoordinators: 0,
            onlineStudents: 0,
            categories: {}
        };
        
        // Contar usuários online
        Object.values(onlineUsers).forEach(user => {
            if (user.status === 'online') {
                if (user.type === 'admin') {
                    stats.onlineCoordinators++;
                } else if (user.type === 'student') {
                    stats.onlineStudents++;
                }
            }
        });
        
        // Contar mensagens por categoria
        categories.forEach(category => {
            const messages = this.getMessages(category);
            const unread = this.getUnreadCounts()[category] || 0;
            
            stats.categories[category] = {
                total: messages.length,
                unread: unread,
                lastActivity: localStorage.getItem(`lastActivity_${category}`)
            };
            
            stats.totalMessages += messages.length;
            stats.unreadMessages += unread;
        });
        
        return stats;
    }

    // Simular resposta automática (para demonstração)
    simulateCoordinatorResponse(category, originalMessage) {
        if (this.userType !== 'student') return;
        
        setTimeout(() => {
            const response = this.generateAutoResponse(originalMessage, category);
            
            const responseData = {
                id: this.generateMessageId(),
                category: category,
                message: response,
                senderId: `coord_${category}`,
                senderType: 'admin',
                recipientType: 'student',
                timestamp: new Date().toISOString(),
                read: false,
                type: 'received'
            };
            
            this.saveMessage(category, responseData);
            this.notifyNewMessage(category, responseData);
            
        }, Math.random() * 4000 + 2000); // 2-6 segundos
    }

    // Gerar resposta automática
    generateAutoResponse(message, category) {
        const responses = {
            academic: {
                default: [
                    'Olá! Recebemos sua dúvida sobre questões acadêmicas. Vou analisar e responder em breve.',
                    'Entendi sua questão. Vou verificar os detalhes em nosso sistema acadêmico.',
                    'Obrigada por entrar em contato. Vou consultar as informações necessárias para ajudá-lo.'
                ],
                matricula: [
                    'Sobre matrícula: O período será de 15 a 20 de dezembro. Instruções detalhadas serão enviadas por email.',
                    'Para a matrícula, acesse o portal acadêmico na data informada com suas credenciais.',
                    'Sua prioridade é baseada no CR. Estudantes com melhor desempenho têm preferência.'
                ],
                notas: [
                    'Suas notas são atualizadas automaticamente após lançamento pelos professores.',
                    'Para contestar uma nota, você tem 5 dias úteis após a publicação.',
                    'Verifique o boletim online para acompanhar suas notas em tempo real.'
                ],
                historico: [
                    'Histórico escolar pode ser solicitado pelo portal. Processamento em até 5 dias úteis.',
                    'Para urgências, compareça na secretaria com RG e comprovante de matrícula.',
                    'O histórico digital ficará disponível em sua área do aluno.'
                ]
            },
            administrative: {
                default: [
                    'Olá! Seu processo administrativo foi recebido. Vou verificar o status para você.',
                    'Obrigado por entrar em contato. Vou analisar seu caso e retornar em breve.',
                    'Recebemos sua solicitação. Estou verificando os procedimentos necessários.'
                ]
            },
            financial: {
                default: [
                    'Olá! Questões financeiras são importantes. Vou verificar sua situação no sistema.',
                    'Recebemos sua dúvida financeira. Aguarde enquanto consulto seu histórico.',
                    'Obrigado pelo contato. Vou analisar sua situação financeira detalhadamente.'
                ]
            },
            technical: {
                default: [
                    'Olá! Problemas técnicos podem ser frustrantes. Vou te ajudar a resolver.',
                    'Recebemos seu problema técnico. Vou diagnosticar a situação.',
                    'Suporte técnico ativo! Vou analisar o problema e fornecer uma solução.'
                ]
            }
        };
        
        const categoryResponses = responses[category] || responses.academic;
        const msgLower = message.toLowerCase();
        
        // Detectar palavras-chave específicas
        if (msgLower.includes('matrícula') || msgLower.includes('matricula')) {
            return categoryResponses.matricula?.[0] || categoryResponses.default[0];
        }
        if (msgLower.includes('nota') || msgLower.includes('prova') || msgLower.includes('boletim')) {
            return categoryResponses.notas?.[0] || categoryResponses.default[0];
        }
        if (msgLower.includes('histórico') || msgLower.includes('historico')) {
            return categoryResponses.historico?.[0] || categoryResponses.default[0];
        }
        
        // Resposta padrão aleatória
        const defaultResponses = categoryResponses.default;
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    // Limpar dados do chat (para desenvolvimento)
    clearAllData() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('chat_') || 
                key.startsWith('lastActivity_') || 
                key === 'onlineUsers' || 
                key === 'unreadCounts') {
                localStorage.removeItem(key);
            }
        });
        console.log('Dados do chat limpos');
    }

    // Exportar dados do chat
    exportChatData() {
        const categories = ['academic', 'administrative', 'financial', 'technical'];
        const data = {
            timestamp: new Date().toISOString(),
            stats: this.getChatStats(),
            messages: {}
        };
        
        categories.forEach(category => {
            data.messages[category] = this.getMessages(category);
        });
        
        return data;
    }

    // Status de conexão
    getConnectionStatus() {
        return {
            isOnline: this.isOnline,
            userId: this.userId,
            userType: this.userType,
            lastSeen: Date.now(),
            stats: this.getChatStats()
        };
    }
}

// Instância global do gerenciador de chat
let chatManager = null;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Só inicializar se estivermos numa página que precisa do chat
    const userProfile = sessionStorage.getItem('userProfile');
    if (userProfile && (userProfile === 'student' || userProfile === 'admin')) {
        chatManager = new ChatManager();
        
        // Expor globalmente para debug
        window.chatManager = chatManager;
        
        console.log('Sistema de chat inicializado:', chatManager.getConnectionStatus());
    }
});

// Função auxiliar para debug
function debugChat() {
    if (chatManager) {
        console.log('=== DEBUG DO CHAT ===');
        console.log('Status:', chatManager.getConnectionStatus());
        console.log('Estatísticas:', chatManager.getChatStats());
        console.log('Usuários online:', chatManager.getOnlineUsers());
        console.log('Mensagens não lidas:', chatManager.getUnreadCounts());
    } else {
        console.log('Chat manager não inicializado');
    }
}

// Expor função de debug globalmente
window.debugChat = debugChat; 