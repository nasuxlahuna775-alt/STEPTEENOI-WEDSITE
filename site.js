/**
 * site.js — Snow + Lightning background effects
 */
(function() {
  // ===================== SNOW =====================
  var snowCanvas = document.createElement('canvas');
  snowCanvas.id = 'snowCanvas';
  snowCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;opacity:0.6;';
  document.body.appendChild(snowCanvas);
  var sctx = snowCanvas.getContext('2d');
  var flakes = [];
  var MAX_FLAKES = 80;

  function resizeSnow() {
    snowCanvas.width = window.innerWidth;
    snowCanvas.height = window.innerHeight;
  }
  resizeSnow();
  window.addEventListener('resize', resizeSnow);

  for (var i = 0; i < MAX_FLAKES; i++) {
    flakes.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 1,
      dx: (Math.random() - 0.5) * 0.5,
      dy: Math.random() * 0.8 + 0.3,
      o: Math.random() * 0.5 + 0.3
    });
  }

  function drawSnow() {
    sctx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      sctx.beginPath();
      sctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      sctx.fillStyle = 'rgba(255,255,255,' + f.o + ')';
      sctx.fill();
      f.x += f.dx;
      f.y += f.dy;
      if (f.y > snowCanvas.height + 5) { f.y = -5; f.x = Math.random() * snowCanvas.width; }
      if (f.x > snowCanvas.width + 5) f.x = -5;
      if (f.x < -5) f.x = snowCanvas.width + 5;
    }
    requestAnimationFrame(drawSnow);
  }
  drawSnow();

  // ===================== LIGHTNING (home only) =====================
  var lbg = document.querySelector('.lightning-bg');
  if (lbg) {
    var flashTimeout;
    function lightningFlash() {
      lbg.style.opacity = '0.25';
      setTimeout(function() { lbg.style.opacity = '0'; }, 60);
      setTimeout(function() { lbg.style.opacity = '0.15'; }, 120);
      setTimeout(function() { lbg.style.opacity = '0'; }, 200);
      scheduleFlash();
    }
    function scheduleFlash() {
      flashTimeout = setTimeout(lightningFlash, 3000 + Math.random() * 8000);
    }
    scheduleFlash();
  }
})();
