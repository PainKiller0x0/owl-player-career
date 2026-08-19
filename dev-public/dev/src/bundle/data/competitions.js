/* ===== BUNDLE MODULE: data/competitions.js ===== */
/* ============================================================================
   MODULE: data/competitions.js
   Milestone B foundation: declarative OWL tournament format presets.
   These are data/config only. UI and season routing live elsewhere.
   ========================================================================== */

const COMPETITION_PRESETS = Object.freeze({
  OWL2018_STAGE_TITLE_LADDER: {
    id: 'OWL2018_STAGE_TITLE_LADDER',
    name: '2018 Stage Title Matches（前三阶梯赛）',
    season: 2018,
    format: 'ladder3',
    participantCount: 3,
    seedSource: 'stageStandings',
    series: { defaultTargetWins: 3, finalTargetWins: 3 },
    notes: ['#1 轮空进决赛', '#2 对 #3，胜者挑战 #1']
  },
  OWL2018_STAGE_FINAL4_PICK: {
    id: 'OWL2018_STAGE_FINAL4_PICK',
    name: '2018 Stage Title Matches（四强选对手）',
    season: 2018,
    format: 'singleElimination',
    participantCount: 4,
    seeding: 'ranked',
    opponentDraft: { round: 1, selectors: 1, autoChoice: 'weakest' },
    series: { roundTargets: [3,3], defaultTargetWins: 3, finalTargetWins: 3 },
    notes: ['#1 从其余3队中选择半决赛对手']
  },
  OWL2019_STAGE_PLAYOFFS: {
    id: 'OWL2019_STAGE_PLAYOFFS',
    name: '2019 Stage Playoffs',
    season: 2019,
    format: 'singleElimination',
    participantCount: 8,
    seeding: 'ranked',
    bracketOrder: 'balancedHighLow',
    series: { roundTargets: [3,4,4], defaultTargetWins: 3, finalTargetWins: 4 },
    mapSelection: { firstMap: 'higherSeed', nextMap: 'previousLoser' },
    notes: ['八强FT3', '半决赛/决赛FT4']
  },
  OWL2021_REGIONAL_TO_GLOBAL: {
    id: 'OWL2021_REGIONAL_TO_GLOBAL',
    name: '2021 区域淘汰 → 全球锦标赛',
    season: 2021,
    format: 'regionalToGlobal',
    regions: [
      { key: 'West', participantCount: 6, advance: 2 },
      { key: 'East', participantCount: 4, advance: 2 }
    ],
    qualifier: {
      format: 'singleElimination',
      stopAt: 2,
      series: { defaultTargetWins: 3 }
    },
    global: {
      format: 'doubleElimination',
      participantCount: 4,
      series: { defaultTargetWins: 3, finalTargetWins: 4 },
      mapSelection: { firstMap: 'higherSeed', nextMap: 'previousLoser' }
    },
    points: { champion: 3, runnerUp: 2, third: 1 },
    notes: ['东西区各出2队', '全球4队双败']
  },
  OWL2022_MIDSEASON_MADNESS: {
    id: 'OWL2022_MIDSEASON_MADNESS',
    name: '2022 Midseason Madness',
    season: 2022,
    format: 'doubleElimination',
    participantCount: 12,
    initialByes: 4,
    opponentDraftAfterByes: { selectors: 3, autoChoice: 'weakest' },
    series: { defaultTargetWins: 3, finalTargetWins: 4 },
    mapSelection: { firstMap: 'higherSeed', nextMap: 'previousLoser' },
    points: { champion: 4, runnerUp: 3, third: 2, participant: 1 },
    notes: ['12队双败', '前4种子首轮轮空', '高种子依次选对手']
  }
});

function competitionPreset(id){
  const preset=COMPETITION_PRESETS[id];
  if(!preset) throw new Error(`Unknown competition preset: ${id}`);
  return preset;
}


