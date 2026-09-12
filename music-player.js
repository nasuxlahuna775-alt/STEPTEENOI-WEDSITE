/**
 * music-player.js — Floating bottom-right corner music widget v11
 * Auto-plays on first user interaction (click/tap/scroll)
 * No manual start button needed — music starts by itself
 */
var _musicAudio = null;
var _musicPlaying = false;
var _musicLoaded = false;
var _musicError = false;
var _autoStarted = false;
var _defaultMusicUrl = 'https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3';

(function() {
  _musicAudio = new Audio();
  _musicAudio.loop = true;
  _musicAudio.volume = 0.4;
  _musicAudio.preload = 'auto';
  // NOTE: Do NOT set crossOrigin — many MP3 hosts don't send
  // Access-Control-Allow-Origin, causing browser to block audio.

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
      setStatus('ready', 'พร้อมเล่น');
      console.log('[Music] Loaded:', url);
      // Auto-play if user already interacted
      tryAutoPlay();
    };

    _musicAudio.onerror = function() {
      _musicError = true;
      _musicLoaded = false;
      setStatus('error', 'โหลดเพลงไม่ได้');
      console.warn('[Music] Error loading:', url, _musicAudio.error);
    };

    _musicAudio.onloadeddata = function() {
      _musicLoaded = true;
      setStatus('ready', 'พร้อมเล่น');
    };

    _musicAudio.load();
  }

  // Try to auto-play — works after user gesture
  function tryAutoPlay() {
    if (_musicPlaying) return;
    if (!_musicLoaded || _musicError) return;
    _musicAudio.play().then(function() {
      _musicPlaying = true;
      _autoStarted = true;
      var btn = document.getElementById('musicBtn');
      var player = document.getElementById('musicPlayer');
      if (btn) btn.textContent = '⏸';
      if (player) player.classList.add('is-playing');
      setStatus('playing', 'กำลังเล่น...');
      console.log('[Music] Auto-played!');
    }).catch(function(err) {
      console.warn('[Music] Auto-play blocked — will retry on next interaction:', err);
    });
  }

  // Set status text with icon
  function setStatus(type, text) {
    var statusEl = document.getElementById('musicStatus');
    if (!statusEl) return;
    var icons = { loading: '⏳', ready: '✅', error: '❌', playing: '🎵' };
    statusEl.textContent = (icons[type] || '') + ' ' + text;
    statusEl.className = 'music-status music-status-' + type;
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

  // Manual play/pause button
  btn.addEventListener('click', function() {
    if (_musicPlaying) {
      _musicAudio.pause();
      btn.textContent = '▶';
      _musicPlaying = false;
      player.classList.remove('is-playing');
      setStatus('ready', 'หยุดชั่วคราว');
    } else {
      if (_musicError) {
        loadAudioUrl(_musicAudio.src);
        setStatus('loading', 'กำลังโหลดใหม่...');
      }
      _musicAudio.play().then(function() {
        btn.textContent = '⏸';
        _musicPlaying = true;
        _autoStarted = true;
        player.classList.add('is-playing');
        setStatus('playing', 'กำลังเล่น...');
      }).catch(function(err) {
        console.warn('[Music] Play blocked:', err);
        setStatus('error', 'กด ▶ อีกครั้ง');
      });
    }
  });

  // Progress bar
  function tick() {
    if (fill && _musicAudio.duration && isFinite(_musicAudio.duration)) {
      var pct = (_musicAudio.currentTime / _musicAudio.duration) * 100;
      fill.style.width = pct + '%';
    }
    requestAnimationFrame(tick);
  }
  tick();

  // ===== AUTO-PLAY ON ANY INTERACTION =====
  // Browsers require a user gesture before playing audio.
  // We listen for ANY click, tap, scroll, or key press.
  function onFirstInteraction() {
    if (_autoStarted) return; // already tried
    console.log('[Music] User interacted — trying auto-play...');
    _autoStarted = true;
    // Small delay so the gesture registers with the browser
    setTimeout(function() {
      tryAutoPlay();
      // If first attempt fails, retry a few more times
      var retries = 0;
      var retryInterval = setInterval(function() {
        if (_musicPlaying || retries > 5) {
          clearInterval(retryInterval);
          return;
        }
        if (_musicLoaded && !_musicError) {
          tryAutoPlay();
        }
        retries++;
      }, 1000);
    }, 100);
  }

  document.addEventListener('click', onFirstInteraction, { once: true });
  document.addEventListener('touchstart', onFirstInteraction, { once: true });
  document.addEventListener('keydown', onFirstInteraction, { once: true });
  document.addEventListener('scroll', onFirstInteraction, { once: true, passive: true });

  // Load from Firebase after delay
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
