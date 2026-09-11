/**
 * admin.js — Full site content management + member CRUD
 * Saves to Firebase (primary) + localStorage (backup)
 */
var ADMIN_PASS = 'STEENOI2026';
var adminMembers = [];
var siteConfig = null;

// ===================== PASSWORD GATE =====================
function unlockAdmin() {
  document.getElementById('adminGate').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  loadAdminMembers();
  loadSiteConfigAdmin();
  loadMusicAdmin();
}

// ===================== MEMBER CRUD =====================
function loadAdminMembers() {
  fbGet('members', function(data) {
    if (data && typeof data === 'object') {
      adminMembers = Object.entries(data).map(function(e) {
        return Object.assign({ id: e[0] }, e[1]);
      });
    } else {
      adminMembers = DEMO_MEMBERS.slice();
    }
    renderAdminTable();
  });
}

function renderAdminTable() {
  var tbody = document.getElementById('adminTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  adminMembers.forEach(function(m) {
    var tr = document.createElement('tr');
    // Avatar thumbnail
    var imgCell = '<td class="td-avatar">';
    if (m.image) {
      imgCell += '<img src="' + escHtml(m.image) + '" class="admin-thumb" onerror="this.style.display=\'none\'">';
    } else {
      imgCell += '<div class="admin-thumb-placeholder">?</div>';
    }
    imgCell += '</td>';

    tr.innerHTML = imgCell +
      '<td>' + escHtml(m.name) + '</td>' +
      '<td><span class="role-badge role-' + (m.role||'member') + '">' + roleLabel(m.role) + '</span></td>' +
      '<td class="td-fb">' + (m.facebook ? '<a href="' + escHtml(m.facebook) + '" target="_blank" class="fb-link">' + escHtml(m.facebook) + '</a>' : '<span class="no-data">—</span>') + '</td>' +
      '<td class="td-desc">' + (m.desc ? escHtml(m.desc) : '<span class="no-data">—</span>') + '</td>' +
      '<td>' +
        '<span class="action-link" data-id="' + m.id + '" data-action="edit">✏️ แก้ไข</span>' +
        '<span class="action-link delete-link" data-id="' + m.id + '" data-action="delete">🗑️ ลบ</span>' +
      '</td>';
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.action-link').forEach(function(el) {
    el.addEventListener('click', function() {
      var action = this.dataset.action;
      var id = this.dataset.id;
      if (action === 'edit') editMember(id);
      else if (action === 'delete') deleteMember(id);
    });
  });
}

function editMember(id) {
  var m = adminMembers.find(function(x){ return x.id === id; });
  if (!m) return;
  document.getElementById('editId').value = m.id;
  document.getElementById('fName').value = m.name || '';
  document.getElementById('fRole').value = m.role || 'member';
  document.getElementById('fFb').value = m.facebook || '';
  document.getElementById('fImg').value = m.image || '';
  document.getElementById('fDesc').value = m.desc || '';
  document.getElementById('saveBtn').textContent = '🔄 อัปเดต';
  // Show image preview
  showImgPreview(m.image);
  document.getElementById('adminForm').scrollIntoView({ behavior: 'smooth' });
}

function deleteMember(id) {
  if (!confirm('ต้องการลบสมาชิกนี้?')) return;
  adminMembers = adminMembers.filter(function(x){ return x.id !== id; });
  fbRef('members/' + id) && fbRef('members/' + id).remove();
  renderAdminTable();
}

function saveMember() {
  var editId = document.getElementById('editId').value;
  var name = document.getElementById('fName').value.trim();
  var role = document.getElementById('fRole').value;
  var fb = document.getElementById('fFb').value.trim();
  var img = document.getElementById('fImg').value.trim();
  var desc = document.getElementById('fDesc').value.trim();
  if (!name) { alert('กรุณาใส่ชื่อ'); return; }
  if (editId) {
    var m = adminMembers.find(function(x){ return x.id === editId; });
    if (m) {
      m.name = name; m.role = role; m.facebook = fb; m.image = img; m.desc = desc;
    }
    fbSet('members/' + editId, { name:name, role:role, facebook:fb, image:img, desc:desc });
  } else {
    var newId = 'm' + Date.now();
    var newM = { id:newId, name:name, role:role, facebook:fb, image:img, desc:desc };
    adminMembers.push(newM);
    fbSet('members/' + newId, newM);
  }
  resetMemberForm();
  renderAdminTable();
  alert('✅ บันทึกสมาชิกเรียบร้อย!');
}

function resetMemberForm() {
  document.getElementById('editId').value = '';
  document.getElementById('fName').value = '';
  document.getElementById('fRole').value = 'member';
  document.getElementById('fFb').value = '';
  document.getElementById('fImg').value = '';
  document.getElementById('fDesc').value = '';
  document.getElementById('saveBtn').textContent = 'บันทึก';
  document.getElementById('imgPreview').style.display = 'none';
  document.getElementById('fImgFileName').textContent = 'ยังไม่ได้เลือกรูป';
}

// ===================== IMAGE UPLOAD HELPERS =====================
function showImgPreview(url) {
  var preview = document.getElementById('imgPreview');
  var previewImg = document.getElementById('imgPreviewImg');
  if (url && preview && previewImg) {
    previewImg.src = url;
    preview.style.display = 'block';
  } else if (preview) {
    preview.style.display = 'none';
  }
}

// Convert uploaded file to base64 data URL
function handleImageUpload(file) {
  if (!file) return;
  document.getElementById('fImgFileName').textContent = file.name;
  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result;
    document.getElementById('fImg').value = dataUrl;
    showImgPreview(dataUrl);
  };
  reader.readAsDataURL(file);
}

// ===================== SITE CONTENT EDITOR =====================
function loadSiteConfigAdmin() {
  loadSiteConfig(function(cfg) {
    siteConfig = cfg;
    renderSiteEditor();
    renderPartnersEditor();
  });
}

function renderSiteEditor() {
  var homeFields = [
    { key: 'home.title', label: 'หัวข้อหน้าแรก', val: siteConfig.home.title },
    { key: 'home.subtitle', label: 'คำบรรยาย', val: siteConfig.home.subtitle },
    { key: 'home.logoText', label: 'ข้อความโลโก้', val: siteConfig.home.logoText },
    { key: 'home.btnText', label: 'ข้อความปุ่ม', val: siteConfig.home.btnText },
    { key: 'home.partnersLabel', label: 'หัวข้อ Partners', val: siteConfig.home.partnersLabel },
    { key: 'members.heroTitle', label: 'หัวข้อหน้าสมาชิก', val: siteConfig.members.heroTitle },
    { key: 'members.heroSub', label: 'คำบรรยายสมาชิก', val: siteConfig.members.heroSub },
    { key: 'members.searchPlaceholder', label: 'Placeholder ค้นหา', val: siteConfig.members.searchPlaceholder },
    { key: 'members.filterAll', label: 'ข้อความปุ่ม ทั้งหมด', val: siteConfig.members.filterAll },
    { key: 'members.footer', label: 'ข้อความ Footer', val: siteConfig.members.footer },
    { key: 'music.title', label: 'ข้อความเพลง (หน้าเว็บ)', val: siteConfig.music.title },
  ];

  var container = document.getElementById('siteEditorFields');
  if (!container) return;
  container.innerHTML = '';

  homeFields.forEach(function(f) {
    var row = document.createElement('div');
    row.className = 'admin-form-row';
    row.innerHTML = '<label>' + escHtml(f.label) + '</label>' +
      '<input type="text" class="site-cfg-input" data-key="' + f.key + '" value="' + escHtml(f.val) + '">';
    container.appendChild(row);
  });
}

function renderPartnersEditor() {
  var container = document.getElementById('partnersEditorList');
  if (!container) return;
  container.innerHTML = '';

  (siteConfig.partners || []).forEach(function(p, i) {
    var row = document.createElement('div');
    row.className = 'partner-edit-row';
    row.innerHTML =
      '<input type="text" class="site-cfg-input partner-name-input" data-idx="' + i + '" placeholder="ชื่อ Alliance" value="' + escHtml(p.name || '') + '">' +
      '<input type="text" class="site-cfg-input partner-url-input" data-idx="' + i + '" placeholder="ลิงก์ (ถ้ามี)" value="' + escHtml(p.url || '') + '">' +
      '<button class="remove-partner-btn" data-idx="' + i + '">✕</button>';
    container.appendChild(row);
  });

  container.querySelectorAll('.remove-partner-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = parseInt(this.dataset.idx);
      siteConfig.partners.splice(idx, 1);
      saveSiteConfig(siteConfig);
      renderPartnersEditor();
    });
  });
}

function addPartner() {
  if (!siteConfig.partners) siteConfig.partners = [];
  siteConfig.partners.push({ name: '', url: '' });
  saveSiteConfig(siteConfig);
  renderPartnersEditor();
}

function saveAllSiteContent() {
  document.querySelectorAll('.site-cfg-input[data-key]').forEach(function(input) {
    var keys = input.dataset.key.split('.');
    var obj = siteConfig;
    for (var i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = input.value;
  });

  document.querySelectorAll('.partner-name-input').forEach(function(input) {
    var idx = parseInt(input.dataset.idx);
    if (siteConfig.partners[idx]) siteConfig.partners[idx].name = input.value;
  });
  document.querySelectorAll('.partner-url-input').forEach(function(input) {
    var idx = parseInt(input.dataset.idx);
    if (siteConfig.partners[idx]) siteConfig.partners[idx].url = input.value;
  });

  saveSiteConfig(siteConfig);
  alert('✅ บันทึกข้อความทั้งหมดเรียบร้อย! (Firebase + localStorage)');
}

// ===================== MUSIC ADMIN =====================
function loadMusicAdmin() {
  loadSiteConfig(function(cfg) {
    var urlInput = document.getElementById('fMusicUrl');
    var titleInput = document.getElementById('fMusicTitle');
    if (urlInput && cfg.music && cfg.music.url) urlInput.value = cfg.music.url;
    if (titleInput && cfg.music && cfg.music.title) titleInput.value = cfg.music.title;
  });
}

function saveMusic() {
  var url = document.getElementById('fMusicUrl').value.trim();
  var title = document.getElementById('fMusicTitle').value.trim();
  if (!siteConfig) return;
  if (!siteConfig.music) siteConfig.music = {};
  siteConfig.music.url = url;
  siteConfig.music.title = title;
  saveSiteConfig(siteConfig);
  // Also update the player immediately
  if (typeof setMusicUrl === 'function') setMusicUrl(url);
  if (typeof setMusicTitle === 'function') setMusicTitle(title);
  alert('✅ บันทึกเพลงเรียบร้อย!');
}

function testMusic() {
  var url = document.getElementById('fMusicUrl').value.trim();
  if (!url) { alert('กรุณาใส่ลิงก์เพลงก่อน'); return; }
  if (typeof setMusicUrl === 'function') {
    setMusicUrl(url);
  }
}

// ===================== HELPERS =====================
function escHtml(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function roleLabel(role) {
  if (role === 'owner') return 'OWNER';
  if (role === 'core') return 'LEADER';
  return 'MEMBERS';
}

// ===================== DOM READY =====================
document.addEventListener('DOMContentLoaded', function() {
  var gateBtn = document.getElementById('gateBtn');
  var gateInput = document.getElementById('gateInput');
  var gateError = document.getElementById('gateError');

  function tryGate() {
    if (gateInput.value === ADMIN_PASS) {
      unlockAdmin();
    } else {
      gateError.style.display = 'block';
      gateInput.value = '';
    }
  }
  gateBtn.addEventListener('click', tryGate);
  gateInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') tryGate(); });

  document.getElementById('saveBtn').addEventListener('click', saveMember);
  document.getElementById('cancelBtn').addEventListener('click', resetMemberForm);

  // Image file upload handler
  var imgFile = document.getElementById('fImgFile');
  if (imgFile) {
    imgFile.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        handleImageUpload(this.files[0]);
      }
    });
  }

  // Image URL input: show preview on change
  var fImgInput = document.getElementById('fImg');
  if (fImgInput) {
    fImgInput.addEventListener('input', function() {
      showImgPreview(this.value.trim());
    });
  }

  var siteSaveBtn = document.getElementById('siteSaveBtn');
  if (siteSaveBtn) siteSaveBtn.addEventListener('click', saveAllSiteContent);

  var addPartnerBtn = document.getElementById('addPartnerBtn');
  if (addPartnerBtn) addPartnerBtn.addEventListener('click', addPartner);

  // Music tab buttons
  var musicSaveBtn = document.getElementById('musicSaveBtn');
  if (musicSaveBtn) musicSaveBtn.addEventListener('click', saveMusic);

  var musicTestBtn = document.getElementById('musicTestBtn');
  if (musicTestBtn) musicTestBtn.addEventListener('click', testMusic);
});
