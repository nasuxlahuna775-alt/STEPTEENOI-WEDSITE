/**
 * members.js — Monochrome card design: square avatars, dark badges, white-circle FB
 */
var memberData = [];
var currentPage = 1;
var perPage = 10;
var currentFilter = 'all';
var searchQuery = '';

var DEMO_MEMBERS = [
  { id:'1', name:'TAR DIFFSTYLE', role:'owner', image:'', facebook:'https://facebook.com/tardiffstyle', desc:'ผู้ก่อตั้ง HOUSE OF STEPTEENOI' },
  { id:'2', name:'KAWIN SOYBAD', role:'core', image:'', facebook:'https://facebook.com/kawin', desc:'Co-Leader ผู้คุมกฎ' },
  { id:'3', name:'Anna Tongkao', role:'member', image:'', facebook:'', desc:'สมาชิก veteran' },
  { id:'4', name:'MeiKoi [OKI]', role:'member', image:'', facebook:'', desc:'มือร่าน พร้อมลุย' },
  { id:'5', name:'Never Alltime', role:'member', image:'', facebook:'', desc:'สมาชิกไฟแรง' },
  { id:'6', name:'Rxyz Luvmoney', role:'member', image:'', facebook:'', desc:'ช่างภาพประจำบ้าน' },
  { id:'7', name:'STEPTEENOI Benz', role:'member', image:'', facebook:'', desc:'ขับรถเก่ง' },
  { id:'8', name:'STEPTEENOI Fluke', role:'member', image:'', facebook:'', desc:'มือปืนประจำกลุ่ม' },
  { id:'9', name:'STEPTEENOI Palm', role:'member', image:'', facebook:'', desc:'วิศวกรระบบ' },
  { id:'10', name:'STEPTEENOI Nat', role:'member', image:'', facebook:'', desc:'ผู้บริหารจัดการ' },
  { id:'11', name:'STEPTEENOI Pok', role:'member', image:'', facebook:'', desc:'พ่อค้าคนกลาง' },
  { id:'12', name:'STEPTEENOI Mix', role:'member', image:'', facebook:'', desc:'สมาชิกหญิงเข้มแข็ง' },
  { id:'13', name:'STEPTEENOI Punn', role:'member', image:'', facebook:'', desc:'น้องใหม่สายลับ' },
  { id:'14', name:'STEPTEENOI Tang', role:'member', image:'', facebook:'', desc:'คนขับเฮลิคอปเตอร์' },
  { id:'15', name:'STEPTEENOI Win', role:'member', image:'', facebook:'', desc:'หมอประจำกลุ่ม' },
];

function getMemberImage(member) {
  if (member.image && member.image.trim()) return member.image;
  var idx = parseInt(member.id) || 0;
  if (typeof MEMBER_IMAGES !== 'undefined' && MEMBER_IMAGES.length > 0) {
    return MEMBER_IMAGES[idx % MEMBER_IMAGES.length];
  }
  return '';
}

function getInitials(name) {
  var parts = name.split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[parts.length-1][0];
  return name.substring(0, 2);
}

function roleLabel(role) {
  if (role === 'owner') return 'OWNER';
  if (role === 'core') return 'LEADER';
  return 'MEMBERS';
}

function loadMembers() {
  if (typeof firebase !== 'undefined' && firebase.apps.length && firebase.database) {
    try {
      firebase.database().ref('members').once('value', function(snap) {
        var data = snap.val();
        if (data && typeof data === 'object') {
          memberData = Object.values(data);
        } else {
          memberData = DEMO_MEMBERS.slice();
        }
        renderRoster();
      });
      return;
    } catch(e) {}
  }
  memberData = DEMO_MEMBERS.slice();
  renderRoster();
}

function filteredMembers() {
  var list = memberData;
  if (currentFilter !== 'all') {
    list = list.filter(function(m) { return m.role === currentFilter; });
  }
  if (searchQuery) {
    var q = searchQuery.toLowerCase();
    list = list.filter(function(m) { return m.name.toLowerCase().indexOf(q) !== -1; });
  }
  return list;
}

function renderRoster() {
  var roster = document.getElementById('roster');
  if (!roster) return;
  roster.innerHTML = '';

  var filtered = filteredMembers();
  if (filtered.length === 0) {
    roster.innerHTML = '<div style="text-align:center;color:#555;padding:40px">ไม่พบสมาชิก</div>';
    return;
  }

  var owners = filtered.filter(function(m){ return m.role==='owner'; });
  var cores  = filtered.filter(function(m){ return m.role==='core'; });
  var members = filtered.filter(function(m){ return m.role==='member'; });

  // OWNER — centered, larger card
  if (owners.length) {
    var ownerGroup = document.createElement('div');
    ownerGroup.className = 'roster-group';
    ownerGroup.innerHTML = '<h3 class="group-title">OWNER</h3>';
    var ownerRow = document.createElement('div');
    ownerRow.className = 'owner-row';
    owners.forEach(function(m) {
      var card = makeCard(m, true);
      ownerRow.appendChild(card);
    });
    ownerGroup.appendChild(ownerRow);
    roster.appendChild(ownerGroup);
  }

  // LEADERS — 5-col grid
  if (cores.length) {
    var coreGroup = document.createElement('div');
    coreGroup.className = 'roster-group';
    coreGroup.innerHTML = '<h3 class="group-title">LEADER</h3>';
    var coreRow = document.createElement('div');
    coreRow.className = 'roster-row';
    cores.forEach(function(m) { coreRow.appendChild(makeCard(m, false)); });
    coreGroup.appendChild(coreRow);
    roster.appendChild(coreGroup);
  }

  // MEMBERS — 5-col grid, paginated
  if (members.length) {
    var memGroup = document.createElement('div');
    memGroup.className = 'roster-group';
    memGroup.innerHTML = '<h3 class="group-title">MEMBERS</h3>';
    var memRow = document.createElement('div');
    memRow.className = 'roster-row';
    var start = (currentPage - 1) * perPage;
    var pageItems = members.slice(start, start + perPage);
    pageItems.forEach(function(m) { memRow.appendChild(makeCard(m, false)); });
    memGroup.appendChild(memRow);
    roster.appendChild(memGroup);
    renderPagination(members.length);
  }

  var pc = document.getElementById('peopleCount');
  if (pc) pc.textContent = filtered.length + ' MEMBERS';
}

function makeCard(m, isOwner) {
  var card = document.createElement('div');
  card.className = isOwner ? 'member-card owner-card' : 'member-card';
  card.dataset.id = m.id;

  // Square avatar area
  var avatar = document.createElement('div');
  avatar.className = 'card-avatar';
  var imgUrl = getMemberImage(m);
  if (imgUrl) {
    avatar.style.backgroundImage = 'url(' + imgUrl + ')';
    avatar.style.backgroundSize = 'cover';
    avatar.style.backgroundPosition = 'center';
  } else {
    avatar.textContent = getInitials(m.name);
  }

  // Badge (positioned inside avatar, top-right)
  var badge = document.createElement('div');
  badge.className = 'card-badge';
  badge.textContent = roleLabel(m.role);

  // Facebook icon — white circle with f, bottom-right of card
  var fb = document.createElement('a');
  fb.className = 'card-fb';
  fb.textContent = 'f';
  fb.href = m.facebook || '#';
  fb.target = '_blank';

  // Card body (name below avatar)
  var body = document.createElement('div');
  body.className = 'card-body';
  var name = document.createElement('div');
  name.className = 'card-name thai-text';
  name.textContent = m.name;
  body.appendChild(name);

  avatar.appendChild(badge);
  avatar.appendChild(fb);
  card.appendChild(avatar);
  card.appendChild(body);

  card.addEventListener('click', function(e) {
    if (e.target === fb) return;
    openProfile(m);
  });
  return card;
}

function openProfile(m) {
  var dialog = document.getElementById('profileDialog');
  if (!dialog) return;
  var imgUrl = getMemberImage(m);
  var media = document.getElementById('dialogMedia');
  if (imgUrl) {
    media.style.backgroundImage = 'url(' + imgUrl + ')';
    media.style.backgroundSize = 'cover';
    media.style.backgroundPosition = 'center';
    media.textContent = '';
  } else {
    media.style.backgroundImage = '';
    media.textContent = getInitials(m.name);
  }
  document.getElementById('dialogRole').textContent = roleLabel(m.role);
  document.getElementById('dialogName').textContent = m.name;
  document.getElementById('dialogBlurb').textContent = m.desc || '';
  var meta = document.getElementById('dialogMeta');
  meta.innerHTML = '';
  if (m.facebook) {
    meta.innerHTML = '<a href="' + m.facebook + '" target="_blank" class="dialog-link">FACEBOOK</a>';
  }
  dialog.showModal();
}

document.addEventListener('DOMContentLoaded', function() {
  var closeBtn = document.getElementById('dialogClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      var d = document.getElementById('profileDialog');
      if (d && d.open) d.close();
    });
  }

  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      searchQuery = this.value;
      currentPage = 1;
      renderRoster();
    });
  }

  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('is-active'); });
      this.classList.add('is-active');
      currentFilter = this.dataset.filter;
      currentPage = 1;
      renderRoster();
    });
  });

  loadMembers();
});

function renderPagination(total) {
  var pag = document.getElementById('pagination');
  if (!pag) return;
  pag.innerHTML = '';
  var pages = Math.ceil(total / perPage);
  if (pages <= 1) return;
  for (var i = 1; i <= pages; i++) {
    var btn = document.createElement('button');
    btn.className = 'page-btn' + (i === currentPage ? ' is-active' : '');
    btn.textContent = i;
    btn.dataset.page = i;
    btn.addEventListener('click', function() {
      currentPage = parseInt(this.dataset.page);
      renderRoster();
      window.scrollTo({ top: 200, behavior: 'smooth' });
    });
    pag.appendChild(btn);
  }
}
