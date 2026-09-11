/**
 * music-player.js — Floating bottom-right corner music widget
 * Supports dynamic URL change from admin panel
 */
var _musicAudio = null;
var _musicPlaying = false;
var _defaultMusicUrl = 'https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3';

(function() {
  _musicAudio = new Audio();
  _musicAudio.loop = true;
  _musicAudio.volume = 0.4;

  // Load saved music URL from config
  function initMusic() {
    var cfg = null;
    try {
      var stored = localStorage.getItem('steenoiconfig');
      if (stored) cfg = JSON.parse(stored);
    } catch(e) {}

    var url = (cfg && cfg.music && cfg.music.url) ? cfg.music.url : _defaultMusicUrl;
    _musicAudio.src = url;

    var titleEl = document.querySelector('.music-title-text');
    if (titleEl && cfg && cfg.music && cfg.music.title) {
      titleEl.textContent = cfg.music.title;
    }
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
    } else {
      _musicAudio.play().catch(function(){});
      btn.textContent = '⏸';
      _musicPlaying = true;
      player.classList.add('is-playing');
    }
  });

  // Animate progress bar
  function tick() {
    if (fill && _musicAudio.duration) {
      var pct = (_musicAudio.currentTime / _musicAudio.duration) * 100;
      fill.style.width = pct + '%';
    }
    requestAnimationFrame(tick);
  }
  tick();

  // Also try to load from Firebase after delay
  if (FIREBASE_READY) {
    setTimeout(function() {
      fbGet('siteConfig/music', function(data) {
        if (data && data.url) {
          _musicAudio.src = data.url;
        }
        if (data && data.title) {
          var titleEl = document.querySelector('.music-title-text');
          if (titleEl) titleEl.textContent = data.title;
        }
      });
    }, 3000);
  }
})();

// Public API for admin panel
function setMusicUrl(url) {
  if (_musicAudio && url) {
    _musicAudio.src = url;
    if (_musicPlaying) {
      _musicAudio.play().catch(function(){});
    }
  }
}

function setMusicTitle(title) {
  var titleEl = document.querySelector('.music-title-text');
  if (titleEl && title) titleEl.textContent = title;
}
