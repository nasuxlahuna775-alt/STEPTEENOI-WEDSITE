/**
 * music-player.js — Floating bottom-right corner music widget
 */
(function() {
  var playing = false;
  var audio = new Audio();
  audio.loop = true;
  audio.volume = 0.4;
  // Royalty-free ambient
  audio.src = 'https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3';

  var btn = document.getElementById('musicBtn');
  var fill = document.getElementById('musicProgress');
  var player = document.getElementById('musicPlayer');

  if (!btn || !player) return;

  btn.addEventListener('click', function() {
    if (playing) {
      audio.pause();
      btn.textContent = '▶';
      playing = false;
      player.classList.remove('is-playing');
    } else {
      audio.play().catch(function(){});
      btn.textContent = '⏸';
      playing = true;
      player.classList.add('is-playing');
    }
  });

  // Animate progress bar
  function tick() {
    if (fill && audio.duration) {
      var pct = (audio.currentTime / audio.duration) * 100;
      fill.style.width = pct + '%';
    }
    requestAnimationFrame(tick);
  }
  tick();
})();
