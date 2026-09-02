(function (root) {
  'use strict';

  var PLAYER_PRESETS = {
    rookie: {
      id: 'rookie', name: '天才新秀', age: 18, ovr: 76, potential: 92,
      reputation: 20,
      attributes: { mechanics: 88, heroPool: 72, gameSense: 70, teamwork: 71, mental: 69 }
    },
    star: {
      id: 'star', name: '巅峰明星', age: 23, ovr: 87, potential: 91,
      reputation: 70,
      attributes: { mechanics: 95, heroPool: 84, gameSense: 86, teamwork: 82, mental: 81 }
    },
    veteran: {
      id: 'veteran', name: '老将核心', age: 27, ovr: 86, potential: 88,
      reputation: 65,
      attributes: { mechanics: 85, heroPool: 83, gameSense: 89, teamwork: 88, mental: 86 }
    }
  };

  var TEAM_PRESETS = {
    contender: { id: 'contender', name: '争冠队', teamBase: 88, coachPower: 88, synergy: 80, goal: '联盟前四 / 争冠' },
    mid: { id: 'mid', name: '中游队', teamBase: 83, coachPower: 83, synergy: 65, goal: '争取季后赛' },
    rebuild: { id: 'rebuild', name: '重建队', teamBase: 78, coachPower: 80, synergy: 50, goal: '培养与竞争附加赛席位' }
  };

  var PLANS = {
    balanced: { id: 'balanced', name: '均衡成长', weights: { mechanics: 1, heroPool: 1, gameSense: 1, teamwork: 1, mental: 1 } },
    mechanics: { id: 'mechanics', name: '机械巅峰', weights: { mechanics: 1.4, heroPool: 0.8, gameSense: 0.8, teamwork: 0.8, mental: 0.7 } },
    meta: { id: 'meta', name: '版本英雄', weights: { mechanics: 0.8, heroPool: 1.4, gameSense: 1, teamwork: 0.8, mental: 0.8 } },
    team: { id: 'team', name: '团队核心', weights: { mechanics: 0.7, heroPool: 0.8, gameSense: 1, teamwork: 1.4, mental: 1.1 } },
    veteran: { id: 'veteran', name: '老将管理', weights: { mechanics: 0.6, heroPool: 0.8, gameSense: 1.3, teamwork: 1.3, mental: 1.3 } }
  };

  var ACTIONS = [
    { id: 'mechanics', name: '机械训练', target: 'mechanics', base: 10, energy: -18, stress: 6, icon: '⚡', description: '提升操作稳定性，年轻选手收益更高。' },
    { id: 'heroPool', name: '英雄实验室', target: 'heroPool', base: 10, energy: -14, stress: 4, icon: '🧪', description: '扩展英雄池，适应版本变化。' },
    { id: 'gameSense', name: '比赛复盘', target: 'gameSense', base: 8, energy: -10, stress: 2, icon: '📺', description: '提升意识，老将更擅长把经验转化为价值。' },
    { id: 'teamwork', name: '团队合练', target: 'teamwork', base: 8, energy: -16, stress: 3, icon: '🤝', description: '提升团队属性，并经营支援角色关系。' },
    { id: 'mental', name: '心态管理', target: 'mental', base: 7, energy: -8, stress: -12, icon: '🧠', description: '降低压力，稳定状态，偶尔获得状态提升。' },
    { id: 'rest', name: '休息恢复', target: null, base: 0, energy: 45, stress: -20, icon: '☕', description: '恢复体力与压力，放弃本节点训练收益。' }
  ];

  var NODE_LABELS = {
    1: '季前计划', 2: '教练定位', 3: '第一次训练',
    4: 'Stage 1 · 回合 1', 5: 'Stage 1 · 回合 2', 6: 'Stage 1 · 回合 3', 7: 'Stage 1 · 回合 4',
    8: 'Stage 1 结算',
    9: 'Stage 2 · 回合 1', 10: 'Stage 2 · 回合 2', 11: 'Stage 2 · 回合 3', 12: 'Stage 2 · 回合 4',
    13: '赛季中点',
    14: 'Stage 3 · 回合 1', 15: 'Stage 3 · 回合 2', 16: 'Stage 3 · 回合 3', 17: 'Stage 3 · 回合 4',
    18: '常规赛结算', 19: '季后赛八强', 20: '季后赛四强', 21: '季后赛决赛', 22: '赛季总结'
  };

  root.OWL_ALPHA_CONSTANTS = {
    VERSION: 2,
    PLAYER_PRESETS: PLAYER_PRESETS,
    TEAM_PRESETS: TEAM_PRESETS,
    PLANS: PLANS,
    ACTIONS: ACTIONS,
    NODE_LABELS: NODE_LABELS,
    STAGE_BLOCKS: {
      1: [4, 5, 4, 5],
      2: [5, 5, 4, 5],
      3: [5, 4, 5, 5]
    },
    AGE_BANDS: { rookie: [18, 20], peak: [21, 25], veteran: [26, 29] },
    MATCH_PLANS: {
      stable: { id: 'stable', name: '稳健执行', description: '降低波动，优先把训练成果稳定兑现。' },
      focus: { id: 'focus', name: '围绕当前备战方向', description: '让本节点训练方向在比赛中获得更清晰的反馈。' },
      highRisk: { id: 'highRisk', name: '高风险抢节奏', description: '主动放大临场收益，赢下关键回合，但波动更大。' }
    },
    CAREER_GRADES: { S: 88, A: 78, B: 65, C: 50 }
  };
})(typeof globalThis === 'undefined' ? this : globalThis);
