const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configurar CORS para permitir conexões do frontend
const io = socketIo(server, {
    cors: {
        origin: function (origin, callback) {
            // Permitir requisições sem origin (apps mobile, etc)
            if (!origin) return callback(null, true);
            
            // Lista de origens permitidas
            const allowedOrigins = [
                'http://localhost:3000',
                'https://falaalunos.onrender.com'
            ];
            
            // Verificar se a origem está na lista ou é um subdomínio permitido
            if (allowedOrigins.includes(origin) || 
                origin.includes('netlify.app') || 
                origin.includes('github.io')) {
                callback(null, true);
            } else {
                console.log('❌ Origem CORS rejeitada:', origin);
                callback(new Error('Não permitido pelo CORS'));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true
});

// Configurar CORS para Express
app.use(cors({
    origin: function (origin, callback) {
        // Permitir requisições sem origin
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'https://falaalunos.onrender.com'
        ];
        
        if (allowedOrigins.includes(origin) || 
            origin.includes('netlify.app') || 
            origin.includes('github.io')) {
            callback(null, true);
        } else {
            console.log('❌ Origem CORS rejeitada:', origin);
            callback(new Error('Não permitido pelo CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// Middleware de log para debugging
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'N/A'}`);
    next();
});

// Servir arquivos estáticos se executando localmente
app.use(express.static('.'));

// Armazenar mensagens em memória (em produção, use um banco de dados)
let messages = [];
let chats = []; // Armazenar chats dinâmicos
let activeUsers = {
    admins: [],
    students: []
};

// Rotas da API
app.get('/api/messages/:category', (req, res) => {
    const { category } = req.params;
    const categoryMessages = messages.filter(msg => msg.category === category);
    res.json(categoryMessages);
});

app.post('/api/messages', (req, res) => {
    const message = {
        id: Date.now(),
        ...req.body,
        timestamp: new Date().toISOString()
    };
    
    messages.push(message);
    
    // Emitir mensagem para todos os clientes conectados
    io.emit('newMessage', message);
    
    res.json(message);
});

// Endpoints para gerenciar chats
app.get('/api/chats', (req, res) => {
    res.json(chats);
});

app.post('/api/chats', (req, res) => {
    const chat = {
        id: Date.now(),
        title: req.body.title,
        category: req.body.category || 'general',
        description: req.body.description,
        createdBy: req.body.createdBy,
        createdByType: req.body.createdByType, // 'admin' ou 'student'
        participants: req.body.participants || [],
        status: 'active',
        priority: req.body.priority || 'medium',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
    };
    
    chats.push(chat);
    
    // Emitir novo chat para todos os clientes
    io.emit('newChat', chat);
    
    res.json(chat);
});

app.get('/api/chats/:chatId', (req, res) => {
    const chatId = parseInt(req.params.chatId);
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) {
        return res.status(404).json({ error: 'Chat não encontrado' });
    }
    
    res.json(chat);
});

app.put('/api/chats/:chatId', (req, res) => {
    const chatId = parseInt(req.params.chatId);
    const chatIndex = chats.findIndex(c => c.id === chatId);
    
    if (chatIndex === -1) {
        return res.status(404).json({ error: 'Chat não encontrado' });
    }
    
    chats[chatIndex] = {
        ...chats[chatIndex],
        ...req.body,
        lastActivity: new Date().toISOString()
    };
    
    // Emitir atualização do chat
    io.emit('chatUpdated', chats[chatIndex]);
    
    res.json(chats[chatIndex]);
});

app.delete('/api/chats/:chatId', (req, res) => {
    const chatId = parseInt(req.params.chatId);
    const chatIndex = chats.findIndex(c => c.id === chatId);
    
    if (chatIndex === -1) {
        return res.status(404).json({ error: 'Chat não encontrado' });
    }
    
    const deletedChat = chats.splice(chatIndex, 1)[0];
    
    // Emitir exclusão do chat
    io.emit('chatDeleted', { chatId: chatId });
    
    res.json({ message: 'Chat excluído com sucesso', chat: deletedChat });
});

// Socket.io - Comunicação em tempo real
io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);

    // Registrar usuário
    socket.on('register', (userData) => {
        socket.userData = userData;
        
        if (userData.type === 'admin') {
            activeUsers.admins.push({
                id: socket.id,
                name: userData.name || 'Administrador',
                timestamp: new Date()
            });
        } else {
            activeUsers.students.push({
                id: socket.id,
                name: userData.name || 'Aluno',
                category: userData.category,
                timestamp: new Date()
            });
        }
        
        // Emitir lista de usuários ativos
        io.emit('activeUsers', activeUsers);
        console.log(`${userData.type} registrado:`, userData.name || socket.id);
    });

    // Receber mensagem
    socket.on('sendMessage', (messageData) => {
        const message = {
            id: Date.now(),
            message: messageData.message,
            category: messageData.category,
            senderType: messageData.senderType,
            senderId: socket.id,
            senderName: socket.userData?.name || 'Usuário',
            timestamp: new Date().toISOString()
        };
        
        messages.push(message);
        
        // Emitir para todos os clientes
        io.emit('newMessage', message);
        
        console.log('Nova mensagem:', message);
    });

    // Aluno digitando
    socket.on('typing', (data) => {
        socket.broadcast.emit('userTyping', {
            userId: socket.id,
            userName: socket.userData?.name || 'Usuário',
            category: data.category,
            isTyping: data.isTyping
        });
    });

    // Marcar mensagens como lidas
    socket.on('markAsRead', (data) => {
        // Implementar lógica de leitura se necessário
        socket.broadcast.emit('messagesRead', {
            userId: socket.id,
            category: data.category
        });
    });

    // Desconexão
    socket.on('disconnect', () => {
        console.log('Usuário desconectado:', socket.id);
        
        // Remover usuário das listas ativas
        activeUsers.admins = activeUsers.admins.filter(user => user.id !== socket.id);
        activeUsers.students = activeUsers.students.filter(user => user.id !== socket.id);
        
        // Emitir lista atualizada
        io.emit('activeUsers', activeUsers);
    });
});

// Rota de health check para o Render
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Rota para status do servidor
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        activeUsers: {
            admins: activeUsers.admins.length,
            students: activeUsers.students.length
        },
        totalMessages: messages.length,
        totalChats: chats.length,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Rota para limpar mensagens (apenas para testes)
app.delete('/api/messages', (req, res) => {
    messages = [];
    io.emit('messagesCleared');
    res.json({ message: 'Mensagens limpas' });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Host: ${HOST}`);
    console.log(`📱 Chat em tempo real ativo`);
    console.log(`🔗 URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Encerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor encerrado');
    });
}); 