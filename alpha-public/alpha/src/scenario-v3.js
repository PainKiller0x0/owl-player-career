(function (root) {
  'use strict';

  var TAGS = {
    hotHands: { id: 'hot-hands', name: '枪感火热', icon: '⚡', route: 'carry' },
    metaAnswer: { id: 'meta-answer', name: '版本答案', icon: '🧪', route: 'meta' },
    supportSync: { id: 'support-sync', name: '双辅默契', icon: '🤝', route: 'team' },
    freshState: { id: 'fresh-state', name: '体能充沛', icon: '☕', route: 'stable' },
    coachApproval: { id: 'coach-approval', name: '教练认可', icon: '📋', route: 'meta' },
    tacticalFlex: { id: 'tactical-flex', name: '战术弹性', icon: '🧭', route: 'team' }
  };

  var ROUNDS = {
    1: {
      id: 'opening-proof',
      title: '争取机会',
      body: '教练愿意给你更多轮换时间，但下一批对手擅长高压切后排。你需要决定怎样证明自己。',
      choices: [
        { id: 'r1-carry', label: '把资源交给我', body: '把训练重点放在对位和枪感上，争取用个人高光抢到首发机会。', benefit: '个人上限', cost: '体力与压力', actionId: 'mechanics', route: 'carry', tag: 'hotHands' },
        { id: 'r1-meta', label: '准备版本英雄', body: '提前研究版本英雄，让教练看到你能解决阵容问题。', benefit: '版本适应', cost: '即时爆发较低', actionId: 'heroPool', route: 'meta', tag: 'metaAnswer' },
        { id: 'r1-team', label: '和主力双辅合练', body: '先把保护与集火节奏磨出来，让自己成为更可靠的轮换人选。', benefit: '团队默契', cost: '个人成长较少', actionId: 'teamwork', route: 'team', tag: 'supportSync' }
      ]
    },
    2: {
      id: 'adjust-after-opening',
      good: {
        title: '根据顺风调整',
        body: '你的开局表现引起关注。教练愿意继续加码，但媒体和队内期待也开始上升。',
        choices: [
          { id: 'r2-carry', label: '继续承担核心资源', body: '趁手感正热继续向核心位冲刺，接受更高压力。', benefit: '个人上限', cost: '压力上升', actionId: 'mechanics', route: 'carry', tag: 'hotHands' },
          { id: 'r2-review', label: '帮队伍复盘比赛', body: '把个人经验变成全队方案，稳住教练对你的判断。', benefit: '教练认可', cost: '个人成长较少', actionId: 'gameSense', route: 'meta', tag: 'coachApproval' },
          { id: 'r2-rest', label: '主动控制训练量', body: '保住状态和体能，把这段优势带进后面的首发竞争。', benefit: '稳定状态', cost: '放弃部分上限', actionId: 'rest', route: 'stable', tag: 'freshState' }
        ]
      },
      hard: {
        title: '根据逆风调整',
        body: '队伍开局不理想，你的轮换表现也没有完全说服教练。下一轮必须作出调整。',
        choices: [
          { id: 'r2-carry', label: '加练抢回机会', body: '接受更高风险，争取用一场硬仗扭转教练的判断。', benefit: '个人上限', cost: '失败风险更高', actionId: 'mechanics', route: 'carry', tag: 'hotHands' },
          { id: 'r2-review', label: '找教练复盘录像', body: '先解决版本和决策问题，再用更稳定的比赛表现换回信任。', benefit: '比赛阅读', cost: '即时上限较低', actionId: 'gameSense', route: 'meta', tag: 'coachApproval' },
          { id: 'r2-rest', label: '先恢复状态', body: '把体力和压力拉回安全区，不让一次逆风变成连续低迷。', benefit: '稳定状态', cost: '放弃永久成长', actionId: 'rest', route: 'stable', tag: 'freshState' }
        ]
      }
    },
    3: {
      id: 'starting-spot',
      title: '队内首发竞争',
      body: 'Stage 收官战即将到来。教练准备确定首发阵容，同位置竞争者也在争取最后的机会。',
      choices: [
        { id: 'r3-carry', label: '争取成为战术核心', body: '把资源和压力都接过来，用上限换取成为核心的可能。', benefit: '个人上限', cost: '失误代价更高', actionId: 'mechanics', route: 'carry', tag: 'hotHands' },
        { id: 'r3-meta', label: '主动适配队伍需要', body: '练习更多战术职责，让教练敢在关键阵容里使用你。', benefit: '战术弹性', cost: '个人资源倾斜较少', actionId: 'heroPool', route: 'meta', tag: 'tacticalFlex' },
        { id: 'r3-team', label: '帮助搭档完善体系', body: '优先补上队伍短板，成为首发阵容里更稳定的一环。', benefit: '团队默契', cost: '个人高光较少', actionId: 'teamwork', route: 'team', tag: 'supportSync' }
      ]
    }
  };

  var FINALE_PLANS = {
    stable: { id: 'stable', label: '稳健完成轮换任务', body: '优先把已经练出的东西稳定兑现。', planId: 'stable', route: 'stable' },
    carry: { id: 'carry', label: '把资源交给我', body: '把关键资源交给你，争取用个人表现赢下收官战。', planId: 'highRisk', route: 'carry', required: 'carry' },
    meta: { id: 'meta', label: '拿出版本答案', body: '用版本适配解决对手的阵容问题。', planId: 'focus', route: 'meta', required: 'meta' },
    team: { id: 'team', label: '执行完整团队体系', body: '优先保证队伍执行，把收官战打成整体协同。', planId: 'stable', route: 'team', required: 'team' }
  };

  root.OWL_ALPHA_V3_SCENARIO = {
    id: 'stage1-rookie-mid',
    title: 'Stage 1 · 争取首发',
    player: 'Rookie',
    team: '中游队',
    initialCoachTrust: 60,
    goal: '从轮换选手争取稳定首发',
    matches: [4, 5, 4, 5],
    tags: TAGS,
    rounds: ROUNDS,
    finalePlans: FINALE_PLANS
  };
})(typeof globalThis === 'undefined' ? this : globalThis);
