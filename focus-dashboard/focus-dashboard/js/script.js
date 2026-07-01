/* ==========================================================
   Daily Focus Dashboard — app logic
   All data is persisted to localStorage. No frameworks, no backend.
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     THEME (Light / Dark mode)
  --------------------------------------------------------- */
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('dashboard-theme', theme);
  }

  applyTheme(localStorage.getItem('dashboard-theme') || 'light');

  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(current);
  });

  /* ---------------------------------------------------------
     GREETING: clock, date, time-based greeting, custom name
  --------------------------------------------------------- */
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const greetingEl = document.getElementById('greeting');
  const nameInput = document.getElementById('nameInput');
  const saveNameBtn = document.getElementById('saveNameBtn');

  const NAME_KEY = 'dashboard-username';

  function getGreetingWord(hour) {
    if (hour < 5) return 'Good Night';
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  }

  function renderGreeting() {
    const name = localStorage.getItem(NAME_KEY);
    const word = getGreetingWord(new Date().getHours());
    greetingEl.textContent = name ? `${word}, ${name}` : word;
  }

  function tickClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour12: false });
    dateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    renderGreeting();
  }

  nameInput.value = localStorage.getItem(NAME_KEY) || '';

  saveNameBtn.addEventListener('click', () => {
    const value = nameInput.value.trim();
    if (value) {
      localStorage.setItem(NAME_KEY, value);
    } else {
      localStorage.removeItem(NAME_KEY);
    }
    renderGreeting();
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveNameBtn.click();
  });

  tickClock();
  setInterval(tickClock, 1000);

  /* ---------------------------------------------------------
     FOCUS TIMER (Pomodoro, adjustable length)
  --------------------------------------------------------- */
  const timerDisplay = document.getElementById('timerDisplay');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const resetBtn = document.getElementById('resetBtn');
  const durationInput = document.getElementById('durationInput');
  const setDurationBtn = document.getElementById('setDurationBtn');

  const DURATION_KEY = 'dashboard-timer-minutes';
  let sessionMinutes = parseInt(localStorage.getItem(DURATION_KEY), 10) || 25;
  let secondsLeft = sessionMinutes * 60;
  let timerInterval = null;

  durationInput.value = sessionMinutes;

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function renderTimer() {
    timerDisplay.textContent = formatTime(secondsLeft);
  }

  function startTimer() {
    if (timerInterval) return; // already running
    timerInterval = setInterval(() => {
      if (secondsLeft > 0) {
        secondsLeft--;
        renderTimer();
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        timerDisplay.textContent = 'Done!';
        if (Notification && Notification.permission === 'granted') {
          new Notification('Focus session complete!');
        }
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function resetTimer() {
    stopTimer();
    secondsLeft = sessionMinutes * 60;
    renderTimer();
  }

  startBtn.addEventListener('click', startTimer);
  stopBtn.addEventListener('click', stopTimer);
  resetBtn.addEventListener('click', resetTimer);

  setDurationBtn.addEventListener('click', () => {
    const minutes = parseInt(durationInput.value, 10);
    if (!minutes || minutes < 1) return;
    sessionMinutes = minutes;
    localStorage.setItem(DURATION_KEY, sessionMinutes);
    resetTimer();
  });

  renderTimer();

  /* ---------------------------------------------------------
     TASKS: add, edit, complete, delete, sort, persist
  --------------------------------------------------------- */
  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  const taskEmptyState = document.getElementById('taskEmptyState');
  const sortSelect = document.getElementById('sortSelect');

  const TASKS_KEY = 'dashboard-tasks';
  let tasks = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
  let sortMode = localStorage.getItem('dashboard-task-sort') || 'created';
  sortSelect.value = sortMode;

  function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  function getSortedTasks() {
    const copy = [...tasks];
    if (sortMode === 'alpha') {
      copy.sort((a, b) => a.text.localeCompare(b.text));
    } else if (sortMode === 'status') {
      copy.sort((a, b) => Number(a.done) - Number(b.done));
    }
    // 'created' keeps insertion order (array order)
    return copy;
  }

  function renderTasks() {
    taskList.innerHTML = '';
    const sorted = getSortedTasks();
    taskEmptyState.style.display = tasks.length === 0 ? 'block' : 'none';

    sorted.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' done' : '');
      li.dataset.id = task.id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.addEventListener('change', () => {
        task.done = checkbox.checked;
        saveTasks();
        renderTasks();
      });

      const textSpan = document.createElement('span');
      textSpan.className = 'task-text';
      textSpan.textContent = task.text;
      textSpan.contentEditable = 'true';
      textSpan.spellcheck = false;
      textSpan.addEventListener('blur', () => {
        const newText = textSpan.textContent.trim();
        if (!newText) {
          textSpan.textContent = task.text; // revert empty edits
          return;
        }
        task.text = newText;
        saveTasks();
      });
      textSpan.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          textSpan.blur();
        }
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        saveTasks();
        renderTasks();
      });

      li.appendChild(checkbox);
      li.appendChild(textSpan);
      li.appendChild(deleteBtn);
      taskList.appendChild(li);
    });
  }

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    // Challenge: prevent duplicate tasks (case-insensitive)
    const isDuplicate = tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
    if (isDuplicate) {
      taskInput.classList.add('duplicate-warning');
      taskInput.placeholder = 'That task already exists!';
      setTimeout(() => {
        taskInput.classList.remove('duplicate-warning');
        taskInput.placeholder = 'Add a new task…';
      }, 1800);
      return;
    }

    tasks.push({ id: Date.now().toString(), text, done: false });
    saveTasks();
    renderTasks();
    taskInput.value = '';
    taskInput.focus();
  });

  sortSelect.addEventListener('change', () => {
    sortMode = sortSelect.value;
    localStorage.setItem('dashboard-task-sort', sortMode);
    renderTasks();
  });

  renderTasks();

  /* ---------------------------------------------------------
     QUICK LINKS: add, open, remove, persist
  --------------------------------------------------------- */
  const linkForm = document.getElementById('linkForm');
  const linkNameInput = document.getElementById('linkNameInput');
  const linkUrlInput = document.getElementById('linkUrlInput');
  const linkList = document.getElementById('linkList');

  const LINKS_KEY = 'dashboard-links';
  const DEFAULT_LINKS = [
    { id: 'default-1', name: 'Google', url: 'https://www.google.com' },
    { id: 'default-2', name: 'Gmail', url: 'https://mail.google.com' },
    { id: 'default-3', name: 'Calendar', url: 'https://calendar.google.com' }
  ];

  let links = JSON.parse(localStorage.getItem(LINKS_KEY) || 'null') || DEFAULT_LINKS;

  function saveLinks() {
    localStorage.setItem(LINKS_KEY, JSON.stringify(links));
  }

  function normalizeUrl(url) {
    if (!/^https?:\/\//i.test(url)) return `https://${url}`;
    return url;
  }

  function renderLinks() {
    linkList.innerHTML = '';
    links.forEach(link => {
      const chip = document.createElement('a');
      chip.className = 'link-chip';
      chip.href = normalizeUrl(link.url);
      chip.target = '_blank';
      chip.rel = 'noopener noreferrer';

      const label = document.createElement('span');
      label.textContent = link.name;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-link';
      removeBtn.textContent = '✕';
      removeBtn.title = `Remove ${link.name}`;
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        links = links.filter(l => l.id !== link.id);
        saveLinks();
        renderLinks();
      });

      chip.appendChild(label);
      chip.appendChild(removeBtn);
      linkList.appendChild(chip);
    });
  }

  linkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = linkNameInput.value.trim();
    const url = linkUrlInput.value.trim();
    if (!name || !url) return;

    links.push({ id: Date.now().toString(), name, url });
    saveLinks();
    renderLinks();
    linkNameInput.value = '';
    linkUrlInput.value = '';
    linkNameInput.focus();
  });

  renderLinks();

});
