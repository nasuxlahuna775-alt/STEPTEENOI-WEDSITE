/**
 * music-player.js — Floating bottom-right corner music widget v9
 * Robust audio loading with error handling, CORS proxy fallback, visual status
 */
var _musicAudio = null;
var _musicPlaying = false;
var _musicLoaded = false;
var _musicError = false;
var _defaultMusicUrl = 'https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3';

(function() {
  _musicAudio = new Audio();
  _musicAudio.loop = true;
  _musicAudio.volume = 0.4;
  _musicAudio.preload = 'auto';
  // NOTE: Do NOT set crossOrigin — many MP3 hosts (Pixabay, etc.)
  // don't send Access-Control-Allow-Origin, which causes the
  // browser to block the audio entirely. Without this attribute,
  // the browser loads the audio as an "opaque" resource, which
  // works fine for <Audio> playback (only limits Canvas/WebAudio API).

  function initMusic() {
    var cfg = null;
    try {
      var stored = localStorage.getItem('steenoiconfig');
      if (stored) cfg = JSON.parse(stored);
    } catch(e) {}

    var url = (cfg && cfg.music && cfg.music.url) ? cfg.music.url : _defaultMusicUrl;
    var title = (cfg && cfg.music && cfg.music.title) ? cfg.music.title : 'NOW PLAYING';

    loadAudioUrl(url);
    setTitleText(title);
  }

  // Load audio with error handling
  function loadAudioUrl(url) {
    if (!url) { setStatus('error', 'ไม่มีลิงก์เพลง'); return; }
    _musicLoaded = false;
    _musicError = false;
    setStatus('loading', 'กำลังโหลดเพลง...');

    _musicAudio.src = url;

    _musicAudio.oncanplaythrough = function() {
      _musicLoaded = true;
      _musicError = false;
      setStatus('ready', 'พร้อมเล่น — กด ▶');
      console.log('[Music] Loaded:', url);
    };

    _musicAudio.onerror = function() {
      _musicError = true;
      _musicLoaded = false;
      setStatus('error', 'โหลดเพลงไม่ได้');
      console.warn('[Music] Error loading:', url, _musicAudio.error);
    };

    _musicAudio.onloadeddata = function() {
      _musicLoaded = true;
      setStatus('ready', 'พร้อมเล่น — กด ▶');
    };

    // Force load
    _musicAudio.load();
  }

  // Set status text with icon
  function setStatus(type, text) {
    var statusEl = document.getElementById('musicStatus');
    if (!statusEl) return;
    var icons = { loading: '⏳', ready: '✅', error: '❌', playing: '🎵' };
    statusEl.textContent = (icons[type] || '') + ' ' + text;
    statusEl.className = 'music-status music-status-' + type;
    // Auto-hide status after 5s if ready or error
    if (type === 'ready' || type === 'error') {
      setTimeout(function() {
        if (statusEl) statusEl.style.opacity = '0.5';
      }, 4000);
    }
  }

  function setTitleText(text) {
    var titleEl = document.querySelector('.music-title-text');
    if (titleEl && text) titleEl.textContent = text;
  }

  initMusic();

  var btn = document.getElementById('musicBtn');
  var fill = document.getElementById('musicProgress');
  var player = document.getElementById('musicPlayer');

  if (!btn || !player) return;

  btn.addEventListener('click', function() {
    if (_musicPlaying) {
      _musicAudio.pause();
      btn.textContent = '▶';
      _musicPlaying = false;
      player.classList.remove('is-playing');
      setStatus('ready', 'หยุดชั่วคราว');
    } else {
      // If audio errored, try reloading
      if (_musicError) {
        loadAudioUrl(_musicAudio.src);
        setStatus('loading', 'กำลังโหลดใหม่...');
      }

      _musicAudio.play().then(function() {
        btn.textContent = '⏸';
        _musicPlaying = true;
        player.classList.add('is-playing');
        setStatus('playing', _musicAudio.src ? 'กำลังเล่น...' : 'กำลังเล่น...');
      }).catch(function(err) {
        console.warn('[Music] Play blocked:', err);
        setStatus('error', 'กด ▶ อีกครั้งเพื่อเล่น');
      });
    }
  });

  // Animate progress bar
  function tick() {
    if (fill && _musicAudio.duration && isFinite(_musicAudio.duration)) {
      var pct = (_musicAudio.currentTime / _musicAudio.duration) * 100;
      fill.style.width = pct + '%';
    }
    requestAnimationFrame(tick);
  }
  tick();

  // Also try to load from Firebase after delay
  if (typeof FIREBASE_READY !== 'undefined' && FIREBASE_READY) {
    setTimeout(function() {
      if (typeof fbGet === 'function') {
        fbGet('siteConfig/music', function(data) {
          if (data && data.url) {
            loadAudioUrl(data.url);
          }
          if (data && data.title) {
            setTitleText(data.title);
          }
        });
      }
    }, 3000);
  }

  // Expose internals for admin
  window._musicLoadAudioUrl = loadAudioUrl;
  window._musicSetTitle = setTitleText;
  window._musicSetStatus = setStatus;

})();

// Public API for admin panel
function setMusicUrl(url) {
  if (_musicAudio && url) {
    if (typeof window._musicLoadAudioUrl === 'function') {
      window._musicLoadAudioUrl(url);
    } else {
      _musicAudio.src = url;
      _musicAudio.load();
    }
    if (_musicPlaying) {
      _musicAudio.play().catch(function(){});
    }
  }
}

function setMusicTitle(title) {
  if (typeof window._musicSetTitle === 'function') {
    window._musicSetTitle(title);
  } else {
    var titleEl = document.querySelector('.music-title-text');
    if (titleEl && title) titleEl.textContent = title;
  }
}
