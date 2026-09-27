/* ==========================================================================
   MEOW ADMINISTRADOR PRO // CORE ENGINE v5.0
   ========================================================================== */

// Base de datos inicial / Estado local en el dispositivo
let messages = JSON.parse(localStorage.getItem('meow_admin_messages')) || [
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
    message: 'Excelente diseño TUI móvil para Meow Administrador Pro. ¿Tienen disponible la API de webhooks?',
    timestamp: '2026-09-26 18:15 UTC',
    read: true
  }
];

// Inicialización de la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  renderLogs();
  updateStats();
  initThemeEngine();
});

/* ==========================================================================
   1. GESTIÓN DE TEMAS VISUALES (PALETAS QUANTUM-TUI)
   ========================================================================== */
function initThemeEngine() {
  const savedTheme = localStorage.getItem('meow_admin_theme') || 'green';
  const themeSelect = document.getElementById('themeSelect');

  if (themeSelect) {
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);

    themeSelect.addEventListener('change', (e) => {
      const selectedTheme = e.target.value;
      applyTheme(selectedTheme);
      localStorage.setItem('meow_admin_theme', selectedTheme);
    });
  }
}

function applyTheme(theme) {
  // Limpia clases de temas previos
  document.body.className = '';
  
  // Aplica la clase correspondiente si es diferente al verde por defecto
  if (theme !== 'green') {
    document.body.classList.add(`theme-${theme}`);
  }
}

/* ==========================================================================
   2. RENDERING Y MANEJO DE AVISOS (INBOX)
   ========================================================================== */
function renderLogs() {
  const container = document.getElementById('logsContainer');
  if (!container) return;

  container.innerHTML = '';

  if (messages.length === 0) {
    container.innerHTML = `
      <div class="stats-box" style="text-align: center; color: var(--text-muted);">
        &gt; NO HAY AVISOS REGISTRADOS EN EL BUZÓN.
      </div>`;
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
        <p><strong>FROM:</strong> ${escapeHTML(msg.name)} &lt;${escapeHTML(msg.email)}&gt;</p>
        <p><strong>TYPE:</strong> ${escapeHTML(msg.type)}</p>
        <p class="preview">&gt; ${escapeHTML(msg.message.substring(0, 45))}...</p>
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

/* ==========================================================================
   3. NAVEGACIÓN POR PESTAÑAS (TABS)
   ========================================================================== */
function switchTab(tabName) {
  // Desactivar todos los botones de pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  // Ocultar todas las secciones
  const tabInbox = document.getElementById('tab-inbox');
  const tabStats = document.getElementById('tab-stats');
  const tabConfig = document.getElementById('tab-config');

  if (tabInbox) tabInbox.style.display = 'none';
  if (tabStats) tabStats.style.display = 'none';
  if (tabConfig) tabConfig.style.display = 'none';

  // Mostrar la pestaña seleccionada y activar su botón
  if (tabName === 'inbox' && tabInbox) {
    tabInbox.style.display = 'block';
  } else if (tabName === 'stats' && tabStats) {
    tabStats.style.display = 'block';
  } else if (tabName === 'config' && tabConfig) {
    tabConfig.style.display = 'block';
  }

  if (event && event.target) {
    event.target.classList.add('active');
  }
}

/* ==========================================================================
   4. MODAL Y LECTURA DE MENSAJES
   ========================================================================== */
function openMessage(index) {
  const msg = messages[index];
  if (!msg) return;

  msg.read = true; // Marcar como leído

  const modalBody = document.getElementById('modalBody');
  const replyBtn = document.getElementById('replyBtn');
  const modal = document.getElementById('messageModal');

  if (modalBody) {
    modalBody.innerHTML = `
      <p style="margin-bottom:6px;"><strong>ID:</strong> #${msg.id}</p>
      <p style="margin-bottom:6px;"><strong>DATE:</strong> ${msg.timestamp}</p>
      <p style="margin-bottom:6px;"><strong>FROM:</strong> ${escapeHTML(msg.name)} (${escapeHTML(msg.email)})</p>
      <p style="margin-bottom:12px;"><strong>TYPE:</strong> ${escapeHTML(msg.type)}</p>
      <hr style="border:0; border-top:1px dashed var(--border-color); margin-bottom:12px;" />
      <p style="white-space: pre-wrap; color: var(--text-primary);">${escapeHTML(msg.message)}</p>
    `;
  }

  if (replyBtn) {
    replyBtn.onclick = () => {
      window.location.href = `mailto:${msg.email}?subject=RE: ${msg.type} - Meow Administrador Pro`;
    };
  }

  if (modal) {
    modal.classList.add('active');
  }

  renderLogs();
  updateStats();
}

function closeModal() {
  const modal = document.getElementById('messageModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

/* ==========================================================================
   5. ELIMINACIÓN Y LIMPIEZA
   ========================================================================== */
function deleteMessage(index) {
  messages.splice(index, 1);
  renderLogs();
  updateStats();
}

function clearAllLogs() {
  if (confirm('> MEOW ADMIN: ¿Confirmar la eliminación de TODOS los avisos?')) {
    messages = [];
    renderLogs();
    updateStats();
  }
}

/* ==========================================================================
   6. METRICAS Y PERSISTENCIA
   ========================================================================== */
function updateStats() {
  const unreadCount = messages.filter(m => !m.read).length;
  
  const unreadCounterEl = document.getElementById('unreadCounter');
  const statTotalEl = document.getElementById('statTotal');
  const statUnreadEl = document.getElementById('statUnread');

  if (unreadCounterEl) unreadCounterEl.innerText = `NUEVOS: ${unreadCount}`;
  if (statTotalEl) statTotalEl.innerText = `TOTAL RECIBIDOS: ${messages.length}`;
  if (statUnreadEl) statUnreadEl.innerText = `PENDIENTES:      ${unreadCount}`;
}

function saveData() {
  localStorage.setItem('meow_admin_messages', JSON.stringify(messages));
}

// Utilidad para evitar inyección HTML en las cadenas de texto
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
