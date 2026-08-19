/* ===== BUNDLE MODULE: ui/theme_fx.js ===== */
/* ==========================================================================
   MODULE: ui/theme_fx.js
   Theme and presentation effects
   Migrated from V6.2 lines 6768-6803; execution order is defined by manifest.json.
   ========================================================================== */
    /* ---------------- 主题与随机动效 ---------------- */
    function initTheme() {
      let saved=null; try{saved=localStorage.getItem('owl-career-theme')}catch(e){}
      const theme=saved||((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');
      applyTheme(theme);
    }
    function applyTheme(theme) {
      document.documentElement.dataset.theme=theme;
      if(els.themeToggle) {
        els.themeToggle.textContent=theme==='dark'?'☀️':'🌙';
        els.themeToggle.title=theme==='dark'?'切换日间模式':'切换夜间模式';
      }
      try{localStorage.setItem('owl-career-theme',theme)}catch(e){}
    }
    function toggleTheme() { applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'); }

    let randomFxTimer=null;
    function showRandomFx(title,candidates=[]) {
      const overlay=document.getElementById('randomFxOverlay');
      if(!overlay) return;
      document.getElementById('randomFxTitle').textContent=title||'正在随机';
      const copy=document.getElementById('randomFxText');
      overlay.classList.remove('ui-hidden');
      clearInterval(randomFxTimer);
      if(candidates.length) randomFxTimer=setInterval(()=>copy.textContent=pick(candidates),75);
      else copy.textContent='命运正在洗牌';
    }
    function hideRandomFx() {
      clearInterval(randomFxTimer); randomFxTimer=null;
      const overlay=document.getElementById('randomFxOverlay'); if(overlay) overlay.classList.add('ui-hidden');
    }
    function playChampionBurst() {
      document.body.classList.remove('champion-burst'); void document.body.offsetWidth; document.body.classList.add('champion-burst');
      setTimeout(()=>document.body.classList.remove('champion-burst'),1500);
    }



