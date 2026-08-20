/* ===== BUNDLE MODULE: systems/season_summary.js ===== */
/* ==========================================================================
   MODULE: systems/season_summary.js
   Season summary and transition hooks
   Migrated from V6.2 lines 6614-6767; execution order is defined by manifest.json.
   ========================================================================== */
    /* ---------------- 赛季结算面板 V0.1 ---------------- */
    function showSeasonSummary() {
      document.getElementById('decisionOverlay')?.classList.add('hidden');
      document.getElementById('seasonEventOverlay')?.classList.add('hidden');
      renderSeasonSummary();
      showScreen('summary');
    }

    function backFromSummary() {
      if (playoffState.active) {
        renderPlayoffs();
        showScreen('playoff');
      } else {
        renderSeason();
        showScreen('season');
      }
    }

    function getSeasonStageText() {
      if (!seasonState.played) return '赛季尚未开始';
      if (playoffState.round === 'champion') return '总冠军';
      if (playoffState.round === 'runnerup') return '总决赛 · 告负';
      if (playoffState.round === 'eliminated') return getPlayoffResultLabel();
      if (playoffState.active && currentPlayoffMatch()) return `${currentPlayoffMatch().stage} · 进行中`;
      const rank = estimateSeasonRank();
      return rank <= 8 ? `常规赛结束 · 排名第 ${rank} · 已晋级季后赛` : `常规赛结束 · 排名第 ${rank} · 未进入季后赛`;
    }

    function synthesizeStageStats(kind='regular') {
      const role = state.role || '长枪输出';
      const ovr = Number(getMyOvr()==='--' ? 78 : getMyOvr());
      const playoffAppearances=(playoffState.results||[]).filter(r=>!r?.dnp&&Number(r?.mapsPlayed??1)>0&&Number.isFinite(Number(r?.rating)));
      const games = kind==='regular' ? seasonState.userRatings.length : playoffAppearances.length;
      if (!games) return null;
      const avgRating = kind==='regular'
        ? seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length
        : playoffAppearances.reduce((a,b)=>a+Number(b.rating||0),0)/playoffAppearances.length;
      const decisionRate = kind==='regular'
        ? (seasonState.decisionTotal ? seasonState.decisionSuccess/seasonState.decisionTotal*100 : null)
        : clamp((seasonState.decisionTotal ? seasonState.decisionSuccess/Math.max(1,seasonState.decisionTotal)*100 : 58) + (avgRating-6.8)*4 + 3, 42, 92);
      const base = {
        '坦克': { elim: 14.2, assist: 19.1, death: 6.6, pick: 3.2 },
        '长枪输出': { elim: 20.6, assist: 8.4, death: 5.9, pick: 5.0 },
        '弹道输出': { elim: 18.9, assist: 10.8, death: 6.3, pick: 4.1 },
        '输出支援': { elim: 12.6, assist: 17.2, death: 5.5, pick: 2.8 },
        '战术支援': { elim: 9.4, assist: 22.6, death: 5.1, pick: 2.1 }
      }[role] || { elim: 16.0, assist: 14.0, death: 6.0, pick: 3.5 };
      const scale = 1 + (avgRating - 6.8) * 0.08 + (ovr - 80) * 0.008 + (kind==='playoff' ? 0.06 : 0);
      const deathScale = 1 - (avgRating - 6.8) * 0.045 - (ovr - 80) * 0.003;
      const elim = (base.elim * scale).toFixed(1);
      const assists = (base.assist * scale).toFixed(1);
      const deaths = clamp(base.death * deathScale + (kind==='playoff' ? 0.15 : 0), 3.6, 8.8).toFixed(1);
      const picks = clamp(base.pick * scale, 1.2, 8.9).toFixed(1);
      const mvpRate = clamp((avgRating - 6.0) * 18 + (ovr - 75) * 1.5 + (kind==='playoff' ? 5 : 0), 8, 78);
      const mvpGames = Math.max(0, Math.round(games * mvpRate / 100));
      const participation = clamp(58 + (avgRating - 6.5) * 8 + (role.includes('支援') ? 6 : 0), 55, 88).toFixed(1);
      const survival = clamp(70 + (8.2 - Number(deaths)) * 4.5 + (role === '坦克' ? -3 : 0), 58, 92).toFixed(1);
      const fightWin = clamp(49 + (avgRating - 6.5) * 9 + (kind==='playoff' ? 2 : 0), 44, 81).toFixed(1);
      return {
        games, avgRating, boxes:[
          {label:'平均评分', value:avgRating.toFixed(1)},
          {label:'击杀（每10分钟）', value:elim},
          {label:'阵亡（每10分钟）', value:deaths},
          {label:'助攻（每10分钟）', value:assists},
          {label:'最后一击（每10分钟）', value:picks},
          {label:'系列赛 MVP', value:String(mvpGames)}
        ],
        line:`决策成功率 ${decisionRate==null?'—':decisionRate.toFixed(1)+'%'} · 参团率 ${participation}% · 生存率 ${survival}% · 团战胜率 ${fightWin}%`
      };
    }

    function renderSummaryStats(containerId, lineId, data) {
      const boxWrap = document.getElementById(containerId);
      const lineWrap = document.getElementById(lineId);
      if (!data) {
        boxWrap.innerHTML = '<div class="summary-note-empty">本阶段暂无数据。</div>';
        lineWrap.textContent = '';
        return;
      }
      boxWrap.innerHTML = data.boxes.map(item => `<div class="summary-stat-box"><strong>${item.value}</strong><span>${item.label}</span></div>`).join('');
      lineWrap.textContent = data.line;
    }

    function renderSeasonSummary() {
      document.getElementById('summarySeasonChip').textContent = `${careerState.seasonYear} 赛季`;
      document.getElementById('summaryTeamName').textContent = careerState.team?.name || '待定';
      document.getElementById('summaryRecord').textContent = `${seasonState.wins}-${seasonState.losses}`;
      document.getElementById('summaryStageText').textContent = getSeasonStageText();
      document.getElementById('summaryRole').textContent = state.role || '—';
      document.getElementById('summaryOvr').textContent = getMyOvr();
      document.getElementById('summaryPlayerName').textContent = getPlayerName();
      document.getElementById('summaryTeamText').textContent = careerState.team?.name || '—';

      const regular = synthesizeStageStats('regular');
      document.getElementById('summaryRegularTitle').textContent = `📈 常规赛个人数据 · 出场 ${seasonState.userRatings.length} / 队伍 ${seasonState.played} 场`;
      renderSummaryStats('summaryRegularStats', 'summaryRegularLine', regular);

      const playoffWrap = document.getElementById('summaryPlayoffWrap');
      if (playoffState.results.length) {
        const playoffApps=(playoffState.results||[]).filter(r=>!r?.dnp&&Number(r?.mapsPlayed??1)>0&&Number.isFinite(Number(r?.rating))).length;
        document.getElementById('summaryPlayoffTitle').textContent = `🏆 季后赛个人数据 · 出场 ${playoffApps} / 队伍 ${playoffState.results.length} 场`;
        const playoff = synthesizeStageStats('playoff');
        playoffWrap.innerHTML = `<div class="summary-stat-grid" id="summaryPlayoffStats"></div><div class="summary-stat-line" id="summaryPlayoffLine"></div>`;
        renderSummaryStats('summaryPlayoffStats', 'summaryPlayoffLine', playoff);
      } else if (estimateSeasonRank() <= 8 && seasonState.played >= seasonState.total) {
        document.getElementById('summaryPlayoffTitle').textContent = '🏆 季后赛数据';
        playoffWrap.innerHTML = '<div class="summary-note-empty">季后赛尚未开始。</div>';
      } else {
        document.getElementById('summaryPlayoffTitle').textContent = '🏆 季后赛数据';
        playoffWrap.innerHTML = '<div class="summary-note-empty">本赛季未进入季后赛。</div>';
      }

      document.getElementById('summaryAttrGrid').innerHTML = ATTRS.map(attr => {
        const item = state.locked[attr.key];
        const value = item?.value || 0;
        const rank = value ? getRank(value).label : '—';
        return `<div class="summary-attr-pill"><small>${attr.name}</small><strong>${rank}</strong><em>${item ? item.player : '未继承'}</em></div>`;
      }).join('');

      const footer = document.getElementById('summaryFooterCopy');
      const offBtn=document.getElementById('summaryOffseasonBtn');
      const regularDone=seasonState.played>=seasonState.total;
      const qualified=regularDone && estimateSeasonRank()<=8;
      const playoffDone=['champion','runnerup','eliminated'].includes(playoffState.round);
      const needsPlayoff=qualified && !playoffDone;
      const canOffseason=regularDone && (!qualified || playoffDone);
      if(offBtn) {
        offBtn.disabled=!regularDone;
        offBtn.textContent=!regularDone
          ? '⌛ 请先完成常规赛'
          : needsPlayoff
            ? '🏆 继续季后赛 →'
            : '📊 生涯数据 · 进入休赛期 →';
      }
      if (playoffState.round === 'champion') footer.textContent = '赛季结束，进入休赛期。';
      else if (playoffState.round === 'runnerup') footer.textContent = '赛季结束，进入休赛期。';
      else if (playoffState.round === 'eliminated') footer.textContent = `${getPlayoffResultLabel()}。进入休赛期。`;
      else if (needsPlayoff) footer.textContent = '已获得季后赛资格。';
      else if (canOffseason) footer.textContent = '赛季结束，进入休赛期。';
      else footer.textContent = '赛季尚未结束。';
    }

    function enterOffseasonStub() {
      enterOffseason();
    }

    function handleSeasonRestartFromSummary() {
      const proceed=()=>restartCurrentSeason();
      if(seasonState.played>0||seasonState.eventHistory.length>0||playoffState.active){if(!window.__OWL_CONFIRM?.({icon:'↩️',kicker:'SEASON RESET · 赛季重开',title:'重开当前赛季？',body:'<p>这会清空当前战绩、季后赛与随机事件进度。</p>',confirmText:'重开赛季',cancelText:'保留当前进度',tone:'warning',onConfirm:proceed}))return;return;}
      proceed();
    }





