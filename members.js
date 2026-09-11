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
      allMembers = DEMO_MEMBERS.slice();
    }
    if (callback) callback(allMembers);
  });
}

function renderMembers() {
  var grid = document.getElementById('membersGrid');
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

  // Render each group
  if (groups.owner.length) renderGroup(grid, 'OWNER', groups.owner, true);
  if (groups.core.length) renderGroup(grid, 'LEADER', groups.core, false);
  if (groups.member.length) renderGroup(grid, 'MEMBERS', groups.member, false);
}

function renderGroup(container, title, members, isOwner) {
  // Group title with decorative lines
  var groupDiv = document.createElement('div');
  groupDiv.className = 'member-group';
  groupDiv.innerHTML = '<div class="group-title"><span>' + title + '</span></div>';
  container.appendChild(groupDiv);

  // Owner: centered, large card
  if (isOwner && members.length === 1) {
    var ownerCard = createMemberCard(members[0], true);
    var ownerWrap = document.createElement('div');
    ownerWrap.className = 'owner-center';
    ownerWrap.appendChild(ownerCard);
    container.appendChild(ownerWrap);
    return;
  }

  // Grid for leaders and members
  var g = document.createElement('div');
  g.className = 'members-row';
  members.forEach(function(m) {
    g.appendChild(createMemberCard(m, false));
  });
  container.appendChild(g);
}

function createMemberCard(m, isOwner) {
  var card = document.createElement('div');
  card.className = isOwner ? 'member-card owner-card' : 'member-card';
  card.addEventListener('click', function() { openProfile(m); });

  var imgDiv = document.createElement('div');
  imgDiv.className = 'member-avatar';
  var img = document.createElement('img');
  img.src = m.image || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#222" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="#666" font-size="28">' + (m.name ? m.name[0] : '?') + '</text></svg>');
  img.alt = m.name;
  imgDiv.appendChild(img);
  card.appendChild(imgDiv);

  var nameDiv = document.createElement('div');
  nameDiv.className = 'member-name';
  nameDiv.textContent = m.name;
  card.appendChild(nameDiv);

  var badge = document.createElement('div');
  badge.className = 'member-badge';
  badge.textContent = m.role === 'owner' ? 'OWNER' : m.role === 'core' ? 'LEADER' : 'MEMBER';
  card.appendChild(badge);

  if (m.facebook) {
    var fbWrap = document.createElement('a');
    fbWrap.className = 'fb-circle';
    fbWrap.href = 'https://facebook.com/' + m.facebook;
    fbWrap.target = '_blank';
    fbWrap.innerHTML = '<span class="fb-f">f</span>';
    card.appendChild(fbWrap);
  }

  return card;
}

// ===================== PROFILE DIALOG =====================
function openProfile(m) {
  var dialog = document.getElementById('profileDialog');
  if (!dialog) return;
  dialog.innerHTML = '';

  var inner = document.createElement('div');
  inner.className = 'profile-inner';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'profile-close';
  closeBtn.textContent = '✕';
  closeBtn.onclick = function() { dialog.close(); };
  inner.appendChild(closeBtn);

  var img = document.createElement('img');
  img.src = m.image || '';
  img.className = 'profile-img';
  img.alt = m.name;
  inner.appendChild(img);

  var name = document.createElement('h2');
  name.className = 'profile-name';
  name.textContent = m.name;
  inner.appendChild(name);

  var badge = document.createElement('div');
  badge.className = 'member-badge';
  badge.textContent = m.role === 'owner' ? 'OWNER' : m.role === 'core' ? 'LEADER' : 'MEMBER';
  inner.appendChild(badge);

  if (m.desc) {
    var desc = document.createElement('p');
    desc.className = 'profile-desc';
    desc.textContent = m.desc;
    inner.appendChild(desc);
  }

  if (m.facebook) {
    var fbLink = document.createElement('a');
    fbLink.className = 'profile-fb';
    fbLink.href = 'https://facebook.com/' + m.facebook;
    fbLink.target = '_blank';
    fbLink.textContent = 'Facebook';
    inner.appendChild(fbLink);
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
      document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
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
