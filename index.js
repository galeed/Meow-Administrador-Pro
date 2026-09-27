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
let audioEngine = null;
let gameInterval = null;
let currentGame = null;

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
        <p style="color: var(--text-muted); margin-top:4px;">&gt; ${escapeHTML(msg.message.substring(0, 40))}...</p>
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
  document.getElementById('tab-games').style.display = 'none';
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
   5. CASSETTE PLAYER DECK & HERRAMIENTAS
   ========================================================================== */
function getAudioEngine() {
  if (!audioEngine) {
    audioEngine = document.getElementById('audioEngine');
    if (audioEngine) {
      audioEngine.addEventListener('play', () => {
        document.getElementById('cassetteDeck')?.classList.add('playing');
      });
      audioEngine.addEventListener('pause', () => {
        document.getElementById('cassetteDeck')?.classList.remove('playing');
      });
      audioEngine.addEventListener('ended', () => {
        document.getElementById('cassetteDeck')?.classList.remove('playing');
        logSystemEvent('AUDIO_ENGINE', 'Cinta finalizada.');
      });
    }
  }
  return audioEngine;
}

function loadFlacAudio(event) {
  const file = event.target.files[0];
  if (!file) return;

  const player = getAudioEngine();
  const titleLabel = document.getElementById('cassetteTitle');
  const fileURL = URL.createObjectURL(file);

  player.src = fileURL;

  if (titleLabel) {
    titleLabel.innerText = file.name.toUpperCase();
  }

  logSystemEvent('CASSETTE_MOUNT', `Cargado: ${file.name}`);
  player.play().catch(() => logSystemEvent('AUDIO_ERROR', 'Interacción requerida para reproducir.'));
}

function playFlacTape() {
  const player = getAudioEngine();
  if (player && player.src) {
    player.play();
    logSystemEvent('AUDIO_CONTROL', 'PLAY');
  }
}

function pauseFlacTape() {
  const player = getAudioEngine();
  if (player) {
    player.pause();
    logSystemEvent('AUDIO_CONTROL', 'PAUSE');
  }
}

function stopFlacTape() {
  const player = getAudioEngine();
  if (player) {
    player.pause();
    player.currentTime = 0;
    logSystemEvent('AUDIO_CONTROL', 'STOP');
  }
}

function calculateAudioSize() {
  const mins = parseFloat(document.getElementById('calcMin').value) || 0;
  const format = document.getElementById('calcFormat').value;

  let sampleRate = 44100;
  let bitDepth = 16;

  if (format === '48000_24') { sampleRate = 48000; bitDepth = 24; }
  else if (format === '96000_24') { sampleRate = 96000; bitDepth = 24; }

  const bytesPerSecond = sampleRate * (bitDepth / 8) * 2;
  const totalBytes = bytesPerSecond * (mins * 60);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  document.getElementById('calcResult').innerText = `ESTIMADO STEREO: ~${totalMB} MB`;
}

/* ==========================================================================
   6. JUEGOS ARCADE (PONG, SNAKE, RADIO)
   ========================================================================== */
function loadGame(gameType) {
  clearInterval(gameInterval);
  currentGame = gameType;
  
  const canvas = document.getElementById('arcadeCanvas');
  const ctx = canvas.getContext('2d');
  const title = document.getElementById('gameTitle');
  const controls = document.getElementById('touchControls');

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameType === 'pong') {
    title.innerText = '> EXEC: pong.sh (PONG ARCADE)';
    controls.style.display = 'flex';
    initPong(canvas, ctx);
  } else if (gameType === 'snake') {
    title.innerText = '> EXEC: snake.sh (SNAKE ARCADE)';
    controls.style.display = 'flex';
    initSnake(canvas, ctx);
  } else if (gameType === 'radio') {
    title.innerText = '> EXEC: radio.sh (LO-FI STREAMING)';
    controls.style.display = 'none';
    initRadio(canvas, ctx);
  }
}

function initPong(canvas, ctx) {
  let paddleY = 80;
  let ballX = 160, ballY = 100;
  let ballDX = 3, ballDY = 2;

  document.getElementById('btnUp').onclick = () => { paddleY = Math.max(0, paddleY - 15); };
  document.getElementById('btnDown').onclick = () => { paddleY = Math.min(canvas.height - 40, paddleY + 15); };

  gameInterval = setInterval(() => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const mainColor = getComputedStyle(document.body).getPropertyValue('--border-color').trim() || '#00ff66';
    ctx.fillStyle = mainColor;

    ctx.fillRect(10, paddleY, 8, 40);
    ctx.fillRect(ballX, ballY, 6, 6);

    ballX += ballDX;
    ballY += ballDY;

    if (ballY <= 0 || ballY >= canvas.height - 6) ballDY *= -1;
    if (ballX <= 18 && ballY >= paddleY && ballY <= paddleY + 40) ballDX *= -1;

    if (ballX <= 0 || ballX >= canvas.width) {
      ballX = 160; ballY = 100;
    }
  }, 1000 / 30);
}

function initSnake(canvas, ctx) {
  let snake = [{x: 160, y: 100}];
  let dx = 10, dy = 0;
  let food = {x: 80, y: 80};

  document.getElementById('btnUp').onclick = () => { if (dy === 0) { dx = 0; dy = -10; } };
  document.getElementById('btnDown').onclick = () => { if (dy === 0) { dx = 0; dy = 10; } };
  document.getElementById('btnLeft').onclick = () => { if (dx === 0) { dx = -10; dy = 0; } };
  document.getElementById('btnRight').onclick = () => { if (dx === 0) { dx = 10; dy = 0; } };

  gameInterval = setInterval(() => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const mainColor = getComputedStyle(document.body).getPropertyValue('--border-color').trim() || '#00ff66';

    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      food = {
        x: Math.floor(Math.random() * (canvas.width / 10)) * 10,
        y: Math.floor(Math.random() * (canvas.height / 10)) * 10
      };
    } else {
      snake.pop();
    }

    ctx.fillStyle = mainColor;
    snake.forEach(part => ctx.fillRect(part.x, part.y, 8, 8));

    ctx.fillStyle = '#ff3366';
    ctx.fillRect(food.x, food.y, 8, 8);

    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
      snake = [{x: 160, y: 100}];
      dx = 10; dy = 0;
    }
  }, 1000 / 12);
}

function initRadio(canvas, ctx) {
  let bars = Array(20).fill(10);

  gameInterval = setInterval(() => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const mainColor = getComputedStyle(document.body).getPropertyValue('--border-color').trim() || '#00ff66';
    ctx.fillStyle = mainColor;

    bars = bars.map(() => Math.floor(Math.random() * 120) + 10);
    bars.forEach((height, index) => {
      ctx.fillRect(20 + (index * 14), canvas.height - height - 20, 10, height);
    });

    ctx.font = '12px Fira Code, monospace';
    ctx.fillText('STREAMING: Lofi Chill Beats 24/7', 30, 30);
  }, 100);
}

/* ==========================================================================
   7. EXPORTACIÓN & RESPALDO
   ========================================================================== */
function exportDataJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
  downloadFile(dataStr, "meow_admin_backup.json");
  logSystemEvent('EXPORT_JSON', 'Copia JSON descargada.');
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
   8. MÉTRICAS Y PERSISTENCIA
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
