/* ===== BUNDLE MODULE: data/base.js ===== */
/* ==========================================================================
   MODULE: data/base.js
   Core data: attributes, roles, 2019 teams/rosters, creation state
   Migrated from V6.2 lines 3770-3947; execution order is defined by manifest.json.
   ========================================================================== */
    const ATTRS = [
      { key: 'hitscan', name: '长枪', desc: '即时命中武器精准度' },
      { key: 'projectile', name: '弹道', desc: '弹道预判与命中' },
      { key: 'mechanics', name: '操作', desc: '身法与复杂操作' },
      { key: 'cooldown', name: '技能管理', desc: '技能与终极技能使用' },
      { key: 'positioning', name: '站位', desc: '安全与有效位置选择' },
      { key: 'survival', name: '生存', desc: '自保与避免暴毙' },
      { key: 'awareness', name: '意识', desc: '信息获取与危险判断' },
      { key: 'decision', name: '决策', desc: '进退、转火与应变' },
      { key: 'synergy', name: '协同', desc: '集火与技能衔接' },
      { key: 'shotcalling', name: '指挥', desc: '报点与临场调度' },
      { key: 'pool', name: '英雄池', desc: '高水平可用英雄范围' },
      { key: 'clutch', name: '抗压', desc: '关键局与逆风表现' }
    ];

    const ROLES = [
      { name: '坦克', icon: '🛡️', desc: '创造空间、决定开团，也负责在队友犯病时替他们买单。', trait: '核心倾向：决策 / 意识 / 协同', gradient: 'linear-gradient(145deg,#39546e,#7897b4)', shadow: 'rgba(57,84,110,.28)', color: '#4e708e', glow: 'rgba(78,112,142,.12)' },
      { name: '长枪输出', icon: '🎯', desc: '用精准枪法结束争论。站得住、点得准，剩下的交给击杀播报。', trait: '核心倾向：长枪 / 站位 / 抗压', gradient: 'linear-gradient(145deg,#d14f3c,#ff9860)', shadow: 'rgba(209,79,60,.28)', color: '#d85b43', glow: 'rgba(216,91,67,.12)' },
      { name: '弹道输出', icon: '⚡', desc: '身法、预判与技能组合并重，操作上限高，送起来也格外有观赏性。', trait: '核心倾向：弹道 / 操作 / 英雄池', gradient: 'linear-gradient(145deg,#7953b7,#bd7be5)', shadow: 'rgba(121,83,183,.28)', color: '#8159bd', glow: 'rgba(129,89,189,.12)' },
      { name: '输出支援', icon: '✚', desc: '一边抬血一边打人，既是后排保险，也是随时可能掏枪的第二火力。', trait: '核心倾向：技能管理 / 站位 / 长枪', gradient: 'linear-gradient(145deg,#2c8b75,#74c7a7)', shadow: 'rgba(44,139,117,.27)', color: '#318e78', glow: 'rgba(49,142,120,.12)' },
      { name: '战术支援', icon: '📡', desc: '维持阵型、组织信息、带动节奏。数据未必华丽，队伍没你立刻散架。', trait: '核心倾向：指挥 / 协同 / 意识', gradient: 'linear-gradient(145deg,#b48728,#e4c063)', shadow: 'rgba(180,135,40,.27)', color: '#b1872f', glow: 'rgba(177,135,47,.12)' }
    ];

    const TEAMS = [
      { name:'Atlanta Reign', short:'ATL', city:'亚特兰大', division:'Atlantic', strength:84, color:'linear-gradient(135deg,#910f1b,#2b2b2b)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Atlanta_Reign_logo.svg' },
      { name:'Boston Uprising', short:'BOS', city:'波士顿', division:'Atlantic', strength:75, color:'linear-gradient(135deg,#174b97,#f5de01)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Boston_Uprising_logo.svg' },
      { name:'Chengdu Hunters', short:'CDH', city:'成都', division:'Pacific', strength:81, color:'linear-gradient(135deg,#ff9e00,#161823)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Chengdu_Hunters_logo.svg' },
      { name:'Dallas Fuel', short:'DAL', city:'达拉斯', division:'Pacific', strength:78, color:'linear-gradient(135deg,#0072ce,#0d2240)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Dallas_Fuel_logo.svg' },
      { name:'Florida Mayhem', short:'FLA', city:'佛罗里达', division:'Atlantic', strength:73, color:'linear-gradient(135deg,#fedc01,#af282f)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Florida_Mayhem_logo.svg' },
      { name:'Guangzhou Charge', short:'GZC', city:'广州', division:'Pacific', strength:83, color:'linear-gradient(135deg,#122c42,#67a2b2)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Guangzhou_Charge_logo.svg' },
      { name:'Hangzhou Spark', short:'HZS', city:'杭州', division:'Pacific', strength:86, color:'linear-gradient(135deg,#fb7299,#5788ce)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Hangzhou_Spark_logo.svg' },
      { name:'Houston Outlaws', short:'HOU', city:'休斯敦', division:'Atlantic', strength:77, color:'linear-gradient(135deg,#97d700,#111111)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Houston_Outlaws_logo.svg' },
      { name:'London Spitfire', short:'LDN', city:'伦敦', division:'Atlantic', strength:83, color:'linear-gradient(135deg,#59cbe8,#1c2b39)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/London_Spitfire_logo.svg' },
      { name:'Los Angeles Gladiators', short:'GLA', city:'洛杉矶', division:'Pacific', strength:86, color:'linear-gradient(135deg,#3c1053,#111111)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Los_Angeles_Gladiators_logo.svg' },
      { name:'Los Angeles Valiant', short:'VAL', city:'洛杉矶', division:'Pacific', strength:80, color:'linear-gradient(135deg,#004438,#e5d661)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Los_Angeles_Valiant_logo.svg' },
      { name:'New York Excelsior', short:'NYXL', city:'纽约', division:'Atlantic', strength:90, color:'linear-gradient(135deg,#171c38,#0f57ea)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/New_York_Excelsior_logo.svg' },
      { name:'Paris Eternal', short:'PAR', city:'巴黎', division:'Atlantic', strength:78, color:'linear-gradient(135deg,#303d56,#8d2f3d)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Paris_Eternal_logo.svg' },
      { name:'Philadelphia Fusion', short:'PHI', city:'费城', division:'Atlantic', strength:82, color:'linear-gradient(135deg,#f99e1a,#202020)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Philadelphia_Fusion_logo.svg' },
      { name:'San Francisco Shock', short:'SFS', city:'旧金山', division:'Pacific', strength:93, color:'linear-gradient(135deg,#fc4c02,#111111)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/San_Francisco_Shock_logo.svg' },
      { name:'Seoul Dynasty', short:'SEO', city:'首尔', division:'Pacific', strength:83, color:'linear-gradient(135deg,#aa8a00,#111111)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Seoul_Dynasty_logo.svg' },
      { name:'Shanghai Dragons', short:'SHD', city:'上海', division:'Pacific', strength:82, color:'linear-gradient(135deg,#d22630,#fdb927)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Shanghai_Dragons_logo.svg' },
      { name:'Toronto Defiant', short:'TOR', city:'多伦多', division:'Atlantic', strength:76, color:'linear-gradient(135deg,#c10021,#111111)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Toronto_Defiant_logo.svg' },
      { name:'Vancouver Titans', short:'VAN', city:'温哥华', division:'Pacific', strength:92, color:'linear-gradient(135deg,#09226b,#2fb228)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Vancouver_Titans_logo.svg' },
      { name:'Washington Justice', short:'WAS', city:'华盛顿', division:'Atlantic', strength:76, color:'linear-gradient(135deg,#990034,#003768)', logo:'https://en.wikipedia.org/wiki/Special:FilePath/Washington_Justice_logo.svg' }
    ];

    const OWL2019_ROSTERS = {
      'Atlanta Reign':[
        ['Erster','弹道输出',92],['babybay','长枪输出',87],['NLaaeR','长枪输出',84],['dafran','长枪输出',91],
        ['Pokpo','坦克',88],['Daco','坦克',89],['frd','坦克',84],['Gator','坦克',84],
        ['Dogman','输出支援',86],['Kodak','输出支援',82],['Masaa','战术支援',89],['FunnyAstro','战术支援',83]
      ],
      'Boston Uprising':[
        ['Colourhex','长枪输出',84],['blasé','弹道输出',82],['Stellar','长枪输出',82],
        ['Fusions','坦克',84],['Axxiom','坦克',80],['rCk','坦克',83],
        ['AimGod','输出支援',87],['Persia','输出支援',80],['Kellex','战术支援',82],['alemao','战术支援',78]
      ],
      'Chengdu Hunters':[
        ['JinMu','弹道输出',92],['Baconjack','长枪输出',84],['YangXiaoLong','长枪输出',83],['leave','弹道输出',86],
        ['Ameng','坦克',90],['Elsa','坦克',88],['LateYoung','坦克',86],['jiqiren','坦克',82],
        ['Kyo','输出支援',86],['Yveltal','战术支援',91],['GARRY','战术支援',80]
      ],
      'Dallas Fuel':[
        ['aKm','长枪输出',84],['Taimou','长枪输出',81],['ZachaREEE','弹道输出',81],
        ['OGE','坦克',87],['NotE','坦克',86],['Mickie','坦克',78],['Trill','坦克',80],
        ['uNKOE','输出支援',86],['Closer','战术支援',84],['HarryHook','战术支援',80]
      ],
      'Florida Mayhem':[
        ['Sayaplayer','长枪输出',89],['BQB','长枪输出',85],['DPI','弹道输出',81],
        ['Fate','坦克',88],['Gargoyle','坦克',86],['Karayan','坦克',80],['Swon','坦克',78],['xepheR','坦克',80],
        ['HaGoPeun','输出支援',84],['Byrem','输出支援',81],['RaiN','战术支援',82],['Kris','战术支援',80]
      ],
      'Guangzhou Charge':[
        ['Happy','长枪输出',92],['Eileen','弹道输出',89],['nero','弹道输出',88],
        ['HOTBA','坦克',89],['Rio','坦克',87],['Fragi','坦克',82],['Bischu','坦克',86],
        ['shu','输出支援',92],['Rise','输出支援',82],['Chara','战术支援',87],['OnlyWish','战术支援',80]
      ],
      'Hangzhou Spark':[
        ['GodsB','长枪输出',90],['Bazzi','长枪输出',87],['Adora','弹道输出',84],['Krystal','弹道输出',86],
        ['guxue','坦克',94],['Ria','坦克',89],['NoSmite','坦克',84],['SASIN','坦克',84],
        ['BeBe','输出支援',89],['Revenge','输出支援',83],['iDK','战术支援',91]
      ],
      'Houston Outlaws':[
        ['Danteh','长枪输出',90],['LiNkzr','长枪输出',87],['JAKE','弹道输出',86],['ArHaN','弹道输出',78],
        ['Muma','坦克',84],['SPREE','坦克',83],['Coolmatt','坦克',80],
        ['Rawkus','输出支援',86],['Bani','战术支援',80],['Boink','战术支援',81]
      ],
      'London Spitfire':[
        ['birdring','长枪输出',89],['Profit','弹道输出',94],['Guard','长枪输出',82],
        ['Gesture','坦克',91],['Fury','坦克',94],
        ['Bdosin','输出支援',91],['Krillin','输出支援',81],['NUS','战术支援',87],['Quatermain','战术支援',82]
      ],
      'Los Angeles Gladiators':[
        ['Decay','长枪输出',91],['Surefour','长枪输出',89],['Hydration','弹道输出',88],
        ['rOar','坦克',88],['Void','坦克',91],['Panker','坦克',82],
        ['Shaz','输出支援',90],['Ripa','输出支援',82],['BigGoose','战术支援',88]
      ],
      'Los Angeles Valiant':[
        ['Shax','长枪输出',90],['KSF','长枪输出',89],['Agilities','弹道输出',88],
        ['FCTFCTN','坦克',87],['McGravy','坦克',87],['SPACE','坦克',92],
        ['KariV','输出支援',93],['Custa','战术支援',89]
      ],
      'New York Excelsior':[
        ['Nenne','长枪输出',90],['Saebyeolbe','长枪输出',90],['Pine','长枪输出',86],['Libero','弹道输出',91],['Fl0w3r','弹道输出',84],
        ['Mano','坦克',94],['MekO','坦克',92],['JJoNak','输出支援',95],['Anamo','战术支援',91]
      ],
      'Paris Eternal':[
        ['SoOn','长枪输出',88],['ShaDowBurn','弹道输出',87],['Danye','弹道输出',84],['NiCOgdh','弹道输出',82],
        ['BenBest','坦克',84],['LhCloudy','坦克',82],['Finnsi','坦克',83],
        ['Greyy','输出支援',86],['HyP','输出支援',84],['Kruise','战术支援',86]
      ],
      'Philadelphia Fusion':[
        ['Carpe','长枪输出',92],['Eqo','弹道输出',91],['Kyb','弹道输出',82],
        ['SADO','坦克',84],['Poko','坦克',90],
        ['Boombox','输出支援',87],['Elk','战术支援',80],['neptuNo','战术支援',89]
      ],
      'San Francisco Shock':[
        ['Striker','长枪输出',91],['sinatraa','长枪输出',95],['Architect','弹道输出',90],['Rascal','弹道输出',92],
        ['super','坦克',93],['Smurf','坦克',88],['ChoiHyoBin','坦克',95],['Nevix','坦克',86],
        ['Viol2t','输出支援',94],['Moth','战术支援',93]
      ],
      'Seoul Dynasty':[
        ['FITS','长枪输出',88],['Fleta','弹道输出',92],['ILLICIT','弹道输出',82],
        ['Marve1','坦克',89],['Michelle','坦克',89],
        ['ryujehong','输出支援',90],['Highly','输出支援',82],['tobi','战术支援',88],['Jecse','战术支援',87]
      ],
      'Shanghai Dragons':[
        ['Diem','长枪输出',92],['DDing','弹道输出',93],['YoungJIN','弹道输出',89],
        ['Gamsu','坦克',89],['Geguri','坦克',87],['envy','坦克',88],
        ['Luffy','输出支援',90],['Izayaki','输出支援',88],['CoMa','战术支援',88]
      ],
      'Toronto Defiant':[
        ['Logix','长枪输出',88],['im37','长枪输出',80],['ivy','弹道输出',85],['Mangachu','弹道输出',85],
        ['Yakpung','坦克',83],['Gods','坦克',80],['sharyk','坦克',80],
        ['Neko','输出支援',86],['RoKy','战术支援',81],['Aid','战术支援',82]
      ],
      'Vancouver Titans':[
        ['Stitch','长枪输出',88],['SeoMinSoo','长枪输出',91],['Haksal','弹道输出',94],['Hooreg','弹道输出',82],
        ['Bumper','坦克',91],['JJANU','坦克',94],['TiZi','坦克',87],
        ['Twilight','输出支援',95],['RAPEL','输出支援',88],['SLIME','战术支援',92]
      ],
      'Washington Justice':[
        ['Corey','长枪输出',94],['Stratus','弹道输出',88],['Ado','弹道输出',83],
        ['Janus','坦克',82],['SanSam','坦克',83],
        ['Sleepy','输出支援',88],['Gido','输出支援',82],['ArK','战术支援',88]
      ]
    };

    const NAMES = ['Vanta','Morrow','Kite','Riven','Nox','Aster','Rune','Pixel','Sora','Volt','Haku','Mira','Flint','Zero','Echo','Nova','Taro','Lynx','Frost','Rook','Mako','Drift','Ion','Juno'];

    const roleBias = {
      '坦克': { decision: 8, awareness: 7, synergy: 7, shotcalling: 6, cooldown: 5, survival: 4, hitscan: -4 },
      '长枪输出': { hitscan: 11, positioning: 7, clutch: 6, survival: 3, shotcalling: -4 },
      '弹道输出': { projectile: 11, mechanics: 8, pool: 5, survival: 3, shotcalling: -4 },
      '输出支援': { hitscan: 6, cooldown: 8, positioning: 6, awareness: 6, survival: 5 },
      '战术支援': { shotcalling: 10, synergy: 9, awareness: 7, decision: 6, mechanics: -2 }
    };

    const V52_PLAYER_COUNTRIES = {
      cn:'中国',kr:'韩国',us:'美国',ca:'加拿大',fr:'法国',gb:'英国',fi:'芬兰',se:'瑞典',dk:'丹麦',de:'德国',
      nl:'荷兰',be:'比利时',es:'西班牙',pt:'葡萄牙',at:'奥地利',ie:'爱尔兰',il:'以色列',sa:'沙特阿拉伯',th:'泰国',au:'澳大利亚',nz:'新西兰',tw:'中国台湾'
    };

    const state = {
      role: null,
      playerName: 'Rookie',
      playerCountry: 'cn',
      playerStartAge: 18,
      locked: {},
      round: 0,
      team: null,
      players: [],
      selectedPlayerId: null,
      rerolls: 5,
      hasRolled: false,
      rolling: false
    };



