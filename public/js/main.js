function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(url) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return '#';
  return escapeHtml(url);
}

function getInitial(name) {
  return name ? name.trim().charAt(0) : '؟';
}

function buildCard(p, index, clickable) {
  const statusClass = p.status === 'maqsi' ? 'maqsi' : '';
  const badgeClass = p.status === 'maqsi' ? 'status-maqsi' : 'status-naji';
  const badgeText = p.status === 'maqsi' ? 'مقصي' : 'ناجي';
  const clickAttr = clickable ? `onclick="openEditModal(${p.id})"` : '';
  const numberHtml = (p.number !== null && p.number !== undefined && p.number !== '')
    ? `<div>الرقم: ${escapeHtml(p.number)}</div>` : '';
  const equipmentHtml = (Array.isArray(p.equipment) && p.equipment.length)
    ? `<div>العتاد: ${p.equipment.map(e => escapeHtml(e)).join('، ')}</div>` : '';
  return `
  <div class="card ${statusClass}" style="animation-delay:${index * 0.05}s" ${clickAttr}>
    <div class="card-header">
      <div class="avatar">${escapeHtml(getInitial(p.facebook_name || p.name))}</div>
      <div>
        <div class="card-name">${escapeHtml(p.name)}</div>
        <span class="card-status ${badgeClass}">${badgeText}</span>
      </div>
    </div>
    <div class="card-info">
      ${numberHtml}
      <div>حساب الفايسبوك: ${escapeHtml(p.facebook_name)}</div>
      <div><a href="${safeUrl(p.facebook_link)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">رابط الحساب</a></div>
      ${equipmentHtml}
    </div>
    <div class="points-badge">${escapeHtml(p.points)} نقطة</div>
  </div>`;
}

async function loadParticipants() {
  const res = await fetch('/api/participants');
  const data = await res.json();
  const grid = document.getElementById('cardsGrid');
  if (data.length === 0) {
    grid.innerHTML = '<div class="empty-state">لا يوجد مشاركون حاليا</div>';
    return;
  }
  grid.innerHTML = data.map((p, i) => buildCard(p, i, false)).join('');
}

async function loadStats() {
  const res = await fetch('/api/stats');
  const data = await res.json();
  document.getElementById('najiCount').textContent = data.naji;
  document.getElementById('maqsiCount').textContent = data.maqsi;
  document.getElementById('stageValue').textContent = data.stage;

  const body = document.getElementById('rankingBody');
  body.innerHTML = data.ranking.map((p, i) => `
    <tr>
      <td class="rank-num">${i + 1}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.facebook_name)}</td>
      <td>${escapeHtml(p.points)}</td>
      <td>${p.status === 'maqsi' ? 'مقصي' : 'ناجي'}</td>
    </tr>
  `).join('');
}

async function checkAuth() {
  const res = await fetch('/api/auth/check');
  const data = await res.json();
  return data.loggedIn;
}

async function doLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = 'login.html';
}