/**
 * members.js — Load & display members
 * Primary: Firebase, Fallback: demo data
 */
var allMembers = [];
var currentFilter = 'all';

function loadMembers(callback) {
  fbGet('members', function(data) {
    if (data && typeof data === 'object') {
      allMembers = Object.values(data);
    } else {
      allMembers = (typeof DEMO_MEMBERS !== 'undefined') ? DEMO_MEMBERS.slice() : [];
    }
    if (callback) callback(allMembers);
  });
}

function renderMembers() {
  var grid = document.getElementById('roster') || document.getElementById('membersGrid');
  if (!grid) return;
  grid.innerHTML = '';

  var search = (document.getElementById('searchInput').value || '').toLowerCase();
  var filtered = allMembers.filter(function(m) {
    var matchRole = currentFilter === 'all' || m.role === currentFilter;
    var matchSearch = !search || m.name.toLowerCase().indexOf(search) >= 0;
    return matchRole && matchSearch;
  });

  // Sort: owner first, then core, then member
  var roleOrder = { owner: 0, core: 1, member: 2 };
  filtered.sort(function(a, b) {
    return (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2);
  });

  // Group by role
  var groups = { owner: [], core: [], member: [] };
  filtered.forEach(function(m) {
    if (!groups[m.role]) groups[m.role] = [];
    groups[m.role].push(m);
  });

  // Update people count
  var countEl = document.getElementById('peopleCount');
  if (countEl) countEl.textContent = filtered.length + ' MEMBERS';

  // Render each group
  if (groups.owner.length) renderGroup(grid, 'OWNER', groups.owner, true);
  if (groups.core.length) renderGroup(grid, 'LEADER', groups.core, false);
  if (groups.member.length) renderGroup(grid, 'MEMBERS', groups.member, false);
}

function renderGroup(container, title, members, isOwner) {
  // Group title with decorative lines
  var groupDiv = document.createElement('div');
  groupDiv.className = 'roster-group';
  groupDiv.innerHTML = '<div class="group-title"><span>' + title + '</span></div>';
  container.appendChild(groupDiv);

  // Owner: centered, large card
  if (isOwner && members.length === 1) {
    var ownerCard = createMemberCard(members[0], true);
    var ownerWrap = document.createElement('div');
    ownerWrap.className = 'owner-row';
    ownerWrap.appendChild(ownerCard);
    container.appendChild(ownerWrap);
    return;
  }

  // Grid for leaders and members
  var g = document.createElement('div');
  g.className = 'roster-row';
  members.forEach(function(m) {
    g.appendChild(createMemberCard(m, false));
  });
  container.appendChild(g);
}

function createMemberCard(m, isOwner) {
  var card = document.createElement('div');
  card.className = isOwner ? 'member-card owner-card' : 'member-card';
  card.addEventListener('click', function() { openProfile(m); });

  // Avatar area with badge and fb icon positioned inside
  var avatarDiv = document.createElement('div');
  avatarDiv.className = 'card-avatar';
  var img = document.createElement('img');
  img.src = m.image || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#222" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="#666" font-size="28">' + (m.name ? m.name[0] : '?') + '</text></svg>');
  img.alt = m.name;
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
  // Fallback to inline SVG if image fails to load
  img.onerror = function() {
    this.onerror = null;
    this.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="#1a1a1a" width="200" height="200"/><text x="100" y="112" text-anchor="middle" fill="#d1d1d1" font-family="Orbitron,monospace" font-size="64" font-weight="700">' + (m.name ? m.name[0] : '?') + '</text></svg>');
  };
  avatarDiv.appendChild(img);

  // Badge — dark grey, white text, top-right
  var badge = document.createElement('div');
  badge.className = 'card-badge';
  badge.textContent = m.role === 'owner' ? 'OWNER' : m.role === 'core' ? 'LEADER' : 'MEMBER';
  avatarDiv.appendChild(badge);

  // Facebook white circle icon — bottom-right
  if (m.facebook) {
    var fbWrap = document.createElement('a');
    fbWrap.className = 'card-fb';
    fbWrap.href = 'https://facebook.com/' + m.facebook;
    fbWrap.target = '_blank';
    fbWrap.textContent = 'f';
    avatarDiv.appendChild(fbWrap);
  }

  card.appendChild(avatarDiv);

  // Card body with name
  var bodyDiv = document.createElement('div');
  bodyDiv.className = 'card-body';
  var nameDiv = document.createElement('div');
  nameDiv.className = 'card-name';
  nameDiv.textContent = m.name;
  bodyDiv.appendChild(nameDiv);
  card.appendChild(bodyDiv);

  return card;
}

// ===================== PROFILE DIALOG =====================
function openProfile(m) {
  var dialog = document.getElementById('profileDialog');
  if (!dialog) return;
  dialog.innerHTML = '';

  var inner = document.createElement('div');
  inner.className = 'dialog-body';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'dialog-close';
  closeBtn.textContent = '✕';
  closeBtn.onclick = function() { dialog.close(); };
  inner.appendChild(closeBtn);

  // Media area with image
  var media = document.createElement('div');
  media.className = 'dialog-media';
  var img = document.createElement('img');
  img.src = m.image || '';
  img.alt = m.name;
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:8px;';
  // Fallback to inline SVG if image fails to load
  img.onerror = function() {
    this.onerror = null;
    this.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:8px;';
    this.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="#1a1a1a" width="200" height="200"/><text x="100" y="112" text-anchor="middle" fill="#d1d1d1" font-family="Orbitron,monospace" font-size="64" font-weight="700">' + (m.name ? m.name[0] : '?') + '</text></svg>');
  };
  if (m.image) {
    media.appendChild(img);
  } else {
    media.textContent = m.name ? m.name[0] : '?';
  }
  inner.appendChild(media);

  var roleDiv = document.createElement('div');
  roleDiv.className = 'dialog-role';
  roleDiv.textContent = m.role === 'owner' ? 'OWNER' : m.role === 'core' ? 'LEADER' : 'MEMBER';
  inner.appendChild(roleDiv);

  var name = document.createElement('div');
  name.className = 'dialog-name thai-text';
  name.textContent = m.name;
  inner.appendChild(name);

  if (m.desc) {
    var desc = document.createElement('p');
    desc.className = 'dialog-blurb thai-text';
    desc.textContent = m.desc;
    inner.appendChild(desc);
  }

  if (m.facebook) {
    var meta = document.createElement('div');
    meta.className = 'dialog-meta';
    var fbLink = document.createElement('a');
    fbLink.href = 'https://facebook.com/' + m.facebook;
    fbLink.target = '_blank';
    fbLink.textContent = 'FACEBOOK';
    meta.appendChild(fbLink);
    inner.appendChild(meta);
  }

  dialog.appendChild(inner);
  dialog.showModal();
}

// ===================== SEARCH & FILTER =====================
document.addEventListener('DOMContentLoaded', function() {
  loadMembers(function() {
    renderMembers();
  });

  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', renderMembers);
  }

  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      currentFilter = this.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('is-active'); });
      this.classList.add('is-active');
      renderMembers();
    });
  });

  // Close dialog on backdrop click
  var dialog = document.getElementById('profileDialog');
  if (dialog) {
    dialog.addEventListener('click', function(e) {
      if (e.target === dialog) dialog.close();
    });
  }
});
