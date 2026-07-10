let participantsCache = [];
let currentStatus = 'naji';

function renderEquipmentFields(items) {
  const wrap = document.getElementById('equipmentList');
  wrap.innerHTML = '';
  (items && items.length ? items : ['']).forEach((val) => addEquipmentField(val));
}

function addEquipmentField(value) {
  const wrap = document.getElementById('equipmentList');
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = '8px';
  row.style.marginBottom = '8px';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'equipment-input';
  input.value = value || '';
  input.style.flex = '1';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-danger';
  removeBtn.textContent = 'حذف';
  removeBtn.onclick = () => row.remove();

  row.appendChild(input);
  row.appendChild(removeBtn);
  wrap.appendChild(row);
}

function collectEquipment() {
  return Array.from(document.querySelectorAll('.equipment-input'))
    .map((i) => i.value.trim())
    .filter((v) => v.length > 0);
}

async function loadAdminParticipants() {
  const res = await fetch('/api/participants');
  participantsCache = await res.json();
  renderAdminCards(participantsCache);
}

function renderAdminCards(list) {
  const grid = document.getElementById('cardsGrid');
  if (list.length === 0) {
    grid.innerHTML = '<div class="empty-state">لا يوجد مشاركون حاليا</div>';
    return;
  }
  grid.innerHTML = list.map((p, i) => buildCard(p, i, true)).join('');
}

function filterAdminParticipants() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  const q = input.value.trim().toLowerCase();
  if (!q) {
    renderAdminCards(participantsCache);
    return;
  }
  const filtered = participantsCache.filter((p) => {
    const name = (p.name || '').toLowerCase();
    const num = p.number !== null && p.number !== undefined ? String(p.number) : '';
    return name.includes(q) || num.includes(q);
  });
  renderAdminCards(filtered);
}

async function loadStage() {
  const res = await fetch('/api/stats');
  const data = await res.json();
  document.getElementById('stageInput').value = data.stage;
}

async function updateStage() {
  const stage = document.getElementById('stageInput').value;
  const res = await fetch('/api/stats/stage', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage })
  });
  if (!res.ok) {
    let msg = 'وقع خطأ فتحديث المرحلة';
    try {
      const data = await res.json();
      if (data && data.error) msg = data.error;
    } catch (e) {}
    if (res.status === 401) {
      alert('انتهت صلاحية الجلسة، خاصك تسجل الدخول من جديد');
      window.location.href = 'login.html';
      return;
    }
    alert(msg);
  }
}

function setStatus(status) {
  currentStatus = status;
  document.getElementById('btnNaji').className = status === 'naji' ? 'active-naji' : '';
  document.getElementById('btnMaqsi').className = status === 'maqsi' ? 'active-maqsi' : '';
}

function openAddModal() {
  document.getElementById('modalTitle').textContent = 'إضافة مشارك';
  document.getElementById('editId').value = '';
  document.getElementById('editName').value = '';
  document.getElementById('editFbName').value = '';
  document.getElementById('editFbLink').value = '';
  document.getElementById('editNumber').value = '';
  document.getElementById('editPoints').value = 0;
  document.getElementById('deleteBtn').style.display = 'none';
  renderEquipmentFields([]);
  setStatus('naji');
  document.getElementById('editModal').classList.add('show');
}

function openEditModal(id) {
  const p = participantsCache.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modalTitle').textContent = 'تعديل مشارك';
  document.getElementById('editId').value = p.id;
  document.getElementById('editName').value = p.name;
  document.getElementById('editFbName').value = p.facebook_name;
  document.getElementById('editFbLink').value = p.facebook_link;
  document.getElementById('editNumber').value = p.number ?? '';
  document.getElementById('editPoints').value = p.points;
  document.getElementById('deleteBtn').style.display = 'block';
  renderEquipmentFields(p.equipment || []);
  setStatus(p.status);
  document.getElementById('editModal').classList.add('show');
}

function closeModal() {
  document.getElementById('editModal').classList.remove('show');
}

async function saveParticipant() {
  const nameVal = document.getElementById('editName').value.trim();
  if (!nameVal) {
    alert('خاصك تدخل الاسم');
    return;
  }

  const id = document.getElementById('editId').value;
  const numberVal = document.getElementById('editNumber').value;
  const payload = {
    name: nameVal,
    facebook_name: document.getElementById('editFbName').value,
    facebook_link: document.getElementById('editFbLink').value,
    points: parseInt(document.getElementById('editPoints').value) || 0,
    status: currentStatus,
    number: numberVal ? parseInt(numberVal) : null,
    equipment: collectEquipment()
  };

  let res;
  try {
    if (id) {
      res = await fetch('/api/participants/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
  } catch (err) {
    alert('تعذر الاتصال بالسيرفر، تحقق من الاتصال');
    return;
  }

  if (!res.ok) {
    let msg = 'وقع خطأ، حاول مرة أخرى';
    try {
      const data = await res.json();
      if (data && data.error) msg = data.error;
    } catch (e) {}

    if (res.status === 401) {
      alert('انتهت صلاحية الجلسة، خاصك تسجل الدخول من جديد');
      window.location.href = 'login.html';
      return;
    }

    alert(msg);
    return;
  }

  closeModal();
  loadAdminParticipants();
}

async function deleteParticipant() {
  const id = document.getElementById('editId').value;
  if (!id) return;

  const res = await fetch('/api/participants/' + id, { method: 'DELETE' });

  if (!res.ok) {
    let msg = 'وقع خطأ فالحذف';
    try {
      const data = await res.json();
      if (data && data.error) msg = data.error;
    } catch (e) {}
    if (res.status === 401) {
      alert('انتهت صلاحية الجلسة، خاصك تسجل الدخول من جديد');
      window.location.href = 'login.html';
      return;
    }
    alert(msg);
    return;
  }

  closeModal();
  loadAdminParticipants();
}