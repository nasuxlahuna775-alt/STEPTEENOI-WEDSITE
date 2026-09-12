/**
 * music-player.js — Floating bottom-right corner music widget v13
 * FAST LOAD: Preloads audio on page start, auto-plays on first interaction
 * No manual start button needed — music starts by itself
 */
var _musicAudio = null;
var _musicPlaying = false;
var _musicLoaded = false;
var _musicError = false;
var _autoStarted = false;
var _retryCount = 0;
var _localMusicUrl = 'assets/default-music.mp3'; // bundled local file — instant load

(function() {
  // Create Audio immediately — start preloading RIGHT NOW
  _musicAudio = new Audio();
  _musicAudio.loop = true;
  _musicAudio.volume = 0.4;
  _musicAudio.preload = 'auto';
  _musicAudio.autoplay = false;

  function initMusic() {
    var cfg = null;
    try {
      var stored = localStorage.getItem('steenoiconfig');
      if (stored) cfg = JSON.parse(stored);
    } catch(e) {}

    // Priority: Firebase > localStorage > local bundled file
    // Start with LOCAL file first for instant availability,
    // then swap to Firebase/custom URL if available
    var localUrl = _localMusicUrl;
    var customUrl = (cfg && cfg.music && cfg.music.url) ? cfg.music.url : null;
    var title = (cfg && cfg.music && cfg.music.title) ? cfg.music.title : 'NOW PLAYING';

    // Load local file FIRST — it's instant (same server, no CORS, no network delay)
    loadAudioUrl(localUrl);
    setTitleText(title);

    // If there's a custom URL, load it after local file is ready
    // (swap audio source seamlessly)
    if (customUrl && customUrl !== localUrl) {
      _musicAudio.oncanplaythrough = function() {
        _musicLoaded = true;
        // Now try to load the custom URL in background
        console.log('[Music] Local file ready — swapping to custom URL...');
        swapToCustomUrl(customUrl);
      };
    }
  }

  // Load audio — set source and start buffering
  function loadAudioUrl(url) {
    if (!url) { setStatus('error', 'ไม่มีลิงก์เพลง'); return; }
    _musicLoaded = false;
    _musicError = false;
    setStatus('loading', 'กำลังโหลด...');

    _musicAudio.src = url;

    _musicAudio.oncanplaythrough = function() {
      _musicLoaded = true;
      _musicError = false;
      setStatus('ready', 'พร้อมเล่น');
      console.log('[Music] Loaded:', url);
      tryAutoPlay();
    };

    _musicAudio.onerror = function() {
      _musicError = true;
      _musicLoaded = false;
      setStatus('error', 'โหลดเพลงไม่ได้');
      console.warn('[Music] Error loading:', url);
    };

    _musicAudio.onloadeddata = function() {
      _musicLoaded = true;
      setStatus('ready', 'พร้อมเล่น');
      tryAutoPlay();
    };

    _musicAudio.load();
  }

  // Swap to custom URL after local file confirms browser allows playback
  function swapToCustomUrl(url) {
    var tempAudio = new Audio();
    tempAudio.preload = 'auto';
    tempAudio.src = url;
    tempAudio.oncanplaythrough = function() {
      // Custom URL loaded — swap source
      if (!_musicPlaying) {
        // Not playing yet — just swap source
        _musicAudio.src = url;
        _musicAudio.load();
      } else {
        // Currently playing local file — prepare swap at loop point
        var currentSrc = _musicAudio.src;
        _musicAudio.onended = function() {
          _musicAudio.src = url;
          _musicAudio.onended = null;
          _musicAudio.play().catch(function(){});
        };
      }
      console.log('[Music] Custom URL ready:', url);
    };
    tempAudio.onerror = function() {
      console.warn('[Music] Custom URL failed — keeping local file');
    };
    tempAudio.load();
  }

  // Try to auto-play
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
      console.warn('[Music] Auto-play blocked:', err.name || err);
      // Will retry on user interaction
    });
  }

  function setStatus(type, text) {
    var statusEl = document.getElementById('musicStatus');
    if (!statusEl) return;
    var icons = { loading: '⏳', ready: '✅', error: '❌', playing: '🎵' };
    statusEl.textContent = (icons[type] || '') + ' ' + text;
    statusEl.className = 'music-status music-status-' + type;
    if (type === 'ready' || type === 'error') {
      setTimeout(function() { if (statusEl) statusEl.style.opacity = '0.5'; }, 4000);
    }
  }

  function setTitleText(text) {
    var titleEl = document.querySelector('.music-title-text');
    if (titleEl && text) titleEl.textContent = text;
  }

  // START PRELOADING IMMEDIATELY
  initMusic();

  var btn = document.getElementById('musicBtn');
  var fill = document.getElementById('musicProgress');
  var player = document.getElementById('musicPlayer');

  if (!btn || !player) return;

  // Manual play/pause
  btn.addEventListener('click', function() {
    if (_musicPlaying) {
      _musicAudio.pause();
      btn.textContent = '▶';
      _musicPlaying = false;
      player.classList.remove('is-playing');
      setStatus('ready', 'หยุดชั่วคราว');
    } else {
      if (_musicError) {
        // Try local file as fallback
        loadAudioUrl(_localMusicUrl);
      }
      _musicAudio.play().then(function() {
        btn.textContent = '⏸';
        _musicPlaying = true;
        _autoStarted = true;
        player.classList.add('is-playing');
        setStatus('playing', 'กำลังเล่น...');
      }).catch(function(err) {
        setStatus('error', 'กด ▶ อีกครั้ง');
      });
    }
  });

  // Progress bar
  function tick() {
    if (fill && _musicAudio.duration && isFinite(_musicAudio.duration)) {
      fill.style.width = ((_musicAudio.currentTime / _musicAudio.duration) * 100) + '%';
    }
    requestAnimationFrame(tick);
  }
  tick();

  // ===== AUTO-PLAY ON ANY INTERACTION =====
  function onFirstInteraction() {
    if (_autoStarted) return;
    _autoStarted = true;
    console.log('[Music] User interacted — trying auto-play...');
    setTimeout(function() {
      if (!_musicLoaded && !_musicError) {
        // Still loading — retry after short delay
        var retries = 0;
        var retryId = setInterval(function() {
          if (_musicPlaying || retries > 10) { clearInterval(retryId); return; }
          if (_musicLoaded) tryAutoPlay();
          if (_musicError) {
            // Fallback to local file
            loadAudioUrl(_localMusicUrl);
          }
          retries++;
        }, 300);
      } else {
        tryAutoPlay();
      }
    }, 50);
  }

  // Listen for ANY user interaction — keep trying until music plays
  function interactionHandler() {
    if (_musicPlaying) return; // already playing, remove listeners
    _autoStarted = true;
    console.log('[Music] User interacted — trying auto-play...');
    setTimeout(function() {
      if (_musicLoaded && !_musicError) {
        tryAutoPlay();
      }
    }, 50);
  }
  document.addEventListener('click', interactionHandler);
  document.addEventListener('touchstart', interactionHandler);
  document.addEventListener('keydown', interactionHandler);
  document.addEventListener('scroll', interactionHandler, { passive: true });

  // Clean up listeners once music starts
  var _cleanupInterval = setInterval(function() {
    if (_musicPlaying) {
      document.removeEventListener('click', interactionHandler);
      document.removeEventListener('touchstart', interactionHandler);
      document.removeEventListener('keydown', interactionHandler);
      document.removeEventListener('scroll', interactionHandler);
      clearInterval(_cleanupInterval);
    }
  }, 2000);

  // Also try to play immediately if we already have user gesture
  // (e.g. user navigated by clicking a link to this page)
  setTimeout(function() {
    tryAutoPlay();
  }, 500);

  // Load from Firebase after delay
  if (typeof FIREBASE_READY !== 'undefined' && FIREBASE_READY) {
    setTimeout(function() {
      if (typeof fbGet === 'function') {
        fbGet('siteConfig/music', function(data) {
          if (data && data.url) {
            // Swap to Firebase URL if different from current
            var currentSrc = _musicAudio.src || '';
            if (data.url !== currentSrc && data.url !== _localMusicUrl) {
              swapToCustomUrl(data.url);
            }
          }
          if (data && data.title) {
            setTitleText(data.title);
          }
        });
      }
    }, 2000);
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
