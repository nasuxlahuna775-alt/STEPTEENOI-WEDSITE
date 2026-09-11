/**
 * site-config.js — All editable text content for the site
 * Stored in localStorage; admin panel can modify everything
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
    title: 'NOW PLAYING'
  }
};

function loadSiteConfig() {
  try {
    var stored = localStorage.getItem('steenoiconfig');
    if (stored) {
      var parsed = JSON.parse(stored);
      // merge with defaults so new keys are always present
      return deepMerge(JSON.parse(JSON.stringify(SITE_CONFIG_DEFAULT)), parsed);
    }
  } catch(e) {}
  return JSON.parse(JSON.stringify(SITE_CONFIG_DEFAULT));
}

function saveSiteConfig(cfg) {
  try {
    localStorage.setItem('steenoiconfig', JSON.stringify(cfg));
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
  var cfg = loadSiteConfig();

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
});
