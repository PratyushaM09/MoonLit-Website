// ---------- Auth bootstrap ----------
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user) {
  window.location.href = 'login.html';
}

document.getElementById('welcomeMsg').textContent = `Welcome, ${user?.firstName || user?.username || ''}!`;
document.getElementById('userEmail').textContent = user?.email || '';

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

function authHeaders() {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function apiGet(url) {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GET ${url} failed`);
  return res.json();
}
async function apiPost(url, body) {
  const res = await fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`POST ${url} failed`);
  return res.json();
}
async function apiPatch(url) {
  const res = await fetch(url, { method: 'PATCH', headers: authHeaders() });
  if (!res.ok) throw new Error(`PATCH ${url} failed`);
  return res.json();
}
async function apiDelete(url) {
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
  return res;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------- Sidebar / panel routing (Discord style: nothing auto-opens) ----------
const panelArea = document.getElementById('panelArea');
const sideButtons = document.querySelectorAll('.side-btn');

const panelRenderers = {
  groups: renderComingSoon('Groups', 'Create/join groups with chat + whiteboard — coming soon.'),
  tasks: renderTasksPanel,
  goals: renderGoalsPanel,
  timer: renderComingSoon('Timer', 'Stopwatch, Pomodoro, custom timers — coming soon.'),
  profile: renderComingSoon('Profile', 'Edit your profile — coming soon.'),
  settings: renderComingSoon('Settings', 'Privacy, camera/mic permissions, general settings — coming soon.'),
};

sideButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    sideButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    panelRenderers[btn.dataset.panel]();
  });
});

function renderComingSoon(title, message) {
  return () => {
    panelArea.innerHTML = `
      <div class="panel-header"><h2>${title}</h2></div>
      <p class="muted-note">${message}</p>
    `;
    if (window.lucide) lucide.createIcons();
  };
}

// ======================================================================
// TASKS PANEL — categories AND timeframes are fully user-defined
// ======================================================================
let taskState = { categories: [], timeframes: [], tasks: [], activeCategory: null, activeTimeframe: null };

async function renderTasksPanel() {
  panelArea.innerHTML = `<p class="muted-note">Loading tasks…</p>`;
  try {
    const [categories, timeframes, tasks] = await Promise.all([
      apiGet('/api/categories?scope=TASK'),
      apiGet('/api/timeframes'),
      apiGet('/api/tasks'),
    ]);
    taskState.categories = categories;
    taskState.timeframes = timeframes;
    taskState.tasks = tasks;
    if (!taskState.activeCategory && categories.length) taskState.activeCategory = categories[0].id;
    if (!taskState.activeTimeframe && timeframes.length) taskState.activeTimeframe = timeframes[0].id;
    drawTasksPanel();
  } catch (err) {
    panelArea.innerHTML = `<p class="muted-note">Couldn't load tasks. Is the backend running?</p>`;
  }
}

function drawTasksPanel() {
  const tfTabs = taskState.timeframes.map(t => `
    <button class="tab ${t.id === taskState.activeTimeframe ? 'active' : ''}" data-tf="${t.id}">${escapeHtml(t.name)}</button>
  `).join('');

  const catTabs = taskState.categories.map(c => `
    <button class="tab ${c.id === taskState.activeCategory ? 'active' : ''}" data-cat="${c.id}">${escapeHtml(c.name)}</button>
  `).join('');

  const filtered = taskState.tasks.filter(
    t => t.categoryId === taskState.activeCategory && t.timeframeId === taskState.activeTimeframe
  );

  const rows = taskState.categories.length === 0
    ? `<p class="muted-note">Create a category to start adding tasks.</p>`
    : taskState.timeframes.length === 0
      ? `<p class="muted-note">Create a timeframe (e.g. "Today") to start adding tasks.</p>`
      : filtered.length
        ? filtered.map(t => `
          <div class="task-row ${t.completed ? 'done' : ''}" data-id="${t.id}">
            <div class="task-check" data-toggle="${t.id}"></div>
            <div class="task-title">${escapeHtml(t.title)}</div>
            <button class="icon-btn" data-delete="${t.id}"><i data-lucide="trash-2"></i></button>
          </div>`).join('')
        : `<p class="muted-note">No tasks here yet.</p>`;

  panelArea.innerHTML = `
    <div class="panel-header"><h2>Tasks</h2></div>
    <div class="tab-row">
      ${tfTabs}
      <button class="tab-add" id="addTimeframeBtn" title="New timeframe"><i data-lucide="plus"></i></button>
    </div>
    <div class="tab-row">
      ${catTabs}
      <button class="tab-add" id="addCategoryBtn" title="New category"><i data-lucide="plus"></i></button>
    </div>
    <div class="task-list">${rows}</div>
    <div class="add-row">
      <input type="text" id="newTaskInput" placeholder="Add new task…" ${taskState.categories.length && taskState.timeframes.length ? '' : 'disabled'} />
      <button class="btn-solid" id="addTaskBtn">Add</button>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  panelArea.querySelectorAll('[data-cat]').forEach(b =>
    b.addEventListener('click', () => { taskState.activeCategory = Number(b.dataset.cat); drawTasksPanel(); }));
  panelArea.querySelectorAll('[data-tf]').forEach(b =>
    b.addEventListener('click', () => { taskState.activeTimeframe = Number(b.dataset.tf); drawTasksPanel(); }));
  panelArea.querySelectorAll('[data-toggle]').forEach(b =>
    b.addEventListener('click', () => toggleTask(b.dataset.toggle)));
  panelArea.querySelectorAll('[data-delete]').forEach(b =>
    b.addEventListener('click', () => deleteTask(b.dataset.delete)));

  document.getElementById('addTaskBtn').addEventListener('click', addTask);
  document.getElementById('newTaskInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
  document.getElementById('addCategoryBtn').addEventListener('click', () => addCategory('TASK'));
  document.getElementById('addTimeframeBtn').addEventListener('click', addTimeframe);
}

async function addCategory(scope) {
  const name = prompt(scope === 'TASK' ? 'New task category name:' : 'New goal category name:');
  if (!name || !name.trim()) return;
  const created = await apiPost('/api/categories', { name: name.trim(), scope });
  if (scope === 'TASK') {
    taskState.categories.push(created);
    taskState.activeCategory = created.id;
    drawTasksPanel();
  } else {
    goalState.categories.push(created);
    goalState.activeCategory = created.id;
    drawGoalsPanel();
  }
}

async function addTimeframe() {
  const name = prompt('New timeframe name (e.g. "Today", "This week"):');
  if (!name || !name.trim()) return;
  const created = await apiPost('/api/timeframes', { name: name.trim() });
  taskState.timeframes.push(created);
  taskState.activeTimeframe = created.id;
  drawTasksPanel();
}

async function addTask() {
  const input = document.getElementById('newTaskInput');
  const title = input.value.trim();
  if (!title || !taskState.activeCategory || !taskState.activeTimeframe) return;
  const created = await apiPost('/api/tasks', {
    title, categoryId: taskState.activeCategory, timeframeId: taskState.activeTimeframe, completed: false,
  });
  taskState.tasks.push(created);
  drawTasksPanel();
}

async function toggleTask(id) {
  const updated = await apiPatch(`/api/tasks/${id}/toggle`);
  taskState.tasks = taskState.tasks.map(t => t.id === updated.id ? updated : t);
  drawTasksPanel();
}

async function deleteTask(id) {
  const res = await apiDelete(`/api/tasks/${id}`);
  if (res.ok || res.status === 204) {
    taskState.tasks = taskState.tasks.filter(t => String(t.id) !== String(id));
    drawTasksPanel();
  }
}

// ======================================================================
// GOALS PANEL — categories are user-defined; each goal has a checklist
// ======================================================================
let goalState = { categories: [], goals: [], activeCategory: null };

async function renderGoalsPanel() {
  panelArea.innerHTML = `<p class="muted-note">Loading goals…</p>`;
  try {
    const [categories, goals] = await Promise.all([
      apiGet('/api/categories?scope=GOAL'),
      apiGet('/api/goals'),
    ]);
    goalState.categories = categories;
    goalState.goals = goals;
    if (!goalState.activeCategory && categories.length) goalState.activeCategory = categories[0].id;
    drawGoalsPanel();
  } catch (err) {
    panelArea.innerHTML = `<p class="muted-note">Couldn't load goals. Is the backend running?</p>`;
  }
}

function drawGoalsPanel() {
  const catTabs = goalState.categories.map(c => `
    <button class="tab ${c.id === goalState.activeCategory ? 'active' : ''}" data-gcat="${c.id}">${escapeHtml(c.name)}</button>
  `).join('');

  const goals = goalState.goals.filter(g => g.categoryId === goalState.activeCategory);

  const cards = goalState.categories.length === 0
    ? `<p class="muted-note">Create a category to start adding goals.</p>`
    : goals.length
      ? `<div class="goal-grid">${goals.map(goalCardHtml).join('')}</div>`
      : `<p class="muted-note">No goals in this category yet.</p>`;

  panelArea.innerHTML = `
    <div class="panel-header"><h2>Goals</h2></div>
    <div class="tab-row">
      ${catTabs}
      <button class="tab-add" id="addGoalCategoryBtn" title="New category"><i data-lucide="plus"></i></button>
    </div>
    ${cards}
    <button class="btn-solid" id="addGoalBtn" ${goalState.categories.length ? '' : 'disabled'}>+ Add Goal</button>
  `;

  if (window.lucide) lucide.createIcons();

  panelArea.querySelectorAll('[data-gcat]').forEach(b =>
    b.addEventListener('click', () => { goalState.activeCategory = Number(b.dataset.gcat); drawGoalsPanel(); }));
  document.getElementById('addGoalCategoryBtn').addEventListener('click', () => addCategory('GOAL'));
  document.getElementById('addGoalBtn').addEventListener('click', addGoal);

  panelArea.querySelectorAll('[data-goal-delete]').forEach(b =>
    b.addEventListener('click', () => deleteGoal(b.dataset.goalDelete)));
  panelArea.querySelectorAll('[data-item-toggle]').forEach(b =>
    b.addEventListener('click', () => toggleGoalItem(b.dataset.itemToggle)));
  panelArea.querySelectorAll('[data-item-delete]').forEach(b =>
    b.addEventListener('click', () => deleteGoalItem(b.dataset.itemDelete)));
  panelArea.querySelectorAll('.goal-add-item-btn').forEach(b =>
    b.addEventListener('click', () => addGoalItem(b.dataset.goalId)));
}

function goalCardHtml(g) {
  const items = g.items.map(i => `
    <div class="goal-item ${i.completed ? 'done' : ''}">
      <div class="task-check" data-item-toggle="${i.id}"></div>
      <span style="flex:1">${escapeHtml(i.text)}</span>
      <button class="icon-btn" data-item-delete="${i.id}"><i data-lucide="x"></i></button>
    </div>
  `).join('');

  return `
    <div class="goal-card">
      <div class="goal-card-header">
        <h3>${escapeHtml(g.title)}</h3>
        <button class="icon-btn" data-goal-delete="${g.id}"><i data-lucide="trash-2"></i></button>
      </div>
      <div class="goal-items">${items || '<p class="muted-note">No checklist items yet.</p>'}</div>
      <div class="goal-add-item">
        <input type="text" placeholder="Add item…" id="goalItemInput-${g.id}">
        <button class="icon-btn goal-add-item-btn" data-goal-id="${g.id}"><i data-lucide="plus"></i></button>
      </div>
    </div>
  `;
}

async function addGoal() {
  const title = prompt('Goal title:');
  if (!title || !title.trim() || !goalState.activeCategory) return;
  const created = await apiPost('/api/goals', { title: title.trim(), categoryId: goalState.activeCategory });
  goalState.goals.push(created);
  drawGoalsPanel();
}

async function deleteGoal(id) {
  const res = await apiDelete(`/api/goals/${id}`);
  if (res.ok || res.status === 204) {
    goalState.goals = goalState.goals.filter(g => String(g.id) !== String(id));
    drawGoalsPanel();
  }
}

async function addGoalItem(goalId) {
  const input = document.getElementById(`goalItemInput-${goalId}`);
  const text = input.value.trim();
  if (!text) return;
  const updated = await apiPost(`/api/goals/${goalId}/items`, { text });
  goalState.goals = goalState.goals.map(g => g.id === updated.id ? updated : g);
  drawGoalsPanel();
}

async function toggleGoalItem(itemId) {
  const updated = await apiPatch(`/api/goals/items/${itemId}/toggle`);
  goalState.goals = goalState.goals.map(g => g.id === updated.id ? updated : g);
  drawGoalsPanel();
}

async function deleteGoalItem(itemId) {
  const res = await fetch(`/api/goals/items/${itemId}`, { method: 'DELETE', headers: authHeaders() });
  if (res.ok) {
    const updated = await res.json();
    goalState.goals = goalState.goals.map(g => g.id === updated.id ? updated : g);
    drawGoalsPanel();
  }
}

// init icons for sidebar on first paint
if (window.lucide) lucide.createIcons();
