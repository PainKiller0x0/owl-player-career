/* ===== BUNDLE MODULE: legacy/v37_transfer_fit.js ===== */
/* ==========================================================================
   MODULE: legacy/v37_transfer_fit.js
   Compatibility layer: transfer system-fit refactor
   Migrated from V6.2 lines 9713-9876; execution order is defined by manifest.json.
   ========================================================================== */
    /* ================= V3.8 · 转会体系适配重构 ================= */

    // 体系适配拆成三层：个人属性50% + 职责天然适配30% + 阵容需求20%。
    // 个人属性不再直接复用旧的“位置适配评分”，而是从当前职责权重出发，再让不同体系强调不同能力。
    const V37_TACTIC_ATTR_MULTIPLIER={
      '突进':{hitscan:.72,projectile:1.18,mechanics:1.34,cooldown:1.28,positioning:.88,survival:.95,awareness:1.06,decision:1.18,synergy:1.34,shotcalling:1.02,pool:1.14,clutch:1.10},
      '消耗':{hitscan:1.38,projectile:.88,mechanics:1.02,cooldown:.96,positioning:1.36,survival:1.14,awareness:1.24,decision:1.08,synergy:.92,shotcalling:.96,pool:1.05,clutch:1.18},
      '阵地':{hitscan:1.00,projectile:.96,mechanics:.94,cooldown:1.32,positioning:1.22,survival:1.30,awareness:1.16,decision:1.20,synergy:1.16,shotcalling:1.20,pool:1.05,clutch:1.08}
    };

    // 这里只表示“这个职责天生在某种体系里好不好用”，权重仅占30%，不再一票否决。
    const V37_ROLE_TACTIC_NATURAL={
      '坦克':{'突进':91,'消耗':74,'阵地':92},
      '长枪输出':{'突进':73,'消耗':95,'阵地':83},
      '弹道输出':{'突进':94,'消耗':75,'阵地':82},
      '输出支援':{'突进':82,'消耗':89,'阵地':87},
      '战术支援':{'突进':91,'消耗':81,'阵地':93}
    };

    function v37PlayerAttrs(){
      const attrs={};
      ATTRS.forEach(a=>attrs[a.key]=state.locked[a.key]?.value||70);
      return attrs;
    }

    function v37PersonalTacticFit(role,tactic,attrs=v37PlayerAttrs()){
      const baseWeights=ROLE_WEIGHTS[role]||{};
      const mult=V37_TACTIC_ATTR_MULTIPLIER[tactic]||{};
      let total=0,used=0;
      Object.entries(baseWeights).forEach(([key,w])=>{
        const value=Number(attrs[key]??70);
        const weight=w*(mult[key]??1);
        total+=value*weight; used+=weight;
      });
      // 英雄池对所有体系都重要，但只给6%的轻权重，防止它喧宾夺主。
      const core=used?total/used:70;
      const pool=Number(attrs.pool??70);
      return clamp(Math.round(core*.94+pool*.06),45,99);
    }

    function v37NaturalRoleFit(role,tactic){
      return V37_ROLE_TACTIC_NATURAL[role]?.[tactic]??80;
    }

    function v37RuntimeRoleDepth(team,role){
      // 当前队伍优先读取正在使用的阵容，避免续约时把主角自己算成“同位置竞争者”。
      if(team?.name===careerState.team?.name && (careerState.starters?.length||careerState.bench?.length)){
        const live=[...(careerState.starters||[]),...(careerState.bench||[])]
          .filter(p=>!p.isUser&&p.role===role);
        if(live.length){
          return live.map(p=>({
            name:p.name,
            ovr:Number.isFinite(p.overall)?p.overall:v35RoleCompositeOvr(p.attrs||{},role)
          }));
        }
      }
      return historicalRosterEntries(team)
        .filter(e=>e[1]===role)
        .map(e=>({name:e[0],ovr:e[2]}));
    }

    function v37RosterNeed(team,role,userOvr=v36RoleOvr(role)){
      const depth=v37RuntimeRoleDepth(team,role);
      if(!depth.length){
        return {score:98,best:0,count:0,label:'位置存在明显空缺'};
      }
      const best=Math.max(...depth.map(x=>Number(x.ovr)||70));
      const count=depth.length;
      const skillGap=userOvr-best;
      // 强同位置选手越多，需求越低；如果主角明显强于现有人选，则重新抬高需求。
      const raw=82-(best-80)*1.35-Math.max(0,count-1)*6+skillGap*1.20;
      const score=clamp(Math.round(raw),45,98);
      const label=score>=88?'位置缺口明显':score>=74?'存在明确竞争机会':score>=60?'已有成熟同位置人选':'同位置资源拥挤';
      return {score,best,count,label};
    }

    function v37SystemFit(team,tactic,role=state.role){
      const attrs=v37PlayerAttrs();
      const personal=v37PersonalTacticFit(role,tactic,attrs);
      const natural=v37NaturalRoleFit(role,tactic);
      const roster=v37RosterNeed(team,role,v35RoleCompositeOvr(attrs,role));
      const total=clamp(Math.round(personal*.50+natural*.30+roster.score*.20),45,99);
      return {total,personal,natural,rosterNeed:roster.score,roster};
    }

    function v37OfferNote(renewal,fitBreakdown,teamPower){
      if(renewal){
        if(fitBreakdown.rosterNeed<60)return '熟悉的环境仍在，但同位置竞争已经非常拥挤。';
        if(fitBreakdown.total>=88)return '熟悉的体系与队友，而且你的打法依旧高度契合。';
        return '留队磨合成本最低，但体系并不会天然放大你的全部优势。';
      }
      if(fitBreakdown.personal>=90&&fitBreakdown.rosterNeed<60)return '打法很合拍，但队内同位置已有强力人选，出场竞争会非常激烈。';
      if(fitBreakdown.total>=90&&fitBreakdown.rosterNeed>=74)return '体系与阵容缺口同时契合，教练组把你视为重点补强目标。';
      if(fitBreakdown.rosterNeed>=88)return '队伍这个位置明显缺人，你会拥有更直接的出场机会。';
      if(teamPower>=88)return '强队机会，但阵容成熟度高，位置需要自己抢。';
      return '整体适配中上，是否站稳首发更取决于后续表现。';
    }

    // 报价也按新体系重排：队伍越需要你、体系越适合你，越有可能真的发来邀请。
    generateContractOffers=function(){
      const avg=seasonState.userRatings.length?seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length:6.8;
      const ovr=Number(getMyOvr()==='--'?78:getMyOvr());
      const rank=estimateSeasonRank();
      const post=playoffState.round==='champion'?2:playoffState.results.length?1:0;
      let count=avg>=8.2||post===2?5:avg>=7.65||rank<=6?4:avg>=7.0||rank<=12?3:avg>=6.35?2:1;
      count=clamp(count+rand(-1,1),1,5);
      const market=ovr*.62+avg*4.2+(21-rank)*.35+post*7+careerState.popularity*.05;

      const renewalTeam=careerState.team;
      const renewalTactic=careerState.tactic||pick(TACTICS);
      const externalPool=TEAMS.filter(t=>t.name!==renewalTeam.name).map(team=>{
        const tactic=pick(TACTICS);
        const teamPower=Math.round(careerLikeTeamPower(team));
        const fitBreakdown=v37SystemFit(team,tactic,state.role);
        const interest=fitBreakdown.total*.45+fitBreakdown.rosterNeed*.30+(market-teamPower)*.18+randomCentered(6);
        return {team,tactic,teamPower,fitBreakdown,interest};
      }).sort((a,b)=>b.interest-a.interest);

      const proposals=[{
        team:renewalTeam,
        tactic:renewalTactic,
        teamPower:Math.round(careerLikeTeamPower(renewalTeam)),
        fitBreakdown:v37SystemFit(renewalTeam,renewalTactic,state.role),
        renewal:true
      },...externalPool.slice(0,Math.max(0,count-1)).map(x=>({...x,renewal:false}))];

      offseasonState.offers=proposals.map((p,index)=>{
        const {team,tactic,teamPower,fitBreakdown}=p;
        const renewal=!!p.renewal;
        const fit=fitBreakdown.total;
        const years=rand(1,3);
        const salary=Math.max(8,Math.round((market-55)*.8+(teamPower-78)*.6+fit*.05+rand(-3,5)));
        // 首发承诺现在真正考虑“同位置是否缺人”，而不是单纯看主角市场热度。
        const starterScore=ovr*.45+fitBreakdown.personal*.20+fitBreakdown.rosterNeed*.25+(avg-7)*8-Math.max(0,teamPower-82)*.40+rand(-3,3);
        const rolePromise=starterScore>=88?'核心首发':starterScore>=80?'稳定首发':starterScore>=71?'首发竞争':'轮换选手';
        return {
          id:`offer-${index}-${Date.now()}-${Math.random()}`,team,renewal,tactic,fit,fitBreakdown,years,salary,rolePromise,teamPower,starterScore,
          note:v37OfferNote(renewal,fitBreakdown,teamPower)
        };
      });
    };

    // 市场卡直接显示拆分结果，让“体系适配92”不再是一个无法解释的黑箱数字。
    const _v37RenderContractMarketBase=renderContractMarket;
    renderContractMarket=function(wrap){
      _v37RenderContractMarketBase(wrap);
      if(!offseasonState.contractExpired||!offseasonState.offers?.length)return;
      wrap.querySelectorAll('[data-offer-id]').forEach(card=>{
        const offer=offseasonState.offers.find(o=>o.id===card.dataset.offerId);
        if(!offer?.fitBreakdown||card.querySelector('.offer-fit-breakdown'))return;
        const b=offer.fitBreakdown;
        const fitRow=card.querySelector('.offer-fit');
        if(!fitRow)return;
        fitRow.insertAdjacentHTML('afterend',`
          <div class="offer-fit-breakdown">
            <div class="offer-fit-part"><small>个人×体系 · 50%</small><b>${b.personal}</b></div>
            <div class="offer-fit-part"><small>职责天然 · 30%</small><b>${b.natural}</b></div>
            <div class="offer-fit-part"><small>阵容需求 · 20%</small><b>${b.rosterNeed}</b></div>
          </div>
          <div class="offer-fit-explain">${b.roster.label}${b.roster.count?` · 同位置${b.roster.count}人 · 最强OVR ${b.roster.best}`:' · 当前名单无成熟同位置人选'}</div>`);
      });
    };




