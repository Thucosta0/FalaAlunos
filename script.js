// Dados globais
let users = [
    { id: 1, name: 'Lucas Toledo', email: 'lucas.toledo@falaalunos.com', role: 'director' },
    { id: 2, name: 'Maria Silva', email: 'maria.silva@falaalunos.com', role: 'coordinator' },
    { id: 3, name: 'João Santos', email: 'joao.santos@falaalunos.com', role: 'teacher' },
    { id: 4, name: 'Ana Costa', email: 'ana.costa@falaalunos.com', role: 'teacher' }
];

let tasks = [];
let currentEditingUser = null;
let currentTaskColumn = null;

// Dados do chat - Array vazio para que usuários criem seus próprios chats
let chats = [];

let currentChatId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeCharts();
    initializeDragAndDrop();
    initializeSearch();
    initializeModals();
    updateTaskCounts();
    initializeChat();
    initializeEditTaskModal();
    initializeOrganogram(); // Adicionar inicialização do organograma
});

// Navegação
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    // Navegação entre seções
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class de todos os links
            navLinks.forEach(l => l.classList.remove('active'));
            // Adiciona active class ao link clicado
            link.classList.add('active');
            
            // Esconde todas as seções
            sections.forEach(section => section.classList.remove('active'));
            
            // Mostra a seção correspondente
            const targetSection = link.getAttribute('data-section');
            document.getElementById(targetSection).classList.add('active');
            
            // Fecha menu mobile se estiver aberto
            navMenu.classList.remove('active');
        });
    });

    // Menu mobile toggle
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Fecha menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    });
}

// Gráficos
function initializeCharts() {
    // Gráfico de Performance no Dashboard
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    new Chart(performanceCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{
                label: 'Performance',
                data: [65, 59, 80, 81, 56, 85],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            }
        }
    });

    // Gráfico de Barras nas Métricas
    const barCtx = document.getElementById('barChart').getContext('2d');
    new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
                label: 'Vendas',
                data: [12, 19, 15, 22],
                backgroundColor: ['#667eea', '#764ba2', '#667eea', '#764ba2']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Gráfico de Linhas nas Métricas
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'],
            datasets: [{
                label: 'Evolução',
                data: [10, 15, 13, 17, 20],
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // Gráfico de Comparação nas Métricas
    const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
    new Chart(comparisonCtx, {
        type: 'bar',
        data: {
            labels: ['Cat A', 'Cat B', 'Cat C', 'Cat D'],
            datasets: [
                {
                    label: '2023',
                    data: [8, 12, 6, 14],
                    backgroundColor: '#3498db'
                },
                {
                    label: '2024',
                    data: [10, 15, 8, 16],
                    backgroundColor: '#27ae60'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Drag and Drop para Kanban
function initializeDragAndDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.column-content');

    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });

    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.setData('text/html', this.outerHTML);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    const draggedCard = document.querySelector('.dragging');
    if (draggedCard) {
        this.appendChild(draggedCard);
        draggedCard.classList.remove('dragging');
        updateTaskCounts();
    }
}

// Busca de usuários
function initializeSearch() {
    const searchInput = document.getElementById('userSearch');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const userCards = document.querySelectorAll('.user-card');
        
        userCards.forEach(card => {
            const userName = card.querySelector('h4').textContent.toLowerCase();
            const userEmail = card.querySelector('p').textContent.toLowerCase();
            
            if (userName.includes(searchTerm) || userEmail.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Modais
function initializeModals() {
    // Fechar modais ao clicar fora
    window.addEventListener('click', function(e) {
        const userModal = document.getElementById('userModal');
        const taskModal = document.getElementById('taskModal');
        
        if (e.target === userModal) {
            closeUserModal();
        }
        if (e.target === taskModal) {
            closeTaskModal();
        }
    });

    // Form de usuário
    document.getElementById('userForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveUser();
    });

    // Form de tarefa
    document.getElementById('taskForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveTask();
    });
}

// Funções de usuários
function openUserModal(userId = null) {
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('userForm');
    
    if (userId) {
        // Editar usuário
        const user = users.find(u => u.id === userId);
        modalTitle.textContent = 'Editar Usuário';
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userRole').value = user.role;
        currentEditingUser = userId;
    } else {
        // Novo usuário
        modalTitle.textContent = 'Adicionar Usuário';
        form.reset();
        currentEditingUser = null;
    }
    
    modal.style.display = 'block';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    currentEditingUser = null;
}

function saveUser() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const role = document.getElementById('userRole').value;
    
    if (currentEditingUser) {
        // Editar usuário existente
        const userIndex = users.findIndex(u => u.id === currentEditingUser);
        users[userIndex] = { ...users[userIndex], name, email, role };
    } else {
        // Adicionar novo usuário
        const newUser = {
            id: users.length + 1,
            name,
            email,
            role
        };
        users.push(newUser);
    }
    
    renderUsers();
    closeUserModal();
    showNotification('Usuário salvo com sucesso!');
}

function editUser(userId) {
    openUserModal(userId);
}

function deleteUser(userId) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        users = users.filter(u => u.id !== userId);
        renderUsers();
        showNotification('Usuário excluído com sucesso!');
    }
}

function renderUsers() {
    const usersGrid = document.querySelector('.users-grid');
    usersGrid.innerHTML = '';
    
    users.forEach(user => {
        const userCard = createUserCard(user);
        usersGrid.appendChild(userCard);
    });
}

function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    
    const roleNames = {
        director: 'Diretor',
        coordinator: 'Coordenador',
        teacher: 'Professor',
        student: 'Aluno'
    };
    
    card.innerHTML = `
        <div class="user-avatar">
            <i class="fas fa-user${user.role === 'director' ? '-tie' : ''}"></i>
        </div>
        <div class="user-info">
            <h4>${user.name}</h4>
            <span class="user-role ${user.role}">${roleNames[user.role]}</span>
            <p>${user.email}</p>
        </div>
        <div class="user-actions">
            <button class="btn-icon" onclick="editUser(${user.id})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" onclick="deleteUser(${user.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return card;
}

// Funções de tarefas
function addTask(column) {
    currentTaskColumn = column;
    document.getElementById('taskModal').style.display = 'block';
}

function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    currentTaskColumn = null;
}

function saveTask() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const priority = document.getElementById('taskPriority').value;
    const date = document.getElementById('taskDate').value;
    const assignee = document.getElementById('taskAssignee').value;
    
    const taskCard = createTaskCard(title, description, priority, date, assignee);
    const column = document.getElementById(`${currentTaskColumn}-column`);
    column.appendChild(taskCard);
    
    // Reinicializar drag and drop para o novo card
    taskCard.addEventListener('dragstart', handleDragStart);
    taskCard.addEventListener('dragend', handleDragEnd);
    
    updateTaskCounts();
    closeTaskModal();
    showNotification('Tarefa adicionada com sucesso!');
}

function createTaskCard(title, description, priority, date, assignee) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    
    // Formatar data
    const formattedDate = new Date(date).toLocaleDateString('pt-BR');
    
    card.innerHTML = `
        <div class="card-priority ${priority}"></div>
        <div class="card-header">
            <h4>${title}</h4>
            <div class="card-actions">
                <button class="btn-action complete" onclick="completeTask(this)" title="Marcar como concluída">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-action edit" onclick="editTask(this)" title="Editar tarefa">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" onclick="deleteTask(this)" title="Excluir tarefa">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <p>${description}</p>
        <div class="card-footer">
            <span class="card-date">${formattedDate}</span>
            <div class="card-avatar">${assignee}</div>
        </div>
    `;
    
    return card;
}

function updateTaskCounts() {
    const columns = ['todo', 'doing', 'review', 'done'];
    
    columns.forEach(column => {
        const columnElement = document.getElementById(`${column}-column`);
        const taskCount = columnElement.querySelectorAll('.kanban-card').length;
        const countElement = columnElement.parentElement.querySelector('.task-count');
        countElement.textContent = taskCount;
    });
}

// Notificações
function showNotification(message) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Estilos da notificação
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;
    
    // Adicionar animação CSS
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Funções utilitárias
function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR');
}

function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// Dados de exemplo para demonstração
function loadSampleData() {
    // Adicionar algumas tarefas de exemplo se não houver nenhuma
    const todoColumn = document.getElementById('todo-column');
    const doingColumn = document.getElementById('doing-column');
    const reviewColumn = document.getElementById('review-column');
    const doneColumn = document.getElementById('done-column');
    
    // Verificar se já existem tarefas
    if (todoColumn.children.length === 0) {
        // Adicionar tarefas de exemplo
        console.log('Dados de exemplo carregados');
    }
}

// Atualizar contadores na inicialização
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        updateTaskCounts();
    }, 100);
});

// Função para atualizar métricas em tempo real
function updateMetrics() {
    // Simular dados em tempo real
    const statNumbers = document.querySelectorAll('.stat-number');
    
    setInterval(() => {
        statNumbers.forEach(stat => {
            if (stat.textContent.includes('%')) {
                const currentValue = parseInt(stat.textContent);
                const newValue = Math.max(0, Math.min(100, currentValue + Math.floor(Math.random() * 3) - 1));
                stat.textContent = newValue + '%';
            } else {
                const currentValue = parseInt(stat.textContent);
                const newValue = Math.max(0, currentValue + Math.floor(Math.random() * 3) - 1);
                stat.textContent = newValue;
            }
        });
    }, 5000); // Atualizar a cada 5 segundos
}

// Inicializar métricas em tempo real
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updateMetrics, 2000);
});

// Função para exportar dados
function exportData() {
    const data = {
        users: users,
        tasks: tasks,
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'fala-alunos-data.json';
    link.click();
}

// Função para importar dados
function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                users = data.users || users;
                tasks = data.tasks || tasks;
                renderUsers();
                showNotification('Dados importados com sucesso!');
            } catch (error) {
                showNotification('Erro ao importar dados!');
            }
        };
        reader.readAsText(file);
    }
}

// Adicionar funcionalidade de teclado
document.addEventListener('keydown', function(e) {
    // ESC para fechar modais
    if (e.key === 'Escape') {
        closeUserModal();
        closeTaskModal();
    }
    
    // Ctrl+S para salvar (prevenir comportamento padrão)
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        showNotification('Use os botões de salvar nos formulários!');
    }
});

// Função para modo escuro (opcional)
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Carregar preferência de modo escuro
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});

// Função para redimensionar gráficos
window.addEventListener('resize', function() {
    // Os gráficos Chart.js são responsivos por padrão
    // Esta função pode ser usada para ajustes adicionais se necessário
});

// Função para validação de formulários
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = '#e74c3c';
            isValid = false;
        } else {
            input.style.borderColor = '#dee2e6';
        }
    });
    
    return isValid;
}

// Adicionar validação aos formulários
document.getElementById('userForm').addEventListener('submit', function(e) {
    if (!validateForm('userForm')) {
        e.preventDefault();
        showNotification('Por favor, preencha todos os campos obrigatórios!');
    }
});

document.getElementById('taskForm').addEventListener('submit', function(e) {
    if (!validateForm('taskForm')) {
        e.preventDefault();
        showNotification('Por favor, preencha todos os campos obrigatórios!');
    }
});

// Função para backup automático
function autoBackup() {
    setInterval(() => {
        const data = {
            users: users,
            tasks: tasks,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('fala-alunos-backup', JSON.stringify(data));
    }, 60000); // Backup a cada minuto
}

// Inicializar backup automático
document.addEventListener('DOMContentLoaded', function() {
    autoBackup();
    
    // Restaurar backup se disponível
    const backup = localStorage.getItem('fala-alunos-backup');
    if (backup) {
        try {
            const data = JSON.parse(backup);
            // Verificar se o backup é recente (últimas 24 horas)
            const backupTime = new Date(data.timestamp);
            const now = new Date();
            const hoursDiff = (now - backupTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                users = data.users || users;
                tasks = data.tasks || tasks;
                renderUsers();
            }
        } catch (error) {
            console.log('Erro ao restaurar backup:', error);
        }
    }
});

// Função para inicializar o chat
function initializeChat() {
    initializeChatEvents();
    renderChatList();
    
    // Só carregar chat se houver chats disponíveis e currentChatId for válido
    if (chats.length > 0 && currentChatId && chats.find(c => c.id === currentChatId)) {
        loadChat(currentChatId);
    } else {
        // Mostrar estado inicial vazio
        showEmptyChatState();
    }
}

// Mostrar estado vazio no chat principal
function showEmptyChatState() {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: #6c757d; padding: 2rem;">
                <i class="fas fa-comments" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <h3 style="margin-bottom: 0.5rem; color: #2c3e50;">Nenhuma conversa selecionada</h3>
                <p style="margin-bottom: 1rem;">Selecione um chat na barra lateral ou aguarde que um aluno inicie uma conversa.</p>
                <p style="font-size: 0.9rem; color: #adb5bd;">Os chats criados pelos alunos aparecerão na lista ao lado.</p>
            </div>
        `;
    }
    
    // Atualizar header para estado vazio
    const contactInfo = document.querySelector('.chat-contact-info');
    if (contactInfo) {
        contactInfo.innerHTML = `
            <div class="contact-avatar">
                <i class="fas fa-comments"></i>
            </div>
            <div class="contact-details">
                <h4>Sistema de Chat</h4>
                <span class="contact-status">
                    <i class="fas fa-circle online"></i> Sistema online - Aguardando conversas
                </span>
            </div>
        `;
    }
}

// Eventos do chat
function initializeChatEvents() {
    // Filtro de conversas
    document.getElementById('chatFilter').addEventListener('change', function() {
        filterChats(this.value);
    });

    // Event listeners para modais
    document.getElementById('newChatForm').addEventListener('submit', function(e) {
        e.preventDefault();
        createNewChat();
    });

    document.getElementById('suggestionsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitSuggestion();
    });

    document.getElementById('ratingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitRating();
    });

    // Eventos de avaliação por estrelas
    const stars = document.querySelectorAll('.rating-stars i');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            setRating(rating);
        });
        
        star.addEventListener('mouseenter', function() {
            const rating = this.getAttribute('data-rating');
            highlightStars(rating);
        });
    });

    document.querySelector('.rating-stars').addEventListener('mouseleave', function() {
        const currentRating = document.getElementById('ratingValue').value;
        highlightStars(currentRating);
    });
}

// Renderizar lista de conversas
function renderChatList() {
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = '';

    if (chats.length === 0) {
        // Mostrar estado vazio
        chatList.innerHTML = `
            <div class="empty-chat-state" style="text-align: center; padding: 2rem; color: #6c757d;">
                <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <h4 style="margin-bottom: 0.5rem; color: #2c3e50;">Nenhum chat ativo</h4>
                <p style="font-size: 0.9rem; margin-bottom: 1rem;">Os chats criados pelos alunos aparecerão aqui.</p>
                <p style="font-size: 0.8rem; color: #adb5bd;">Aguarde que um aluno inicie uma conversa ou use o botão "Novo Chat" acima.</p>
            </div>
        `;
    } else {
        chats.forEach(chat => {
            const chatItem = createChatItem(chat);
            chatList.appendChild(chatItem);
        });
    }
}

// Criar item da lista de conversa
function createChatItem(chat) {
    const div = document.createElement('div');
    div.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
    div.setAttribute('data-chat-id', chat.id);
    
    const iconMap = {
        academic: 'fa-graduation-cap',
        administrative: 'fa-file-alt',
        suggestions: 'fa-lightbulb',
        financial: 'fa-dollar-sign',
        technical: 'fa-cog',
        general: 'fa-info-circle'
    };

    const timeStr = formatChatTime(chat.timestamp);

    div.innerHTML = `
        <div class="chat-avatar">
            <i class="fas ${iconMap[chat.category] || 'fa-comments'}"></i>
        </div>
        <div class="chat-info">
            <h4>${chat.title}</h4>
            <p>${chat.lastMessage}</p>
            <small>${timeStr}</small>
        </div>
        <div class="chat-status ${chat.status}"></div>
    `;

    div.addEventListener('click', () => {
        selectChat(chat.id);
    });

    return div;
}

// Selecionar conversa
function selectChat(chatId) {
    // Remover active de todos os itens
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Adicionar active ao item selecionado
    document.querySelector(`[data-chat-id="${chatId}"]`).classList.add('active');
    
    currentChatId = chatId;
    loadChat(chatId);
}

// Carregar conversa
function loadChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    // Atualizar header do chat
    updateChatHeader(chat);
    
    // Carregar mensagens
    loadMessages(chat);
}

// Atualizar header do chat
function updateChatHeader(chat) {
    const iconMap = {
        academic: 'fa-graduation-cap',
        administrative: 'fa-file-alt',
        suggestions: 'fa-lightbulb',
        financial: 'fa-dollar-sign',
        technical: 'fa-cog',
        general: 'fa-info-circle'
    };

    document.querySelector('.contact-avatar i').className = `fas ${iconMap[chat.category]}`;
    document.querySelector('.contact-details h4').textContent = chat.title;
    document.querySelector('.contact-status').innerHTML = `
        <i class="fas fa-circle ${chat.status}"></i> 
        ${chat.status === 'online' ? 'Online' : 'Ausente'} - ${chat.coordinator}
    `;
}

// Carregar mensagens
function loadMessages(chat) {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '<div class="message-date">Hoje</div>';

    if (chat.messages) {
        // Agrupar mensagens consecutivas
        const groupedMessages = groupConsecutiveMessages(chat.messages);
        
        groupedMessages.forEach(message => {
            const messageElement = createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });
    }

    // Scroll para o final
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Agrupar mensagens consecutivas do mesmo tipo
function groupConsecutiveMessages(messages) {
    if (!messages || messages.length === 0) return [];

    const grouped = [];
    let currentGroup = [];
    let currentType = null;

    messages.forEach((message, index) => {
        if (message.type !== currentType) {
            // Finalizar grupo anterior
            if (currentGroup.length > 0) {
                markGroupPositions(currentGroup);
                grouped.push(...currentGroup);
            }
            // Iniciar novo grupo
            currentGroup = [message];
            currentType = message.type;
        } else {
            // Adicionar ao grupo atual
            currentGroup.push(message);
        }

        // Se for a última mensagem, finalizar o grupo
        if (index === messages.length - 1) {
            markGroupPositions(currentGroup);
            grouped.push(...currentGroup);
        }
    });

    return grouped;
}

// Marcar posições dentro do grupo (primeira, meio, última)
function markGroupPositions(group) {
    group.forEach((message, index) => {
        if (group.length === 1) {
            message.groupPosition = 'single';
        } else if (index === 0) {
            message.groupPosition = 'first';
        } else if (index === group.length - 1) {
            message.groupPosition = 'last';
        } else {
            message.groupPosition = 'middle';
        }
    });
}

// Criar elemento de mensagem
function createMessageElement(message) {
    const div = document.createElement('div');
    
    // Aplicar classes de agrupamento
    let groupClass = '';
    if (message.groupPosition === 'single') {
        groupClass = 'first-in-group last-in-group';
    } else if (message.groupPosition === 'first') {
        groupClass = 'first-in-group';
    } else if (message.groupPosition === 'last') {
        groupClass = 'last-in-group';
    } else if (message.groupPosition === 'middle') {
        groupClass = 'middle-in-group';
    }
    
    div.className = `message ${message.type} ${groupClass}`;

    const timeStr = formatMessageTime(message.timestamp);

    if (message.type === 'received') {
        div.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">${message.message}</div>
                <div class="message-time">${timeStr}</div>
            </div>
        `;
    } else {
        div.innerHTML = `
            <div class="message-content">
                <div class="message-bubble">${message.message}</div>
                <div class="message-time">${timeStr}</div>
            </div>
        `;
    }

    return div;
}

// Enviar mensagem
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Adicionar mensagem enviada
    const newMessage = {
        id: Date.now(),
        type: 'sent',
        message: message,
        timestamp: new Date(),
        sender: 'Você'
    };

    addMessageToChat(currentChatId, newMessage);
    input.value = '';

    // Simular resposta automática após 2 segundos
    setTimeout(() => {
        simulateResponse();
    }, 2000);
}

// Adicionar mensagem ao chat
function addMessageToChat(chatId, message) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    if (!chat.messages) chat.messages = [];
    chat.messages.push(message);

    // Atualizar última mensagem
    chat.lastMessage = message.message;
    chat.timestamp = message.timestamp;

    // Atualizar UI
    const messageElement = createMessageElement(message);
    document.getElementById('chatMessages').appendChild(messageElement);
    
    // Scroll para o final
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Atualizar lista de conversas
    renderChatList();
}

// Simular resposta automática
function simulateResponse() {
    const responses = [
        'Entendi sua dúvida. Vou te ajudar com isso.',
        'Perfeito! Deixe-me verificar essas informações para você.',
        'Essa é uma ótima pergunta. Vou buscar os detalhes.',
        'Claro! Posso te orientar sobre esse processo.',
        'Vou verificar seu caso específico e te responder em instantes.'
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const responseMessage = {
        id: Date.now(),
        type: 'received',
        message: randomResponse,
        timestamp: new Date(),
        sender: getCurrentCoordinator()
    };

    addMessageToChat(currentChatId, responseMessage);
}

// Obter coordenador atual
function getCurrentCoordinator() {
    const chat = chats.find(c => c.id === currentChatId);
    return chat ? chat.coordinator : 'Coordenador';
}

// Manipular Enter no input
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Toggle respostas rápidas
function toggleQuickResponses() {
    const quickResponses = document.getElementById('quickResponses');
    quickResponses.classList.toggle('active');
}

// Inserir resposta rápida
function insertQuickResponse(text) {
    document.getElementById('messageInput').value = text;
    document.getElementById('quickResponses').classList.remove('active');
}

// Toggle informações do chat
function toggleChatInfo() {
    const infoPanel = document.getElementById('chatInfoPanel');
    infoPanel.classList.toggle('active');
}

// Filtrar conversas
function filterChats(category) {
    const filteredChats = category === 'all' ? chats : chats.filter(chat => chat.category === category);
    
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = '';
    
    filteredChats.forEach(chat => {
        const chatItem = createChatItem(chat);
        chatList.appendChild(chatItem);
    });
}

// Iniciar nova conversa
function startNewChat() {
    document.getElementById('newChatModal').style.display = 'block';
}

function closeNewChatModal() {
    document.getElementById('newChatModal').style.display = 'none';
    document.getElementById('newChatForm').reset();
}

function createNewChat() {
    const category = document.getElementById('chatCategory').value;
    const subject = document.getElementById('chatSubject').value;
    const message = document.getElementById('chatMessage').value;
    const priority = document.getElementById('chatPriority').value;

    const categoryNames = {
        academic: 'Suporte Acadêmico',
        administrative: 'Processos Administrativos',
        financial: 'Questões Financeiras',
        technical: 'Suporte Técnico',
        general: 'Informações Gerais'
    };

    const coordinators = {
        academic: 'Maria Silva',
        administrative: 'João Santos',
        financial: 'Carlos Lima',
        technical: 'Ana Costa',
        general: 'Pedro Oliveira'
    };

    const newChat = {
        id: chats.length + 1,
        title: categoryNames[category],
        category: category,
        coordinator: coordinators[category],
        status: 'online',
        lastMessage: subject,
        timestamp: new Date(),
        messages: [
            {
                id: 1,
                type: 'sent',
                message: message,
                timestamp: new Date(),
                sender: 'Você'
            }
        ]
    };

    chats.unshift(newChat);
    renderChatList();
    selectChat(newChat.id);
    closeNewChatModal();
    showNotification('Nova conversa iniciada com sucesso!');

    // Simular resposta inicial
    setTimeout(() => {
        const welcomeMessage = {
            id: 2,
            type: 'received',
            message: `Olá! Recebemos sua solicitação sobre "${subject}". Vou analisar e te responder em instantes.`,
            timestamp: new Date(),
            sender: coordinators[category]
        };
        addMessageToChat(newChat.id, welcomeMessage);
    }, 3000);
}

// Abrir modal de sugestões
function openSuggestionsModal() {
    document.getElementById('suggestionsModal').style.display = 'block';
}

function closeSuggestionsModal() {
    document.getElementById('suggestionsModal').style.display = 'none';
    document.getElementById('suggestionsForm').reset();
}

function submitSuggestion() {
    const type = document.getElementById('suggestionType').value;
    const title = document.getElementById('suggestionTitle').value;
    const description = document.getElementById('suggestionDescription').value;
    const benefit = document.getElementById('suggestionBenefit').value;

    // Simular envio da sugestão
    closeSuggestionsModal();
    showNotification('Sugestão enviada com sucesso! Agradecemos seu feedback.');

    // Adicionar à conversa de sugestões se existir
    const suggestionsChat = chats.find(c => c.category === 'suggestions');
    if (suggestionsChat) {
        const suggestionMessage = {
            id: Date.now(),
            type: 'sent',
            message: `Nova sugestão: ${title}\n\n${description}`,
            timestamp: new Date(),
            sender: 'Você'
        };
        addMessageToChat(suggestionsChat.id, suggestionMessage);
    }
}

// Avaliar atendimento
function rateChat() {
    document.getElementById('ratingModal').style.display = 'block';
}

function closeRatingModal() {
    document.getElementById('ratingModal').style.display = 'none';
    document.getElementById('ratingForm').reset();
    // Resetar estrelas
    document.querySelectorAll('.rating-stars i').forEach(star => {
        star.classList.remove('active');
    });
    document.getElementById('ratingValue').value = '';
}

function setRating(rating) {
    document.getElementById('ratingValue').value = rating;
    highlightStars(rating);
}

function highlightStars(rating) {
    document.querySelectorAll('.rating-stars i').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function submitRating() {
    const rating = document.getElementById('ratingValue').value;
    const comment = document.getElementById('ratingComment').value;

    if (!rating) {
        showNotification('Por favor, selecione uma avaliação!');
        return;
    }

    closeRatingModal();
    showNotification('Obrigado por sua avaliação! Ela nos ajuda a melhorar nosso atendimento.');
}

// Solicitar retorno
function requestCallback() {
    showNotification('Solicitação de retorno enviada! Entraremos em contato em breve.');
}

// Escalar para supervisor
function escalateChat() {
    showNotification('Sua conversa foi encaminhada para um supervisor. Aguarde o contato.');
}

// Anexar arquivo (simulado)
function attachFile() {
    showNotification('Funcionalidade de anexo será implementada em breve.');
}

// Formatadores de tempo
function formatChatTime(date) {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return date.toLocaleDateString('pt-BR');
}

function formatMessageTime(date) {
    return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// ========== FUNCIONALIDADES DO KANBAN ==========

let currentEditingTask = null;

// Completar tarefa - move para a coluna "Concluído"
function completeTask(button) {
    const card = button.closest('.kanban-card');
    const doneColumn = document.getElementById('done-column');
    
    // Atualizar botões para tarefa concluída
    const cardActions = card.querySelector('.card-actions');
    cardActions.innerHTML = `
        <button class="btn-action reopen" onclick="reopenTask(this)" title="Reabrir tarefa">
            <i class="fas fa-undo"></i>
        </button>
        <button class="btn-action edit" onclick="editTask(this)" title="Editar tarefa">
            <i class="fas fa-edit"></i>
        </button>
        <button class="btn-action delete" onclick="deleteTask(this)" title="Excluir tarefa">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // Mover para coluna concluído
    doneColumn.appendChild(card);
    updateTaskCounts();
    showNotification('Tarefa marcada como concluída!');
    
    // Adicionar animação de sucesso
    card.style.transform = 'scale(1.05)';
    setTimeout(() => {
        card.style.transform = 'scale(1)';
    }, 200);
}

// Reabrir tarefa - move para a coluna "A Fazer"
function reopenTask(button) {
    const card = button.closest('.kanban-card');
    const todoColumn = document.getElementById('todo-column');
    
    // Atualizar botões para tarefa reaberta
    const cardActions = card.querySelector('.card-actions');
    cardActions.innerHTML = `
        <button class="btn-action complete" onclick="completeTask(this)" title="Marcar como concluída">
            <i class="fas fa-check"></i>
        </button>
        <button class="btn-action edit" onclick="editTask(this)" title="Editar tarefa">
            <i class="fas fa-edit"></i>
        </button>
        <button class="btn-action delete" onclick="deleteTask(this)" title="Excluir tarefa">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // Mover para coluna A Fazer
    todoColumn.appendChild(card);
    updateTaskCounts();
    showNotification('Tarefa reaberta!');
}

// Excluir tarefa
function deleteTask(button) {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        const card = button.closest('.kanban-card');
        card.style.animation = 'fadeOut 0.3s ease';
        
        setTimeout(() => {
            card.remove();
            updateTaskCounts();
            showNotification('Tarefa excluída com sucesso!');
        }, 300);
    }
}

// Editar tarefa
function editTask(button) {
    const card = button.closest('.kanban-card');
    currentEditingTask = card;
    
    // Preencher modal com dados atuais
    const title = card.querySelector('h4').textContent;
    const description = card.querySelector('p').textContent;
    const priority = card.querySelector('.card-priority').classList.contains('high') ? 'high' : 
                    card.querySelector('.card-priority').classList.contains('medium') ? 'medium' : 'low';
    const dateText = card.querySelector('.card-date').textContent;
    const assignee = card.querySelector('.card-avatar').textContent;
    
    document.getElementById('editTaskTitle').value = title;
    document.getElementById('editTaskDescription').value = description;
    document.getElementById('editTaskPriority').value = priority;
    document.getElementById('editTaskAssignee').value = assignee;
    
    // Converter data do formato brasileiro para input date
    const dateParts = dateText.split('/');
    if (dateParts.length === 3) {
        const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
        document.getElementById('editTaskDate').value = formattedDate;
    }
    
    document.getElementById('editTaskModal').style.display = 'block';
}

// Fechar modal de edição
function closeEditTaskModal() {
    document.getElementById('editTaskModal').style.display = 'none';
    currentEditingTask = null;
}

// Salvar alterações da tarefa
function saveEditTask() {
    if (!currentEditingTask) return;
    
    const title = document.getElementById('editTaskTitle').value;
    const description = document.getElementById('editTaskDescription').value;
    const priority = document.getElementById('editTaskPriority').value;
    const date = document.getElementById('editTaskDate').value;
    const assignee = document.getElementById('editTaskAssignee').value;
    
    // Atualizar dados na card
    currentEditingTask.querySelector('h4').textContent = title;
    currentEditingTask.querySelector('p').textContent = description;
    currentEditingTask.querySelector('.card-avatar').textContent = assignee;
    
    // Atualizar prioridade
    const priorityDiv = currentEditingTask.querySelector('.card-priority');
    priorityDiv.className = `card-priority ${priority}`;
    
    // Atualizar data
    const formattedDate = new Date(date).toLocaleDateString('pt-BR');
    currentEditingTask.querySelector('.card-date').textContent = formattedDate;
    
    closeEditTaskModal();
    showNotification('Tarefa atualizada com sucesso!');
}

// Inicializar eventos do modal de edição
function initializeEditTaskModal() {
    // Event listener para o formulário de edição
    document.getElementById('editTaskForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEditTask();
    });
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', function(e) {
        const editTaskModal = document.getElementById('editTaskModal');
        if (e.target === editTaskModal) {
            closeEditTaskModal();
        }
    });
}

// ========== FUNCIONALIDADES ADMINISTRATIVAS DO CHAT ==========

// Inicializar chat administrativo
function initializeAdminChat() {
    console.log('🎯 Inicializando chat administrativo...');
    
    if (sessionStorage.getItem('userProfile') !== 'admin') {
        console.log('❌ Usuário não é admin');
        return;
    }
    
    // Aguardar RealTimeChatManager estar disponível
    const waitForChatManager = setInterval(() => {
        if (window.RealTimeChatManager) {
            clearInterval(waitForChatManager);
            
            console.log('✅ RealTimeChatManager encontrado, inicializando...');
            
            // Certificar que o sessionStorage tem o tipo correto
            sessionStorage.setItem('userProfile', 'admin');
            
            // Inicializar o RealTimeChatManager
            window.chatManager = new RealTimeChatManager();
            
            // Adicionar listener para novas mensagens
            window.chatManager.addMessageListener((message) => {
                console.log('🔔 Nova mensagem recebida no admin:', message);
                updateAdminChatInterface(message);
            });
            
            // Configurar formulário de novo chat
            setupNewChatForm();
            
            // Carregar chats após inicialização
            setTimeout(() => {
                loadAdminChats();
            }, 2000);
            
            console.log('✅ Chat administrativo inicializado com sucesso');
        }
    }, 500);
    
    // Timeout de segurança
    setTimeout(() => {
        if (!window.chatManager) {
            console.error('❌ Timeout: Chat Manager não foi carregado em 10 segundos');
        }
    }, 10000);
}

// Carregar chats administrativos
async function loadAdminChats() {
    if (!window.chatManager) {
        console.log('⚠️ Chat Manager não disponível ainda');
        return;
    }

    try {
        console.log('📊 Carregando chats administrativos...');
        const chats = await window.chatManager.loadChats();
        console.log('Chats carregados:', chats);
        
        updateAdminChatList(chats);
        
    } catch (error) {
        console.error('❌ Erro ao carregar chats:', error);
    }
}

// Atualizar lista de chats na interface administrativa
function updateAdminChatList(chats) {
    const chatList = document.getElementById('chatList');
    if (!chatList) {
        console.log('❌ chatList não encontrado');
        return;
    }

    // Limpar lista atual
    chatList.innerHTML = '';
    
    if (chats.length === 0) {
        chatList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6c757d;">
                <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <h4>Nenhum chat ativo</h4>
                <p>Os chats criados pelos alunos aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    // Adicionar chats dinâmicos
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.setAttribute('data-chat-id', chat.id);
        
        const priorityIcon = chat.priority === 'high' ? '🔴' : chat.priority === 'medium' ? '🟡' : '🟢';
        const categoryIcon = getCategoryIcon(chat.category);
        
        chatItem.innerHTML = `
            <div class="chat-avatar">
                <i class="fas ${categoryIcon}"></i>
            </div>
            <div class="chat-info">
                <h4>${chat.title} ${priorityIcon}</h4>
                <p>${chat.description || 'Sem descrição'}</p>
                <small>${formatTimeAgo(chat.createdAt)} - por ${chat.createdBy}</small>
            </div>
            <div class="chat-status online"></div>
        `;
        
        chatItem.addEventListener('click', () => {
            selectAdminChat(chatItem, chat);
        });
        
        chatList.appendChild(chatItem);
    });
    
    console.log(`✅ ${chats.length} chats carregados na interface administrativa`);
}

// Selecionar chat administrativo
function selectAdminChat(chatElement, chat) {
    // Remover active de outros chats
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Adicionar active ao chat clicado
    chatElement.classList.add('active');
    
    // Abrir chat
    openAdminChat(chat);
}

// Abrir chat administrativo
function openAdminChat(chat) {
    console.log('📖 Abrindo chat administrativo:', chat);
    
    // Atualizar header do chat
    const contactInfo = document.querySelector('.chat-contact-info');
    if (contactInfo) {
        contactInfo.innerHTML = `
            <div class="contact-avatar">
                <i class="fas ${getCategoryIcon(chat.category)}"></i>
            </div>
            <div class="contact-details">
                <h4>${chat.title}</h4>
                <span class="contact-status">
                    <i class="fas fa-circle online"></i> Chat criado por ${chat.createdBy} - ${chat.priority} prioridade
                </span>
            </div>
        `;
    }
    
    // Carregar mensagens do chat
    loadChatMessages(chat);
    
    // Atualizar categoria atual do chat manager
    if (window.chatManager) {
        window.chatManager.setCurrentCategory && window.chatManager.setCurrentCategory(chat.category);
    }
}

// Carregar mensagens do chat
async function loadChatMessages(chat) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    // Limpar container
    messagesContainer.innerHTML = `
        <div class="message-date">Chat: ${chat.title}</div>
        <div class="message received">
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    ${chat.description || 'Chat iniciado'}
                </div>
                <div class="message-time">${formatTimeAgo(chat.createdAt)}</div>
            </div>
        </div>
    `;
    
    // Carregar mensagens da categoria se disponível
    if (window.chatManager && window.chatManager.loadMessages) {
        try {
            const messages = await window.chatManager.loadMessages(chat.category);
            if (messages && messages.length > 0) {
                messages.forEach(message => {
                    addMessageToAdminInterface(message);
                });
            }
        } catch (error) {
            console.log('Erro ao carregar mensagens:', error);
        }
    }
}

// Atualizar interface do chat com nova mensagem
function updateAdminChatInterface(message) {
    console.log('🔄 Atualizando interface administrativa com nova mensagem:', message);
    
    // Verificar se o chat ativo é da mesma categoria
    const activeChat = document.querySelector('.chat-item.active');
    if (activeChat) {
        addMessageToAdminInterface(message);
    }
    
    // Atualizar lista se necessário
    updateUnreadBadges();
}

// Adicionar mensagem à interface administrativa
function addMessageToAdminInterface(messageData) {
    console.log('➕ Adicionando mensagem à interface administrativa:', messageData);
    
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) {
        console.error('❌ Container de mensagens não encontrado');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${messageData.senderType === 'admin' ? 'sent' : 'received'}`;
    
    const messageContent = messageData.content || messageData.message || messageData.text || 'Mensagem vazia';
    
    const time = new Date(messageData.timestamp || Date.now()).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    if (messageData.senderType === 'admin') {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-bubble">
                    ${messageContent}
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <strong>${messageData.senderName || 'Aluno'}:</strong><br>
                    ${messageContent}
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    console.log('✅ Mensagem adicionada à interface administrativa');
}

// Configurar formulário de novo chat
function setupNewChatForm() {
    const newChatForm = document.getElementById('newChatForm');
    if (newChatForm) {
        // Remove listeners existentes
        const newForm = newChatForm.cloneNode(true);
        newChatForm.parentNode.replaceChild(newForm, newChatForm);
        
        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!window.chatManager) {
                alert('Sistema de chat não está conectado');
                return;
            }

            const chatData = {
                title: document.getElementById('chatSubject').value,
                category: document.getElementById('chatCategory').value,
                priority: document.getElementById('chatPriority').value,
                description: document.getElementById('chatMessage').value
            };

            try {
                const newChat = await window.chatManager.createChat(chatData);
                if (newChat) {
                    closeNewChatModal();
                    showNotification('Chat criado com sucesso!');
                    await loadAdminChats();
                }
            } catch (error) {
                console.error('Erro ao criar chat:', error);
                alert('Erro ao criar chat. Tente novamente.');
            }
        });
    }
}

// Funções auxiliares para o admin
function getCategoryIcon(category) {
    const icons = {
        academic: 'fa-graduation-cap',
        administrative: 'fa-file-alt',
        financial: 'fa-dollar-sign',
        technical: 'fa-cog',
        general: 'fa-comments'
    };
    return icons[category] || 'fa-comments';
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} horas atrás`;
    return `${Math.floor(diffInMinutes / 1440)} dias atrás`;
}

// Enviar mensagem (sobrescrever a função existente)
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput || !window.chatManager) {
        console.error('Input de mensagem ou chat manager não disponível');
        return;
    }
    
    const content = messageInput.value.trim();
    if (!content) return;
    
    try {
        // Pegar categoria do chat ativo ou usar 'general'
        const activeChat = document.querySelector('.chat-item.active');
        let category = 'general';
        
        if (activeChat) {
            const chatId = activeChat.getAttribute('data-chat-id');
            // Encontrar categoria baseada no chat ativo
            // Por enquanto usar 'general' como fallback
        }
        
        // Enviar mensagem através do chat manager
        const success = window.chatManager.sendMessage(category, content);
        
        if (success) {
            messageInput.value = '';
            console.log('✅ Mensagem enviada pelo admin:', content);
        } else {
            console.error('❌ Falha ao enviar mensagem');
        }
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
    }
}

// Função para lidar com Enter no input (sobrescrever existente)
function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Gerenciar modais de chat
function openNewChatModal() {
    const modal = document.getElementById('newChatModal');
    if (modal) modal.style.display = 'block';
}

function closeNewChatModal() {
    const modal = document.getElementById('newChatModal');
    if (modal) {
        modal.style.display = 'none';
        const form = document.getElementById('newChatForm');
        if (form) form.reset();
    }
}

// Adicionar logout ao menu
function addLogoutToAdminMenu() {
    const navbar = document.querySelector('.nav-menu');
    if (navbar && !document.getElementById('logoutBtn')) {
        const logoutItem = document.createElement('li');
        logoutItem.innerHTML = `
            <a href="#" class="nav-link" id="logoutBtn" onclick="adminLogout()">
                <i class="fas fa-sign-out-alt"></i>
                Sair
            </a>
        `;
        navbar.appendChild(logoutItem);
    }
}

// Logout administrativo
function adminLogout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        sessionStorage.removeItem('userProfile');
        sessionStorage.removeItem('loginTime');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('adminCredentials'); // Limpar credenciais de validação
        window.location.href = 'login.html';
    }
}

// CSS adicional para chat administrativo
const adminChatStyles = `
<style>
.admin-chat-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.admin-chat-item:hover {
    background: rgba(102, 126, 234, 0.05);
}

.student-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #667eea;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
}

.chat-item-content {
    flex: 1;
}

.chat-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.chat-item-header h4 {
    margin: 0;
    color: #2c3e50;
    font-size: 1rem;
}

.chat-time {
    color: #6c757d;
    font-size: 0.8rem;
}

.chat-preview {
    color: #6c757d;
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.chat-actions {
    display: flex;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.admin-chat-item:hover .chat-actions {
    opacity: 1;
}

.chat-actions .btn-action {
    padding: 0.3rem 0.8rem;
    font-size: 0.8rem;
    border-radius: 15px;
}

.conversation-message {
    margin-bottom: 1rem;
    padding: 0.8rem;
    border-radius: 8px;
}

.student-msg {
    background: white;
    border-left: 3px solid #667eea;
}

.admin-msg {
    background: rgba(102, 126, 234, 0.1);
    border-left: 3px solid #27ae60;
    margin-left: 2rem;
}

.msg-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.msg-header strong {
    color: #2c3e50;
}

.msg-time {
    color: #6c757d;
    font-size: 0.8rem;
}

.msg-content {
    color: #555;
    line-height: 1.4;
}
</style>
`;

// Adicionar estilos do chat administrativo
document.addEventListener('DOMContentLoaded', function() {
    document.head.insertAdjacentHTML('beforeend', adminChatStyles);
    addLogoutToAdminMenu();
});

// ========== SISTEMA DE ORGANOGRAMA DINÂMICO ==========

// Dados do organograma
let organizationalChart = [];
let currentEditingPosition = null;

// Inicializar organograma
function initializeOrganogram() {
    // Carregar dados salvos ou iniciar vazio
    const savedChart = localStorage.getItem('organizationalChart');
    if (savedChart) {
        organizationalChart = JSON.parse(savedChart);
        renderOrganogram();
    } else {
        showEmptyOrganogram();
    }
}

// Mostrar organograma vazio
function showEmptyOrganogram() {
    const container = document.getElementById('organogramaContainer');
    container.innerHTML = `
        <div class="empty-organogram">
            <i class="fas fa-sitemap"></i>
            <h3>Organograma Vazio</h3>
            <p>Comece adicionando o primeiro cargo da sua organização</p>
            <button class="btn btn-primary" onclick="openAddPositionModal()">
                <i class="fas fa-plus"></i> Adicionar Primeiro Cargo
            </button>
        </div>
    `;
}

// Abrir modal para adicionar posição
function openAddPositionModal(parentId = null) {
    currentEditingPosition = null;
    
    document.getElementById('positionModalTitle').textContent = 'Adicionar Cargo';
    document.getElementById('positionForm').reset();
    
    // Preencher dropdown de superiores
    populateSuperiorDropdown(parentId);
    
    // Se tem parentId, pré-selecionar
    if (parentId) {
        document.getElementById('positionSuperior').value = parentId;
    }
    
    document.getElementById('positionModal').style.display = 'block';
}

// Fechar modal de posição
function closePositionModal() {
    document.getElementById('positionModal').style.display = 'none';
    currentEditingPosition = null;
}

// Preencher dropdown de superiores
function populateSuperiorDropdown(excludeId = null) {
    const select = document.getElementById('positionSuperior');
    select.innerHTML = '<option value="">Nenhum (Cargo mais alto)</option>';
    
    organizationalChart.forEach(position => {
        if (position.id !== excludeId && position.id !== currentEditingPosition) {
            const option = document.createElement('option');
            option.value = position.id;
            option.textContent = `${position.name} - ${position.title}`;
            select.appendChild(option);
        }
    });
}

// Salvar posição
function savePosition() {
    const form = document.getElementById('positionForm');
    const formData = new FormData(form);
    
    const position = {
        id: currentEditingPosition || generateId(),
        name: formData.get('positionName') || document.getElementById('positionName').value,
        title: formData.get('positionTitle') || document.getElementById('positionTitle').value,
        department: formData.get('positionDepartment') || document.getElementById('positionDepartment').value,
        email: formData.get('positionEmail') || document.getElementById('positionEmail').value,
        phone: formData.get('positionPhone') || document.getElementById('positionPhone').value,
        superiorId: formData.get('positionSuperior') || document.getElementById('positionSuperior').value || null,
        level: formData.get('positionLevel') || document.getElementById('positionLevel').value,
        icon: formData.get('positionIcon') || document.getElementById('positionIcon').value,
        createdAt: currentEditingPosition ? 
            organizationalChart.find(p => p.id === currentEditingPosition)?.createdAt || new Date().toISOString() : 
            new Date().toISOString()
    };
    
    if (currentEditingPosition) {
        // Editar posição existente
        const index = organizationalChart.findIndex(p => p.id === currentEditingPosition);
        organizationalChart[index] = position;
        showNotification('Cargo atualizado com sucesso!');
    } else {
        // Adicionar nova posição
        organizationalChart.push(position);
        showNotification('Cargo adicionado com sucesso!');
    }
    
    // Salvar no localStorage
    localStorage.setItem('organizationalChart', JSON.stringify(organizationalChart));
    
    // Renderizar organograma
    renderOrganogram();
    closePositionModal();
}

// Renderizar organograma
function renderOrganogram() {
    if (organizationalChart.length === 0) {
        showEmptyOrganogram();
        return;
    }
    
    const container = document.getElementById('organogramaContainer');
    
    // Construir hierarquia
    const hierarchy = buildHierarchy();
    
    // Renderizar HTML
    const orgChart = document.createElement('div');
    orgChart.className = 'org-chart';
    
    hierarchy.forEach((level, levelIndex) => {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'org-level';
        
        level.forEach(position => {
            const nodeDiv = createPositionNode(position);
            levelDiv.appendChild(nodeDiv);
        });
        
        orgChart.appendChild(levelDiv);
    });
    
    container.innerHTML = '';
    container.appendChild(orgChart);
    
    // Adicionar linhas de conexão se habilitado
    if (document.getElementById('showConnectionLines')?.checked) {
        addConnectionLines();
    }
}

// Construir hierarquia
function buildHierarchy() {
    const hierarchy = [];
    const processed = new Set();
    
    // Encontrar posições de nível mais alto (sem superior)
    const topLevel = organizationalChart.filter(p => !p.superiorId);
    
    if (topLevel.length > 0) {
        hierarchy.push(topLevel);
        topLevel.forEach(p => processed.add(p.id));
        
        // Construir níveis subsequentes
        while (processed.size < organizationalChart.length) {
            const currentLevel = [];
            
            organizationalChart.forEach(position => {
                if (!processed.has(position.id) && 
                    position.superiorId && 
                    processed.has(position.superiorId)) {
                    currentLevel.push(position);
                    processed.add(position.id);
                }
            });
            
            if (currentLevel.length > 0) {
                hierarchy.push(currentLevel);
            } else {
                break; // Evitar loop infinito
            }
        }
    }
    
    return hierarchy;
}

// Criar nó de posição
function createPositionNode(position) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = `org-node ${position.level} new-node`;
    nodeDiv.setAttribute('data-position-id', position.id);
    
    nodeDiv.innerHTML = `
        <div class="node-avatar">
            <i class="fas ${position.icon}"></i>
        </div>
        <div class="node-info">
            <h4>${position.name}</h4>
            <div class="position-title">${position.title}</div>
            ${position.department ? `<div class="position-department">${position.department}</div>` : ''}
        </div>
        <div class="node-actions">
            <button class="node-action-btn add-child" onclick="openAddPositionModal('${position.id}')" title="Adicionar Subordinado">
                <i class="fas fa-plus"></i>
            </button>
            <button class="node-action-btn edit" onclick="editPosition('${position.id}')" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <button class="node-action-btn delete" onclick="deletePosition('${position.id}')" title="Excluir">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Adicionar click para ver detalhes
    nodeDiv.addEventListener('click', (e) => {
        if (!e.target.closest('.node-actions')) {
            showPositionDetails(position.id);
        }
    });
    
    return nodeDiv;
}

// Editar posição
function editPosition(positionId) {
    const position = organizationalChart.find(p => p.id === positionId);
    if (!position) return;
    
    currentEditingPosition = positionId;
    
    document.getElementById('positionModalTitle').textContent = 'Editar Cargo';
    document.getElementById('positionName').value = position.name;
    document.getElementById('positionTitle').value = position.title;
    document.getElementById('positionDepartment').value = position.department || '';
    document.getElementById('positionEmail').value = position.email || '';
    document.getElementById('positionPhone').value = position.phone || '';
    document.getElementById('positionLevel').value = position.level;
    document.getElementById('positionIcon').value = position.icon;
    
    populateSuperiorDropdown(positionId);
    document.getElementById('positionSuperior').value = position.superiorId || '';
    
    document.getElementById('positionModal').style.display = 'block';
}

// Excluir posição
function deletePosition(positionId) {
    const position = organizationalChart.find(p => p.id === positionId);
    if (!position) return;
    
    // Verificar se tem subordinados
    const hasSubordinates = organizationalChart.some(p => p.superiorId === positionId);
    
    let confirmMessage = `Tem certeza que deseja excluir o cargo "${position.name} - ${position.title}"?`;
    if (hasSubordinates) {
        confirmMessage += '\n\nATENÇÃO: Este cargo tem subordinados. Eles ficarão sem superior.';
    }
    
    if (confirm(confirmMessage)) {
        // Remover posição
        organizationalChart = organizationalChart.filter(p => p.id !== positionId);
        
        // Atualizar subordinados (remover referência ao superior)
        organizationalChart.forEach(p => {
            if (p.superiorId === positionId) {
                p.superiorId = null;
            }
        });
        
        // Salvar e renderizar
        localStorage.setItem('organizationalChart', JSON.stringify(organizationalChart));
        renderOrganogram();
        
        showNotification('Cargo excluído com sucesso!');
    }
}

// Mostrar detalhes da posição
function showPositionDetails(positionId) {
    const position = organizationalChart.find(p => p.id === positionId);
    if (!position) return;
    
    const superior = position.superiorId ? 
        organizationalChart.find(p => p.id === position.superiorId) : null;
    
    const subordinates = organizationalChart.filter(p => p.superiorId === positionId);
    
    const content = document.getElementById('positionDetailsContent');
    content.innerHTML = `
        <div class="position-details">
            <div class="position-details-avatar">
                <i class="fas ${position.icon}"></i>
            </div>
            <div class="position-details-info">
                <h4>${position.name}</h4>
                <div class="position-title">${position.title}</div>
                ${position.department ? `<p><strong>Departamento:</strong> ${position.department}</p>` : ''}
                ${superior ? `<p><strong>Superior:</strong> ${superior.name} - ${superior.title}</p>` : '<p><strong>Posição:</strong> Cargo mais alto</p>'}
                ${subordinates.length > 0 ? `<p><strong>Subordinados:</strong> ${subordinates.length}</p>` : ''}
            </div>
        </div>
        
        ${(position.email || position.phone) ? `
        <div class="position-contact">
            ${position.email ? `
            <div class="contact-item">
                <i class="fas fa-envelope"></i>
                <span>${position.email}</span>
            </div>
            ` : ''}
            ${position.phone ? `
            <div class="contact-item">
                <i class="fas fa-phone"></i>
                <span>${position.phone}</span>
            </div>
            ` : ''}
        </div>
        ` : ''}
        
        ${subordinates.length > 0 ? `
        <div style="margin-top: 1.5rem;">
            <h5>Subordinados:</h5>
            <div style="display: grid; gap: 0.5rem; margin-top: 0.8rem;">
                ${subordinates.map(sub => `
                    <div class="contact-item" style="cursor: pointer;" onclick="showPositionDetails('${sub.id}'); closePositionDetailsModal();">
                        <i class="fas ${sub.icon}"></i>
                        <span>${sub.name} - ${sub.title}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="position-actions">
            <button class="btn btn-secondary" onclick="closePositionDetailsModal()">Fechar</button>
            <button class="btn btn-primary" onclick="editPosition('${position.id}'); closePositionDetailsModal();">
                <i class="fas fa-edit"></i> Editar
            </button>
        </div>
    `;
    
    document.getElementById('positionDetailsModal').style.display = 'block';
}

// Fechar modal de detalhes
function closePositionDetailsModal() {
    document.getElementById('positionDetailsModal').style.display = 'none';
}

// Toggle linhas de conexão
function toggleConnectionLines() {
    const showLines = document.getElementById('showConnectionLines').checked;
    
    if (showLines) {
        addConnectionLines();
    } else {
        removeConnectionLines();
    }
}

// Adicionar linhas de conexão
function addConnectionLines() {
    removeConnectionLines(); // Limpar linhas existentes
    
    // Implementação simplificada - em uma versão mais avançada,
    // calcularia as posições exatas e desenharia linhas SVG
    const nodes = document.querySelectorAll('.org-node');
    
    nodes.forEach(node => {
        const positionId = node.getAttribute('data-position-id');
        const position = organizationalChart.find(p => p.id === positionId);
        
        if (position && position.superiorId) {
            // Adicionar classe visual para indicar conexão
            node.style.position = 'relative';
            
            // Em uma implementação completa, desenharia linhas SVG aqui
        }
    });
}

// Remover linhas de conexão
function removeConnectionLines() {
    document.querySelectorAll('.connection-line').forEach(line => line.remove());
}

// Resetar organograma
function resetOrganogram() {
    if (confirm('Tem certeza que deseja resetar todo o organograma? Esta ação não pode ser desfeita.')) {
        organizationalChart = [];
        localStorage.removeItem('organizationalChart');
        showEmptyOrganogram();
        showNotification('Organograma resetado com sucesso!');
    }
}

// Event listeners para modais de organograma
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar organograma
    initializeOrganogram();
    
    // Event listener para formulário de posição
    document.getElementById('positionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        savePosition();
    });
    
    // Fechar modais ao clicar fora
    window.addEventListener('click', function(e) {
        const positionModal = document.getElementById('positionModal');
        const detailsModal = document.getElementById('positionDetailsModal');
        
        if (e.target === positionModal) {
            closePositionModal();
        }
        if (e.target === detailsModal) {
            closePositionDetailsModal();
        }
    });
});

// Exportar organograma
function exportOrganogram() {
    const data = {
        organizationalChart: organizationalChart,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'organograma-fala-alunos.json';
    link.click();
    
    showNotification('Organograma exportado com sucesso!');
}

// Importar organograma
function importOrganogram(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.organizationalChart && Array.isArray(data.organizationalChart)) {
                organizationalChart = data.organizationalChart;
                localStorage.setItem('organizationalChart', JSON.stringify(organizationalChart));
                renderOrganogram();
                showNotification('Organograma importado com sucesso!');
            } else {
                throw new Error('Formato de arquivo inválido');
            }
        } catch (error) {
            showNotification('Erro ao importar organograma: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Enviar mensagem (versão antiga - renomeada para evitar conflito)
function sendMessageOld() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Adicionar mensagem enviada
    const newMessage = {
        id: Date.now(),
        type: 'sent',
        message: message,
        timestamp: new Date(),
        sender: 'Você'
    };

    addMessageToChat(currentChatId, newMessage);
    input.value = '';

    // Simular resposta automática após 2 segundos
    setTimeout(() => {
        simulateResponse();
    }, 2000);
}

// Manipular Enter no input (versão antiga - renomeada)
function handleEnterKeyOld(event) {
    if (event.key === 'Enter') {
        sendMessageOld();
    }
}