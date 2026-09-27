// Base de datos local (Simulación / LocalStorage)
let messages = JSON.parse(localStorage.getItem('admin_buzon_messages')) || [
  {
    id: 'MSG-0842',
    name: 'Linus Torvalds',
    email: 'linus@kernel.org',
    type: 'COLLAB_PROPOSAL',
    message: 'Hola, me interesa integrar el buzón con la arquitectura del kernel. Quedo atento a tu respuesta.',
    timestamp: '2026-09-26 19:40 UTC',
    read: false
  },
  {
    id: 'MSG-0841',
    name: 'Ada Lovelace',
    email: 'ada@analytical.engine',
    type: 'GENERAL_INQUIRY',
    message: 'Excelente diseño TUI móvil. ¿Tienen disponible la API de webhooks?',
    timestamp: '2026-09-26 18:15 UTC',
    read: true
  }
];

// Inicializar la App al cargar
document.addEventListener('DOMContentLoaded', () => {
  renderLogs();
  updateStats();

  // Selector de Tema
  document.getElementById('themeSelect').addEventListener('change', (e) => {
    document.body.className = '';
    if (e.target.value !== 'green') {
      document.body.classList.add(`theme-${e.target.value}`);
    }
  });
});

// Renderizar la lista de mensajes en la terminal
function renderLogs() {
  const container = document.getElementById('logsContainer');
  container.innerHTML = '';

  if (messages.length === 0) {
    container.innerHTML = `<div class="stats-box" style="text-align: center;">> NO HAS RECIBIDO AVISOS AÚN.</div>`;
    return;
  }

  messages.forEach((msg, index) => {
    const card = document.createElement('div');
    card.className = `log-card ${msg.read ? 'read' : ''}`;
    card.innerHTML = `
      <div class="log-header">
        <span>#${msg.id}</span>
        <span>${msg.timestamp}</span>
      </div>
      <div class="log-body">
        <p><strong>FROM:</strong> ${msg.name} &lt;${msg.email}&gt;</p>
        <p><strong>TYPE:</strong> ${msg.type}</p>
        <p class="preview">&gt; ${msg.message.substring(0, 45)}...</p>
      </div>
      <div class="log-actions">
        <button class="btn-tui" onclick="openMessage(${index})">[READ_FULL]</button>
        <button class="btn-tui alert" onclick="deleteMessage(${index})">[DELETE]</button>
      </div>
    `;
    container.appendChild(card);
  });

  saveData();
}

// Cambiar entre pestañas
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-inbox').style.display = 'none';
  document.getElementById('tab-stats').style.display = 'none';
  document.getElementById('tab-config').style.display = 'none';

  if (tabName === 'inbox') {
    document.getElementById('tab-inbox').style.display = 'block';
    event.target.classList.add('active');
  } else if (tabName === 'stats') {
    document.getElementById('tab-stats').style.display = 'block';
    event.target.classList.add('active');
  } else if (tabName === 'config') {
    document.getElementById('tab-config').style.display = 'block';
    event.target.classList.add('active');
  }
}

// Abrir Modal de lectura
function openMessage(index) {
  const msg = messages[index];
  msg.read = true;

  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <p style="margin-bottom:6px;"><strong>ID:</strong> #${msg.id}</p>
    <p style="margin-bottom:6px;"><strong>DATE:</strong> ${msg.timestamp}</p>
    <p style="margin-bottom:6px;"><strong>FROM:</strong> ${msg.name} (${msg.email})</p>
    <p style="margin-bottom:12px;"><strong>TYPE:</strong> ${msg.type}</p>
    <hr style="border:0; border-top:1px dashed var(--border-color); margin-bottom:12px;" />
    <p style="white-space: pre-wrap;">${msg.message}</p>
  `;

  document.getElementById('replyBtn').onclick = () => {
    window.location.href = `mailto:${msg.email}?subject=RE: ${msg.type} - Quantum Console`;
  };

  document.getElementById('messageModal').classList.add('active');
  renderLogs();
  updateStats();
}

function closeModal() {
  document.getElementById('messageModal').classList.remove('active');
}

// Eliminar aviso
function deleteMessage(index) {
  messages.splice(index, 1);
  renderLogs();
  updateStats();
}

function clearAllLogs() {
  if (confirm('>¿CONFIRMAR ELIMINACIÓN DE TODOS LOS AVISOS?')) {
    messages = [];
    renderLogs();
    updateStats();
  }
}

// Actualizar contadores
function updateStats() {
  const unreadCount = messages.filter(m => !m.read).length;
  document.getElementById('unreadCounter').innerText = `NUEVOS: ${unreadCount}`;
  document.getElementById('statTotal').innerText = `TOTAL RECIBIDOS: ${messages.length}`;
  document.getElementById('statUnread').innerText = `PENDIENTES:      ${unreadCount}`;
}

// Guardar en Storage local
function saveData() {
  localStorage.setItem('admin_buzon_messages', JSON.stringify(messages));
}
