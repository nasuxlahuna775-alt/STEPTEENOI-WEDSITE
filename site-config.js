/**
 * site-config.js — All editable text content for the site
 * Primary: Firebase Realtime Database (shared across all users)
 * Fallback: localStorage (local only, used when Firebase not configured)
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
    url: 'https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3'
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
  // Try Firebase first
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

  // If Firebase not ready, return from localStorage/defaults synchronously
  if (!FIREBASE_READY) {
    try {
      var stored = localStorage.getItem('steenoiconfig');
      if (stored) {
        _siteConfigCache = deepMerge(JSON.parse(JSON.stringify(SITE_CONFIG_DEFAULT)), JSON.parse(stored));
      }
    } catch(e) {}
    if (!_siteConfigCache) _siteConfigCache = JSON.parse(JSON.stringify(SITE_CONFIG_DEFAULT));
    return _siteConfigCache;
  }
}

function saveSiteConfig(cfg) {
  _siteConfigCache = cfg;
  // Save to Firebase
  fbSet('siteConfig', cfg);
  // Also save to localStorage as backup
  try { localStorage.setItem('steenoiconfig', JSON.stringify(cfg)); } catch(e) {}
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
  // Also apply synchronously from cache if available
  if (_siteConfigCache) applyConfigToDOM(_siteConfigCache);
}

function applyConfigToDOM(cfg) {
  if (!cfg) return;
  // HOME page
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

  // PARTNERS — dynamic
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

  // MEMBERS page
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

  // MUSIC
  var musicTitle = document.querySelector('.music-title-text');
  if (musicTitle) musicTitle.textContent = cfg.music.title;
}

// Run on load
document.addEventListener('DOMContentLoaded', function() {
  applySiteConfig();
  // Re-apply when Firebase loads (delayed)
  if (FIREBASE_READY) {
    setTimeout(function() { applySiteConfig(); }, 2000);
    setTimeout(function() { applySiteConfig(); }, 5000);
  }
});
