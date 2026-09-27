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

/* ==========================================================================
   CASSETTE PLAYER & FLAC AUDIO ENGINE
   ========================================================================== */
let audioEngine = null;

function getAudioEngine() {
  if (!audioEngine) {
    audioEngine = document.getElementById('audioEngine');
    
    // Sincronizar eventos de reproducción con las animaciones de la cinta
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

  // Crear URL local temporal para reproducir el archivo cargado
  const fileURL = URL.createObjectURL(file);
  player.src = fileURL;

  if (titleLabel) {
    titleLabel.innerText = file.name.toUpperCase();
  }

  logSystemEvent('CASSETTE_MOUNT', `Cargado: ${file.name}`);
  
  // Reproduce automáticamente al montar el archivo
  player.play().catch(err => {
    logSystemEvent('AUDIO_ERROR', 'Requiere interacción del usuario para reproducir.');
  });
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

/* ==========================================================================
   EXEC: GAMES.SH (PONG, SNAKE & LO-FI RADIO)
   ========================================================================== */
let gameInterval = null;
let currentGame = null;

function loadGame(gameType) {
  clearInterval(gameInterval);
  currentGame = gameType;
  
  const canvas = document.getElementById('arcadeCanvas');
  const ctx = canvas.getContext('2d');
  const title = document.getElementById('gameTitle');
  const controls = document.getElementById('touchControls');

  // Limpiar pantalla
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

/* 1. 🕹️ PONG.SH */
function initPong(canvas, ctx) {
  let paddleY = 80;
  let ballX = 160, ballY = 100;
  let ballDX = 3, ballDY = 2;

  document.getElementById('btnUp').onclick = () => { paddleY = Math.max(0, paddleY - 15); };
  document.getElementById('btnDown').onclick = () => { paddleY = Math.min(canvas.height - 40, paddleY + 15); };

  gameInterval = setInterval(() => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Obtener color dinámico del tema activo
    const mainColor = getComputedStyle(document.body).getPropertyValue('--border-color').trim() || '#00ff66';
    ctx.fillStyle = mainColor;

    // Raqueta Jugador
    ctx.fillRect(10, paddleY, 8, 40);
    // Bola
    ctx.fillRect(ballX, ballY, 6, 6);

    ballX += ballDX;
    ballY += ballDY;

    // Rebotes techo/piso
    if (ballY <= 0 || ballY >= canvas.height - 6) ballDY *= -1;

    // Rebote raqueta
    if (ballX <= 18 && ballY >= paddleY && ballY <= paddleY + 40) ballDX *= -1;

    // Reinicio si sale
    if (ballX <= 0 || ballX >= canvas.width) {
      ballX = 160; ballY = 100;
    }
  }, 1000 / 30);
}

/* 2. 🐍 SNAKE.SH */
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

    // Mover Serpiente
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    snake.unshift(head);

    // Comer comida
    if (head.x === food.x && head.y === food.y) {
      food = {
        x: Math.floor(Math.random() * (canvas.width / 10)) * 10,
        y: Math.floor(Math.random() * (canvas.height / 10)) * 10
      };
    } else {
      snake.pop();
    }

    // Dibujar Serpiente
    ctx.fillStyle = mainColor;
    snake.forEach(part => ctx.fillRect(part.x, part.y, 8, 8));

    // Dibujar Comida
    ctx.fillStyle = '#ff3366';
    ctx.fillRect(food.x, food.y, 8, 8);

    // Choque pared
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
      snake = [{x: 160, y: 100}];
      dx = 10; dy = 0;
    }
  }, 1000 / 12);
}

/* 3. 📻 RADIO.SH (LO-FI) */
function initRadio(canvas, ctx) {
  let bars = Array(20).fill(10);

  gameInterval = setInterval(() => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const mainColor = getComputedStyle(document.body).getPropertyValue('--border-color').trim() || '#00ff66';
    ctx.fillStyle = mainColor;

    // Dibujar ecualizador visual dinámico
    bars = bars.map(() => Math.floor(Math.random() * 120) + 10);
    bars.forEach((height, index) => {
      ctx.fillRect(20 + (index * 14), canvas.height - height - 20, 10, height);
    });

    ctx.font = '12px Courier New';
    ctx.fillText('STREAMING: Lofi Chill Beats 24/7', 30, 30);
  }, 100);
}
