/**
 * site-config.js v14 — All editable text content for the site
 * Primary: Firebase Realtime Database
 * Fallback: localStorage + defaults
 * FIX: Listens for 'firebase-ready' event to re-apply config
 * FIX: fbGet handles Firebase-not-ready gracefully (returns null, uses fallback)
 */
var SITE_CONFIG_DEFAULT = {
  home: {
    title: 'HOUSE OF STEPTEENOI',
    subtitle: 'BORN OF LEGEND',
    logoText: 'STEPTEENOI',
    btnText: 'ดูรายละเอียด',
    partnersLabel: 'PARTNERS'
  },
  members: {
    heroTitle: 'HOUSE OF STEPTEENOI',
    heroSub: 'รายชื่อสมาชิกทั้งหมด',
    searchPlaceholder: 'ค้นหาชื่อในระบบ...',
    filterAll: 'ทั้งหมด',
    footer: '© 2026 STEPTEENOI'
  },
  partners: [],
  music: {
    title: 'NOW PLAYING',
    url: ''
  }
};

/* -------- Firebase helpers -------- */
function fbRef(path) {
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length || !firebase.database) return null;
  try { return firebase.database().ref(path); } catch(e) { return null; }
}

function fbGet(path, callback) {
  var ref = fbRef(path);
  if (!ref) { callback(null); return; }
  ref.once('value', function(snap) { callback(snap.val()); }, function() { callback(null); });
}

function fbSet(path, data) {
  var ref = fbRef(path);
  if (!ref) return;
  try { ref.set(data); } catch(e) {}
}

/* -------- Load config -------- */
var _siteConfigCache = null;

function loadSiteConfig(callback) {
  fbGet('siteConfig', function(data) {
    if (data && typeof data === 'object') {
      _siteConfigCache = deepMerge(JSON.parse(JSON.stringify(SITE_CONFIG_DEFAULT)), data);
      if (callback) callback(_siteConfigCache);
      return;
    }
    // Fallback: localStorage
    try {
      var stored = localStorage.getItem('steenoiconfig');
      if (stored) {
        _siteConfigCache = deepMerge(JSON.parse(JSON.stringify(SITE_CONFIG_DEFAULT)), JSON.parse(stored));
        if (callback) callback(_siteConfigCache);
        return;
      }
    } catch(e) {}
    // Final fallback: defaults
    _siteConfigCache = JSON.parse(JSON.stringify(SITE_CONFIG_DEFAULT));
    if (callback) callback(_siteConfigCache);
  });

  // Synchronous fallback if Firebase not ready
  if (!_siteConfigCache) {
    try {
      var stored = localStorage.getItem('steenoiconfig');
      if (stored) {
        _siteConfigCache = deepMerge(JSON.parse(JSON.stringify(SITE_CONFIG_DEFAULT)), JSON.parse(stored));
      }
    } catch(e) {}
    if (!_siteConfigCache) _siteConfigCache = JSON.parse(JSON.stringify(SITE_CONFIG_DEFAULT));
  }
}

function saveSiteConfig(cfg) {
  _siteConfigCache = cfg;
  var ref = fbRef('siteConfig');
  if (ref) {
    try {
      ref.set(cfg).then(function() {
        console.log('[Config] Saved to Firebase OK');
      }).catch(function(err) {
        console.warn('[Config] Firebase save failed:', err);
      });
    } catch(e) {
      console.warn('[Config] Firebase set error:', e);
    }
  }
  try {
    localStorage.setItem('steenoiconfig', JSON.stringify(cfg));
    console.log('[Config] Saved to localStorage OK');
  } catch(e) {}
}

function deepMerge(target, source) {
  for (var key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Apply config to current page DOM
function applySiteConfig() {
  loadSiteConfig(function(cfg) {
    applyConfigToDOM(cfg);
  });
  if (_siteConfigCache) applyConfigToDOM(_siteConfigCache);
}

function applyConfigToDOM(cfg) {
  if (!cfg) return;
  var homeTitle = document.querySelector('.home-hero h1');
  if (homeTitle) homeTitle.textContent = cfg.home.title;
  var homeSub = document.querySelector('.home-hero .subtitle');
  if (homeSub) homeSub.textContent = cfg.home.subtitle;
  var logoText = document.querySelector('.logo-text');
  if (logoText) logoText.textContent = cfg.home.logoText;
  var homeBtn = document.querySelector('.home-btn');
  if (homeBtn) {
    var svg = homeBtn.querySelector('svg');
    homeBtn.childNodes[0].textContent = cfg.home.btnText;
  }
  var partnersLabel = document.querySelector('.partners-label');
  if (partnersLabel) partnersLabel.textContent = cfg.home.partnersLabel;

  var partnersGrid = document.querySelector('.partners-grid');
  if (partnersGrid) {
    partnersGrid.innerHTML = '';
    (cfg.partners || []).forEach(function(p) {
      var box = document.createElement('div');
      box.className = 'alliance-box';
      box.textContent = p.name || 'ALLIANCE';
      if (p.url) {
        var link = document.createElement('a');
        link.href = p.url;
        link.target = '_blank';
        link.textContent = p.name;
        box.textContent = '';
        box.appendChild(link);
      }
      partnersGrid.appendChild(box);
    });
  }

  var memHeroTitle = document.querySelector('.hero-title-members');
  if (memHeroTitle) memHeroTitle.textContent = cfg.members.heroTitle;
  var memHeroSub = document.querySelector('.hero-sub-members');
  if (memHeroSub) memHeroSub.textContent = cfg.members.heroSub;
  var searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = cfg.members.searchPlaceholder;
  var filterAll = document.querySelector('[data-filter="all"]');
  if (filterAll) filterAll.textContent = cfg.members.filterAll;
  var memFooter = document.querySelector('.members-footer');
  if (memFooter) memFooter.textContent = cfg.members.footer;

  // Music player removed — no music DOM updates needed
}

// Run on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  applySiteConfig();
});

// FIX: Re-apply config when Firebase becomes ready
window.addEventListener('firebase-ready', function() {
  setTimeout(function() { applySiteConfig(); }, 200);
});
