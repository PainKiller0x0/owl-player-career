/* ===== BUNDLE MODULE: legacy/v40_dev_playoffs.js ===== */
/* ==========================================================================
   MODULE: legacy/v40_dev_playoffs.js
   Compatibility layer: developer gating and whole-playoff simulation
   Migrated from V6.2 lines 9932-9983; execution order is defined by manifest.json.
   ========================================================================== */
    /* ================= V4.1 · 开发入口收口 / 整季后赛模拟 ================= */

    // 网页部署版不暴露开发者模式。本机 file:// 或 localhost 才允许开启。
    if(!isLocalDeveloperEnvironment()) {
      gameSettings.developerMode=false;
      document.body.classList.remove('dev-mode');
      document.getElementById('developerSettingRow')?.classList.add('ui-hidden');
    }

    // 季后赛：一键快速模拟玩家剩余全部轮次。出局后沿用现有逻辑继续跑出冠亚军。
    function simulateWholePlayoffs() {
      if(!playoffState.active || !currentPlayoffMatch()) return;
      const btn=document.getElementById('simulateWholePlayoffsBtn');
      if(btn){btn.disabled=true;btn.textContent='模拟中…';}
      let guard=0;
      while(currentPlayoffMatch() && guard++<12) {
        simulateSinglePlayoffSeries();
        if(['champion','runnerup','eliminated'].includes(playoffState.round)) break;
      }
      renderPlayoffs();
      showScreen('playoff');
      window.scrollTo({top:0,behavior:'smooth'});
    }
    document.getElementById('simulateWholePlayoffsBtn')?.addEventListener('click',simulateWholePlayoffs);

    // 在原季后赛渲染基础上同步“一键模拟整个季后赛”按钮状态。
    const _v40RenderPlayoffsBase=renderPlayoffs;
    renderPlayoffs=function(){
      _v40RenderPlayoffsBase();
      const whole=document.getElementById('simulateWholePlayoffsBtn');
      if(!whole)return;
      const current=currentPlayoffMatch();
      whole.disabled=!current;
      whole.classList.toggle('ui-hidden',!current);
      whole.textContent=current?'🚀 模拟整个季后赛':'季后赛已结束';
    };

    // 休赛期开发者入口：无视正常退役年龄条件，每个赛季都可直接测试退役流程。
    const _v40RenderOffseasonReviewBase=renderOffseasonReview;
    renderOffseasonReview=function(wrap){
      _v40RenderOffseasonReviewBase(wrap);
      const actions=wrap.querySelector('.offer-actions');
      if(!actions || actions.querySelector('#devRetireOffseasonBtn')) return;
      const btn=document.createElement('button');
      btn.className='secondary-btn dev-only';
      btn.id='devRetireOffseasonBtn';
      btn.textContent='🛠 开发者：立即退役';
      btn.addEventListener('click',()=>retireCareer(`${careerState.age}岁 · 开发者测试退役`));
      actions.prepend(btn);
    };




