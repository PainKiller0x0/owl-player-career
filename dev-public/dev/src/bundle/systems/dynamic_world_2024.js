/* ===== BUNDLE MODULE: systems/dynamic_world_2024.js ===== */
/* ==========================================================================
   MODULE: systems/dynamic_world_2024.js
   Milestone A: 2024+ AI lifecycle, real birthdates, retirement/rebirth
   Migrated from V6.2 lines 10570-11163; execution order is defined by manifest.json.
   ========================================================================== */
    /* ================= V5.2 · 创角国籍 / 地区 =================
       默认中国；可选项严格来自2019–2023 OWL真实选手数据库中已经出现的国家/地区。
       玩家国旗复用V5.1离线SVG方案，不依赖外网。
    */
    /* ================= V6.2 · Milestone A：2024+ 动态AI世界 / 真实生日 =================
       目标：
       1) 2024年后所有2023存量真实选手 + 新生成AI统一进入生命周期；年龄与职业里程共同决定成长、下滑和退役。
       2) AI选手退役后1~3年，必定以其国籍、职责、风格为模板生成一名“传承新秀”；潜在巅峰=模板生涯巅峰±2。
       3) 世界按年份保存快照，保证同一赛季重复打开/重抽合同不会重复成长或重复生成新人。
    */

    const V60_AI_WORLD={
      seasons:{},
      retired:[],
      rebirthQueue:[],
      newsByYear:{},
      generatedSeq:0,
      initialized:false
    };
    const V60_COUNTRY_BY_NAME={};
    let V60_ROSTER_QUERY_YEAR=null;

    function v60Hash(text){
      const s=String(text??'');let h=2166136261>>>0;
      for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
      return h>>>0;
    }
    function v60Unit(seed){return (v60Hash(seed)%100000)/100000;}
    function v60Signed(seed,range=1){return (v60Unit(seed)*2-1)*range;}
    function v60Int(seed,min,max){return min+(v60Hash(seed)%Math.max(1,max-min+1));}
    function v60ClonePlayer(p){return {...p,attrs:{...(p.attrs||{})},styleDelta:{...(p.styleDelta||{})}};}
    function v60CloneTeams(teams){const out={};Object.entries(teams||{}).forEach(([k,list])=>out[k]=(list||[]).map(v60ClonePlayer));return out;}

    // Public Beta 1.5 RC1 · 人才生态：2023固定为现实黄金一代；2026起每2~3年出现一次动态人才大年。
    // 核心原则：新人初始只小幅增强，真正拉开差距的是16~22岁的兑现速度。
    function v60TalentSeed(){return String(state?.careerSeed||careerState?.careerSeed||'owl-default');}
    function v60GoldenClassYears(limit=2060){
      const years=[2023,2026];let y=2026;
      while(y<limit){y+=2+v60Int(`golden-gap-${v60TalentSeed()}-${y}`,0,1);if(y<=limit)years.push(y);}
      return years;
    }
    function v60TalentBoomInfo(year){
      year=Number(year)||0;if(!v60GoldenClassYears(Math.max(2060,year)).includes(year))return null;
      return{year,historical:year===2023,label:year===2023?'2023 黄金一代':`${year} 黄金一代`,kind:year===2023?'史实人才潮':'动态人才大年',count:0,players:[]};
    }
    function v60IsGoldenPlayer(p){return p?.talentClass==='golden'||Number(p?.debutYear)===2023;}
    function v60TuneGoldenRookie(p,year,index=0){
      if(!p)return p;p.talentClass='golden';p.talentCohortYear=Number(year);
      p.potential=clamp(Number(p.potential||p.ovr)+3,83,98);
      p.peakAge=Math.max(Number(p.peakAge||22),23+v60Int(`golden-peak-window-${year}-${p.id}-${index}`,0,1));
      p.ovr=clamp(Number(p.ovr||70)+1,60,88);
      p.attrs=v60BuildDynamicAttrs(p);p.ovr=v35RoleCompositeOvr(p.attrs,p.role);p.peakRecorded=Math.max(Number(p.peakRecorded||0),p.ovr);p.archetype=v60Archetype(p);
      return p;
    }
    function v60TalentBoomMarkup(boom){
      if(!boom)return'';const names=(boom.players||[]).slice(0,4).join(' · ');
      const detail=boom.historical
        ?'2023按史实时间线标记为黄金一代。起点只小幅上调，但年轻阶段拥有更快的潜力兑现窗口，目标是在2～3年内成长为冠军核心。'
        :`本届额外涌现 ${Number(boom.count||0)} 名重点新秀，拥有更高成长上限。${names?` 重点关注：${names}。`:''}`;
      return`<div class="v15-talent-boom-card"><span>🌟 TALENT WAVE · ${boom.kind}</span><strong>${boom.label}</strong><p>${detail}</p></div>`;
    }

    // 汇总2019~2023真实名单，用来推断“首次进入顶级联赛年份”和真实阶段最高OVR。
    const V60_HIST_INDEX={};
    function v60IndexRow(year,teamShort,entry){
      if(!entry?.[0])return;
      const name=entry[0];
      if(!V60_HIST_INDEX[name])V60_HIST_INDEX[name]=[];
      V60_HIST_INDEX[name].push({year,teamShort,entry});
    }
    Object.entries(OWL2019_ROSTERS).forEach(([teamEn,list])=>{
      const team=TEAMS.find(t=>(V50_BASE_TEAM_META[t.short]?.enName||t.enName||t.name)===teamEn);
      (list||[]).forEach(e=>v60IndexRow(2019,team?.short||teamEn,e));
    });
    Object.entries(V50_OWL_ROSTERS).forEach(([year,teams])=>Object.entries(teams).forEach(([short,list])=>(list||[]).forEach(e=>v60IndexRow(Number(year),short,e))));

    function v60HistoricalPeak(name,current=80){
      const rows=V60_HIST_INDEX[name]||[];
      return Math.max(current,...rows.map(r=>Number(r.entry?.[2])||0));
    }
    // 2023赛季仍在联盟的真实选手生日。来源以 Liquipedia/Wiki 公布资料为准；缺失者继续使用旧估算逻辑。
    // 年龄统一按2023赛季开赛日（2023-04-27）计算，之后每个赛季自然+1。
    const V62_REAL_BIRTHDATES={
      "Admiral":"2001-05-28",
      "AlphaYi":"2002-11-27",
      "Aniyun":"2004-06-08",
      "Aspire":"2001-12-12",
      "Babel":"2001-01-25",
      "Backbone":"2003-07-20",
      "BeBe":"1999-02-03",
      "Belosrea":"2004-01-10",
      "BenBest":"1995-11-17",
      "birdring":"1999-05-28",
      "Bliss":"2005-01-05",
      "cal":"2004-10-15",
      "CH0R0NG":"2003-12-08",
      "Checkmate":"2001-05-08",
      "ChiYo":"2003-09-08",
      "ChoiSehwan":"2002-10-13",
      "Cjay":"2003-09-02",
      "Coluge":"1999-12-01",
      "Creative":"2001-11-04",
      "Crimzo":"1999-10-03",
      "D0NGHAK":"2005-12-03",
      "Danteh":"1999-03-24",
      "Decay":"2001-02-27",
      "Dove":"2002-06-23",
      "Edison":"2001-11-16",
      "Ezhan":"2003-12-14",
      "Faith":"2001-11-16",
      "Farway1987":"2001-09-11",
      "Fate":"1998-10-15",
      "FDGod":"2001-08-27",
      "Fearless":"1998-05-27",
      "Fielder":"2002-01-29",
      "Finale":"2003-05-07",
      "FiNN":"2003-09-19",
      "FITS":"2000-06-22",
      "FiXa":"2004-05-02",
      "Fleta":"1999-09-02",
      "Flora":"2002-12-26",
      "FunnyAstro":"2000-03-21",
      "GA9A":"2000-04-12",
      "Gangnamjin":"1998-11-11",
      "Gargoyle":"1998-11-04",
      "guxue":"2000-10-16",
      "Hadi":"2000-10-09",
      "Hanbin":"2002-02-20",
      "Happy":"1999-08-02",
      "Hawk":"2001-09-16",
      "HeeSang":"2005-03-03",
      "Heesu":"2002-03-25",
      "Hydron":"2004-02-27",
      "Hyunjae":"2000-08-14",
      "Ir1s":"2000-09-10",
      "irony":"2002-01-07",
      "Izayaki":"2000-02-22",
      "Jimmy":"2001-07-01",
      "JinMu":"1999-05-15",
      "Junbin":"2005-10-05",
      "Kai":"2000-06-17",
      "Kalios":"1998-11-09",
      "Kellan":"2003-10-09",
      "Kevster":"2001-05-21",
      "KNIFE":"2004-07-21",
      "Krawi":"2002-06-16",
      "Krillin":"2000-10-28",
      "Landon":"2001-11-07",
      "Lastro":"2001-04-02",
      "Leave":"2001-10-23",
      "LeeJaeGon":"2001-08-29",
      "LeeSooMin":"2005-07-10",
      "Lengsa":"2001-07-30",
      "Lep":"2002-07-30",
      "Lethal":"2002-10-01",
      "LIP":"2001-11-05",
      "Lukemino":"2003-02-12",
      "Lyar":"2000-10-30",
      "Mag":"2002-06-12",
      "MAKA":"2004-08-30",
      "Malthel":"2003-12-04",
      "Marve1":"2000-10-26",
      "MAX":"2004-11-23",
      "MCD":"1998-12-25",
      "MER1T":"2002-06-21",
      "Mirror":"2001-10-14",
      "Mmonk":"2001-08-09",
      "MN3":"2003-11-26",
      "Ojee":"2003-09-19",
      "OPENER":"2004-04-03",
      "Paintbrush":"1996-03-19",
      "Pelican":"2002-07-05",
      "PIGGY":"1999-11-19",
      "Pineapple":"2003-08-04",
      "Poko":"1996-07-21",
      "Probe":"2005-03-06",
      "Profit":"1999-11-19",
      "Proper":"2003-12-01",
      "Prophet":"2005-09-27",
      "Punk":"2001-10-22",
      "Rakattack":"2002-09-22",
      "Renko":"2002-08-12",
      "Rupal":"2002-09-04",
      "s9mm":"2002-09-11",
      "Sauna":"2004-10-03",
      "Seeker":"2004-08-07",
      "Seicoe":"2003-11-19",
      "SeonJun":"2006-03-23",
      "Shockwave":"2000-07-25",
      "Shu":"2000-07-12",
      "Shy":"2002-10-22",
      "SirMajed":"2004-01-24",
      "skewed":"2001-01-11",
      "smurf":"2000-03-12",
      "SOMEONE":"2004-04-24",
      "Sp9rk1e":"2002-05-31",
      "SparkR":"2003-06-10",
      "Spectra":"2004-08-20",
      "Speedily":"2004-08-26",
      "Stalk3r":"2003-08-26",
      "Striker":"1999-12-04",
      "Sugarfree":"2004-12-16",
      "Teru":"2002-12-15",
      "Toyou":"2001-06-27",
      "Twenty":"2000-06-21",
      "Twilight":"1998-02-08",
      "UltraViolet":"2004-04-01",
      "vigilante":"2004-07-01",
      "Vindaim":"2003-08-30",
      "Viol2t":"2000-04-17",
      "Viper":"2005-06-30",
      "Void":"1996-10-02",
      "Vulcan":"2002-05-17",
      "Xerneas":"2000-09-29",
      "Yaki":"2001-06-11",
      "NOS":"2000-09-08",
      "ZEST":"2003-06-05"
    };
    const V62_SEASON_AGE_REF={month:4,day:27};
    const V100_DOB_ALIASES={
      'shu':'Shu','bebe':'BeBe','vigilante':'vigilante','birdring':'birdring','ch0r0ng':'CH0R0NG',
      'danteh-tank':'Danteh','danteh-dps':'Danteh','danteh-support':'Danteh'
    };
    const V100_DOB_CASE_INDEX=Object.fromEntries(Object.keys(V62_REAL_BIRTHDATES).map(k=>[k.toLowerCase(),k]));
    function v100BirthDateFor(name){
      const raw=String(name||'').trim(),base=raw.replace(/-(tank|dps|support)$/i,'');
      const key=V100_DOB_ALIASES[raw.toLowerCase()]||V100_DOB_ALIASES[base.toLowerCase()]||V100_DOB_CASE_INDEX[base.toLowerCase()]||base;
      return V62_REAL_BIRTHDATES[key]||null;
    }
    function v62RealAgeAtSeason(name,year=2023){
      const dob=v100BirthDateFor(name);
      if(!dob)return null;
      const parts=dob.split('-').map(Number),y=parts[0],m=parts[1],d=parts[2];
      if(!y||!m||!d)return null;
      const ref=V62_SEASON_AGE_REF;
      return year-y-((ref.month<m||(ref.month===m&&ref.day<d))?1:0);
    }
    function v62BirthCoverage(){
      const names=[...new Set(Object.values(V50_OWL_ROSTERS[2023]||{}).flat().map(e=>e?.[0]).filter(Boolean))];
      const real=names.filter(n=>!!v100BirthDateFor(n)).length;
      return {real,total:names.length,missing:names.filter(n=>!v100BirthDateFor(n))};
    }
    window.__OWL_V62_QA={birthCoverage:v62BirthCoverage,birthDate:v100BirthDateFor,ageAtSeason:v62RealAgeAtSeason};
    function v60FirstSeen(name){
      const rows=V60_HIST_INDEX[name]||[];
      return rows.length?Math.min(...rows.map(r=>r.year)):2023;
    }
    function v60CountryFor(name,entry){
      return (entry?.[3]||V50_COUNTRY_BY_NAME[name]||v36CountryCode(name,false)||'kr').toLowerCase();
    }
    function v60PreOwlMileage(name,first){
      // 2019前的履历没有完整录入，所以不用“真实年龄”硬猜，而用职业里程补偿。
      // 越早出现在数据库中的选手，越可能已经有APEX/Contenders等职业经历。
      if(first<=2019)return 1+v60Int(`preowl-mileage-${name}`,0,3); // 1~4年
      if(first===2020)return v60Int(`preowl-mileage-${name}`,0,2);  // 0~2年
      if(first===2021)return v60Int(`preowl-mileage-${name}`,0,1);  // 0~1年
      return 0;
    }
    function v60CareerMileage2023(name){
      const first=v60FirstSeen(name);
      return Math.max(1,(2023-first+1)+v60PreOwlMileage(name,first));
    }
    function v60EstimatedAge2023(name){
      const first=v60FirstSeen(name);
      const pre=v60PreOwlMileage(name,first);
      const debutAge=17+v60Int(`debut-age-${name}`,0,3); // 17~20；仅用于动态世界的隐藏生命周期。
      return clamp(debutAge+(2023-first)+pre,18,32);
    }
    function v60StyleDelta(name,role,ovr,entry){
      const actual=historicalAttributes(entry);
      const base=v35RoleProfileAttrs(role,ovr,`v60-base-${name}`,0);
      const delta={};
      ATTRS.forEach(a=>{
        const inherited=(Number(actual[a.key]||base[a.key])-Number(base[a.key]))*1.35;
        const signature=deterministicJitter(`v60-style-${name}`,a.key,3);
        delta[a.key]=clamp(Math.round(inherited+signature),-5,5);
      });
      return delta;
    }
    function v60PeakAge(name,age2023){
      let peak=20+v60Int(`peak-age-${name}`,0,4);
      const rows=(V60_HIST_INDEX[name]||[]).slice().sort((a,b)=>a.year-b.year);
      if(rows.length>=2){
        const a=Number(rows[rows.length-2].entry?.[2])||0,b=Number(rows[rows.length-1].entry?.[2])||0;
        if(b-a>=2)peak=Math.max(peak,age2023+1);
      }
      return clamp(peak,20,26);
    }
    function v60RetirementAge(name,peak){
      return clamp(27+v60Int(`retire-age-${name}`,0,4)+(peak>=94?1:0),27,33);
    }
    function v60BuildDynamicAttrs(p){
      const attrs=v35RoleProfileAttrs(p.role,p.ovr,`v60-dyn-${p.id}`,0);
      ATTRS.forEach(a=>attrs[a.key]=clamp(Math.round(attrs[a.key]+Number(p.styleDelta?.[a.key]||0)),45,99));
      const yearsPast=Math.max(0,(p.age||20)-(p.peakAge||22));
      if(yearsPast>0){
        const reflex={hitscan:.58,projectile:.58,mechanics:.72,cooldown:.28,survival:.35,clutch:.42};
        const experience={positioning:.22,awareness:.30,decision:.32,synergy:.22,shotcalling:.36,pool:.20};
        Object.entries(reflex).forEach(([k,w])=>{attrs[k]=clamp(Math.round(attrs[k]-yearsPast*w),45,99);});
        Object.entries(experience).forEach(([k,w])=>{attrs[k]=clamp(Math.round(attrs[k]+Math.min(4,yearsPast*w)),45,99);});
      }
      return attrs;
    }
    function v60Archetype(p){
      const base=v35RoleProfileAttrs(p.role,p.ovr,'v60-arch-base',0);
      return [...ATTRS].sort((a,b)=>((p.attrs?.[b.key]||0)-(base[b.key]||0))-((p.attrs?.[a.key]||0)-(base[a.key]||0))).slice(0,3).map(a=>a.key);
    }
    function v60HistoricalPlayer(entry,teamShort){
      const [name,role,ovr]=entry;
      const realAge=v62RealAgeAtSeason(name,2023);
      const age=realAge??v60EstimatedAge2023(name),histPeak=v60HistoricalPeak(name,ovr),first=v60FirstSeen(name),golden=first===2023;
      const styleDelta=v60StyleDelta(name,role,ovr,entry);
      const p={
        id:`real-${name}`,
        name,role,country:v60CountryFor(name,entry),teamShort,
        age,birthDate:v100BirthDateFor(name),ageSource:realAge==null?'estimated':'wiki',ovr:Number(ovr)||80,
        potential:clamp(Math.max(Number(ovr)||80,histPeak+v60Int(`future-pot-${name}`,0,2)+(golden?1:0)),60,99),
        peakRecorded:histPeak,
        peakAge:golden?Math.max(23,v60PeakAge(name,age)):v60PeakAge(name,age),
        retirementAge:v60RetirementAge(name,histPeak),
        proYears:v60CareerMileage2023(name),
        legacyVeteran:v60CareerMileage2023(name)>=6,
        styleDelta,
        debutYear:first,
        generated:false,lineage:'historical',templateName:null,lastRating:null,talentClass:golden?'golden':'standard',talentCohortYear:golden?2023:null
      };
      p.attrs=v60BuildDynamicAttrs(p);p.ovr=v35RoleCompositeOvr(p.attrs,p.role);p.peakRecorded=Math.max(p.peakRecorded,p.ovr);p.archetype=v60Archetype(p);
      V60_COUNTRY_BY_NAME[p.name]=p.country;
      return p;
    }
    function v60Build2023Snapshot(){
      if(V60_AI_WORLD.seasons[2023])return V60_AI_WORLD.seasons[2023];
      const teams={};
      TEAMS.forEach(team=>{
        const meta=v50TeamMetaForYear(team,2023);
        if(meta.active===false)return;
        const entries=(V50_OWL_ROSTERS[2023]?.[team.short]||[]);
        teams[team.short]=entries.map(e=>v60HistoricalPlayer(e,team.short));
      });
      const boom=v60TalentBoomInfo(2023);if(boom){const cohort=Object.values(teams).flat().filter(p=>Number(p.debutYear)===2023);boom.count=cohort.length;boom.players=cohort.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,4).map(p=>p.name);}
      const snap={year:2023,teams,teamStrength:{},news:{retirements:[],rookies:[],gainers:[],decliners:[],talentBoom:boom}};
      Object.keys(teams).forEach(short=>snap.teamStrength[short]=v60CalcTeamStrength(teams[short]));
      V60_AI_WORLD.seasons[2023]=snap;V60_AI_WORLD.initialized=true;return snap;
    }

    function v60CalcTeamStrength(roster){
      const list=roster||[];if(!list.length)return 70;
      const starters=[];
      ROLES.forEach(r=>{const best=list.filter(p=>p.role===r.name).sort((a,b)=>b.ovr-a.ovr)[0];if(best)starters.push(best.ovr);});
      const top=[...list].sort((a,b)=>b.ovr-a.ovr).slice(0,Math.max(5,Math.min(8,list.length))).map(p=>p.ovr);
      const starterAvg=starters.length?starters.reduce((a,b)=>a+b,0)/starters.length:(top.reduce((a,b)=>a+b,0)/top.length);
      const depthAvg=top.length?top.reduce((a,b)=>a+b,0)/top.length:starterAvg;
      return clamp(Math.round(starterAvg*.82+depthAvg*.18),62,99);
    }
    function v60SimRating(p,teamShort,year,snapshot){
      const strength=Number(snapshot?.teamStrength?.[teamShort]||v60CalcTeamStrength(snapshot?.teams?.[teamShort]||[])||80);
      const roleDepth=(snapshot?.teams?.[teamShort]||[]).filter(x=>x.role===p.role).sort((a,b)=>b.ovr-a.ovr);
      const roleRank=Math.max(0,roleDepth.findIndex(x=>x.id===p.id));
      let teamForm=(strength-80)*.018;
      if(careerState.team?.short===teamShort&&careerState.seasonYear===year&&seasonState.total){teamForm+=(seasonState.wins/Math.max(1,seasonState.total)-.5)*.55;}
      const starterEdge=roleRank===0?.16:roleRank===1?.02:-.12;
      const rating=6.20+(p.ovr-75)*.080+teamForm+starterEdge+v60Signed(`rating-${year}-${p.id}`,.42);
      return clamp(Math.round(rating*100)/100,5.45,9.75);
    }
    function v60NextOvr(p,rating,nextAge,year){
      const perf=rating-7;
      const proYears=Number(p.proYears||Math.max(1,year-(p.debutYear||year)+1));
      let delta=0;
      // 年龄与职业里程共同决定生命周期。资历很深的老将即使隐藏年龄偏小，也不会继续按“年轻人”成长。
      const mileagePastPeak=Math.max(0,proYears-(p.generated?9:6));
      const agePastPeak=Math.max(0,nextAge-(p.peakAge||22));
      const inDecline=agePastPeak>0||mileagePastPeak>=2;
      if(!inDecline){
        const gap=Math.max(0,p.potential-p.ovr);
        const youth=nextAge<=19?1.65:nextAge<=21?1.25:nextAge<=23?.78:.38;
        const mileageBrake=proYears>=6?.55:proYears>=5?.28:0;
        const pipelineBonus=p.generated?(nextAge<=19?.82:nextAge<=21?.56:nextAge<=23?.24:0):0;
        const golden=v60IsGoldenPlayer(p),goldenBonus=golden?(nextAge<=20?.92:nextAge<=22?.66:nextAge<=24?.28:0):0;
        delta=youth+gap*.095+perf*.64+pipelineBonus+goldenBonus-mileageBrake+v60Signed(`grow-${year}-${p.id}`,.48);
        let growthCap=3;
        if((p.generated||Number(p.debutYear)===2023)&&nextAge<=22&&gap>=4)growthCap=4;
        if(p.generated&&nextAge<=20&&gap>=8)growthCap=5;
        if(golden&&nextAge<=21&&gap>=6)growthCap=5;
        delta=clamp(Math.round(delta),-1,growthCap);
        if(p.ovr+delta>p.potential)delta=Math.max(0,p.potential-p.ovr);
      }else{
        const decline=.42+agePastPeak*.34+mileagePastPeak*.24;
        const starResistance=(p.peakRecorded||p.ovr)>=94?.25:0;
        delta=-decline+starResistance+Math.max(-.35,perf*.34)+v60Signed(`decline-${year}-${p.id}`,.42);
        delta=clamp(Math.round(delta),-4,1);
      }
      return clamp(p.ovr+delta,58,99);
    }
    function v60ShouldRetire(p,year){
      const proYears=Number(p.proYears||Math.max(1,year-(p.debutYear||year)+1));
      if(p.age>=33||proYears>=14)return true;
      // 新人保护：真正年轻且职业里程很短，不会莫名其妙退役。
      if(p.generated&&p.age<26&&proYears<10)return false;
      if(p.age<24&&proYears<6)return false;
      const drop=Math.max(0,(p.peakRecorded||p.ovr)-p.ovr);
      const starMod=(p.peakRecorded||0)>=94?.72:1;
      let chance=0;
      // 年龄退役曲线
      if(p.age>=p.retirementAge)chance=Math.max(chance,.30+(p.age-p.retirementAge)*.18+(p.ovr<75?.12:0));
      else chance=Math.max(chance,({24:.004,25:.008,26:.015,27:.035,28:.065,29:.11,30:.19,31:.32,32:.52}[p.age]||0));
      // 职业里程退役曲线：专门解决2023存量老将被隐藏年龄“洗年轻”的问题。
      const mileageChance={6:.025,7:.055,8:.11,9:.20,10:.34,11:.50,12:.68,13:.84}[Math.min(13,proYears)]||0;
      chance=Math.max(chance,mileageChance+drop*.018+(p.ovr<72&&proYears>=7?.08:0));
      if(p.ovr<=67&&(p.age>=26||proYears>=7))chance=Math.max(chance,.28);
      return v60Unit(`retire-v61-${year}-${p.id}`)<clamp(chance*starMod,0,.94);
    }
    function v60ScheduleRebirth(p,retiredYear){
      if(V60_AI_WORLD.rebirthQueue.some(x=>x.templateId===p.id&&x.retiredYear===retiredYear))return;
      const spawnYear=retiredYear+v60Int(`rebirth-delay-${retiredYear}-${p.id}`,1,3);
      const peakTarget=clamp((p.peakRecorded||p.potential||p.ovr)+v60Int(`rebirth-peak-${retiredYear}-${p.id}`,-2,2),70,99);
      V60_AI_WORLD.rebirthQueue.push({
        templateId:p.id,templateName:p.name,retiredYear,spawnYear,country:p.country||'kr',role:p.role,
        peakTarget,styleDelta:{...(p.styleDelta||{})},archetype:[...(p.archetype||v60Archetype(p))]
      });
    }

    const V60_NAME_STEMS={
      cn:['Ming','Tian','Yun','Qiu','Mo','Lan','Fei','Chen','Aster','Nian','Shan','Rui'],
      kr:['Haru','Rin','Velo','Miro','Keen','Lune','Naru','Zeal','Daze','Ari','Nero','Bero'],
      us:['Ace','Dash','Vex','Knox','Flux','Glint','Raze','Cinder','Blitz','Nova'],
      ca:['North','Maple','Frost','Echo','Vale','Aero','Jett','Nox'],
      gb:['Rune','Crown','Ash','Wisp','Kite','Moss','Rook','Vale'],
      fr:['Lumi','Aube','Roux','Nox','Vif','Soleil','Mira','Lynx'],
      fi:['Sisu','Aalto','Kivi','Lumi','Noki','Vire','Kajo'],
      se:['Norr','Varg','Ljus','Falk','Isak','Vik','Rune'],
      dk:['Birk','Mads','Rune','Vig','Nox','Keld','Lyn'],
      au:['Koala','Aero','Jett','Roo','Vale','Flux','Nox'],
      tw:['Kai','Yu','Lin','Han','Ren','Wei','Mori','Nova'],
      sa:['Saif','Rami','Zed','Nour','Faris','Asem','Ray'],
      default:['Nova','Velo','Rin','Aero','Mira','Flux','Nox','Kiro','Aster','Zeal','Echo','Lynx']
    };
    function v60AllUsedNames(){
      const used=new Set(Object.keys(V60_HIST_INDEX));
      Object.values(V60_AI_WORLD.seasons).forEach(s=>Object.values(s.teams||{}).forEach(list=>list.forEach(p=>used.add(p.name))));
      V60_AI_WORLD.retired.forEach(p=>used.add(p.name));Object.keys(V60_COUNTRY_BY_NAME).forEach(n=>used.add(n));return used;
    }
    function v60NewHandle(country,seed){
      const pool=V60_NAME_STEMS[country]||V60_NAME_STEMS.default,used=v60AllUsedNames();
      const base=pool[v60Int(`${seed}-stem`,0,pool.length-1)];
      const variants=[base,`${base}${v60Int(`${seed}-n`,2,9)}`,`${base}x`,`${base}${String.fromCharCode(65+v60Int(`${seed}-c`,0,25))}`];
      for(const v of variants)if(!used.has(v))return v;
      return `${base}${++V60_AI_WORLD.generatedSeq}`;
    }
    // 1.9 RC3 · 2024-2029 换代缓冲：只抬高这批新人起步，不提高潜力上限；2030+恢复长期规则。
    function v60TransitionAcademyGap(year){
      year=Number(year)||2030;
      if(year<=2026)return [6,12];
      if(year<=2029)return [6,13];
      return [8,15];
    }
    function v60TransitionRebirthGap(year){
      year=Number(year)||2030;
      if(year<=2026)return [9,14];
      if(year<=2029)return [9,14];
      return [11,17];
    }
    function v60ChooseRookieTeam(role,teams,seed){
      const candidates=Object.entries(teams).map(([short,list])=>{
        const same=(list||[]).filter(p=>p.role===role).sort((a,b)=>b.ovr-a.ovr),best=same[0]?.ovr||60,count=same.length,total=list.length;
        const need=100-(best-70)*1.35-count*7-Math.max(0,total-8)*3+v60Signed(`${seed}-${short}` ,4);
        return{short,need};
      }).sort((a,b)=>b.need-a.need);
      const top=candidates.slice(0,Math.min(4,candidates.length));return top[v60Int(`${seed}-pick`,0,Math.max(0,top.length-1))]?.short||candidates[0]?.short;
    }
    function v60CreateRebirth(q,year,teams){
      const country=q.country||'kr',name=v60NewHandle(country,`rebirth-${year}-${q.templateId}`),age=16+v60Int(`rookie-age-${name}`,0,1);
      const [gapMin,gapMax]=v60TransitionRebirthGap(year),initialGap=v60Int(`rookie-gap-${name}`,gapMin,gapMax),ovr=clamp(q.peakTarget-initialGap,61,87),styleDelta={};
      ATTRS.forEach(a=>styleDelta[a.key]=clamp(Number(q.styleDelta?.[a.key]||0)+v60Int(`mutation-${name}-${a.key}`,-1,1),-6,6));
      const p={id:`regen-${year}-${name}-${++V60_AI_WORLD.generatedSeq}`,name,role:q.role,country,age,ovr,potential:q.peakTarget,peakRecorded:ovr,
        peakAge:23+v60Int(`regen-peakage-${name}`,0,3),retirementAge:27+v60Int(`regen-retire-${name}`,0,5),proYears:1,legacyVeteran:false,styleDelta,
        debutYear:year,generated:true,lineage:'rebirth',templateName:q.templateName,lastRating:null,archetype:[...(q.archetype||[])]};
      p.attrs=v60BuildDynamicAttrs(p);p.ovr=v35RoleCompositeOvr(p.attrs,p.role);p.peakRecorded=Math.max(p.peakRecorded,p.ovr);
      p.teamShort=v60ChooseRookieTeam(p.role,teams,`team-${p.id}`);V60_COUNTRY_BY_NAME[p.name]=p.country;return p;
    }
    function v60CreateAcademy(role,teamShort,year,seed,country='kr'){
      const name=v60NewHandle(country,`academy-${year}-${teamShort}-${role}-${seed}`),age=17+v60Int(`academy-age-${name}`,0,2),potential=clamp(82+v60Int(`academy-pot-${name}`,0,13),80,96),[gapMin,gapMax]=v60TransitionAcademyGap(year);
      const p={id:`academy-${year}-${name}-${++V60_AI_WORLD.generatedSeq}`,name,role,country,teamShort,age,ovr:clamp(potential-v60Int(`academy-gap-${name}`,gapMin,gapMax),60,86),potential,peakRecorded:0,
        peakAge:23+v60Int(`academy-peak-${name}`,0,3),retirementAge:27+v60Int(`academy-retire-${name}`,0,5),proYears:1,legacyVeteran:false,styleDelta:{},debutYear:year,generated:true,lineage:'academy',templateName:null,lastRating:null};
      ATTRS.forEach(a=>p.styleDelta[a.key]=v60Int(`academy-style-${name}-${a.key}`,-3,3));
      p.attrs=v60BuildDynamicAttrs(p);p.ovr=v35RoleCompositeOvr(p.attrs,p.role);p.peakRecorded=p.ovr;p.archetype=v60Archetype(p);V60_COUNTRY_BY_NAME[p.name]=p.country;return p;
    }
    function v60SpawnGoldenClass(teams,year,news){
      const boom=v60TalentBoomInfo(year);if(!boom||Number(year)===2023)return;
      const count=2+v60Int(`golden-count-${v60TalentSeed()}-${year}`,0,2),countries=['kr','cn','us','ca','fr','fi','se','dk'];
      for(let i=0;i<count;i++){
        const role=ROLES[(i+v60Int(`golden-role-${year}`,0,ROLES.length-1))%ROLES.length].name,country=countries[v60Int(`golden-country-${year}-${i}`,0,countries.length-1)];
        const p=v60TuneGoldenRookie(v60CreateAcademy(role,null,year,`golden-${i}`,country),year,i),to=v60ChooseRookieTeam(role,teams,`golden-team-${year}-${i}`);
        if(!to)continue;p.teamShort=to;teams[to]=teams[to]||[];teams[to].push(p);V60_COUNTRY_BY_NAME[p.name]=p.country;
        news.rookies.push({name:p.name,teamShort:to,role:p.role,country:p.country,lineage:'golden-academy',talentClass:'golden'});boom.players.push(p.name);
      }
      boom.count=boom.players.length;news.talentBoom=boom;
    }

    function v60MajorityCountry(list){
      const counts={};(list||[]).forEach(p=>counts[p.country]=(counts[p.country]||0)+1);return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'kr';
    }
    function v60EnsureRosterMinimums(teams,year,news){
      Object.entries(teams).forEach(([short,list])=>{
        const majority=v60MajorityCountry(list);
        ROLES.forEach(r=>{if(!list.some(p=>p.role===r.name)){const p=v60CreateAcademy(r.name,short,year,`role-${r.name}`,majority);list.push(p);news.rookies.push({name:p.name,teamShort:short,role:p.role,country:p.country,lineage:'academy'});}});
        while(list.length<6){const role=ROLES.slice().sort((a,b)=>list.filter(p=>p.role===a.name).length-list.filter(p=>p.role===b.name).length)[0].name;const p=v60CreateAcademy(role,short,year,`depth-${list.length}`,majority);list.push(p);news.rookies.push({name:p.name,teamShort:short,role:p.role,country:p.country,lineage:'academy'});}
      });
    }

    function v60AdvanceOneYear(fromYear){
      const nextYear=fromYear+1,prev=V60_AI_WORLD.seasons[fromYear]||v60Build2023Snapshot();
      if(V60_AI_WORLD.seasons[nextYear])return V60_AI_WORLD.seasons[nextYear];
      const teams={};Object.keys(prev.teams||{}).forEach(short=>teams[short]=[]);
      const news={retirements:[],rookies:[],gainers:[],decliners:[],talentBoom:v60TalentBoomInfo(nextYear)};
      Object.entries(prev.teams||{}).forEach(([short,list])=>{
        (list||[]).forEach(old=>{
          const rating=v60SimRating(old,short,fromYear,prev),p=v60ClonePlayer(old),before=old.ovr;
          p.lastRating=rating;p.age=(old.age||20)+1;p.proYears=(old.proYears||Math.max(1,fromYear-(old.debutYear||fromYear)+1))+1;p.ovr=v60NextOvr({...old,proYears:p.proYears},rating,p.age,fromYear);p.attrs=v60BuildDynamicAttrs(p);p.ovr=v35RoleCompositeOvr(p.attrs,p.role);p.peakRecorded=Math.max(old.peakRecorded||before,p.ovr);p.archetype=v60Archetype(p);
          const diff=p.ovr-before;
          if(diff>=1)news.gainers.push({name:p.name,diff,from:before,to:p.ovr,teamShort:short});
          if(diff<=-1)news.decliners.push({name:p.name,diff,from:before,to:p.ovr,teamShort:short});
          if(v60ShouldRetire(p,fromYear)){
            const retired={...v60ClonePlayer(p),retiredYear:fromYear};V60_AI_WORLD.retired.push(retired);v60ScheduleRebirth(retired,fromYear);
            news.retirements.push({name:p.name,teamShort:short,role:p.role,country:p.country,age:p.age,peak:p.peakRecorded});
          }else{p.teamShort=short;teams[short].push(p);V60_COUNTRY_BY_NAME[p.name]=p.country;}
        });
      });

      // 到期的“传承新秀”在退役1~3年后进入联盟。模板关系只保存在后台，不直接告诉玩家。
      const due=V60_AI_WORLD.rebirthQueue.filter(q=>q.spawnYear===nextYear);
      due.forEach(q=>{const p=v60CreateRebirth(q,nextYear,teams);if(p.teamShort){teams[p.teamShort]=teams[p.teamShort]||[];teams[p.teamShort].push(p);news.rookies.push({name:p.name,teamShort:p.teamShort,role:p.role,country:p.country,lineage:'rebirth'});}});
      V60_AI_WORLD.rebirthQueue=V60_AI_WORLD.rebirthQueue.filter(q=>q.spawnYear>nextYear);
      v60SpawnGoldenClass(teams,nextYear,news);
      v60EnsureRosterMinimums(teams,nextYear,news);

      const snap={year:nextYear,teams,teamStrength:{},news};
      Object.keys(teams).forEach(short=>snap.teamStrength[short]=v60CalcTeamStrength(teams[short]));
      news.gainers.sort((a,b)=>b.diff-a.diff||b.to-a.to);news.decliners.sort((a,b)=>a.diff-b.diff||a.to-b.to);
      V60_AI_WORLD.seasons[nextYear]=snap;V60_AI_WORLD.newsByYear[nextYear]=news;return snap;
    }
    function v60EnsureWorldToYear(year){
      if(year<=2023)return v60Build2023Snapshot();
      v60Build2023Snapshot();
      for(let y=2023;y<year;y++)if(!V60_AI_WORLD.seasons[y+1])v60AdvanceOneYear(y);
      return V60_AI_WORLD.seasons[year];
    }
    function v60DynamicEntries(team,year){
      const snap=v60EnsureWorldToYear(year),list=snap?.teams?.[team.short]||[];
      return list.map(p=>[p.name,p.role,p.ovr,p.country,{v60:true,id:p.id,age:p.age,birthDate:p.birthDate||null,ageSource:p.ageSource||'generated',attrs:{...p.attrs},potential:p.potential,peakRecorded:p.peakRecorded,peakAge:p.peakAge,retirementAge:p.retirementAge,retirementReady:!!(p.age>=p.retirementAge||p.age>=32||p.proYears>=13),proYears:p.proYears,legacyVeteran:p.legacyVeteran,debutYear:p.debutYear,generated:p.generated,lineage:p.lineage,lastRating:p.lastRating,templateName:p.templateName,talentClass:p.talentClass||'standard',talentCohortYear:p.talentCohortYear||null}]);
    }

    // 2024+ roster/query layer: 历史数据库负责2019~2023，动态世界负责2024以后。
    const _v60RosterEntriesBase=v50RosterEntriesFor;
    v50RosterEntriesFor=function(team,year=careerState.seasonYear||2019){
      if(Number(year)>=2024)return v60DynamicEntries(team,Number(year));
      return _v60RosterEntriesBase(team,year);
    };
    historicalRosterEntries=function(team){return v50RosterEntriesFor(team,V60_ROSTER_QUERY_YEAR||careerState.seasonYear||2019);};

    const _v60HistoricalAttributesBase=historicalAttributes;
    historicalAttributes=function(entry){
      if(entry?.[4]?.v60&&entry[4].attrs)return {...entry[4].attrs};
      return _v60HistoricalAttributesBase(entry);
    };
    const _v60CountryCodeBase=v36CountryCode;
    v36CountryCode=function(name,isUser=false){
      if(isUser||name===getPlayerName())return state.playerCountry||'cn';
      return V60_COUNTRY_BY_NAME[name]||_v60CountryCodeBase(name,false)||'kr';
    };

    const _v60TeamMetaBase=v50TeamMetaForYear;
    v50TeamMetaForYear=function(team,year){
      const meta=_v60TeamMetaBase(team,year);
      if(Number(year)>=2024&&meta.active!==false){const snap=v60EnsureWorldToYear(Number(year));meta.strength=snap?.teamStrength?.[team.short]??meta.strength;}
      return meta;
    };
    const _v60ApplyWorldBase=v50ApplySeasonWorld;
    v50ApplySeasonWorld=function(year){
      const result=_v60ApplyWorldBase(year);
      if(Number(year)>=2024){
        const snap=v60EnsureWorldToYear(Number(year));
        TEAMS.forEach(team=>{if(team.active!==false&&snap?.teamStrength?.[team.short]!=null)team.strength=snap.teamStrength[team.short];});
      }
      return Number(year)>=2024?Number(year):result;
    };

    // 合同市场在2023休赛期开始就预生成2024世界；后续每个休赛期同理。
    // 这样“阵容需求”看到的是下一赛季真实的动态名单，而不是上一年的旧深度。
    const _v60GenerateContractOffersBase=generateContractOffers;
    generateContractOffers=function(){
      const nextYear=(careerState.seasonYear||2019)+1;
      if(nextYear>=2024)v60EnsureWorldToYear(nextYear);
      const old=V60_ROSTER_QUERY_YEAR;V60_ROSTER_QUERY_YEAR=nextYear>=2024?nextYear:null;
      try{return _v60GenerateContractOffersBase();}finally{V60_ROSTER_QUERY_YEAR=old;}
    };
    const _v60CareerLikePowerBase=careerLikeTeamPower;
    careerLikeTeamPower=function(team){
      if(V60_ROSTER_QUERY_YEAR>=2024&&team){const snap=v60EnsureWorldToYear(V60_ROSTER_QUERY_YEAR);return (snap?.teamStrength?.[team.short]||team.strength||80)+randomCentered(.55);}
      return _v60CareerLikePowerBase(team);
    };

    // 真正跨年之前先锁定下一年世界快照，保证阵容变动、退役和新秀只发生一次。
    const _v60ContinueContractBase=continueExistingContract;
    continueExistingContract=function(){const to=(careerState.seasonYear||2019)+1;if(to>=2024)v60EnsureWorldToYear(to);return _v60ContinueContractBase();};
    const _v60ApplyOfferBase=applyTeamFromOffer;
    applyTeamFromOffer=function(offer){const to=(careerState.seasonYear||2019)+1;if(to>=2024)v60EnsureWorldToYear(to);return _v60ApplyOfferBase(offer);};

    // 2024+奖项池直接来自动态名单；“最佳新秀”只认该年的真实首次进入联盟者/生成新秀。
    const _v60AwardPoolBase=buildRegularAwardLeaguePool;
    buildRegularAwardLeaguePool=function(){
      if((careerState.seasonYear||2019)<2024)return _v60AwardPoolBase();
      const year=careerState.seasonYear,snap=v60EnsureWorldToYear(year),pool=[];
      v50ActiveTeams().forEach(team=>{
        (snap.teams?.[team.short]||[]).forEach(p=>{
          const rating=v60SimRating(p,team.short,year,snap);
          pool.push({id:`dyn-${year}-${p.id}`,isUser:false,name:p.name,team:team.name,role:p.role,rating,ovr:p.ovr,
            wins:clamp(Math.round(14+(snap.teamStrength?.[team.short]-80)*.72+v60Signed(`wins-${year}-${team.short}`,3)),2,26),
            popularity:clamp(Math.round(26+(p.ovr-76)*2.7+(p.peakRecorded>=94?8:0)+v60Signed(`pop-${year}-${p.id}`,10)),8,99),
            rookie:p.debutYear===year,roleQuality:p.ovr});
        });
      });
      pool.push(getSeasonUserAwardProfile());return pool;
    };

    function v60TeamName(short){return TEAMS.find(t=>t.short===short)?.name||short;}
    function v60NewsMarkup(year){
      const news=V60_AI_WORLD.newsByYear[year]||v60EnsureWorldToYear(year)?.news;if(!news)return '';
      const gains=(news.gainers||[]).slice(0,4).map(x=>`${x.name} +${x.diff} → ${x.to}`).join(' · ')||'本年没有明显暴涨';
      const drops=(news.decliners||[]).slice(0,4).map(x=>`${x.name} ${x.diff} → ${x.to}`).join(' · ')||'本年没有明显下滑';
      const retirees=(news.retirements||[]).slice(0,6).map(x=>`${v36FlagMarkup(x.name,false)}${x.name}`).join(' · ')||'暂无主要退役';
      const rookies=(news.rookies||[]).slice(0,8).map(x=>`${v36FlagMarkup(x.name,false)}${x.name}（${v60TeamName(x.teamShort)}）`).join(' · ')||'暂无新秀进入';
      return `<div class="v60-world-card"><div class="offseason-kicker">${year} · DYNAMIC LEAGUE WORLD</div><h4>联盟世界开始自行演化</h4>${v60TalentBoomMarkup(news.talentBoom)}<div class="v60-world-grid"><div><span>📈 主要成长</span><strong>${gains}</strong></div><div><span>📉 主要下滑</span><strong>${drops}</strong></div><div><span>🎙️ 休赛期退役</span><strong>${retirees}</strong></div><div><span>🌱 新秀进入联盟</span><strong>${rookies}</strong></div></div><p>2024年后AI选手会根据年龄、潜力和模拟赛季表现自行成长或下滑；退役选手会在1~3年后留下同国籍、同职责、相近巅峰和相似风格的新一代选手。模板继承关系属于隐藏世界数据，不会直接标在新人脸上。</p></div>`;
    }
    const _v60RenderSigningCompleteBase=renderSigningComplete;
    renderSigningComplete=function(wrap){
      _v60RenderSigningCompleteBase(wrap);
      if((careerState.seasonYear||2019)<2024||wrap.querySelector('.v60-world-card'))return;
      const transition=wrap.querySelector('.v50-roster-transition');
      if(transition){const p=transition.querySelector('p');if(p)p.textContent='名单已进入架空动态时代。AI选手的能力、退役与新人补充会按世界模拟结果持续变化。';transition.insertAdjacentHTML('afterend',v60NewsMarkup(careerState.seasonYear));}
      else wrap.insertAdjacentHTML('beforeend',v60NewsMarkup(careerState.seasonYear));
    };

    // 赛季和阵容页明确告诉玩家：2024+不再是2023名单冻结，而是动态世界。
    const _v60RenderSeasonBase=renderSeason;
    renderSeason=function(){
      _v60RenderSeasonBase();
      if((careerState.seasonYear||2019)>=2024){const league=document.getElementById('seasonLeagueText');if(league)league.innerHTML=`守望先锋职业联赛 · ${careerState.seasonYear} 架空动态赛季 · Stage ${currentStageNumber()}`;}
    };
    const _v60RenderCareerTeamBase=renderCareerTeam;
    renderCareerTeam=function(){
      _v60RenderCareerTeamBase();
      if((careerState.seasonYear||2019)>=2024&&careerState.team){const meta=document.getElementById('careerContractMeta');if(meta)meta.textContent=`架空职业联赛 · ${careerState.seasonYear} · 动态AI世界 · ${careerState.contract?`${careerState.contract.years}年合同 · 剩余${careerState.contract.remaining}年 · 年薪${careerState.contract.salary}万 · ${careerState.contract.rolePromise}`:'合同待定'} · 季前排名第${careerState.rank}`;}
    };

    // 新开角色时清空上一条生涯留下的AI未来世界，避免不同角色共享同一条架空时间线。
    const _v60ResetBuildOnlyBase=resetBuildOnly;
    resetBuildOnly=function(){
      Object.keys(V60_AI_WORLD.seasons).forEach(k=>delete V60_AI_WORLD.seasons[k]);
      V60_AI_WORLD.retired.length=0;V60_AI_WORLD.rebirthQueue.length=0;V60_AI_WORLD.newsByYear={};V60_AI_WORLD.generatedSeq=0;V60_AI_WORLD.initialized=false;
      Object.keys(V60_COUNTRY_BY_NAME).forEach(k=>delete V60_COUNTRY_BY_NAME[k]);
      return _v60ResetBuildOnlyBase();
    };

    // 开发调试辅助：控制台可执行 v60WorldSummary(2030) 查看某年的AI世界，不暴露给正式UI。
    function v60WorldSummary(year=careerState.seasonYear||2024){
      const s=v60EnsureWorldToYear(Math.max(2024,Number(year)||2024)),players=Object.values(s.teams||{}).flat();
      return {year:s.year,teams:Object.keys(s.teams).length,players:players.length,avgOvr:Math.round(players.reduce((a,p)=>a+p.ovr,0)/Math.max(1,players.length)*10)/10,retiredTotal:V60_AI_WORLD.retired.length,pendingRebirths:V60_AI_WORLD.rebirthQueue.length,birthCoverage:v62BirthCoverage(),goldenYears:v60GoldenClassYears(Math.max(2038,s.year)),news:s.news};
    }



