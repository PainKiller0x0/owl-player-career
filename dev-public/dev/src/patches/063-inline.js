/* ======================================================================
   Public Beta 1.9 RC13 · Career Value & Ordinary Story Polish
   - distinguish championship contribution instead of presenting every ring
     as if the user were the dynasty core
   - add one grounded career node for ordinary / difficult careers
   - no new popups, no extra event frequency, archive only
   ====================================================================== */
(function(){
  const VER='Public Beta 1.9 RC13';
  const esc33=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const share33=r=>{
    const a=Number(r?.stats?.appearances||0),s=Number(r?.stats?.series||0);
    return s>0?Math.max(0,Math.min(1,a/s)):0;
  };
  const isPlayoff33=r=>/总冠军|亚军|季后赛|四强|六强|八强|季军/.test(String(r?.result||''));
  const missedPlayoffs33=r=>!isPlayoff33(r)&&/常规赛|未进|无缘/.test(String(r?.result||''));

  function usage33(r){
    const sh=share33(r);
    if(Number(r?.stats?.appearances||0)<=0)return{key:'none',label:'未获出场',share:sh};
    if(sh>=.72)return{key:'starter',label:'主力首发',share:sh};
    if(sh>=.48)return{key:'rotation',label:'主要轮换',share:sh};
    if(sh>=.22)return{key:'fringe',label:'边缘轮换',share:sh};
    return{key:'bench',label:'深度替补',share:sh};
  }

  function championContribution33(r){
    if(!r||r.result!=='总冠军')return null;
    const u=usage33(r),honors=r.honors||[],rating=Number(r.rating||0);
    if(honors.includes('总决赛MVP')||honors.includes('总决赛最有价值选手')||r.fmvp?.isUser||honors.includes('MVP')||(u.share>=.82&&rating>=7.35))
      return{key:'core',label:'冠军核心',icon:'👑',share:u.share};
    if(u.share>=.62)return{key:'starter',label:'冠军主力',icon:'🏆',share:u.share};
    if(u.share>=.32)return{key:'rotation',label:'冠军轮换',icon:'🔄',share:u.share};
    return{key:'member',label:'冠军阵容成员',icon:'📋',share:u.share};
  }

  function consecutiveMissedBefore33(archive,idx){
    let n=0;
    for(let i=idx-1;i>=0;i--){if(missedPlayoffs33(archive[i]))n++;else break;}
    return n;
  }

  function appearanceMilestone33(archive,idx){
    const thresholds=[50,100,150,200,250,300,400,500];
    const prev=archive.slice(0,idx).reduce((n,r)=>n+Number(r.stats?.appearances||0),0);
    const now=prev+Number(archive[idx]?.stats?.appearances||0);
    const crossed=thresholds.filter(x=>prev<x&&now>=x).at(-1);
    return crossed||null;
  }

  function contractNode33(r){
    const pending=careerState.v33ContractNodes||{};
    const n=pending?.[String(r?.year)];
    return n?{...n}:null;
  }

  function careerNode33(r){
    const archive=careerState.careerArchive||[],idx=archive.indexOf(r);
    if(idx<0)return null;
    const cur=usage33(r),prev=idx>0?usage33(archive[idx-1]):null;
    const missedBefore=consecutiveMissedBefore33(archive,idx);

    // Position changes matter more than generic season results.
    if(prev&&prev.share<.50&&cur.share>=.68)
      return{icon:'⬆️',key:'regained-starter',title:'重新抢回主力位置',text:`出场占比从 ${Math.round(prev.share*100)}% 回升到 ${Math.round(cur.share*100)}%。`};
    if(prev&&prev.share>=.65&&cur.share<=.48)
      return{icon:'⬇️',key:'fell-rotation',title:'从首发跌入轮换',text:`出场占比从 ${Math.round(prev.share*100)}% 降到 ${Math.round(cur.share*100)}%。`};
    if(idx===0&&cur.share>=.72)
      return{icon:'✅',key:'first-starter',title:'首个完整赛季站稳首发',text:`赛季出场占比 ${Math.round(cur.share*100)}%。`};
    if(prev&&prev.share<.65&&cur.share>=.72&&!archive.slice(0,idx).some(x=>share33(x)>=.72))
      return{icon:'✅',key:'first-starter',title:'首次站稳首发',text:`赛季出场占比提升到 ${Math.round(cur.share*100)}%。`};

    // Team success after a long drought is a strong memory even without awards.
    if(isPlayoff33(r)&&missedBefore>=2)
      return{icon:'🎟️',key:'playoff-return',title:`阔别${missedBefore}年重返季后赛`,text:`连续${missedBefore}年无缘季后赛后，再次进入年度季后赛。`};

    // Contract-year outcomes are grounded in the actual market offer set.
    const cn=contractNode33(r);if(cn)return cn;

    if(prev&&prev.share-cur.share>=.20&&cur.share<.65)
      return{icon:'📉',key:'usage-drop',title:'出场时间明显缩水',text:`出场占比从 ${Math.round(prev.share*100)}% 降到 ${Math.round(cur.share*100)}%。`};

    if(missedPlayoffs33(r)){
      let streak=1;for(let i=idx-1;i>=0&&missedPlayoffs33(archive[i]);i--)streak++;
      if(streak>=2&&streak%2===0)return{icon:'🌧️',key:`missed-${streak}`,title:`连续${streak}年无缘季后赛`,text:'这段低谷已经成为职业生涯的一部分。'};
    }

    const milestone=appearanceMilestone33(archive,idx);
    if(milestone)
      return{icon:'🎮',key:`apps-${milestone}`,title:`生涯 ${milestone} 次系列赛出场`,text:'职业生涯出场里程碑。'};
    return null;
  }

  function enrich33(r){
    if(!r)return null;
    r.usageIdentity=usage33(r);
    r.championContribution=championContribution33(r);
    if(r.championContribution){
      const c=r.championContribution;
      r.seasonAnchor={icon:'🏆',title:`总冠军 · ${c.label}`,text:`${r.team} · 出场占比 ${Math.round(c.share*100)}%${((r.honors||[]).includes('总决赛MVP')||(r.honors||[]).includes('总决赛最有价值选手')||r.fmvp?.isUser)?' · 总决赛MVP':''}`};
    }
    // Recompute only RC13-owned node; old saves can be enriched safely on load.
    r.careerNode=careerNode33(r);
    return r;
  }

  function enrichAll33(){
    (careerState.careerArchive||[]).forEach(r=>{r.usageIdentity=usage33(r);r.championContribution=championContribution33(r);});
    (careerState.careerArchive||[]).forEach(enrich33);
  }

  // Capture a contract-year outcome for the season the new deal applies to.
  const _sign33=signSelectedOffer;
  signSelectedOffer=function(){
    const offer=(offseasonState.offers||[]).find(o=>o.id===offseasonState.selectedOfferId);
    if(!offer)return _sign33.apply(this,arguments);
    const from=careerState.team?.name||'',renewalAvailable=(offseasonState.offers||[]).some(o=>o.renewal),renewal=!!offer.renewal;
    const out=_sign33.apply(this,arguments);
    const year=Number(careerState.seasonYear||0);careerState.v33ContractNodes=careerState.v33ContractNodes||{};
    if(renewal)careerState.v33ContractNodes[String(year)]={icon:'📝',key:'contract-renewal',title:'合同年成功留队',text:`与 ${careerState.team?.name||from} 完成续约。`};
    else if(!renewalAvailable)careerState.v33ContractNodes[String(year)]={icon:'🧳',key:'no-renewal-move',title:'未获续约 · 转投新队',text:`${from} 没有给出续约报价，转投 ${careerState.team?.name||offer.team?.name||'新队伍'}。`};
    else careerState.v33ContractNodes[String(year)]={icon:'✍️',key:'contract-move',title:'合同到期后选择转会',text:`${from} → ${careerState.team?.name||offer.team?.name||'新队伍'}。`};
    return out;
  };

  const _record33=recordCompletedCareerSeason;
  recordCompletedCareerSeason=function(){
    const before=careerState.careerArchive?.length||0,out=_record33.apply(this,arguments);
    if((careerState.careerArchive?.length||0)>before)enrichAll33();
    return out;
  };
  enrichAll33();

  function inject33(){
    enrichAll33();
    const rows=[...document.querySelectorAll('#careerTabContent .career-season-row')],archive=[...(careerState.careerArchive||[])].reverse();
    rows.forEach((row,i)=>{
      row.querySelector('.v33-career-node')?.remove();row.querySelector('.v33-usage-badge')?.remove();
      const r=archive[i],host=row.children?.[1];if(!r||!host)return;
      const use=r.usageIdentity||usage33(r);
      const badge=document.createElement('span');badge.className=`v33-usage-badge ${use.key}`;badge.textContent=use.label;host.querySelector('.meta')?.appendChild(badge);
      if(r.careerNode){const n=document.createElement('div');n.className='v33-career-node';n.innerHTML=`${esc33(r.careerNode.icon||'📌')} <strong>${esc33(r.careerNode.title)}</strong>`;host.appendChild(n);}
    });
  }
  const _overview33=renderCareerOverview;
  renderCareerOverview=function(){const out=_overview33.apply(this,arguments);inject33();return out;};

  // Honor wall keeps the official honor as “总冠军”, but explains the user's role.
  const _honors33=renderHonorWall;
  renderHonorWall=function(){
    enrichAll33();const out=_honors33.apply(this,arguments);
    const seasons=[...document.querySelectorAll('#careerTabContent .career-honor-season')],archive=[...(careerState.careerArchive||[])].reverse();
    seasons.forEach((row,i)=>{const r=archive[i],c=r?.championContribution;if(!c)return;const badges=row.querySelector('.honor-badges');if(!badges||badges.querySelector('.v33-champ-role'))return;const b=document.createElement('span');b.className=`honor-badge v33-champ-role ${c.key}`;b.textContent=`${c.icon} ${c.label}`;badges.appendChild(b);});
    return out;
  };

  window.__OWL_V27_UX={version:VER,usage:usage33,championContribution:championContribution33,careerNode:careerNode33,enrich:enrich33,enrichAll:enrichAll33};
})();
