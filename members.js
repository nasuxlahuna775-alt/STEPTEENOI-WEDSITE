/**
 * members.js v15 — Load & display members
 * FIX v15: Members display IMMEDIATELY on page load.
 *   - On DOMContentLoaded, set allMembers = DEMO_MEMBERS and render right away
 *   - Then call fbGet to try Firebase; if data exists, replace demo data and re-render
 *   - Listen for 'firebase-ready' to reload from Firebase when SDK finishes loading
 * FIX: fbGet from site-config.js handles Firebase-not-ready (returns null)
 */
var allMembers = [];
var currentFilter = 'all';

// Build correct Facebook URL from any input format
function buildFbUrl(val) {
  if (!val) return '';
  val = val.trim();
  if (/^https?:\/\//i.test(val)) return val;
  if (/^(www\.)?facebook\.com/i.test(val)) return 'https://' + val;
  return 'https://www.facebook.com/' + val;
}

function loadMembers(callback) {
  fbGet('members', function(data) {
    if (data && typeof data === 'object') {
      allMembers = Object.values(data);
      console.log('[Members] Loaded from Firebase:', allMembers.length);
    } else {
      allMembers = (typeof DEMO_MEMBERS !== 'undefined') ? DEMO_MEMBERS.slice() : [];
      console.log('[Members] Firebase empty — using demo data:', allMembers.length);
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

  var roleOrder = { owner: 0, core: 1, member: 2 };
  filtered.sort(function(a, b) {
    return (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2);
  });

  var groups = { owner: [], core: [], member: [] };
  filtered.forEach(function(m) {
    if (!groups[m.role]) groups[m.role] = [];
    groups[m.role].push(m);
  });

  var countEl = document.getElementById('peopleCount');
  if (countEl) countEl.textContent = filtered.length + ' MEMBERS';

  if (groups.owner.length) renderGroup(grid, 'OWNER', groups.owner, 'owner');
  if (groups.core.length) renderGroup(grid, 'LEADER', groups.core, 'core');
  if (groups.member.length) renderGroup(grid, 'MEMBERS', groups.member, 'member');
}

function renderGroup(container, title, members, roleType) {
  var groupDiv = document.createElement('div');
  groupDiv.className = 'roster-group';
  groupDiv.innerHTML = '<div class="group-title"><span>' + title + '</span></div>';
  container.appendChild(groupDiv);

  if (roleType === 'owner') {
    var ownerCard = createMemberCard(members[0], true);
    var ownerWrap = document.createElement('div');
    ownerWrap.className = 'owner-row';
    ownerWrap.appendChild(ownerCard);
    container.appendChild(ownerWrap);
    return;
  }

  if (roleType === 'core') {
    var leaderWrap = document.createElement('div');
    leaderWrap.className = 'leader-row';
    members.forEach(function(m) {
      leaderWrap.appendChild(createMemberCard(m, false));
    });
    container.appendChild(leaderWrap);
    return;
  }

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

  var avatarDiv = document.createElement('div');
  avatarDiv.className = 'card-avatar';
  var img = document.createElement('img');
  img.src = m.image || '';
  img.alt = m.name;
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
  // Fallback to inline SVG if image fails to load
  img.onerror = function() {
    this.onerror = null;
    this.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="#1a1a1a" width="200" height="200"/><text x="100" y="112" text-anchor="middle" fill="#d1d1d1" font-family="Orbitron,monospace" font-size="64" font-weight="700">' + (m.name ? m.name[0] : '?') + '</text></svg>');
  };
  avatarDiv.appendChild(img);

  var badge = document.createElement('div');
  badge.className = 'card-badge';
  badge.textContent = m.role === 'owner' ? 'OWNER' : m.role === 'core' ? 'LEADER' : 'MEMBER';
  avatarDiv.appendChild(badge);

  if (m.facebook) {
    var fbWrap = document.createElement('a');
    fbWrap.className = 'card-fb';
    fbWrap.href = buildFbUrl(m.facebook);
    fbWrap.target = '_blank';
    fbWrap.setAttribute('aria-label', 'Facebook');
    fbWrap.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
    avatarDiv.appendChild(fbWrap);
  }

  card.appendChild(avatarDiv);

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

  var media = document.createElement('div');
  media.className = 'dialog-media';
  var img = document.createElement('img');
  img.src = m.image || '';
  img.alt = m.name;
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:8px;';
  img.onerror = function() {
    this.onerror = null;
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
    fbLink.href = buildFbUrl(m.facebook);
    fbLink.target = '_blank';
    fbLink.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="white" style="vertical-align:middle;"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> FACEBOOK';
    meta.appendChild(fbLink);
    inner.appendChild(meta);
  }

  dialog.appendChild(inner);
  dialog.showModal();
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', function() {
  // ===== FIX v15: Display members IMMEDIATELY on page load =====
  // Set demo data right away so cards render instantly
  if (typeof DEMO_MEMBERS !== 'undefined' && DEMO_MEMBERS.length > 0) {
    allMembers = DEMO_MEMBERS.slice();
    renderMembers();
    console.log('[Members] Instant render with demo data:', allMembers.length);
  }

  // Then try Firebase (async) — if it has real data, it will replace demo
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

  var dialog = document.getElementById('profileDialog');
  if (dialog) {
    dialog.addEventListener('click', function(e) {
      if (e.target === dialog) dialog.close();
    });
  }
});

// ===== Re-load members when Firebase becomes ready =====
function reloadMembersOnFirebaseReady() {
  console.log('[Members] Firebase ready — reloading members...');
  loadMembers(function() {
    renderMembers();
  });
}

// Listen for the custom 'firebase-ready' event
window.addEventListener('firebase-ready', function() {
  setTimeout(function() {
    reloadMembersOnFirebaseReady();
  }, 200);
});