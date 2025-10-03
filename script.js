const STORAGE_KEY = 'todo.tasks.v1';
let tasks = [];

const qs = sel => document.querySelector(sel);
const qsa = sel => document.querySelectorAll(sel);

const form = qs('#task-form');
const input = qs('#task-input');
const list = qs('#task-list');
const filterSelect = qs('#filter');
const searchInput = qs('#search');

function loadTasks(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch(e){
    tasks = [];
    console.error('Failed to load tasks', e);
  }
}

function saveTasks(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

function addTask(text){
  const task = { id: createId(), text: text.trim(), done:false, createdAt: Date.now() };
  tasks.unshift(task);
  saveTasks();
  render();
}

function updateTask(id, newText){
  const t = tasks.find(x=>x.id===id);
  if(t){ t.text = newText.trim(); saveTasks(); render(); }
}

function toggleDone(id){
  const t = tasks.find(x=>x.id===id);
  if(t){ t.done = !t.done; saveTasks(); render(); }
}

function deleteTask(id){
  tasks = tasks.filter(x=>x.id!==id);
  saveTasks();
  render();
}

function render(){
  const filter = filterSelect.value;
  const query = searchInput.value.trim().toLowerCase();
  list.innerHTML = '';

  const filtered = tasks.filter(t => {
    if(filter==='active' && t.done) return false;
    if(filter==='completed' && !t.done) return false;
    if(query && !t.text.toLowerCase().includes(query)) return false;
    return true;
  });

  if(filtered.length === 0){
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `<div class="task-main"><p class="task-text">No tasks found</p></div>`;
    list.appendChild(li);
    return;
  }

  filtered.forEach(t => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = t.id;

    li.innerHTML = `
      <div class="task-main">
        <input type="checkbox" class="chk" ${t.done ? 'checked' : ''} aria-label="Mark task done">
        <p class="task-text ${t.done ? 'completed' : ''}" contenteditable="false" role="textbox">${escapeHtml(t.text)}</p>
      </div>
      <div class="task-actions">
        <button class="edit" title="Edit">✎</button>
        <button class="delete" title="Delete">🗑</button>
      </div>
    `;
    list.appendChild(li);
  });
}


function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

// Event listeners
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = input.value;
  if(!v.trim()) return;
  addTask(v);
  input.value = '';
  input.focus();
});

list.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if(!li) return;
  const id = li.dataset.id;
  if(e.target.matches('.chk')){
    toggleDone(id);
    return;
  }
  if(e.target.matches('.delete')){
    deleteTask(id);
    return;
  }
  if(e.target.matches('.edit')){
    enableEdit(li, id);
    return;
  }
});

list.addEventListener('change', (e) => {
  if(e.target.matches('.chk')){
    const li = e.target.closest('li');
    toggleDone(li.dataset.id);
  }
});

filterSelect.addEventListener('change', render);
searchInput.addEventListener('input', render);

function enableEdit(li, id){
  const p = li.querySelector('.task-text');
  p.contentEditable = 'true';
  p.focus();

  // place caret at end
  document.getSelection().selectAllChildren(p);
  document.getSelection().collapseToEnd();

  function finish(){
    p.contentEditable = 'false';
    updateTask(id, p.textContent);
    cleanup();
  }
  function cleanup(){
    p.removeEventListener('blur', finish);
    p.removeEventListener('keydown', onKey);
  }
  function onKey(ev){
    if(ev.key === 'Enter'){
      ev.preventDefault();
      p.blur();
    } else if(ev.key === 'Escape'){
      p.textContent = tasks.find(t=>t.id===id)?.text || p.textContent;
      p.blur();
    }
  }
  p.addEventListener('blur', finish);
  p.addEventListener('keydown', onKey);
}

loadTasks();
render();
