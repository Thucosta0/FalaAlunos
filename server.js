const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configurar CORS para permitir conexões do frontend
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos se executando localmente
app.use(express.static('.'));

// Armazenar mensagens em memória (em produção, use um banco de dados)
let messages = [];
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

// Rota para status do servidor
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        activeUsers: {
            admins: activeUsers.admins.length,
            students: activeUsers.students.length
        },
        totalMessages: messages.length,
        uptime: process.uptime()
    });
});

// Rota para limpar mensagens (apenas para testes)
app.delete('/api/messages', (req, res) => {
    messages = [];
    io.emit('messagesCleared');
    res.json({ message: 'Mensagens limpas' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Chat em tempo real ativo`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Encerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor encerrado');
    });
}); 