/**
 * admin.js — Full site content management + member CRUD
 * Saves to Firebase (primary) + localStorage (backup)
 * Uses beautiful toast notifications
 */
var ADMIN_PASS = 'STEENOI2026';
var adminMembers = [];
var siteConfig = null;
var _actionLog = []; // track all actions for display

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
      adminMembers = (typeof DEMO_MEMBERS !== 'undefined') ? DEMO_MEMBERS.slice() : [];
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
  showImgPreview(m.image);
  document.getElementById('adminForm').scrollIntoView({ behavior: 'smooth' });
}

function deleteMember(id) {
  var m = adminMembers.find(function(x){ return x.id === id; });
  if (!m) return;
  // Show confirmation toast instead of confirm()
  showConfirmToast(
    'ยืนยันการลบ',
    'ต้องการลบสมาชิก "' + m.name + '" หรือไม่?',
    function() {
      var detail = 'ชื่อ: ' + m.name + '\nยศ: ' + roleLabel(m.role);
      if (m.facebook) detail += '\nFacebook: ' + m.facebook;
      if (m.desc) detail += '\nคำอธิบาย: ' + m.desc;
      adminMembers = adminMembers.filter(function(x){ return x.id !== id; });
      fbRef('members/' + id) && fbRef('members/' + id).remove();
      renderAdminTable();
      logAction('🗑️ ลบสมาชิก', detail);
      showToast('success', 'ลบสมาชิกเรียบร้อย', 'สมาชิก "' + m.name + '" ถูกลบแล้ว', detail);
    }
  );
}

function saveMember() {
  var editId = document.getElementById('editId').value;
  var name = document.getElementById('fName').value.trim();
  var role = document.getElementById('fRole').value;
  var fb = document.getElementById('fFb').value.trim();
  var img = document.getElementById('fImg').value.trim();
  var desc = document.getElementById('fDesc').value.trim();
  if (!name) {
    showToast('error', 'บันทึกไม่สำเร็จ', 'กรุณาใส่ชื่อสมาชิก');
    return;
  }
  var detail = 'ชื่อ: ' + name + '\nยศ: ' + roleLabel(role);
  if (fb) detail += '\nFacebook: ' + fb;
  if (img) detail += '\nรูป: มี' + (img.length > 100 ? ' (base64)' : ' ' + img.substring(0, 50));
  if (desc) detail += '\nคำอธิบาย: ' + desc;

  if (editId) {
    var m = adminMembers.find(function(x){ return x.id === editId; });
    if (m) {
      m.name = name; m.role = role; m.facebook = fb; m.image = img; m.desc = desc;
    }
    fbSet('members/' + editId, { name:name, role:role, facebook:fb, image:img, desc:desc });
    logAction('✏️ แก้ไขสมาชิก', detail);
    showToast('success', 'อัปเดตสมาชิกเรียบร้อย', '"' + name + '" ถูกอัปเดตแล้ว', detail);
  } else {
    var newId = 'm' + Date.now();
    var newM = { id:newId, name:name, role:role, facebook:fb, image:img, desc:desc };
    adminMembers.push(newM);
    fbSet('members/' + newId, newM);
    logAction('➕ เพิ่มสมาชิก', detail);
    showToast('success', 'บันทึกสมาชิกเรียบร้อย', '"' + name + '" ถูกเพิ่มแล้ว', detail);
  }
  resetMemberForm();
  renderAdminTable();
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

function handleImageUpload(file) {
  if (!file) return;
  document.getElementById('fImgFileName').textContent = file.name;
  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result;
    document.getElementById('fImg').value = dataUrl;
    showImgPreview(dataUrl);
    showToast('info', 'อัปโหลดรูปเรียบร้อย', 'ไฟล์: ' + file.name, 'ขนาด: ' + (file.size / 1024).toFixed(1) + ' KB');
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
      var pName = (siteConfig.partners[idx] || {}).name || '(ว่าง)';
      siteConfig.partners.splice(idx, 1);
      saveSiteConfig(siteConfig);
      renderPartnersEditor();
      logAction('🗑️ ลบ Alliance', pName);
      showToast('warning', 'ลบ Alliance เรียบร้อย', '"' + pName + '" ถูกลบแล้ว');
    });
  });
}

function addPartner() {
  if (!siteConfig.partners) siteConfig.partners = [];
  siteConfig.partners.push({ name: '', url: '' });
  saveSiteConfig(siteConfig);
  renderPartnersEditor();
  showToast('info', 'เพิ่ม Alliance', 'เพิ่มช่อง Alliance ใหม่แล้ว กรุณากรอกชื่อและลิงก์');
}

function saveAllSiteContent() {
  var changes = [];
  document.querySelectorAll('.site-cfg-input[data-key]').forEach(function(input) {
    var keys = input.dataset.key.split('.');
    var obj = siteConfig;
    for (var i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    var oldVal = obj[keys[keys.length - 1]];
    obj[keys[keys.length - 1]] = input.value;
    // Track changes
    var label = input.closest('.admin-form-row').querySelector('label');
    if (label && oldVal !== input.value) {
      changes.push(label.textContent + ': "' + input.value + '"');
    }
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
  var detail = changes.length > 0 ? changes.join('\n') : 'ไม่มีการเปลี่ยนแปลง';
  logAction('✏️ แก้ไขข้อความ', detail);
  showToast('success', 'บันทึกข้อความเรียบร้อย', 'บันทึงเข้า Firebase + localStorage แล้ว', detail);
}

// ===================== MUSIC ADMIN =====================
function loadMusicAdmin() {
  function fillMusicFields(cfg) {
    var urlInput = document.getElementById('fMusicUrl');
    var titleInput = document.getElementById('fMusicTitle');
    if (urlInput && cfg.music && cfg.music.url) urlInput.value = cfg.music.url;
    if (titleInput && cfg.music && cfg.music.title) titleInput.value = cfg.music.title;
  }
  // Use cached config if available
  if (siteConfig) {
    fillMusicFields(siteConfig);
  }
  // Also load fresh from config system
  loadSiteConfig(function(cfg) {
    siteConfig = cfg;
    fillMusicFields(cfg);
  });
}

function saveMusic() {
  var url = document.getElementById('fMusicUrl').value.trim();
  var title = document.getElementById('fMusicTitle').value.trim();
  console.log('[Admin] saveMusic called — URL:', url, 'Title:', title);
  // Make sure siteConfig exists — create from defaults if needed
  if (!siteConfig) {
    console.log('[Admin] siteConfig was null — creating from defaults');
    siteConfig = JSON.parse(JSON.stringify(SITE_CONFIG_DEFAULT));
  }
  if (!siteConfig.music) siteConfig.music = {};
  siteConfig.music.url = url;
  siteConfig.music.title = title;
  saveSiteConfig(siteConfig);
  if (typeof setMusicUrl === 'function') setMusicUrl(url);
  if (typeof setMusicTitle === 'function') setMusicTitle(title);
  var detail = 'URL: ' + (url || '(ว่าง)') + '\nชื่อเพลง: ' + (title || '(ว่าง)');
  logAction('🎵 แก้ไขเพลง', detail);
  showToast('success', 'บันทึกเพลงเรียบร้อย', 'เพลงถูกอัปเดตแล้ว', detail);
  console.log('[Admin] saveMusic complete — siteConfig.music:', siteConfig.music);
}

function testMusic() {
  var url = document.getElementById('fMusicUrl').value.trim();
  if (!url) {
    showToast('error', 'ทดสอบไม่ได้', 'กรุณาใส่ลิงก์เพลงก่อน');
    return;
  }
  // Validate URL format
  try {
    new URL(url);
  } catch(e) {
    showToast('error', 'ลิงก์ไม่ถูกต้อง', 'กรุณาใส่ URL ให้ครบ เช่น https://example.com/song.mp3');
    return;
  }
  // Set the music URL (loads the audio)
  if (typeof setMusicUrl === 'function') {
    setMusicUrl(url);
  }
  showToast('info', 'กำลังโหลดเพลง...', 'รอสักครู่แล้วกด ▶ ที่มุมล่างขวา', 'ลิงก์: ' + url);
  
  // Auto-play after the audio has time to load
  // Try multiple times with increasing delay
  function tryPlay(attempt) {
    if (attempt > 5) return; // give up after 5 tries
    if (_musicPlaying) return; // already playing
    if (_musicAudio && _musicAudio.readyState >= 2) {
      // Audio is loaded enough to play
      _musicAudio.play().then(function() {
        var btn = document.getElementById('musicBtn');
        if (btn) btn.textContent = '⏸';
        _musicPlaying = true;
        var player = document.getElementById('musicPlayer');
        if (player) player.classList.add('is-playing');
        if (typeof window._musicSetStatus === 'function') {
          window._musicSetStatus('playing', 'กำลังเล่น...');
        }
        showToast('success', '🎵 เพลงเล่นแล้ว!', 'ทดสอบเพลงสำเร็จ');
      }).catch(function(err) {
        console.warn('[Music] Auto-play blocked on attempt', attempt, err);
        // Try again after longer delay
        setTimeout(function() { tryPlay(attempt + 1); }, 1000);
      });
    } else {
      // Not ready yet, wait and try again
      setTimeout(function() { tryPlay(attempt + 1); }, 800);
    }
  }
  
  // Start trying to play after a short delay
  setTimeout(function() { tryPlay(1); }, 1000);
}

// ===================== ACTION LOG =====================
function logAction(title, detail) {
  var now = new Date();
  var time = now.getHours().toString().padStart(2,'0') + ':' +
    now.getMinutes().toString().padStart(2,'0') + ':' +
    now.getSeconds().toString().padStart(2,'0');
  _actionLog.unshift({ time: time, title: title, detail: detail });
  if (_actionLog.length > 50) _actionLog.pop(); // keep max 50
}

function getActionLog() {
  return _actionLog;
}

// ===================== TOAST NOTIFICATIONS =====================
var toastContainer = null;
function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function showToast(type, title, message, detail) {
  var icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  var container = getToastContainer();
  var el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML =
    '<div class="toast-icon">' + (icons[type] || '✨') + '</div>' +
    '<div class="toast-body">' +
      '<div class="toast-title">' + escHtml(title) + '</div>' +
      '<div class="toast-message">' + escHtml(message) + '</div>' +
      (detail ? '<div class="toast-detail">' + escHtml(detail).replace(/\n/g, '<br>') + '</div>' : '') +
    '</div>' +
    '<button class="toast-close">✕</button>' +
    '<div class="toast-progress" style="width:100%"></div>';
  container.appendChild(el);

  // Close button
  el.querySelector('.toast-close').addEventListener('click', function() {
    removeToast(el);
  });

  // Animate in
  requestAnimationFrame(function() {
    el.classList.add('show');
  });

  // Progress bar animation
  var progress = el.querySelector('.toast-progress');
  var duration = detail ? 6000 : 4000; // longer if has detail
  progress.style.transitionDuration = duration + 'ms';
  setTimeout(function() { progress.style.width = '0%'; }, 50);

  // Auto remove
  setTimeout(function() { removeToast(el); }, duration + 300);
}

function removeToast(el) {
  el.classList.remove('show');
  el.classList.add('hide');
  setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
}

// Confirm toast with OK/CANCEL
function showConfirmToast(title, message, onConfirm) {
  var container = getToastContainer();
  var el = document.createElement('div');
  el.className = 'toast warning';
  el.innerHTML =
    '<div class="toast-icon">⚠️</div>' +
    '<div class="toast-body">' +
      '<div class="toast-title">' + escHtml(title) + '</div>' +
      '<div class="toast-message">' + escHtml(message) + '</div>' +
      '<div style="margin-top:10px;display:flex;gap:8px">' +
        '<button class="toast-confirm-btn toast-confirm-yes" style="padding:6px 16px;background:rgba(220,60,60,0.2);border:1px solid rgba(220,60,60,0.4);border-radius:4px;color:#f87171;cursor:pointer;font-family:inherit;font-size:0.75rem">ยืนยันลบ</button>' +
        '<button class="toast-confirm-btn toast-confirm-no" style="padding:6px 16px;background:rgba(255,255,255,0.05);border:1px solid var(--chrome);border-radius:4px;color:var(--muted);cursor:pointer;font-family:inherit;font-size:0.75rem">ยกเลิก</button>' +
      '</div>' +
    '</div>' +
    '<button class="toast-close">✕</button>';
  container.appendChild(el);

  el.querySelector('.toast-close').addEventListener('click', function() { removeToast(el); });
  el.querySelector('.toast-confirm-no').addEventListener('click', function() { removeToast(el); });
  el.querySelector('.toast-confirm-yes').addEventListener('click', function() {
    removeToast(el);
    if (onConfirm) onConfirm();
  });

  requestAnimationFrame(function() { el.classList.add('show'); });
  // Don't auto-remove confirm toasts
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
      showToast('success', 'เข้าสู่ระบบสำเร็จ', 'ยินดีต้อนรับเข้าสู่ Admin Panel');
    } else {
      gateError.style.display = 'block';
      gateInput.value = '';
      showToast('error', 'รหัสผ่านไม่ถูกต้อง', 'กรุณาลองใหม่');
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

  // Backup click handler for image upload button (label for may fail on some devices)
  var imgUploadBtn = document.querySelector('.img-upload-btn');
  if (imgUploadBtn && imgFile) {
    imgUploadBtn.addEventListener('click', function(e) {
      e.preventDefault();
      imgFile.click();
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
