/* =========================================================
   app.js — Personal Dashboard
   Features:
     ✅ Greeting with live clock & date
     ✅ Focus timer (start / pause / reset)
     ✅ To-do list (add, edit, done, delete) + LocalStorage
     ✅ Quick links + LocalStorage
   Challenges implemented (3/5):
     ✅ Light / Dark mode
     ✅ Custom name in greeting
     ✅ Change Pomodoro time
   ========================================================= */

'use strict';

/* ── Utility helpers ── */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function loadLS(key, fallback = null) {
  const raw = localStorage.getItem(key);
  return raw !== null ? JSON.parse(raw) : fallback;
}

/* =========================================================
   1. GREETING — live clock, date, time-of-day greeting
   ========================================================= */
const clockEl     = $('#clock');
const greetingEl  = $('#greeting-text');
const greetNameEl = $('#greeting-name');
const dateEl      = $('#current-date');

function updateClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2, '0');
  const m    = String(now.getMinutes()).padStart(2, '0');
  const s    = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${h}:${m}:${s}`;

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  dateEl.textContent =
    `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const hour = now.getHours();
  let greeting;
  if (hour >= 5  && hour < 12) greeting = 'Good morning';
  else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17 && hour < 21) greeting = 'Good evening';
  else greeting = 'Good night';

  const name = loadLS('userName', '');
  greetingEl.textContent  = name ? `${greeting}, ${name}!` : `${greeting}!`;
  greetNameEl.textContent = name ? `👋 Welcome back, ${name}` : '👆 Set your name';
}

setInterval(updateClock, 1000);
updateClock();

/* =========================================================
   2. CHALLENGE — Custom name in greeting
   ========================================================= */
const nameModal     = $('#name-modal');
const nameInput     = $('#name-input');
const nameSaveBtn   = $('#name-save-btn');
const nameCancelBtn = $('#name-cancel-btn');
const editNameBtn   = $('#edit-name-btn');

function openNameModal() {
  nameInput.value = loadLS('userName', '');
  nameModal.classList.remove('hidden');
  nameInput.focus();
}

function closeNameModal() {
  nameModal.classList.add('hidden');
}

editNameBtn.addEventListener('click', openNameModal);

nameSaveBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  saveLS('userName', name);
  closeNameModal();
  updateClock();
});

nameCancelBtn.addEventListener('click', closeNameModal);

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') nameSaveBtn.click();
  if (e.key === 'Escape') closeNameModal();
});

// Auto-prompt for name on first visit
if (!loadLS('userName')) openNameModal();

/* =========================================================
   3. CHALLENGE — Light / Dark mode
   ========================================================= */
const themeToggle = $('#theme-toggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  saveLS('theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// Load saved theme
applyTheme(loadLS('theme', 'light'));

/* =========================================================
   4. FOCUS TIMER (Pomodoro)
   ========================================================= */
const timerMinEl   = $('#timer-minutes');
const timerSecEl   = $('#timer-seconds');
const startBtn     = $('#timer-start');
const stopBtn      = $('#timer-stop');
const resetBtn     = $('#timer-reset');
const durationInput = $('#pomodoro-duration');
const setDurationBtn = $('#set-duration-btn');
const timerDisplay = $('.timer-display');

let pomoDuration = loadLS('pomoDuration', 25); // minutes
let totalSeconds = pomoDuration * 60;
let remaining    = totalSeconds;
let timerRunning = false;
let timerInterval = null;

durationInput.value = pomoDuration;

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return [String(m).padStart(2, '0'), String(s).padStart(2, '0')];
}

function renderTimer() {
  const [m, s] = formatTime(remaining);
  timerMinEl.textContent = m;
  timerSecEl.textContent = s;
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  timerDisplay.classList.add('running');
  timerInterval = setInterval(() => {
    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.classList.remove('running');
      // Notify user
      timerMinEl.textContent = '00';
      timerSecEl.textContent = '00';
      alert('⏰ Focus session complete! Take a break.');
      return;
    }
    remaining--;
    renderTimer();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerDisplay.classList.remove('running');
}

function resetTimer() {
  pauseTimer();
  remaining = totalSeconds;
  renderTimer();
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Challenge: change Pomodoro duration
setDurationBtn.addEventListener('click', () => {
  const val = parseInt(durationInput.value, 10);
  if (!val || val < 1 || val > 90) {
    alert('Please enter a duration between 1 and 90 minutes.');
    return;
  }
  pauseTimer();
  pomoDuration = val;
  totalSeconds = pomoDuration * 60;
  remaining    = totalSeconds;
  saveLS('pomoDuration', pomoDuration);
  renderTimer();
});

renderTimer();

/* =========================================================
   5. TO-DO LIST
   ========================================================= */
const todoForm   = $('#todo-form');
const todoInput  = $('#todo-input');
const todoListEl = $('#todo-list');
const sortSelect = $('#sort-select');

let todos = loadLS('todos', []);

// Each todo: { id, text, done }
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function saveTodos() {
  saveLS('todos', todos);
}

function getSortedTodos() {
  const copy = [...todos];
  const sort = sortSelect.value;
  if (sort === 'az') copy.sort((a, b) => a.text.localeCompare(b.text));
  else if (sort === 'za') copy.sort((a, b) => b.text.localeCompare(a.text));
  else if (sort === 'done') copy.sort((a, b) => Number(a.done) - Number(b.done));
  return copy;
}

function renderTodos() {
  todoListEl.innerHTML = '';
  const sorted = getSortedTodos();

  if (sorted.length === 0) {
    todoListEl.innerHTML = '<li style="color:var(--text-muted);font-size:.875rem;text-align:center;padding:12px">No tasks yet. Add one above!</li>';
    return;
  }

  sorted.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.dataset.id = todo.id;

    // Checkbox
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'todo-item__check';
    chk.checked = todo.done;
    chk.addEventListener('change', () => toggleTodo(todo.id));

    // Editable text span
    const span = document.createElement('span');
    span.className = 'todo-item__text';
    span.textContent = todo.text;
    span.contentEditable = true;
    span.spellcheck = false;
    span.addEventListener('blur', () => {
      const newText = span.textContent.trim();
      if (!newText) {
        span.textContent = todo.text; // revert if empty
        return;
      }
      // Challenge: prevent duplicate tasks (on edit)
      const duplicate = todos.find(
        (t) => t.id !== todo.id && t.text.toLowerCase() === newText.toLowerCase()
      );
      if (duplicate) {
        alert(`"${newText}" already exists in your list.`);
        span.textContent = todo.text;
        return;
      }
      todo.text = newText;
      saveTodos();
    });
    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); span.blur(); }
      if (e.key === 'Escape') { span.textContent = todo.text; span.blur(); }
    });

    // Actions
    const actions = document.createElement('div');
    actions.className = 'todo-item__actions';

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn--sm btn--danger';
    delBtn.textContent = '🗑';
    delBtn.title = 'Delete task';
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    actions.appendChild(delBtn);
    li.append(chk, span, actions);
    todoListEl.appendChild(li);
  });
}

function addTodo(text) {
  // Challenge: prevent duplicate tasks
  const duplicate = todos.find((t) => t.text.toLowerCase() === text.toLowerCase());
  if (duplicate) {
    alert(`"${text}" is already in your list.`);
    return;
  }
  todos.push({ id: generateId(), text, done: false });
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    saveTodos();
    renderTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  renderTodos();
}

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;
  addTodo(text);
  todoInput.value = '';
  todoInput.focus();
});

sortSelect.addEventListener('change', renderTodos);

renderTodos();

/* =========================================================
   6. QUICK LINKS
   ========================================================= */
const linksGrid  = $('#links-grid');
const linkForm   = $('#link-form');
const linkNameEl = $('#link-name');
const linkUrlEl  = $('#link-url');

let links = loadLS('quickLinks', [
  { id: generateId(), label: 'Google',   url: 'https://google.com' },
  { id: generateId(), label: 'YouTube',  url: 'https://youtube.com' },
  { id: generateId(), label: 'GitHub',   url: 'https://github.com' },
]);

function saveLinks() { saveLS('quickLinks', links); }

function getFavicon(url) {
  try {
    const { origin } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=16`;
  } catch { return ''; }
}

function renderLinks() {
  linksGrid.innerHTML = '';
  if (links.length === 0) {
    linksGrid.innerHTML = '<span style="color:var(--text-muted);font-size:.875rem">No links yet. Add one below!</span>';
    return;
  }
  links.forEach((link) => {
    const a = document.createElement('a');
    a.className = 'link-btn';
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    const favicon = document.createElement('img');
    favicon.src = getFavicon(link.url);
    favicon.width = 16; favicon.height = 16;
    favicon.onerror = () => { favicon.style.display = 'none'; };

    const label = document.createElement('span');
    label.textContent = link.label;

    const del = document.createElement('button');
    del.className = 'link-btn__delete';
    del.textContent = '✕';
    del.title = 'Remove link';
    del.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });

    a.append(favicon, label, del);
    linksGrid.appendChild(a);
  });
}

function addLink(label, url) {
  links.push({ id: generateId(), label, url });
  saveLinks();
  renderLinks();
}

function deleteLink(id) {
  links = links.filter((l) => l.id !== id);
  saveLinks();
  renderLinks();
}

linkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const label = linkNameEl.value.trim();
  let   url   = linkUrlEl.value.trim();
  if (!label || !url) return;

  // Auto-prepend https:// if missing
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  addLink(label, url);
  linkNameEl.value = '';
  linkUrlEl.value  = '';
  linkNameEl.focus();
});

renderLinks();
