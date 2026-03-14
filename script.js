const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const dateInput = document.getElementById("dateInput");
const searchInput = document.getElementById("searchInput");

const taskList = document.getElementById("taskList");
const message = document.getElementById("message");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");
const highPriorityTasks = document.getElementById("highPriorityTasks");

const filterButtons = document.querySelectorAll(".filter-btn");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

const modalOverlay = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const editTaskForm = document.getElementById("editTaskForm");
const editTaskInput = document.getElementById("editTaskInput");
const editPriorityInput = document.getElementById("editPriorityInput");
const editDateInput = document.getElementById("editDateInput");

const themeToggle = document.getElementById("themeToggle");

let tasks = JSON.parse(localStorage.getItem("tasks-pro")) || [];
let currentFilter = "all";
let currentSearch = "";
let editingTaskId = null;

const savedTheme = localStorage.getItem("task-theme") || "dark";
setTheme(savedTheme);

function saveTasks() {
  localStorage.setItem("tasks-pro", JSON.stringify(tasks));
}

function saveTheme(theme) {
  localStorage.setItem("task-theme", theme);
}

function setTheme(theme) {
  if (theme === "light") {
    document.body.classList.remove("theme-dark");
    document.body.classList.add("theme-light");
    themeToggle.textContent = "🌙 Dark";
  } else {
    document.body.classList.remove("theme-light");
    document.body.classList.add("theme-dark");
    themeToggle.textContent = "☀️ Light";
  }
}

function formatDate(dateString) {
  if (!dateString) return "No due date";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const high = tasks.filter(task => task.priority === "High").length;

  totalTasks.textContent = total;
  completedTasks.textContent = completed;
  pendingTasks.textContent = pending;
  highPriorityTasks.textContent = high;
}

function showMessage(filteredTasks) {
  if (tasks.length === 0) {
    message.textContent = "Add your first task to get started.";
    return;
  }

  if (filteredTasks.length === 0) {
    message.textContent = "No tasks match your current filter.";
    return;
  }

  message.textContent = "";
}

function getFilteredTasks() {
  let filtered = [...tasks];

  if (currentFilter === "completed") {
    filtered = filtered.filter(task => task.completed);
  } else if (currentFilter === "pending") {
    filtered = filtered.filter(task => !task.completed);
  }

  if (currentSearch.trim()) {
    filtered = filtered.filter(task =>
      task.text.toLowerCase().includes(currentSearch.toLowerCase())
    );
  }

  filtered.sort((a, b) => {
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };

    if (a.completed !== b.completed) {
      return a.completed - b.completed;
    }

    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }

    return b.id - a.id;
  });

  return filtered;
}

function openEditModal(task) {
  editingTaskId = task.id;
  editTaskInput.value = task.text;
  editPriorityInput.value = task.priority;
  editDateInput.value = task.dueDate || "";
  modalOverlay.classList.remove("hidden");
}

function closeEditModal() {
  editingTaskId = null;
  modalOverlay.classList.add("hidden");
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = `task-item ${task.completed ? "completed" : ""}`;
  li.draggable = true;
  li.dataset.id = task.id;

  const overdueBadge = isOverdue(task)
    ? `<span class="badge overdue">Overdue</span>`
    : "";

  li.innerHTML = `
    <div class="task-left">
      <input type="checkbox" class="task-check" ${task.completed ? "checked" : ""} />
      <div class="task-content">
        <p class="task-text">${task.text}</p>
        <div class="task-meta">
          <span class="badge ${task.priority.toLowerCase()}">${task.priority} Priority</span>
          <span class="badge">${formatDate(task.dueDate)}</span>
          ${overdueBadge}
        </div>
      </div>
    </div>

    <div class="task-actions">
      <button class="action-btn edit" type="button">Edit</button>
      <button class="action-btn delete" type="button">Delete</button>
    </div>
  `;

  const checkbox = li.querySelector(".task-check");
  const editBtn = li.querySelector(".edit");
  const deleteBtn = li.querySelector(".delete");

  checkbox.addEventListener("change", function () {
    task.completed = checkbox.checked;
    saveTasks();
    renderTasks();
  });

  editBtn.addEventListener("click", function () {
    openEditModal(task);
  });

  deleteBtn.addEventListener("click", function () {
    tasks = tasks.filter(item => item.id !== task.id);
    saveTasks();
    renderTasks();
  });

  li.addEventListener("dragstart", function () {
    li.classList.add("dragging");
  });

  li.addEventListener("dragend", function () {
    li.classList.remove("dragging");

    const ids = [...taskList.querySelectorAll(".task-item")].map(item => Number(item.dataset.id));
    tasks = ids.map(id => tasks.find(task => task.id === id)).filter(Boolean);
    saveTasks();
    renderTasks();
  });

  return li;
}

function renderTasks() {
  taskList.innerHTML = "";

  const filteredTasks = getFilteredTasks();

  filteredTasks.forEach(task => {
    taskList.appendChild(createTaskElement(task));
  });

  updateStats();
  showMessage(filteredTasks);
}

taskList.addEventListener("dragover", function (e) {
  e.preventDefault();
  const dragging = document.querySelector(".dragging");
  const siblings = [...taskList.querySelectorAll(".task-item:not(.dragging)")];

  const nextSibling = siblings.find(sibling => {
    return e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2;
  });

  taskList.insertBefore(dragging, nextSibling || null);
});

taskForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const text = taskInput.value.trim();
  const priority = priorityInput.value;
  const dueDate = dateInput.value;

  if (!text) {
    message.textContent = "Please enter a task.";
    return;
  }

  const newTask = {
    id: Date.now(),
    text,
    priority,
    dueDate,
    completed: false
  };

  tasks.unshift(newTask);
  saveTasks();
  renderTasks();

  taskInput.value = "";
  priorityInput.value = "Medium";
  dateInput.value = "";
  taskInput.focus();
});

filterButtons.forEach(button => {
  button.addEventListener("click", function () {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

searchInput.addEventListener("input", function () {
  currentSearch = searchInput.value;
  renderTasks();
});

clearCompletedBtn.addEventListener("click", function () {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
});

clearAllBtn.addEventListener("click", function () {
  if (tasks.length === 0) return;

  const confirmed = confirm("Are you sure you want to delete all tasks?");
  if (!confirmed) return;

  tasks = [];
  saveTasks();
  renderTasks();
});

editTaskForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const text = editTaskInput.value.trim();
  const priority = editPriorityInput.value;
  const dueDate = editDateInput.value;

  if (!text) return;

  const task = tasks.find(item => item.id === editingTaskId);
  if (!task) return;

  task.text = text;
  task.priority = priority;
  task.dueDate = dueDate;

  saveTasks();
  renderTasks();
  closeEditModal();
});

closeModalBtn.addEventListener("click", closeEditModal);
cancelEditBtn.addEventListener("click", closeEditModal);

modalOverlay.addEventListener("click", function (e) {
  if (e.target === modalOverlay) {
    closeEditModal();
  }
});

themeToggle.addEventListener("click", function () {
  const isLight = document.body.classList.contains("theme-light");
  const newTheme = isLight ? "dark" : "light";
  setTheme(newTheme);
  saveTheme(newTheme);
});

renderTasks();