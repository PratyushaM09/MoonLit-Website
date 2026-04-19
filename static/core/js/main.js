console.log("✅ main.js loaded");
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM fully loaded");

    const sidebarLinks = document.querySelectorAll('.sidebar-icon-link');
    const mainPanel = document.getElementById("main-panel");

    async function loadPanel(panel) {
        mainPanel.innerHTML = `<div class="panel-loading">Loading...</div>`;
        try {
            const res = await fetch(`/load-panel/${panel}/`);
            if (!res.ok) throw new Error("Panel fetch failed");
            const html = await res.text();
            mainPanel.classList.remove("fade-in"); void mainPanel.offsetWidth;
            mainPanel.innerHTML = html;

            // ✅ Modular per-panel hooks
            if (panel === 'timer' && typeof setupTimer === 'function') setupTimer();
            if (panel === 'tasks' && typeof attachTasksPanelLogic === 'function') attachTasksPanelLogic();
            if (panel === 'goals' && typeof attachGoalsPanelLogic === 'function') attachGoalsPanelLogic();
            // ⛔ groups.js now manages groups — do not call attachGroupsPanelLogic()

            mainPanel.classList.add("fade-in");
        } catch (err) {
            console.error("❌ Error loading panel:", err);
            mainPanel.innerHTML = `<p class="error">Error loading panel.</p>`;
        }
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('active-icon'));
            link.classList.add('active-icon');
            loadPanel(link.dataset.panel);
        });
    });
});


// ================= LOGIN & SIGNUP =================
function toggleLoginOptions() {
    const loginOptions = document.getElementById("loginOptions");
    loginOptions.style.display = loginOptions.style.display === "block" ? "none" : "block";
}

document.addEventListener("DOMContentLoaded", () => {
    // Signup modal
    const modal = document.getElementById("signup-modal");
    const signupLinks = document.querySelectorAll(".signup-trigger");
    const closeBtn = document.querySelector(".close-btn");

    signupLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            modal.classList.add("show");
        });
    });

    if (closeBtn) closeBtn.addEventListener("click", () => modal.classList.remove("show"));
    window.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("show"); });
});

// ================== TIMER ==================
function setupTimer() {
    let timer, minutes = 25, seconds = 0, isRunning = false;
    const display = document.getElementById('timer-display');

    function updateTimerDisplay() {
        if (display) display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function playAlarm() {
        const audio = new Audio('/static/core/audio/alarm.mp3');
        audio.play();
    }

    function startPomodoro() {
        if (isRunning) return;
        isRunning = true;
        timer = setInterval(() => {
            if (seconds === 0) {
                if (minutes === 0) { clearInterval(timer); alert("⏰ Time's up!"); playAlarm(); isRunning = false; return; }
                minutes--; seconds = 59;
            } else seconds--;
            updateTimerDisplay();
        }, 1000);
    }

    function resetTimer() { clearInterval(timer); isRunning = false; minutes = 25; seconds = 0; updateTimerDisplay(); }
    function pauseTimer() { clearInterval(timer); isRunning = false; }

    document.getElementById('start-timer')?.addEventListener('click', startPomodoro);
    document.getElementById('pause-timer')?.addEventListener('click', pauseTimer);
    document.getElementById('reset-timer')?.addEventListener('click', resetTimer);

    updateTimerDisplay();
}

// ================== PANEL & SIDEBAR ==================
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM fully loaded");

    const sidebarLinks = document.querySelectorAll('.sidebar-icon-link');
    const mainPanel = document.getElementById("main-panel");
    const sidebar = document.getElementById('group-sidebar');

    async function loadPanel(panel) {
        mainPanel.innerHTML = `<div class="panel-loading">Loading...</div>`;
        try {
            const res = await fetch(`/load-panel/${panel}/`);
            if (!res.ok) throw new Error("Panel fetch failed");
            const html = await res.text();
            mainPanel.classList.remove("fade-in"); void mainPanel.offsetWidth;
            mainPanel.innerHTML = html;

            if (panel === 'timer') setupTimer();
            //if (panel === 'groups') attachGroupsPanelLogic();
            if (panel === 'tasks') attachTasksPanelLogic();
            if (panel === 'goals') attachGoalsPanelLogic();

            mainPanel.classList.add("fade-in");
        } catch (err) {
            console.error("❌ Error loading panel:", err);
            mainPanel.innerHTML = `<p class="error">Error loading panel.</p>`;
        }
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('active-icon'));
            link.classList.add('active-icon');
            loadPanel(link.dataset.panel);
        });
    });

    // Load default panel
    loadPanel('groups');

  
});

// ================== GOALS PANEL ==================
function attachGoalsPanelLogic() {
    console.log("🔄 Attaching goals panel logic");
    const goalCategories = document.querySelector(".goal-left");
    const goalList = document.getElementById("goal-list");
    const addCategoryBtn = document.getElementById("add-category-btn");
    const addGoalBtn = document.getElementById("add-goal-btn");
    const goalModal = document.getElementById("goal-modal");
    const saveGoalBtn = document.getElementById("save-goal-btn");
    const cancelGoalBtn = document.getElementById("cancel-goal-btn");
    const goalTitleInput = document.getElementById("goal-title");
    const goalProgressInput = document.getElementById("goal-progress");
    const goalTasksInput = document.getElementById("goal-tasks");

    if (!goalCategories || !goalList || !addGoalBtn || !goalModal || !saveGoalBtn || !cancelGoalBtn || !goalTitleInput || !goalProgressInput || !goalTasksInput) {
        console.warn("⚠ Goals panel elements not found. Skipping attachGoalsPanelLogic.");
        return;
    }

    let currentCategory = "Coding";
    let editIndex = null;

    let goalsData = JSON.parse(localStorage.getItem("goalsData")) || {
        "Coding": [], "College": [], "Project": [], "Personal": []
    };

    function saveToLocal() { localStorage.setItem("goalsData", JSON.stringify(goalsData)); }
    function renderCategories() {
        const periods = goalCategories.querySelectorAll(".task-period");
        periods.forEach(period => {
            period.classList.toggle("active", period.dataset.category === currentCategory);
            period.onclick = () => { currentCategory = period.dataset.category; renderCategories(); renderGoals(); };
        });
    }

    function renderGoals() {
        goalList.innerHTML = "";
        const goals = goalsData[currentCategory] || [];
        goals.forEach((goal, gIndex) => {
            const goalCard = document.createElement("div");
            goalCard.classList.add("goal-card");
            goalCard.innerHTML = `
                <div class="goal-header">
                    <h3 class="${goal.completed ? 'completed' : ''}">${goal.title}</h3>
                    <div class="goal-actions">
                        <button class="edit-btn">✏</button>
                        <button class="delete-btn">🗑</button>
                        <button class="complete-btn">✅</button>
                    </div>
                </div>
                <div class="goal-content">
                    <div class="progress-bar"><div class="progress" style="width: ${goal.progress}%;"></div></div>
                    <ul class="task-list">
                        ${goal.tasks.map((t, tIndex) => `<li><input type="checkbox" data-task-index="${tIndex}" ${t.completed ? 'checked' : ''}><span class="${t.completed ? 'completed' : ''}">${t.name}</span></li>`).join("")}
                    </ul>
                </div>
            `;
            // Event listeners for edit, delete, complete, tasks
            goalCard.querySelector(".edit-btn").onclick = () => { editIndex = gIndex; goalTitleInput.value = goal.title; goalProgressInput.value = goal.progress; goalTasksInput.value = goal.tasks.map(t => t.name).join(", "); goalModal.classList.remove("hidden"); };
            goalCard.querySelector(".delete-btn").onclick = () => { if (confirm("Delete this goal?")) { goalsData[currentCategory].splice(gIndex,1); saveToLocal(); renderGoals(); } };
            goalCard.querySelector(".complete-btn").onclick = () => { goal.completed = !goal.completed; saveToLocal(); renderGoals(); };
            goalCard.querySelectorAll(".task-list input[type='checkbox']").forEach(cb => { cb.onchange = () => { const tIndex = parseInt(cb.dataset.taskIndex); goal.tasks[tIndex].completed = cb.checked; saveToLocal(); renderGoals(); }; });
            goalList.appendChild(goalCard);
        });
    }

    addGoalBtn.onclick = () => { editIndex = null; goalTitleInput.value=""; goalProgressInput.value=""; goalTasksInput.value=""; goalModal.classList.remove("hidden"); };
    saveGoalBtn.onclick = () => {
        const title = goalTitleInput.value.trim();
        const progress = parseInt(goalProgressInput.value) || 0;
        const tasks = goalTasksInput.value.split(",").map(t=>t.trim()).filter(Boolean).map(t=>({name:t,completed:false}));
        if(!title || progress<0 || progress>100){ alert("⚠ Please enter valid details"); return; }
        const goalObj={title,progress,tasks,completed:false};
        if(editIndex!==null) goalsData[currentCategory][editIndex]=goalObj; else goalsData[currentCategory].push(goalObj);
        saveToLocal(); renderGoals(); goalModal.classList.add("hidden");
    };
    cancelGoalBtn.onclick = () => goalModal.classList.add("hidden");
    addCategoryBtn?.addEventListener('click',()=>{ const newCat=prompt("Enter new category:"); if(newCat && !goalsData[newCat]){ goalsData[newCat]=[]; saveToLocal(); renderCategories(); renderGoals(); } else if(goalsData[newCat]) alert("Category exists"); });

    renderCategories(); renderGoals();
}

// ================== TASKS PANEL ==================
function attachTasksPanelLogic() {
    console.log("🔄 Attaching tasks panel logic");

    const taskCategories = document.querySelector(".task-left");
    const taskList = document.getElementById("task-list");
    const addTaskBtn = document.getElementById("add-task-btn");
    const taskModal = document.getElementById("task-modal");
    const saveTaskBtn = document.getElementById("save-task-btn");
    const cancelTaskBtn = document.getElementById("cancel-task-btn");
    const taskTitleInput = document.getElementById("task-title");
    const taskProgressInput = document.getElementById("task-progress");
    const taskSubtasksInput = document.getElementById("task-subtasks");

    if(!taskCategories || !taskList || !addTaskBtn || !taskModal || !saveTaskBtn || !cancelTaskBtn || !taskTitleInput || !taskProgressInput || !taskSubtasksInput){
        console.warn("⚠ Tasks panel elements not found. Skipping attachTasksPanelLogic."); return;
    }

    let currentTaskCategory="Work", editTaskIndex=null;
    let tasksData=JSON.parse(localStorage.getItem("tasksData")) || { "Work":[], "College":[], "Personal":[] };

    function saveTasksToLocal(){ localStorage.setItem("tasksData",JSON.stringify(tasksData)); }
    function renderTaskCategories(){ taskCategories.querySelectorAll(".task-period").forEach(cat=>{ cat.classList.toggle("active",cat.dataset.category===currentTaskCategory); cat.onclick=()=>{ currentTaskCategory=cat.dataset.category; renderTaskCategories(); renderTasks(); }; }); }
    function renderTasks(){
        taskList.innerHTML="";
        (tasksData[currentTaskCategory]||[]).forEach((task,tIndex)=>{
            const taskCard=document.createElement("div"); taskCard.classList.add("task-card");
            taskCard.innerHTML=`
                <div class="task-header">
                    <h3 class="${task.completed?'completed':''}">${task.title}</h3>
                    <div class="task-actions">
                        <button class="edit-btn">✏</button>
                        <button class="delete-btn">🗑</button>
                        <button class="complete-btn">✅</button>
                    </div>
                </div>
                <div class="task-content">
                    <div class="progress-bar"><div class="progress" style="width:${task.progress}%;"></div></div>
                    <ul class="subtask-list">${(task.subtasks||[]).map((s,sIndex)=>`<li><input type="checkbox" data-subtask-index="${sIndex}" ${s.completed?'checked':''}><span class="${s.completed?'completed':''}">${s.name}</span></li>`).join("")}</ul>
                </div>
            `;
            taskCard.querySelector(".edit-btn").onclick=()=>{ editTaskIndex=tIndex; taskTitleInput.value=task.title; taskProgressInput.value=task.progress; taskSubtasksInput.value=(task.subtasks||[]).map(s=>s.name).join(","); taskModal.classList.remove("hidden"); };
            taskCard.querySelector(".delete-btn").onclick=()=>{ if(confirm("Delete this task?")){ tasksData[currentTaskCategory].splice(tIndex,1); saveTasksToLocal(); renderTasks(); } };
            taskCard.querySelector(".complete-btn").onclick=()=>{ task.completed=!task.completed; saveTasksToLocal(); renderTasks(); };
            taskCard.querySelectorAll(".subtask-list input[type='checkbox']").forEach(cb=>{ cb.onchange=()=>{ const sIndex=parseInt(cb.dataset.subtaskIndex); task.subtasks[sIndex].completed=cb.checked; saveTasksToLocal(); renderTasks(); }; });
            taskList.appendChild(taskCard);
        });
    }

    addTaskBtn.onclick=()=>{ editTaskIndex=null; taskTitleInput.value=""; taskProgressInput.value=""; taskSubtasksInput.value=""; taskModal.classList.remove("hidden"); };
    saveTaskBtn.onclick=()=>{ const title=taskTitleInput.value.trim(); const progress=parseInt(taskProgressInput.value)||0; const subtasks=taskSubtasksInput.value.split(",").map(s=>s.trim()).filter(Boolean).map(s=>({name:s,completed:false})); if(!title||progress<0||progress>100){ alert("⚠ Please enter valid details"); return;} const taskObj={title,progress,subtasks,completed:false}; if(editTaskIndex!==null) tasksData[currentTaskCategory][editTaskIndex]=taskObj; else tasksData[currentTaskCategory].push(taskObj); saveTasksToLocal(); renderTasks(); taskModal.classList.add("hidden"); };
    cancelTaskBtn.onclick=()=>taskModal.classList.add("hidden");

    renderTaskCategories(); renderTasks();
}
