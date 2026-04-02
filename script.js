/* ══════════════════════════════════════════════
   MINT — script.js
════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Scroll hint ──────────────────────────── */
  var hint = document.getElementById('scrollHint');
  if (hint) {
    window.addEventListener('scroll', function () {
      hint.classList.add('gone');
    }, { once: true, passive: true });
  }

  /* ── Chip stagger ─────────────────────────── */
  function revealChips(row) {
    row.querySelectorAll('.chip').forEach(function (chip, i) {
      setTimeout(function () { chip.classList.add('show'); }, i * 70);
    });
  }

  if ('IntersectionObserver' in window) {
    var chipObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        revealChips(entry.target);
        chipObs.unobserve(entry.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.chip-row').forEach(function (row) {
      chipObs.observe(row);
    });
  } else {
    document.querySelectorAll('.chip').forEach(function (c) { c.classList.add('show'); });
  }

  /* ── Outro / Discord reveal ───────────────── */
  if ('IntersectionObserver' in window) {
    var outroObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('.reveal-item').forEach(function (el, i) {
          setTimeout(function () { el.classList.add('show'); }, i * 80);
        });
        outroObs.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });

    document.querySelectorAll('#outro, #discord').forEach(function (sec) {
      outroObs.observe(sec);
    });
  } else {
    document.querySelectorAll('.reveal-item').forEach(function (el) { el.classList.add('show'); });
  }

  /* ── Discord widget error detection ──────── */
  (function () {
    var iframe = document.getElementById('discordWidget');
    var fallback = document.getElementById('discordFallback');
    if (!iframe || !fallback) return;

    // If the iframe fails to load (cross-origin errors won't fire onerror,
    // but we can check if the widget's container ends up blank after a timeout)
    var widgetTimer = setTimeout(function () {
      // We can't read cross-origin iframe content, so we rely on the
      // widget itself. If it loaded OK the iframe will have non-zero scrollHeight
      // via same-origin check — if not, show fallback.
      try {
        // same-origin access attempt — throws for cross-origin (expected)
        var h = iframe.contentWindow.document.body.scrollHeight;
        if (h < 10) { fallback.style.opacity = '1'; }
      } catch (e) {
        // cross-origin means it loaded fine (Discord's servers responded)
        // so don't show fallback
      }
    }, 6000);

    iframe.addEventListener('error', function () {
      clearTimeout(widgetTimer);
      fallback.style.opacity = '1';
    });
  }());

  /* ══════════════════════════════════════════
     FEATURED WORK — GitHub API
  ════════════════════════════════════════════
     Fetches public repos for MINT-D8,
     excludes the portfolio repo itself,
     picks the 3 most interesting ones,
     and renders cards.
  ═══════════════════════════════════════════ */

  var GITHUB_USER = 'MINT-D8';
  var EXCLUDE_REPO = 'My-Portofolio'; // the portfolio repo slug to skip (case-insensitive)

  /* Language → accent colour map.
     Falls back to var(--muted) for unknowns. */
  var LANG_COLORS = {
    'C++':        '#5b9bd5',
    'C':          '#5b9bd5',
    'C#':         '#9b7dc4',
    'Rust':       '#c0544a',
    'Python':     '#4a9fd4',
    'Java':       '#e8a040',
    'Lua':        '#7b8ec8',
    'JavaScript': '#d4bf40',
    'TypeScript': '#4a85c8',
    'HTML':       '#c86040',
    'CSS':        '#4a80b5',
    'Shell':      '#8ddcb0',
    'Go':         '#79d4d8',
    'Kotlin':     '#b07de0',
    'Swift':      '#f05138',
    'Ruby':       '#cc342d',
    'PHP':        '#777bb4',
  };

  /* Score a repo to pick the most interesting ones.
     Higher score = more likely to be featured. */
  function scoreRepo(repo) {
    var score = 0;
    score += (repo.stargazers_count || 0) * 3;
    score += (repo.forks_count || 0) * 2;
    score += (repo.watchers_count || 0);
    // having a description is a good sign
    if (repo.description && repo.description.trim().length > 10) score += 5;
    // prefer non-forked
    if (!repo.fork) score += 4;
    // prefer repos with known languages
    if (repo.language && LANG_COLORS[repo.language]) score += 3;
    // recently updated is a proxy for active
    var updated = new Date(repo.pushed_at || repo.updated_at);
    var ageMonths = (Date.now() - updated) / (1000 * 60 * 60 * 24 * 30);
    if (ageMonths < 6)  score += 4;
    if (ageMonths < 18) score += 2;
    return score;
  }

  /* Try to pick 3 repos that are varied in language. */
  function pickFeatured(repos) {
    var sorted = repos.slice().sort(function (a, b) {
      return scoreRepo(b) - scoreRepo(a);
    });

    var picked = [];
    var usedLangs = {};

    // First pass: prefer language diversity
    for (var i = 0; i < sorted.length && picked.length < 3; i++) {
      var r = sorted[i];
      var lang = r.language || 'Unknown';
      if (!usedLangs[lang]) {
        picked.push(r);
        usedLangs[lang] = true;
      }
    }

    // Second pass: fill remaining slots ignoring lang dupe
    for (var j = 0; j < sorted.length && picked.length < 3; j++) {
      if (picked.indexOf(sorted[j]) === -1) {
        picked.push(sorted[j]);
      }
    }

    return picked;
  }

  /* Build a single project card element. */
  function buildCard(repo) {
    var lang    = repo.language || '';
    var color   = LANG_COLORS[lang] || 'var(--muted)';
    var desc    = repo.description
      ? repo.description.trim()
      : 'No description provided.';
    var stars   = repo.stargazers_count || 0;
    var forks   = repo.forks_count || 0;

    var card = document.createElement('article');
    card.className = 'project-card';

    card.innerHTML =
      '<div class="project-card-top">' +
        '<span class="project-lang-dot" style="--lang-color:' + color + '" title="' + escHtml(lang) + '"></span>' +
        '<span class="project-name">' + escHtml(repo.name) + '</span>' +
        '<a class="project-link" href="' + escHtml(repo.html_url) + '" target="_blank" rel="noopener noreferrer" aria-label="View ' + escHtml(repo.name) + ' on GitHub">' +
          'View Code' +
          '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
            '<path d="M2.5 9.5l7-7M4 2.5h5.5V8"/>' +
          '</svg>' +
        '</a>' +
      '</div>' +
      '<p class="project-desc">' + escHtml(desc) + '</p>' +
      '<div class="project-stats">' +
        (lang
          ? '<span class="project-stat">' +
              '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><circle cx="6" cy="6" r="4.5"/></svg>' +
              escHtml(lang) +
            '</span>'
          : '') +
        '<span class="project-stat">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
          stars +
        '</span>' +
        (forks > 0
          ? '<span class="project-stat">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>' +
              forks +
            '</span>'
          : '') +
      '</div>';

    return card;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderCards(repos) {
    var grid  = document.getElementById('projectGrid');
    var error = document.getElementById('projectsError');
    if (!grid) return;

    var featured = pickFeatured(repos);

    if (featured.length === 0) {
      grid.hidden  = true;
      error.hidden = false;
      return;
    }

    // Clear skeleton placeholders
    grid.innerHTML = '';

    featured.forEach(function (repo, i) {
      var card = buildCard(repo);
      grid.appendChild(card);
      // stagger reveal
      setTimeout(function () { card.classList.add('show'); }, i * 120 + 80);
    });

    // Observe the grid section for scroll-reveal if needed
    if ('IntersectionObserver' in window) {
      var workObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          grid.querySelectorAll('.project-card').forEach(function (c, i) {
            setTimeout(function () { c.classList.add('show'); }, i * 120);
          });
          workObs.unobserve(entry.target);
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
      workObs.observe(grid);
    }
  }

  function loadProjects() {
    var grid  = document.getElementById('projectGrid');
    var error = document.getElementById('projectsError');
    if (!grid) return;

    fetch('https://api.github.com/users/' + GITHUB_USER + '/repos?per_page=100&sort=pushed', {
      headers: { 'Accept': 'application/vnd.github+json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('GitHub API returned ' + res.status);
        return res.json();
      })
      .then(function (all) {
        var filtered = all.filter(function (r) {
          return r.name.toLowerCase() !== EXCLUDE_REPO.toLowerCase() &&
                 !r.archived &&
                 !r.disabled;
        });

        if (filtered.length === 0) {
          grid.innerHTML = '';
          grid.hidden  = true;
          error.hidden = false;
          return;
        }

        renderCards(filtered);
      })
      .catch(function () {
        if (grid)  { grid.innerHTML = ''; grid.hidden = true; }
        if (error) { error.hidden = false; }
      });
  }

  loadProjects();

  /* ── Time widget ──────────────────────────── */
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

  /* ── Reduced motion ───────────────────────── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.chip').forEach(function (c) { c.classList.add('show'); });
    document.querySelectorAll('.reveal-item').forEach(function (el) { el.classList.add('show'); });
    document.querySelectorAll('.project-card').forEach(function (c) { c.classList.add('show'); });
    if (hint) hint.classList.add('gone');
  }

})();
