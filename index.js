/* ==========================================================================
   MEOW ADMINISTRADOR PRO // CORE ENGINE v5.5
   ========================================================================== */

let messages = JSON.parse(localStorage.getItem('meow_admin_messages')) || [
  {
    id: 'MSG-0842',
    name: 'Linus Torvalds',
    email: 'linus@kernel.org',
    type: 'COLLAB_PROPOSAL',
    message: 'Hola, me interesa integrar el buzón con la arquitectura del kernel. Quedo atento a tu respuesta.',
    timestamp: '2026-09-26 19:40 UTC',
    read: false,
    tag: 'PENDING'
  },
  {
    id: 'MSG-0841',
    name: 'Ada Lovelace',
    email: 'ada@analytical.engine',
    type: 'GENERAL_INQUIRY',
    message: 'Excelente diseño TUI móvil para Meow Administrador Pro. ¿Tienen disponible la API de webhooks?',
    timestamp: '2026-09-26 18:15 UTC',
    read: true,
    tag: 'RESOLVED'
  }
];

let selectedMsgIndex = null;

document.addEventListener('DOMContentLoaded', () => {
  renderLogs();
  updateStats();
  initThemeEngine();
  logSystemEvent('SYSTEM_READY', 'Todos los módulos cargados.');
});

/* ==========================================================================
   1. GESTIÓN DE TEMAS VISUALES
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
      logSystemEvent('THEME_CHANGE', `Tema cambiado a ${selectedTheme}`);
    });
  }
}

function applyTheme(theme) {
  document.body.className = '';
  if (theme !== 'green') {
    document.body.classList.add(`theme-${theme}`);
  }
}

/* ==========================================================================
   2. FILTRADO, BÚSQUEDA Y RENDERING (INBOX)
   ========================================================================== */
function renderLogs() {
  const container = document.getElementById('logsContainer');
  if (!container) return;

  const searchQuery = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const selectedTag = document.getElementById('tagFilter')?.value || 'ALL';

  container.innerHTML = '';

  const filtered = messages.filter(msg => {
    const matchesSearch = msg.name.toLowerCase().includes(searchQuery) ||
                          msg.email.toLowerCase().includes(searchQuery) ||
                          msg.message.toLowerCase().includes(searchQuery);
    const matchesTag = (selectedTag === 'ALL') || (msg.tag === selectedTag);
    return matchesSearch && matchesTag;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="stats-box" style="text-align: center; color: var(--text-muted);">
        &gt; NO SE ENCONTRARON AVISOS QUE COINCIDAN.
      </div>`;
    return;
  }

  filtered.forEach((msg) => {
    const originalIndex = messages.indexOf(msg);
    const card = document.createElement('div');
    card.className = `log-card ${msg.read ? 'read' : ''}`;
    card.innerHTML = `
      <div class="log-header">
        <span>#${msg.id} <span class="tag-badge tag-${msg.tag}">${msg.tag}</span></span>
        <span>${msg.timestamp}</span>
      </div>
      <div class="log-body">
        <p><strong>FROM:</strong> ${escapeHTML(msg.name)} &lt;${escapeHTML(msg.email)}&gt;</p>
        <p><strong>TYPE:</strong> ${escapeHTML(msg.type)}</p>
        <p style="color: #8b949e; margin-top:4px;">&gt; ${escapeHTML(msg.message.substring(0, 40))}...</p>
      </div>
      <div class="log-actions">
        <button class="btn-tui" onclick="openMessage(${originalIndex})">[READ_FULL]</button>
        <button class="btn-tui" onclick="toggleTag(${originalIndex})">[TAG: ${msg.tag}]</button>
        <button class="btn-tui alert" onclick="deleteMessage(${originalIndex})">[DELETE]</button>
      </div>
    `;
    container.appendChild(card);
  });

  saveData();
}

function toggleTag(index) {
  const tags = ['PENDING', 'RESOLVED', 'ARCHIVED'];
  const currentTag = messages[index].tag || 'PENDING';
  const nextTag = tags[(tags.indexOf(currentTag) + 1) % tags.length];
  messages[index].tag = nextTag;
  renderLogs();
  updateStats();
}

/* ==========================================================================
   3. NAVEGACIÓN Y PESTAÑAS
   ========================================================================== */
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById('tab-inbox').style.display = 'none';
  document.getElementById('tab-tools').style.display = 'none';
  document.getElementById('tab-backup').style.display = 'none';
  document.getElementById('tab-stats').style.display = 'none';

  const selectedTab = document.getElementById(`tab-${tabName}`);
  if (selectedTab) selectedTab.style.display = 'flex';

  if (event && event.target) {
    event.target.classList.add('active');
  }
}

/* ==========================================================================
   4. MODAL Y PLANTILLAS DE RESPUESTA
   ========================================================================== */
function openMessage(index) {
  selectedMsgIndex = index;
  const msg = messages[index];
  if (!msg) return;

  msg.read = true;

  const modalBody = document.getElementById('modalBody');
  const modal = document.getElementById('messageModal');

  if (modalBody) {
    modalBody.innerHTML = `
      <p><strong>ID:</strong> #${msg.id} | <strong>DATE:</strong> ${msg.timestamp}</p>
      <p><strong>FROM:</strong> ${escapeHTML(msg.name)} (${escapeHTML(msg.email)})</p>
      <p style="margin-bottom:8px;"><strong>TYPE:</strong> ${escapeHTML(msg.type)}</p>
      <hr style="border:0; border-top:1px dashed var(--border-color); margin-bottom:8px;" />
      <p style="white-space: pre-wrap; color: var(--text-primary);">${escapeHTML(msg.message)}</p>
    `;
  }

  document.getElementById('templateSelect').value = '';
  updateReplyButton(msg.email, '');

  if (modal) modal.classList.add('active');
  renderLogs();
  updateStats();
}

function applyResponseTemplate() {
  if (selectedMsgIndex === null) return;
  const msg = messages[selectedMsgIndex];
  const templateType = document.getElementById('templateSelect').value;

  let bodyText = "";
  if (templateType === 'CONFIRM') {
    bodyText = `Hola ${msg.name},\n\nHemos recibido tu aviso correctamente. Nos pondremos en contacto a la brevedad.\n\nSaludos,\nMeow Admin Team`;
  } else if (templateType === 'IN_REVIEW') {
    bodyText = `Hola ${msg.name},\n\nTu propuesta/mensaje está actualmente bajo revisión técnica.\n\nSaludos,\nMeow Admin Team`;
  } else if (templateType === 'ACCEPTED') {
    bodyText = `Hola ${msg.name},\n\nNos complace informarte que tu solicitud ha sido aprobada.\n\nSaludos,\nMeow Admin Team`;
  }

  updateReplyButton(msg.email, bodyText);
}

function updateReplyButton(email, body) {
  const replyBtn = document.getElementById('replyBtn');
  if (replyBtn) {
    replyBtn.onclick = () => {
      const subject = encodeURIComponent("RE: Mensaje recibido - Meow Admin");
      const bodyParam = encodeURIComponent(body);
      window.location.href = `mailto:${email}?subject=${subject}&body=${bodyParam}`;
    };
  }
}

function closeModal() {
  document.getElementById('messageModal')?.classList.remove('active');
}

/* ==========================================================================
   5. HERRAMIENTAS INTEGRADAS (TOOLS.EXE)
   ========================================================================== */
function calculateAudioSize() {
  const mins = parseFloat(document.getElementById('calcMin').value) || 0;
  const format = document.getElementById('calcFormat').value;

  let sampleRate = 44100;
  let bitDepth = 16;

  if (format === '48000_24') { sampleRate = 48000; bitDepth = 24; }
  else if (format === '96000_24') { sampleRate = 96000; bitDepth = 24; }

  // Estéreo = 2 canales
  const bytesPerSecond = sampleRate * (bitDepth / 8) * 2;
  const totalBytes = bytesPerSecond * (mins * 60);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  document.getElementById('calcResult').innerText = `ESTIMADO STEREO: ~${totalMB} MB`;
}

/* ==========================================================================
   6. EXPORTACIÓN & RESPALDO (BACKUP.SH)
   ========================================================================== */
function exportDataJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
  downloadFile(dataStr, "meow_admin_backup.json");
  logSystemEvent('EXPORT_JSON', 'Copia de seguridad descargada.');
}

function exportDataCSV() {
  let csv = "ID,Name,Email,Type,Message,Timestamp,Tag\n";
  messages.forEach(m => {
    csv += `"${m.id}","${m.name}","${m.email}","${m.type}","${m.message.replace(/"/g, '""')}","${m.timestamp}","${m.tag}"\n`;
  });
  const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  downloadFile(dataStr, "meow_admin_backup.csv");
  logSystemEvent('EXPORT_CSV', 'Respaldo CSV exportado.');
}

function downloadFile(dataStr, filename) {
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importDataJSON() {
  const fileInput = document.getElementById('importFile');
  if (!fileInput.files.length) {
    alert('> ERROR: Selecciona un archivo .json');
    return;
  }
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        messages = imported;
        renderLogs();
        updateStats();
        alert('> RESPALDO RESTAURADO CON ÉXITO');
        logSystemEvent('IMPORT_BACKUP', 'Respaldo JSON restaurado.');
      }
    } catch (err) {
      alert('> ERROR: Archivo JSON no válido.');
    }
  };
  reader.readAsText(file);
}

/* ==========================================================================
   7. METRICAS & LOGS DEL SISTEMA
   ========================================================================== */
function deleteMessage(index) {
  messages.splice(index, 1);
  renderLogs();
  updateStats();
}

function updateStats() {
  const unreadCount = messages.filter(m => !m.read).length;
  const resolvedCount = messages.filter(m => m.tag === 'RESOLVED').length;

  document.getElementById('unreadCounter').innerText = `NUEVOS: ${unreadCount}`;
  document.getElementById('statTotal').innerText = `TOTAL RECIBIDOS: ${messages.length}`;
  document.getElementById('statUnread').innerText = `PENDIENTES:      ${unreadCount}`;
  document.getElementById('statResolved').innerText = `RESUELTOS:       ${resolvedCount}`;
}

function logSystemEvent(event, detail) {
  const consoleEl = document.getElementById('sysLogs');
  if (consoleEl) {
    const time = new Date().toLocaleTimeString();
    consoleEl.innerHTML += `&gt; [${time}] ${event}: ${detail}<br/>`;
  }
}

function saveData() {
  localStorage.setItem('meow_admin_messages', JSON.stringify(messages));
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
