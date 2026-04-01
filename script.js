/* ══════════════════════════════════════════════
   MINT — script.js
════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Scroll hint ─────────────────────────────
     Hides the "scroll" arrow on first scroll.
  ─────────────────────────────────────────── */
  const hint = document.getElementById('scrollHint');
  if (hint) {
    window.addEventListener(
      'scroll',
      () => hint.classList.add('gone'),
      { once: true, passive: true }
    );
  }

  /* ── Chip stagger ────────────────────────────
     Reveal chips one-by-one when their section
     enters the viewport. Low threshold so it
     works fine on short/mobile screens too.
  ─────────────────────────────────────────── */
  function revealChips(row) {
    row.querySelectorAll('.chip').forEach(function(chip, i) {
      setTimeout(function() { chip.classList.add('show'); }, i * 70);
    });
  }

  if ('IntersectionObserver' in window) {
    var chipObs = new IntersectionObserver(
      function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          revealChips(entry.target);
          chipObs.unobserve(entry.target);
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.chip-row').forEach(function(row) {
      chipObs.observe(row);
    });
  } else {
    document.querySelectorAll('.chip').forEach(function(c) { c.classList.add('show'); });
  }

  /* ── Outro reveal ────────────────────────────
     Fade in the outro content when the section
     scrolls into view.
  ─────────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    var outroObs = new IntersectionObserver(
      function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          entry.target.querySelectorAll('.reveal-item').forEach(function(el, i) {
            setTimeout(function() { el.classList.add('show'); }, i * 80);
          });
          outroObs.unobserve(entry.target);
        });
      },
      { threshold: 0.05 }
    );
    var outro = document.getElementById('outro');
    if (outro) outroObs.observe(outro);
  } else {
    document.querySelectorAll('.reveal-item').forEach(function(el) { el.classList.add('show'); });
  }

  /* ── Time widget ─────────────────────────────
     Left  = MINT in Bochum (Europe/Berlin)
     Right = visitor's local time
     Status uses inline SVG icons, no emojis.
  ─────────────────────────────────────────── */
  var timeBochum    = document.getElementById('timeBochum');
  var statusBochum  = document.getElementById('statusBochum');
  var timeVisitor   = document.getElementById('timeVisitor');
  var statusVisitor = document.getElementById('statusVisitor');

  var icons = {
    sleep:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    morning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    around:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    evening: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>',
    late:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  };

  function getStatus(hour) {
    if (hour >= 23 || hour < 7)  return { text: 'probably sleeping', cls: 'sleep',  icon: icons.sleep   };
    if (hour >= 7  && hour < 10) return { text: 'morning',           cls: 'awake',  icon: icons.morning };
    if (hour >= 10 && hour < 18) return { text: 'likely around',     cls: 'awake',  icon: icons.around  };
    if (hour >= 18 && hour < 21) return { text: 'evening mode',      cls: 'awake',  icon: icons.evening };
    return                               { text: 'up late maybe',    cls: 'late',   icon: icons.late    };
  }

  function fmt(date, tz) {
    return date.toLocaleTimeString('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  function getHour(date, tz) {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    }).formatToParts(date);
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === 'hour') return parseInt(parts[i].value, 10);
    }
    return 12;
  }

  function setTimeCol(timeEl, statusEl, date, tz) {
    if (!timeEl || !statusEl) return;
    timeEl.textContent = fmt(date, tz);
    var s = getStatus(getHour(date, tz));
    statusEl.innerHTML = s.icon + '<span>' + s.text + '</span>';
    statusEl.className = 'time-status ' + s.cls;
  }

  function tick() {
    if (!timeBochum) return;
    var now = new Date();
    setTimeCol(timeBochum,  statusBochum,  now, 'Europe/Berlin');
    var visitorTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimeCol(timeVisitor, statusVisitor, now, visitorTZ);
  }

  tick();
  setInterval(tick, 10000);

  /* ── Reduced motion ──────────────────────────
     Skip all animations if OS requests it.
  ─────────────────────────────────────────── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.chip').forEach(function(c) { c.classList.add('show'); });
    document.querySelectorAll('.reveal-item').forEach(function(el) { el.classList.add('show'); });
    if (hint) hint.classList.add('gone');
  }

})();
