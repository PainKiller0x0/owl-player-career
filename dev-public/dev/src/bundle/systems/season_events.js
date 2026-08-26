/* ===== BUNDLE MODULE: systems/season_events.js ===== */
/* ==========================================================================
   MODULE: systems/season_events.js
   Season random events, health events and career dynamics
   Migrated from V6.2 lines 5141-5811; execution order is defined by manifest.json.
   ========================================================================== */
    const PRIMARY_ATTR_BY_ROLE = {
      '坦克':'decision', '长枪输出':'hitscan', '弹道输出':'projectile', '输出支援':'cooldown', '战术支援':'shotcalling'
    };

    const SEASON_EVENTS = [
      {
        id:'late-training', icon:'🎯', kicker:'TRAINING · 额外训练', title:'训练室最后一盏灯',
        text:'教练组临时开放了一晚额外训练。你可以继续压榨状态，也可以做点职业选手通常最不擅长的事——休息。',
        choices:[
          { label:'专练招牌英雄', desc:'强化当前位置最关键的能力，短期状态会明显下降。', effects:{primaryAttr:1,condition:-8,coachTrust:4,nextMatchBonus:1.6}, outcome:'你把训练室熬成了个人直播间。招牌能力有所精进，身体则开始提交抗议。' },
          { label:'和教练复盘录像', desc:'不追求手感爆发，优先理解自己为何会在同一个位置死三次。', effects:{awarenessAttr:1,coachTrust:6,condition:-3,nextRatingBonus:.15}, outcome:'复盘没有击杀集锦那么爽，但教练终于确认你会使用大脑。' },
          { label:'按时回去休息', desc:'没有属性成长，但能恢复状态，降低下一场波动。', effects:{condition:14,teammateBond:2}, outcome:'你做出了职业电竞最反常识的决定：睡觉。身体对此非常感动。' }
        ]
      },
      {
        id:'locker-room', icon:'🗣️', kicker:'TEAM · 队内关系', title:'训练赛后的争执',
        text:'两名队友因为战术执行互相甩锅，语音频道已经从复盘变成了辩论赛。所有人都在等你表态。',
        choices:[
          { label:'主动调停', desc:'尝试把争论拉回比赛内容，风险是双方都觉得你多管闲事。', effects:{teammateBond:11,coachTrust:4,condition:-3}, outcome:'你没有解决所有矛盾，但至少让语音重新出现了和比赛有关的词。' },
          { label:'支持核心队友', desc:'短期站队能获得一部分人的认可，也会伤害另一边关系。', effects:{popularity:5,teammateBond:-7,nextMatchBonus:1}, outcome:'你选了边。更衣室暂时安静了，只是安静得稍微有点危险。' },
          { label:'保持沉默', desc:'避免卷入冲突，但教练会认为你缺乏担当。', effects:{condition:3,coachTrust:-5}, outcome:'你成功没有得罪任何一方，也成功让教练记住了你什么都没做。' }
        ]
      },
      {
        id:'media-interview', icon:'🎙️', kicker:'MEDIA · 赛后采访', title:'突然递来的麦克风',
        text:'你打出了一场不错的比赛，媒体临时把你请到采访区。问题很简单：“你认为自己已经是队内核心了吗？”',
        choices:[
          { label:'“我就是来成为核心的”', desc:'高调回答能迅速增加关注，也会把下一场压力拉满。', effects:{popularity:14,coachTrust:-2,nextMatchBonus:1,nextRatingBonus:-.1}, outcome:'标题已经替你写好了。接下来最好打得配得上标题，否则评论区会代替教练复盘。' },
          { label:'“胜利属于整个团队”', desc:'标准答案通常无聊，但队友和教练很喜欢。', effects:{coachTrust:6,teammateBond:7,popularity:4}, outcome:'回答毫无爆点，却让更衣室气氛舒服了不少。无聊有时也是一种成熟。' },
          { label:'礼貌结束采访', desc:'减少曝光，避免额外压力，把精力留给后续比赛。', effects:{condition:5,popularity:-4}, outcome:'媒体没拿到故事，你拿回了半小时休息时间。公平交易。' }
        ]
      },
      {
        id:'starter-competition', icon:'⚔️', kicker:'ROSTER · 首发竞争', title:'替补正在逼近',
        text:'同位置替补最近训练赛表现出色。教练明确表示，下一场会重新评估首发安排。你的位置第一次真正变得不稳。',
        choices:[
          { label:'正面接受竞争', desc:'增加训练量，用下一场表现决定谁首发。', effects:{condition:-7,coachTrust:7,nextMatchBonus:2}, outcome:'你把压力变成了训练强度。下场比赛会更有机会，也更容易累到脑子掉线。' },
          { label:'主动找教练沟通', desc:'了解自己需要改进的内容，收益稳定但不够热血。', effects:{coachTrust:5,awarenessAttr:1,nextRatingBonus:.1}, outcome:'教练给了明确要求。至少你现在知道自己该改什么，而不是盲目把排位打到凌晨。' },
          { label:'公开表达不满', desc:'粉丝可能支持你，但教练不会喜欢被迫看社交媒体声明。', effects:{popularity:9,coachTrust:-13,teammateBond:-4}, outcome:'舆论站到了你这边一部分。遗憾的是，首发名单并不由评论区投票。' }
        ]
      },
      {
        id:'wrist-fatigue', icon:'🩹', kicker:'HEALTH · 身体状态', title:'手腕开始报警',
        text:'连续高强度比赛后，你的手腕出现轻微不适。队医认为还不算伤病，但继续硬撑肯定不会让它突然学会自愈。',
        choices:[
          { label:'完整休整一天', desc:'大幅恢复状态，但会缺席一部分训练内容。', effects:{condition:18,coachTrust:-2,nextMatchBonus:-.5}, outcome:'你错过了部分合练，却避免把“小问题”培养成职业生涯主线。' },
          { label:'接受治疗并减量训练', desc:'恢复幅度中等，几乎不影响队内评价。', effects:{condition:11,coachTrust:2}, outcome:'不英勇，也不愚蠢。队医对此评价很高。' },
          { label:'继续满负荷训练', desc:'下一场短暂获得手感加成，但状态与长期风险明显恶化。', effects:{condition:-15,nextMatchBonus:2.5,coachTrust:3}, outcome:'你坚持完成训练。手感很好，手腕则开始认真考虑辞职。' }
        ]
      },
      {
        id:'role-trial', icon:'🔄', kicker:'TACTICS · 位置试验', title:'教练提出客串转位',
        text:'版本变化让队伍需要更多阵容弹性。教练希望你在训练赛中客串相邻位置，这不是正式转位，但可能改变未来路线。',
        choices:[
          { label:'接受客串训练', desc:'提高英雄池与教练信任，短期训练负担增加。', effects:{poolAttr:1,coachTrust:9,condition:-6,positionTrial:true}, outcome:'你开始接触新的职责。暂时还只是客串，但职业路线已经多开了一扇门。' },
          { label:'专注原位置', desc:'继续强化招牌能力，但会让教练觉得你缺少弹性。', effects:{primaryAttr:1,coachTrust:-4,nextMatchBonus:1}, outcome:'你选择把一把刀磨得更锋利。问题只是，版本有时根本不让你带这把刀。' },
          { label:'请求赛季后再讨论', desc:'不拒绝可能性，也避免现在打乱比赛准备。', effects:{coachTrust:3,teammateBond:2,condition:3}, outcome:'教练接受了你的节奏。转位议题被暂时压后，但没有消失。' }
        ]
      },
      {
        id:'fan-event', icon:'📸', kicker:'COMMUNITY · 商业活动', title:'临时追加的粉丝见面会',
        text:'俱乐部希望你参加周末粉丝活动。它能迅速提升曝光，但时间正好卡在下一场比赛前。',
        choices:[
          { label:'全程参加', desc:'公众关注大幅提升，竞技状态会有所消耗。', effects:{popularity:16,condition:-8,teammateBond:2}, outcome:'现场气氛很好，你也收获了大量新粉丝。回到基地时，训练赛已经快结束了。' },
          { label:'只参加核心环节', desc:'兼顾曝光和备战，是最稳妥的处理。', effects:{popularity:8,condition:-2,coachTrust:3}, outcome:'你完成了营业，也没把训练完全扔给队友。俱乐部和教练都勉强满意。' },
          { label:'以备战为由拒绝', desc:'恢复状态并赢得教练认可，但会降低商业关注。', effects:{condition:7,coachTrust:5,popularity:-6}, outcome:'教练很满意，运营同事的表情则像刚输了一张决胜图。' }
        ]
      },
      {
        id:'winning-streak', icon:'🔥', kicker:'FORM · 连胜状态', title:'连胜让所有人开始膨胀',
        text:'队伍已经连续取胜，训练氛围轻松得有些过头。有人开始讨论季后赛对手，仿佛常规赛已经自动结算。',
        condition:()=>seasonState.results.slice(Math.max(0,seasonState.played-2),seasonState.played).length===2 && seasonState.results.slice(seasonState.played-2,seasonState.played).every(r=>r==='win'),
        choices:[
          { label:'提醒队友保持专注', desc:'强化队伍纪律，可能稍微扫兴。', effects:{coachTrust:7,teammateBond:3,nextMatchBonus:1}, outcome:'庆祝被你提前结束。没人特别开心，但下一场准备确实认真了。' },
          { label:'享受当前气氛', desc:'增进队友关系，但下一场容易出现松懈。', effects:{teammateBond:9,condition:4,nextMatchBonus:-1}, outcome:'更衣室快乐得像已经夺冠。希望对手没打算破坏气氛。' },
          { label:'主动要求更多战术责任', desc:'提升个人曝光与教练信任，同时增加压力。', effects:{popularity:7,coachTrust:5,condition:-4,nextRatingBonus:.2}, outcome:'你开始承担更多核心任务。赢了叫领袖，输了自然也更方便找到负责人。' }
        ]
      },
      {
        id:'losing-streak', icon:'🌧️', kicker:'FORM · 连败压力', title:'连败后的沉默训练室',
        text:'连续失利让队伍气氛跌到谷底。训练结束后没有人说话，连键盘声都显得像在互相指责。',
        condition:()=>seasonState.results.slice(Math.max(0,seasonState.played-2),seasonState.played).length===2 && seasonState.results.slice(seasonState.played-2,seasonState.played).every(r=>r==='loss'),
        choices:[
          { label:'组织队内复盘', desc:'优先修复沟通和协同，消耗额外精力。', effects:{teammateBond:11,coachTrust:5,condition:-5,nextMatchBonus:1}, outcome:'问题没有一夜消失，但大家至少重新开始对着问题说话，而不是对着彼此。' },
          { label:'独自加练', desc:'强化个人状态，却无法解决队伍层面的问题。', effects:{primaryAttr:1,condition:-9,nextMatchBonus:1.8,teammateBond:-2}, outcome:'你的个人手感更好了。至于全队为什么输，训练室里仍然没人愿意先开口。' },
          { label:'暂时屏蔽舆论', desc:'恢复精神状态，减少外界关注。', effects:{condition:10,popularity:-4,coachTrust:2}, outcome:'你关掉了社交媒体。世界突然安静了，至少安静到足够睡一觉。' }
        ]
      },
      {
        id:'meta-patch', icon:'🧩', kicker:'PATCH · 版本更新', title:'赛季中途的大版本更新',
        text:'联盟发布了平衡性补丁，你最熟悉的英雄被削弱，新版本却偏爱一套你还没完全掌握的体系。教练只给了三天适应时间。',
        choices:[
          { label:'彻底拥抱新版本', desc:'用大量训练换取版本适应。', effects:{poolAttr:1,condition:-8,coachTrust:6,nextMatchBonus:1.2}, outcome:'你把旧习惯拆了重练。手腕不太高兴，教练组倒是终于松了口气。' },
          { label:'坚持招牌英雄', desc:'保住个人舒适区，但承担被版本针对的风险。', effects:{primaryAttr:1,popularity:5,coachTrust:-4,nextMatchBonus:-.6}, outcome:'粉丝爱看绝活，分析师则已经在节目里画红圈。' },
          { label:'先观察其他强队', desc:'提升理解，短期收益较温和。', effects:{awarenessAttr:1,condition:-2,nextRatingBonus:.12}, outcome:'你没有抢着当版本答案，但至少没成为版本问题。' }
        ]
      },
      {
        id:'map-pool', icon:'🗺️', kicker:'LEAGUE · 地图池', title:'联盟公布新阶段地图池',
        text:'下一阶段加入了两张队伍胜率很低的地图。分析组把地图录像塞进共享盘，文件夹名称叫“紧急”。',
        choices:[
          { label:'主动负责专项训练', desc:'强化地图理解并提高教练信任。', effects:{awarenessAttr:1,coachTrust:7,condition:-5}, outcome:'你把每个拐角都走了一遍。至少下一次迷路时，能更专业地迷路。' },
          { label:'专注自己的站位路线', desc:'优先保证个人稳定性。', effects:{nextRatingBonus:.2,nextMatchBonus:.5,teammateBond:-2}, outcome:'你的路线变稳了，但队友发现你对他们的路线并没有同等热情。' },
          { label:'让队长统一安排', desc:'强化团队同步，个人存在感较低。', effects:{teammateBond:7,coachTrust:3}, outcome:'训练过程没有英雄主义，只有所有人终于在同一张地图上打同一场游戏。' }
        ]
      },
      {
        id:'scrim-leak', icon:'📼', kicker:'SCRIM · 训练赛泄露', title:'训练赛录像意外流出',
        text:'一段训练赛录像被传到社区。你的队伍尝试了尚未公开的新阵容，而你的一次离谱失误正好位于视频最精彩的位置。',
        choices:[
          { label:'公开自嘲回应', desc:'缓和舆论，提高社区亲和力。', effects:{popularity:8,condition:3,coachTrust:-2}, outcome:'梗图传播得比战术更快。至少大家笑完以后，没有继续追着骂。' },
          { label:'保持沉默继续训练', desc:'降低外界噪音，保住教练信任。', effects:{coachTrust:5,condition:-3,popularity:-2,nextMatchBonus:.6}, outcome:'你没有参与评论区团战。真正的团战还在服务器里等着。' },
          { label:'要求俱乐部追查泄露', desc:'维护战术机密，但可能损伤队内关系。', effects:{coachTrust:4,teammateBond:-5,condition:-2}, outcome:'泄露源开始被调查，更衣室里的每个人也开始互相看得有点像嫌疑人。' }
        ]
      },
      {
        id:'travel-delay', icon:'✈️', kicker:'TRAVEL · 跨区客场', title:'跨国客场遭遇航班延误',
        text:'队伍抵达赛区时已经接近凌晨。第二天还有媒体日和训练安排，时差正准备用你的反应速度做实验。',
        choices:[
          { label:'取消媒体活动补觉', desc:'恢复状态，但损失公众曝光。', effects:{condition:13,popularity:-5,coachTrust:2}, outcome:'你错过了镜头，却保住了第二天睁开眼睛的能力。' },
          { label:'照常完成全部安排', desc:'保住职业形象，身体压力明显增加。', effects:{popularity:7,coachTrust:4,condition:-10}, outcome:'行程表被全部打勾，身体状态则被打了一个问号。' },
          { label:'只参加团队训练', desc:'在竞技与曝光之间取中间值。', effects:{condition:3,teammateBond:5,nextMatchBonus:.4}, outcome:'你把有限的清醒时间留给了队伍。运营部门会活下来的，大概。' }
        ]
      },
      {
        id:'hero-ban-week', icon:'🚫', kicker:'FORMAT · 英雄禁用', title:'英雄禁用周抽中了你的招牌', condition:()=>Number(careerState.seasonYear||0)===2025,
        text:'联盟阶段规则临时禁用了你的招牌英雄。对手教练显然很开心，你的英雄池则被迫接受突击检查。',
        choices:[
          { label:'启用冷门备用英雄', desc:'高风险地扩展英雄池。', effects:{poolAttr:1,nextMatchBonus:.8,condition:-6}, outcome:'训练赛一开始像事故现场，后来至少变成了有规划的施工现场。' },
          { label:'转为团队功能位', desc:'牺牲个人数据，强化协同。', effects:{teammateBond:8,coachTrust:6,nextRatingBonus:-.08}, outcome:'数据面板不再好看，但队伍突然能正常运转。真烦。' },
          { label:'申请临时轮换', desc:'减少风险，也会降低教练对你不可替代性的判断。', effects:{condition:9,coachTrust:-6,popularity:-3}, outcome:'你获得了休息，替补获得了舞台，讨论区获得了新的首发争议。' }
        ]
      },
      {
        id:'vod-review', icon:'🧠', kicker:'COACHING · 录像复盘', title:'教练点名你主持全队复盘',
        text:'主教练把遥控器递给你，要你解释上一场为什么输掉关键图。所有队友都坐在下面，等着看你是分析问题，还是制造新问题。',
        choices:[
          { label:'直接指出团队问题', desc:'提升战术执行，但容易让气氛变硬。', effects:{coachTrust:8,teammateBond:-4,awarenessAttr:1}, outcome:'复盘效率很高，散会速度也很高。没人想在门口继续聊。' },
          { label:'先承担自己的错误', desc:'强化队友关系与领导形象。', effects:{teammateBond:9,popularity:3,coachTrust:3}, outcome:'你没有把锅全部抱走，但先把自己的那口拿稳了。队友开始愿意继续说话。' },
          { label:'让每个人轮流发言', desc:'强化沟通，消耗更多时间和状态。', effects:{teammateBond:7,coachTrust:5,condition:-5}, outcome:'会议比预定时间长了一倍，好消息是这次大家真的在讨论同一场比赛。' }
        ]
      },
      {
        id:'roster-rotation', icon:'🔄', kicker:'ROSTER · 阵容轮换', title:'教练提出阶段性轮换',
        text:'教练组想在部分地图启用替补，以测试新的阵容组合。你不会彻底失去首发，但出场时间和个人数据可能受到影响。',
        choices:[
          { label:'接受轮换安排', desc:'提升团队关系与长期状态。', effects:{teammateBond:8,condition:8,coachTrust:5,popularity:-2}, outcome:'你少打了几张图，却让队伍拥有更多变化。个人数据没有因此发来感谢信。' },
          { label:'争取完整首发', desc:'强化个人曝光，增加身体消耗。', effects:{popularity:6,condition:-8,coachTrust:-3,nextRatingBonus:.15}, outcome:'你保住了全部出场时间。接下来最好也保住全部表现。' },
          { label:'主动帮助替补磨合', desc:'强化领导力和队伍协同。', effects:{teammateBond:10,coachTrust:7,condition:-4}, outcome:'你把竞争关系暂时变成了合作关系。至少在下一次首发名单公布以前。' }
        ]
      },
      {
        id:'viral-highlight', icon:'📱', kicker:'COMMUNITY · 高光传播', title:'你的高光片段突然爆火',
        text:'一段关键团战操作登上社区热门，剪辑、慢放和夸张标题同时出现。有人已经开始认真讨论你是不是联盟未来门面。',
        choices:[
          { label:'趁热参与社区互动', desc:'大幅提高关注度，增加额外行程。', effects:{popularity:12,condition:-6,teammateBond:2}, outcome:'关注数涨得很快，睡眠时间掉得同样专业。' },
          { label:'把赞美转给全队', desc:'提升队友关系和公众形象。', effects:{popularity:7,teammateBond:8,coachTrust:2}, outcome:'队友很受用，评论区则开始夸你“情商也在线”。要求已经逐渐离谱。' },
          { label:'不回应，专注比赛', desc:'保住状态，错过部分曝光。', effects:{condition:8,coachTrust:4,popularity:-2}, outcome:'热门话题会过去，下一场比赛不会。这个判断至少目前没错。' }
        ]
      },
      {
        id:'comms-language', icon:'🎧', kicker:'TEAM · 跨语言沟通', title:'新队友的语音沟通出现障碍',
        text:'新加入的外援在高压团战中跟不上队内术语。一次“回撤”被听成“继续”，训练赛当场变成了语言教学现场。',
        choices:[
          { label:'一起整理简化术语表', desc:'显著改善团队协同。', effects:{teammateBond:10,coachTrust:5,condition:-4}, outcome:'术语表只有一页，却比之前十分钟的语音争吵有效得多。' },
          { label:'由你承担更多指挥', desc:'提升临场责任与个人压力。', effects:{coachTrust:7,nextMatchBonus:.8,condition:-6}, outcome:'沟通变清楚了，因为所有人现在都等你说。压力也变清楚了。' },
          { label:'交给教练组处理', desc:'保住个人状态，但团队问题改善较慢。', effects:{condition:6,teammateBond:-3}, outcome:'你专注自己的工作。问题没有消失，只是被移动到了教练的待办列表。' }
        ]
      },
      {
        id:'equipment-failure', icon:'🖱️', kicker:'MATCHDAY · 设备故障', title:'赛前设备突然出现异常',
        text:'热身时鼠标开始间歇性断连。技术人员可以立即更换设备，但新设备的手感与你熟悉的设置略有差异。',
        choices:[
          { label:'立刻更换备用设备', desc:'降低故障风险，短期手感受影响。', effects:{condition:-2,nextMatchBonus:-.5,coachTrust:3}, outcome:'设备稳定了，手感陌生了。至少这次空枪不能继续怪USB接口。' },
          { label:'坚持使用原设备', desc:'保留手感，承担比赛中断风险。', effects:{nextMatchBonus:.8,condition:-4,coachTrust:-4}, outcome:'你选择相信老伙计。技术人员选择提前准备事故报告。' },
          { label:'延长热身适应备用设备', desc:'以体力换取稳定发挥。', effects:{condition:-7,nextMatchBonus:.5,coachTrust:5}, outcome:'你多练了半小时，新设备终于不再像借来的手。' }
        ]
      },
      {
        id:'rookie-stage-fright', icon:'🫀', kicker:'ROOKIE · 首次大场面', title:'第一次在满场观众前热身', minAge:16, maxAge:18, eventTags:['rookie'], weight:2.4,
        text:'灯光、现场音响和观众的欢呼把训练赛里的安静彻底撕碎。你的手没有发抖，但呼吸显然比平时快。',
        choices:[
          { label:'主动做更长热身', desc:'用体力换取稳定手感。', effects:{condition:-5,nextMatchBonus:1.2,coachTrust:2}, outcome:'你的热身时间长得像加时赛，不过上台后手终于听话了。' },
          { label:'跟老将聊几句', desc:'降低紧张，建立队内关系。', effects:{teammateBond:7,condition:5,nextRatingBonus:.08}, outcome:'老将没有传授什么玄学，只告诉你别把观众当成会开枪的人。确实有用。' },
          { label:'戴上耳机隔绝现场', desc:'专注自己，减少外界干扰。', effects:{condition:3,popularity:-2,nextMatchBonus:.5}, outcome:'世界安静了。至少在摘下耳机以前，压力暂时找不到入口。' }
        ]
      },
      {
        id:'rookie-mentor', icon:'🧑‍🏫', kicker:'ROOKIE · 老将带教', title:'队内老将愿意带你复盘', minAge:16, maxAge:20, eventTags:['rookie'], weight:2.0,
        text:'一名老将主动提出陪你看两小时录像。他的语气不算温柔，但每次暂停的位置都很准确。',
        choices:[
          { label:'认真记下所有问题', desc:'强化意识与教练信任。', effects:{awarenessAttr:1,coachTrust:6,condition:-3}, outcome:'你的笔记越来越长，死亡原因终于不再统一写成“运气不好”。' },
          { label:'重点问位置细节', desc:'提升比赛理解和下一场稳定性。', effects:{nextRatingBonus:.18,teammateBond:5}, outcome:'你开始理解那些看似保守的站位，其实是在提前拒绝送头。' },
          { label:'改约到休息日', desc:'保住状态，但错过一次交流机会。', effects:{condition:9,coachTrust:-2}, outcome:'你获得了一晚休息。老将点了点头，表情看不出是理解还是失望。' }
        ]
      },
      {
        id:'contract-year-pressure', icon:'📝', kicker:'CONTRACT · 合同年压力', title:'合同年里的每一张图都被放大', minCareer:2, eventTags:['contract'], weight:2.0,
        condition:()=>careerState.contract && careerState.contract.remaining<=1,
        text:'合同即将到期。媒体开始统计你的身价，管理层开始统计你的失误，连普通常规赛都像在公开试训。',
        choices:[
          { label:'把注意力留在比赛', desc:'减少舆论消耗，保持稳定。', effects:{condition:6,coachTrust:3,nextRatingBonus:.1}, outcome:'你没有回应合同问题。报道少了些，训练室里的呼吸也顺了些。' },
          { label:'要求经纪团队主动造势', desc:'提高市场关注，也增加压力。', effects:{popularity:11,condition:-7,nextMatchBonus:.8}, outcome:'你的名字频繁出现在转会讨论里。流量来了，安静也走了。' },
          { label:'私下询问俱乐部计划', desc:'获得教练信任，但可能影响队内关系。', effects:{coachTrust:7,teammateBond:-2}, outcome:'你得到了一些诚实答案。诚实通常不太好听，但至少比猜测便宜。' }
        ]
      },
      {
        id:'captaincy-offer', icon:'🧭', kicker:'LEADERSHIP · 队长职责', title:'教练希望你承担更多临场指挥', minAge:21, eventTags:['prime','veteran'], weight:1.5,
        text:'教练组认为你已经不只是执行者，希望你在混乱团战里接管部分语音。责任不会写进数据面板，失误却会被所有人听见。',
        choices:[
          { label:'接受更多指挥责任', desc:'提升教练信任与团队影响。', effects:{coachTrust:8,teammateBond:5,condition:-5}, outcome:'你的语音变多了，氧气变少了。好消息是队伍真的开始按同一节奏行动。' },
          { label:'先从特定地图尝试', desc:'稳妥增加责任，降低失败成本。', effects:{coachTrust:5,nextMatchBonus:.6,condition:-2}, outcome:'你先接管熟悉地图。至少第一次当指挥，不用同时找路。' },
          { label:'坚持专注个人操作', desc:'保住个人状态，错过领导机会。', effects:{condition:7,coachTrust:-4,nextRatingBonus:.12}, outcome:'你继续把注意力放在准星上。教练没有强求，只在笔记本上多写了一行。' }
        ]
      },
      {
        id:'veteran-mentor', icon:'🪴', kicker:'VETERAN · 带新人', title:'新秀把你当成了求生手册', minAge:25, eventTags:['veteran'], weight:2.1,
        text:'队里的新秀开始频繁问你站位、英雄池和比赛压力。你突然意识到，自己已经成了当年最想遇到的那种老队员。',
        choices:[
          { label:'固定陪他复盘', desc:'强化队伍关系与领导价值。', effects:{teammateBond:10,coachTrust:6,condition:-4}, outcome:'新秀少犯了一些错误，你多开了几次夜会。经验开始以睡眠为货币流通。' },
          { label:'只给关键建议', desc:'兼顾个人训练与带教。', effects:{teammateBond:6,condition:2,coachTrust:3}, outcome:'你没有替他走路，只是在几个坑旁边插了牌子。' },
          { label:'让教练组负责', desc:'专注自身状态，降低队内影响。', effects:{condition:8,teammateBond:-4}, outcome:'你把问题交回专业人员。新秀理解，关系却没因此自动升温。' }
        ]
      },
      {
        id:'reflex-training', icon:'⚡', kicker:'VETERAN · 反应训练', title:'你开始明显感觉到反应差异', minAge:26, eventTags:['veteran'], weight:1.8,
        text:'训练数据里，第一反应速度比年轻时慢了一点。差距很小，却足够让职业选手一眼看见。',
        choices:[
          { label:'加练纯反应项目', desc:'短期维持机械状态，身体消耗较大。', effects:{primaryAttr:1,condition:-10,nextMatchBonus:.8}, outcome:'训练数据回升了一点。身体则提醒你，这种账单不会永远延迟寄送。' },
          { label:'用站位减少对枪需求', desc:'强化经验型打法。', effects:{awarenessAttr:1,coachTrust:5,nextRatingBonus:.15}, outcome:'你不再每次都赌反应，而是让对手更少有机会逼你赌。' },
          { label:'接受状态变化', desc:'恢复体力，降低额外训练压力。', effects:{condition:12,popularity:-2}, outcome:'你没有假装时间不存在。职业生涯反而因此显得更可控。' }
        ]
      },
      {
        id:'legacy-interview', icon:'📚', kicker:'LEGACY · 生涯回顾', title:'媒体开始问你如何评价自己的时代', minAge:27, eventTags:['veteran'], weight:1.6,
        text:'采访问题不再只是下一场比赛，而是“你觉得自己会留下什么”。这种问题听起来像赞美，也像提前写好的告别。',
        choices:[
          { label:'谈冠军与荣誉', desc:'提高历史讨论度和公众关注。', effects:{popularity:12,condition:-3}, outcome:'报道把你放进了历史讨论。评论区很快开始计算你还缺几个冠军。' },
          { label:'谈队友与成长', desc:'强化团队关系与成熟形象。', effects:{teammateBond:8,popularity:6,coachTrust:3}, outcome:'你的回答没那么锋利，却让很多旧队友主动发来消息。' },
          { label:'拒绝提前总结', desc:'保持竞争心态，减少额外曝光。', effects:{nextMatchBonus:1,condition:4,popularity:-3}, outcome:'你说职业生涯还没结束。下一场比赛因此突然显得很有必要。' }
        ]
      }
    ];

    // 非伤病类健康事件：会影响状态或缺席比赛，但不会计入伤病次数。
    SEASON_EVENTS.push(
      {
        id:'food-poisoning', icon:'🤢', kicker:'HEALTH · 突发肠胃问题', title:'客场餐厅的危险套餐',
        text:'比赛前一晚，全队聚餐后只有你开始反复跑厕所。队医判断是急性食物中毒，不属于运动伤病，但身体显然也不打算听联盟赛程安排。',
        eventTags:['health','random'], weight:1.35,
        choices:[
          { label:'报备并休息一场', desc:'缺席下一场，让身体彻底恢复；不会记入伤病次数。', effects:{condition:16,illnessRest:1,coachTrust:2}, outcome:'你缺席了下一场比赛，但恢复速度比硬撑快得多。病假不是伤病，至少履历表不用再多一条。' },
          { label:'输液后照常出战', desc:'不缺席，但接下来两场都会受到身体状态影响。', effects:{condition:-8,illnessGames:2,illnessPenalty:-1.8,coachTrust:3}, outcome:'你准时出现在赛场，镜头看不出问题，只有你知道每一次快速转身都像在和胃进行团战。' },
          { label:'只吃止泻药硬顶', desc:'保住出场，短期代价最大。', effects:{condition:-16,nextMatchBonus:-2.4,popularity:2}, outcome:'你完成了比赛准备。至于准备得是不是比赛，身体暂时保留意见。' }
        ]
      },
      {
        id:'flu-fever', icon:'🤒', kicker:'HEALTH · 流感季', title:'赛前突然发烧',
        text:'早训测温时，你的体温明显超标。队医判断是流感发热，不是伤病，但继续参赛会让反应、沟通和耐力一起打折。',
        eventTags:['health','random'], weight:1.25,
        choices:[
          { label:'隔离休息一场', desc:'缺席下一场并快速恢复，不计入伤病记录。', effects:{condition:18,illnessRest:1,teammateBond:2}, outcome:'你被安排单独休息。队友少了一个首发，至少没有多五个病号。' },
          { label:'退烧后有限度训练', desc:'接下来一场状态下降，但不缺席。', effects:{condition:-6,illnessGames:1,illnessPenalty:-1.4,coachTrust:2}, outcome:'体温降了下来，反应速度仍像隔着一层棉被。你能上场，只是不会特别像平时的自己。' },
          { label:'坚持完整训练计划', desc:'教练会认可态度，身体大概率不会。', effects:{condition:-14,coachTrust:5,nextMatchBonus:-2}, outcome:'训练内容一项没少，健康状态倒是少了不少。职业态度满分，医学常识暂时缺席。' }
        ]
      },
      {
        id:'perfect-setup', icon:'🖱️', kicker:'EQUIPMENT · 设备调校', title:'终于找到完美的设备参数',
        text:'设备经理帮你重新调校了鼠标、显示器和座椅高度。参数看起来只变了一点，手感却突然顺得像用了几年。',
        eventTags:['positive','prime'], weight:1.25,
        choices:[
          { label:'固定这套参数', desc:'稳定提升下一场手感。', effects:{condition:5,nextMatchBonus:1.8}, outcome:'你把参数保存了三份。职业选手对配置文件的信任，通常比对云同步更真诚。' },
          { label:'继续微调寻找上限', desc:'有机会强化核心能力，但会消耗训练状态。', effects:{primaryAttr:1,condition:-5,nextMatchBonus:.8}, outcome:'你继续折腾到深夜，最终确实更顺了。至于是不是心理作用，赢了以后就没人敢问。' },
          { label:'分享给全队', desc:'个人收益较少，队伍协同和关系提升。', effects:{teammateBond:9,coachTrust:4}, outcome:'全队的设备体验都顺了一点。设备经理第一次觉得自己的岗位像是战术核心。' }
        ]
      },
      {
        id:'analyst-read', icon:'📊', kicker:'ANALYSIS · 对手研究', title:'分析师抓到了对手习惯',
        text:'分析师发现下一个对手在特定地图和团战阶段存在固定站位习惯。这份报告不保证胜利，但至少保证你不会毫无准备地撞上去。',
        eventTags:['positive','tactics'], weight:1.4,
        choices:[
          { label:'单独研究对位选手', desc:'强化下一场个人发挥。', effects:{nextMatchBonus:1.7,nextRatingBonus:.18,condition:-2}, outcome:'你把对位选手最近十场录像看了个遍。现在连他什么时候会贪枪，你都比他教练更清楚。' },
          { label:'拉全队做专项复盘', desc:'提升团队关系与教练信任。', effects:{teammateBond:8,coachTrust:6,condition:-4}, outcome:'全队终于对下一场该怎么打有了同一个版本，而不是五份各自正确的答案。' },
          { label:'保存为临场提示', desc:'收益温和，但几乎没有额外消耗。', effects:{awarenessAttr:1,nextMatchBonus:.5}, outcome:'你没有过度训练，只把最关键的信息留下。少看九小时录像，也不代表少用脑子。' }
        ]
      },
      {
        id:'team-day-off', icon:'🍲', kicker:'TEAM · 难得休息日', title:'全队终于一起吃了顿饭',
        text:'赛程中出现了罕见的完整休息日。没有拍摄、没有训练赛，也没有人提议“顺便复盘一下”。队友决定一起出去吃饭。',
        eventTags:['positive','team'], weight:1.3,
        choices:[
          { label:'和全队一起参加', desc:'恢复状态并明显改善队内关系。', effects:{condition:10,teammateBond:11}, outcome:'这顿饭没有提升任何战术指标，却让语音频道里的语气正常了许多。人类偶尔确实需要像人类一样相处。' },
          { label:'早点回去补觉', desc:'最大化恢复，错过一部分团队交流。', effects:{condition:17,teammateBond:-2}, outcome:'你睡了一个完整的长觉。醒来后最大的惊喜，是身体没有任何部位在投诉。' },
          { label:'顺便和队长聊比赛', desc:'兼顾关系和战术理解。', effects:{condition:6,teammateBond:6,awarenessAttr:1}, outcome:'饭局最后还是聊到了比赛，但至少不是对着暂停画面吃外卖。' }
        ]
      },
      {
        id:'scrim-breakthrough', icon:'✨', kicker:'SCRIM · 训练赛突破', title:'训练赛击败联盟头名',
        text:'一整周都不顺的队伍，突然在训练赛里连续击败联盟头名。正式比赛当然不是训练赛，但这种胜利足够让全队重新相信战术不是废纸。',
        eventTags:['positive','form'], weight:1.15,
        choices:[
          { label:'保持冷静继续准备', desc:'稳定获得下一场状态提升。', effects:{nextMatchBonus:1.5,coachTrust:5}, outcome:'你没有把训练赛当冠军庆祝，但走出房间时，所有人的脚步都轻了一点。' },
          { label:'主动鼓舞全队', desc:'强化团队关系和士气。', effects:{teammateBond:10,popularity:4,nextMatchBonus:.7}, outcome:'你把这场胜利说成了转折点。是不是转折点，要看下一场；至少现在大家愿意相信。' },
          { label:'继续加练薄弱地图', desc:'用状态换取地图理解。', effects:{awarenessAttr:1,condition:-6,coachTrust:4}, outcome:'别人去庆祝，你又打开了录像。很扫兴，也很职业。' }
        ]
      }
      ,{
        id:'new-head-coach', icon:'🧑‍💼', kicker:'COACHING · 新教练上任', title:'新教练带着一套完全不同的体系来到基地', minCareer:2, eventTags:['coach','team'], weight:1.25,
        text:'俱乐部宣布更换主教练。过去积累的信任不会完全消失，但新教练显然不会因为你以前的履历就自动把首发位置焊死。',
        choices:[
          {label:'第一时间学习新体系',desc:'主动适应，尽快建立新的教练信任。',effects:{coachTrustSet:56,coachTrust:7,condition:-4,nextMatchBonus:.6},outcome:'你成为第一批掌握新术语的人。新教练记住了你的名字，也记住了你没在会议上打哈欠。'},
          {label:'用比赛表现说话',desc:'不刻意讨好，保留状态等待正式赛。',effects:{coachTrustSet:52,condition:6,nextRatingBonus:.15},outcome:'你没有抢着表态。新教练没有不满，只把你的名字留在了“继续观察”那一栏。'},
          {label:'坚持原有打法',desc:'保护舒适区，但新教练可能认为你不够配合。',effects:{coachTrustSet:44,primaryAttr:1,teammateBond:-3},outcome:'你的招牌打法依然锋利。问题是新战术板上暂时没有专门给招牌留的位置。'}
        ]
      },
      {
        id:'new-teammate-arrival', icon:'🆕', kicker:'ROSTER · 新选手加入', title:'队伍签下了一名与你风格完全不同的新队友', minCareer:2, eventTags:['team'], weight:1.3,
        text:'新队友加入首发轮换，沟通习惯、英雄池和比赛节奏都与旧阵容不同。原本顺手的配合需要重新建立。',
        choices:[
          {label:'主动带他熟悉体系',desc:'投入额外精力，快速建立队内关系。',effects:{teammateBondSet:55,teammateBond:8,coachTrust:4,condition:-4},outcome:'新队友少走了几条弯路，你多开了几场私人复盘。关系这种东西，通常就是拿时间换的。'},
          {label:'先从训练赛慢慢磨合',desc:'稳妥适应，不追求立即见效。',effects:{teammateBondSet:53,teammateBond:3,nextMatchBonus:.4},outcome:'配合没有突然开窍，但每次团战后的问号逐渐少了几个。'},
          {label:'保持各自比赛习惯',desc:'保住个人状态，阵容关系建立较慢。',effects:{teammateBondSet:47,condition:5,nextRatingBonus:.1},outcome:'你们都打得很舒服，只是偶尔像在同一张地图上参加两场不同的比赛。'}
        ]
      },
      {
        id:'teammate-demoted', icon:'⬇️', kicker:'ROSTER · 队内处分', title:'一名队友因训练态度问题被下放替补', minCareer:2, eventTags:['team','coach'], weight:1.05,
        text:'连续几次训练争执后，教练组把一名首发下放替补。队内气氛突然变得很安静，所有人都在重新判断规则边界。',
        choices:[
          {label:'支持教练组决定',desc:'强化纪律与教练信任，但可能让队友感到不安。',effects:{coachTrust:8,teammateBond:-6},outcome:'训练秩序迅速恢复，语音频道也安静得过分。大家开始更认真，也更谨慎。'},
          {label:'私下安慰被下放队友',desc:'维护关系，但可能被教练认为立场模糊。',effects:{teammateBond:9,coachTrust:-4,condition:-2},outcome:'你没有改变名单，却让对方知道更衣室里还有人愿意听完他的版本。'},
          {label:'推动一次全队沟通',desc:'消耗状态，争取同时修复纪律和关系。',effects:{coachTrust:5,teammateBond:6,condition:-6},outcome:'会议没有让所有人满意，但至少“为什么”不再只靠走廊传闻解释。'}
        ]
      },
      {
        id:'coach-public-criticism', icon:'📋', kicker:'COACHING · 公开点名', title:'教练在复盘会上直接点名批评了你', eventTags:['coach'], weight:1.1,
        text:'上一场的关键失误被反复播放。主教练没有留情，明确表示你的执行已经影响全队战术。',
        choices:[
          {label:'当场认错并提出改法',desc:'快速修复信任，承担额外训练压力。',effects:{coachTrust:8,condition:-5,awarenessAttr:1},outcome:'你没有争论镜头角度，只讨论下一次该站在哪里。教练的语气明显缓和了。'},
          {label:'会后单独解释情况',desc:'保护队内气氛，获得较温和的信任修复。',effects:{coachTrust:4,teammateBond:3,nextRatingBonus:.1},outcome:'你把没能在会议上说清的内容讲完了。不是所有解释都能免锅，但至少不是沉默。'},
          {label:'认为批评不公平',desc:'保住自尊与状态，教练关系明显恶化。',effects:{coachTrust:-12,condition:4,popularity:3},outcome:'你表达了不同意见。讨论区很快站队，首发名单却仍然只由教练组发布。'}
        ]
      },
      {
        id:'captain-leaves', icon:'🧳', kicker:'ROSTER · 队长离队', title:'队内最稳定的老队长突然转会', minCareer:2, eventTags:['team'], weight:.9,
        text:'转会窗口临近关闭时，队长正式离队。原本负责调节气氛和统一语音的人不在了，队伍需要新的稳定点。',
        choices:[
          {label:'主动承担更多沟通',desc:'提升教练信任，承担更高精神消耗。',effects:{coachTrust:7,teammateBond:5,condition:-6},outcome:'语音里空出来的位置被你补上了。责任没有职位名称，疲劳倒是很具体。'},
          {label:'支持新队长建立权威',desc:'快速恢复队内关系，降低个人存在感。',effects:{teammateBond:9,coachTrust:3,popularity:-2},outcome:'你没有抢着成为中心，却让新队长少经历了一轮无意义的权力测试。'},
          {label:'只专注自己的职责',desc:'保持状态，队伍关系恢复更慢。',effects:{condition:8,teammateBond:-5},outcome:'你的个人准备没有受到影响。至于全队谁来喊停，暂时仍然是个开放问题。'}
        ]
      },
      {
        id:'team-workshop', icon:'🤝', kicker:'TEAM · 关系修复', title:'俱乐部安排了一次没有电脑的团队活动', eventTags:['positive','team'], weight:1.15,
        text:'教练组发现更衣室气氛持续紧绷，临时取消半天训练，要求所有人离开屏幕一起完成团队活动。没有录像，也没有数据面板可甩锅。',
        choices:[
          {label:'认真参与所有环节',desc:'显著改善队友关系，并恢复部分状态。',effects:{teammateBond:12,condition:8},outcome:'活动内容不算精彩，但回到基地后，大家终于又会在语音里正常叫彼此名字。'},
          {label:'重点和关系最差的队友沟通',desc:'集中修复关系，过程略显尴尬。',effects:{teammateBond:15,condition:-2,coachTrust:2},outcome:'对话开头比加时赛还难熬，结束时至少不再需要通过第三个人传话。'},
          {label:'把它当作纯休息日',desc:'最大化恢复，关系改善较少。',effects:{condition:15,teammateBond:3},outcome:'你获得了真正的半天休息。社交效果一般，睡眠效果堪称MVP。'}
        ]
      }

    );

    function snapshotCareerDynamics() {
      return {condition:careerState.condition,coachTrust:careerState.coachTrust,teammateBond:careerState.teammateBond,popularity:careerState.popularity};
    }

    function restoreCareerDynamics(snapshot) {
      if(!snapshot) return;
      careerState.condition=snapshot.condition;
      careerState.coachTrust=snapshot.coachTrust;
      careerState.teammateBond=snapshot.teammateBond;
      careerState.popularity=snapshot.popularity;
    }

    function prepareCareerDynamicsForSeason(isRestart=false) {
      if(isRestart && seasonState.startDynamics) {
        restoreCareerDynamics(seasonState.startDynamics);
      } else {
        const teamName=careerState.team?.name||null;
        const firstSeason=!careerState.relationshipTeamName && careerState.careerYears===1;
        const changedTeam=!!careerState.relationshipTeamName && careerState.relationshipTeamName!==teamName;
        if(firstSeason) {
          careerState.condition=clamp(82+openingState.condition,55,95);
          careerState.coachTrust=clamp(60+openingState.coachTrust,0,100);
          careerState.teammateBond=clamp(58+openingState.teammateBond,0,100);
          careerState.popularity=clamp(18+openingState.popularity,0,100);
        } else if(changedTeam) {
          careerState.condition=clamp(careerState.condition+rand(8,15),62,92);
          careerState.coachTrust=clamp(50+Math.round(careerState.popularity*.04)+rand(-4,4),42,65);
          careerState.teammateBond=clamp(50+rand(-5,5),40,62);
        } else {
          // 留队或续约：关系延续，只让休赛期恢复竞技状态，不把多年信任一键格式化。
          careerState.condition=clamp(careerState.condition+Math.round((82-careerState.condition)*.55)+rand(3,7),55,94);
          careerState.coachTrust=clamp(careerState.coachTrust+rand(-1,2),0,100);
          careerState.teammateBond=clamp(careerState.teammateBond+rand(-1,2),0,100);
        }
        careerState.relationshipTeamName=teamName;
        seasonState.startDynamics=snapshotCareerDynamics();
      }
      careerState.nextMatchBonus=0;
      careerState.nextRatingBonus=0;
      careerState.injuryGames=0;
      careerState.injuryPenalty=0;
      careerState.illnessGames=0;
      careerState.illnessPenalty=0;
      careerState.illnessRestGames=0;
    }

    function generateSeasonEventSchedule() {
      const age=careerState.age;
      const base=age<=18?8:age<=22?7:age<=26?8:9;
      const count=clamp(base+rand(-2,2),5,11);
      const candidates=shuffle(Array.from({length:35},(_,i)=>i+2));
      const selected=[];
      for(const round of candidates) {
        if(selected.every(x=>Math.abs(x-round)>=2)) selected.push(round);
        if(selected.length>=count) break;
      }
      return selected.sort((a,b)=>a-b);
    }

    function seasonMetricLabel(value) {
      if(value>=85) return '极佳';
      if(value>=70) return '良好';
      if(value>=55) return '正常';
      if(value>=40) return '偏低';
      return '危险';
    }

    function renderCareerDynamics() {
      const metrics=[
        ['Condition',careerState.condition,'careerConditionText','careerConditionBar'],
        ['Trust',careerState.coachTrust,'careerTrustText','careerTrustBar'],
        ['Bond',careerState.teammateBond,'careerBondText','careerBondBar'],
        ['Popularity',careerState.popularity,'careerPopularityText','careerPopularityBar']
      ];
      metrics.forEach(([,value,textId,barId])=>{
        const text=document.getElementById(textId), bar=document.getElementById(barId);
        if(text) text.textContent=`${Math.round(value)} · ${seasonMetricLabel(value)}`;
        if(bar) bar.style.width=`${clamp(value,0,100)}%`;
      });
      const history=document.getElementById('seasonEventHistory');
      const count=document.getElementById('seasonEventCount');
      if(count) count.textContent=`${seasonState.eventHistory.length} 件`;
      if(history) {
        history.innerHTML=seasonState.eventHistory.length ? seasonState.eventHistory.slice(-4).reverse().map(item=>`<div class="season-event-history-row"><b>${item.icon}</b><div><strong>第 ${item.afterMatch} 场后 · ${item.title}</strong><p>${item.choice}：${item.summary}</p></div></div>`).join('') : '<div class="season-event-history-empty">暂无赛季事件。</div>';
      }
    }

    function currentCareerMatchBonus() {
      const injuryPenalty=careerState.injuryGames>0?careerState.injuryPenalty:0;
      const illnessPenalty=careerState.illnessGames>0?careerState.illnessPenalty:0;
      return (careerState.condition-75)*.055 + (careerState.coachTrust-60)*.025 + (careerState.teammateBond-55)*.015 + (careerState.roleAdaptation-100)*.07 + careerState.nextMatchBonus + injuryPenalty + illnessPenalty;
    }

    function applyCareerMatchModifiers(roster) {
      const user=roster.find(p=>p.isUser);
      if(!user) return 0;
      const bonus=currentCareerMatchBonus();
      ATTRS.forEach(attr=>user.attrs[attr.key]=clamp(user.attrs[attr.key]+Math.round(bonus),45,99));
      user.overall=Math.round(Object.values(user.attrs).reduce((a,b)=>a+b,0)/ATTRS.length);
      return bonus;
    }

    function consumeCareerMatchModifiers() {
      careerState.nextMatchBonus=0;
      careerState.nextRatingBonus=0;
    }

    function maybeRecordMinorInjury() {
      const seasonCount=getSeasonInjuryCount();
      if(seasonCount>=3 || seasonState.played-seasonState.lastMinorInjuryAt<8) return;
      const chance=careerState.condition<30?.045+(careerState.age>=27?.015:0):careerState.condition<42?.015:0;
      if(chance>0 && Math.random()<chance) {
        careerState.injuryHistory.push({year:careerState.seasonYear,age:careerState.age,choice:'轻微伤病记录',severity:'轻微'});
        seasonState.lastMinorInjuryAt=seasonState.played;
      }
    }

    function updateCareerAfterMatch(won,rating) {
      // 竞技状态代表近期手感与精神状态，不是每打一场就必扣的体力条。
      const formCenter=74;
      const meanReversion=(formCenter-careerState.condition)*.07;
      const performance=rating>=8.2?2.3:rating>=7.4?1.2:rating<5.8?-2.2:rating<6.4?-1.0:0;
      const result=won?.45:-.25;
      const scheduleRecovery=seasonState.played>0&&seasonState.played%6===0?1.5:0;
      careerState.condition=clamp(careerState.condition+meanReversion+performance+result+randomCentered(1.8)+scheduleRecovery,22,98);
      maybeRecordMinorInjury();
      careerState.coachTrust=clamp(careerState.coachTrust+(rating>=7.8?3:rating<6?-2:won?.6:0),0,100);
      careerState.teammateBond=clamp(careerState.teammateBond+(won?.6:-.2),0,100);
      if(careerState.roleAdaptation<100) careerState.roleAdaptation=clamp(careerState.roleAdaptation+rand(2,4),0,100);
      careerState.popularity=clamp(careerState.popularity+(rating>=8.2?3:rating>=7.3?1:0),0,100);
      if(careerState.injuryGames>0) {
        careerState.injuryGames--;
        if(careerState.injuryGames<=0) { careerState.injuryGames=0; careerState.injuryPenalty=0; }
      }
      if(careerState.illnessGames>0) {
        careerState.illnessGames--;
        if(careerState.illnessGames<=0) { careerState.illnessGames=0; careerState.illnessPenalty=0; }
      }
      consumeCareerMatchModifiers();
    }

    function modifyCareerAttribute(key,delta) {
      if(!key || !delta) return;
      if(!state.locked[key]) state.locked[key]={value:75,player:'赛季成长',team:careerState.team?.name||'职业生涯',role:state.role};
      state.locked[key].value=clamp(state.locked[key].value+delta,45,99);
      const user=careerState.starters.find(p=>p.isUser);
      if(user) {
        user.attrs[key]=state.locked[key].value;
        user.overall=Math.round(Object.values(user.attrs).reduce((a,b)=>a+b,0)/ATTRS.length);
      }
    }

    function eventEffectBadges(effects) {
      const list=[];
      const add=(text,value)=>list.push({text,kind:value>0?'good':value<0?'bad':''});
      if(effects.condition) add(`状态 ${effects.condition>0?'+':''}${effects.condition}`,effects.condition);
      if(effects.coachTrust) add(`信任 ${effects.coachTrust>0?'+':''}${effects.coachTrust}`,effects.coachTrust);
      if(effects.teammateBond) add(`关系 ${effects.teammateBond>0?'+':''}${effects.teammateBond}`,effects.teammateBond);
      if(effects.popularity) add(`关注 ${effects.popularity>0?'+':''}${effects.popularity}`,effects.popularity);
      if(effects.nextMatchBonus) add(`下场发挥 ${effects.nextMatchBonus>0?'+':''}${effects.nextMatchBonus}`,effects.nextMatchBonus);
      if(effects.nextRatingBonus) add(`评分修正 ${effects.nextRatingBonus>0?'+':''}${effects.nextRatingBonus}`,effects.nextRatingBonus);
      if(effects.primaryAttr) add(`${attrName(PRIMARY_ATTR_BY_ROLE[state.role])} +${effects.primaryAttr}`,effects.primaryAttr);
      if(effects.awarenessAttr) add(`意识 +${effects.awarenessAttr}`,effects.awarenessAttr);
      if(effects.poolAttr) add(`英雄池 +${effects.poolAttr}`,effects.poolAttr);
      if(effects.positionTrial) add('开启转位试训',1);
      if(effects.coachTrustSet!=null) add('教练关系重新建立',1);
      if(effects.teammateBondSet!=null) add('队内关系重新建立',1);
      if(effects.illnessRest) add(`因病休战 ${effects.illnessRest} 场`,-1);
      if(effects.illnessGames) add(`身体不适影响 ${effects.illnessGames} 场`,-1);
      return list;
    }

    function applySeasonEventEffects(effects) {
      careerState.condition=clamp(careerState.condition+(effects.condition||0),0,100);
      if(effects.coachTrustSet!=null) careerState.coachTrust=clamp(effects.coachTrustSet,0,100);
      careerState.coachTrust=clamp(careerState.coachTrust+(effects.coachTrust||0),0,100);
      if(effects.teammateBondSet!=null) careerState.teammateBond=clamp(effects.teammateBondSet,0,100);
      careerState.teammateBond=clamp(careerState.teammateBond+(effects.teammateBond||0),0,100);
      careerState.popularity=clamp(careerState.popularity+(effects.popularity||0),0,100);
      careerState.nextMatchBonus+=effects.nextMatchBonus||0;
      careerState.nextRatingBonus+=effects.nextRatingBonus||0;
      if(effects.primaryAttr) modifyCareerAttribute(PRIMARY_ATTR_BY_ROLE[state.role],effects.primaryAttr);
      if(effects.awarenessAttr) modifyCareerAttribute('awareness',effects.awarenessAttr);
      if(effects.poolAttr) modifyCareerAttribute('pool',effects.poolAttr);
      if(effects.positionTrial) careerState.positionTrial=pick(ROLES.filter(r=>r.name!==state.role).map(r=>r.name));
      if(effects.illnessRest) careerState.illnessRestGames=Math.max(careerState.illnessRestGames||0,effects.illnessRest);
      if(effects.illnessGames) careerState.illnessGames=Math.max(careerState.illnessGames||0,effects.illnessGames);
      if(effects.illnessPenalty!=null) careerState.illnessPenalty=Math.min(careerState.illnessPenalty||0,effects.illnessPenalty);
    }

    function eventAgeEligible(event) {
      if(event.minAge!=null && careerState.age<event.minAge) return false;
      if(event.maxAge!=null && careerState.age>event.maxAge) return false;
      if(event.minCareer!=null && careerState.careerYears<event.minCareer) return false;
      if(event.maxCareer!=null && careerState.careerYears>event.maxCareer) return false;
      const format=window.getSeasonFormat?.(Number(careerState.seasonYear||0));
      const inPostseason=typeof playoffState!=='undefined'&&!!playoffState.active;
      const inOnlineRegularSeason=format?.onlineRegularSeason===true&&!!seasonState.active&&!inPostseason&&Number(seasonState.played||0)<Number(seasonState.total||format.total);
      if(event.id==='travel-delay'&&inOnlineRegularSeason) return false;
      return !event.condition || event.condition();
    }

    function seasonEventWeight(event) {
      let weight=event.weight||1;
      const tags=event.eventTags||[];
      if(careerState.age<=18 && tags.includes('rookie')) weight*=3.2;
      if(careerState.age>=25 && tags.includes('veteran')) weight*=2.8;
      if(careerState.age>=21 && careerState.age<=25 && tags.includes('prime')) weight*=2.0;
      if(tags.includes('contract') && careerState.contract?.remaining<=1) weight*=2.4;
      if(event.id==='role-trial') weight*=careerState.positionTrial?0.2:0.35;
      if(event.id==='wrist-fatigue') weight*=careerState.age>=25?2.0:.7;
      if(event.id==='starter-competition') weight*=careerState.careerYears<=3?1.6:.75;
      if(tags.includes('coach') && careerState.coachTrust<55) weight*=1.7;
      if(tags.includes('team') && careerState.teammateBond<55) weight*=1.5;
      if((careerState.recentEventIds||[]).includes(event.id)) weight*=.08;
      if(event.condition) weight*=1.45;
      return Math.max(.01,weight);
    }

    function weightedEventPick(events) {
      const weighted=events.map(event=>({event,weight:seasonEventWeight(event)}));
      const total=weighted.reduce((s,x)=>s+x.weight,0);
      let roll=Math.random()*total;
      for(const item of weighted) { roll-=item.weight; if(roll<=0) return item.event; }
      return weighted[weighted.length-1]?.event||pick(SEASON_EVENTS);
    }

    function chooseSeasonEvent() {
      const used=new Set(seasonState.eventHistory.map(x=>x.id));
      let eligible=SEASON_EVENTS.filter(e=>!used.has(e.id) && eventAgeEligible(e));
      if(!eligible.length) eligible=SEASON_EVENTS.filter(eventAgeEligible);
      if(!eligible.length) eligible=SEASON_EVENTS;
      return weightedEventPick(eligible);
    }

    function markSeasonEventDue() {
      if(seasonState.played>=seasonState.total || seasonState.eventDue) return false;
      if(seasonState.eventSchedule.includes(seasonState.played) && !seasonState.eventTriggeredAt.includes(seasonState.played)) {
        seasonState.eventDue=true;
        return true;
      }
      return false;
    }

    function openScheduledSeasonEvent() {
      if(!seasonState.eventDue || seasonState.currentEvent) return false;
      openRandomSeasonEvent(false);
      return true;
    }

    function openRandomSeasonEvent(force=false) {
      if(seasonState.currentEvent) return;
      if(!force && !seasonState.eventDue) return;
      if(force && seasonState.simulating) {
        window.__OWL_RUNTIME?.simulation?.pauseFast?.();
      }
      const event=chooseSeasonEvent();
      seasonState.currentEvent={event,resolved:false,forced:force};
      renderSeasonEvent();
      document.getElementById('seasonEventOverlay').classList.remove('hidden');
    }

    function renderSeasonEvent() {
      const holder=document.getElementById('seasonEventContent');
      const current=seasonState.currentEvent;
      if(!holder || !current) return;
      const event=current.event;
      if(!current.resolved) {
        holder.innerHTML=`<div class="season-event-top"><span class="season-event-kicker">${event.kicker}</span><span class="season-event-round">第 ${Math.max(1,seasonState.played)} 场后</span></div>
          <div class="season-event-icon">${event.icon}</div><h2 class="season-event-title">${event.title}</h2><p class="season-event-copy">${event.text}</p>
          <div class="season-event-choices">${event.choices.map((choice,index)=>`<button class="season-event-choice" data-event-choice="${index}"><div><strong>${choice.label}</strong><p>${choice.desc}</p></div></button>`).join('')}</div>`;
        holder.querySelectorAll('[data-event-choice]').forEach(btn=>btn.addEventListener('click',()=>resolveSeasonEvent(Number(btn.dataset.eventChoice))));
      } else {
        const badges=eventEffectBadges(current.choice.effects);
        holder.innerHTML=`<div class="season-event-result"><div class="result-mark">✓</div><h3>${current.choice.label}</h3><p>${current.choice.outcome}</p><div class="season-event-result-summary">${badges.map(x=>`<span class="season-event-effect ${x.kind}">${x.text}</span>`).join('')}</div><button class="primary-btn" id="closeSeasonEventBtn">继续 →</button></div>`;
        document.getElementById('closeSeasonEventBtn').addEventListener('click',closeSeasonEvent);
      }
    }

    function resolveSeasonEvent(index) {
      const current=seasonState.currentEvent;
      if(!current || current.resolved) return;
      const choice=current.event.choices[index];
      applySeasonEventEffects(choice.effects);
      current.choice=choice;
      current.resolved=true;
      const badges=eventEffectBadges(choice.effects);
      seasonState.eventHistory.push({id:current.event.id,icon:current.event.icon,title:current.event.title,choice:choice.label,summary:badges.map(x=>x.text).join('、')||'没有即时数值变化',afterMatch:seasonState.played});
      careerState.recentEventIds=[...(careerState.recentEventIds||[]).filter(id=>id!==current.event.id),current.event.id].slice(-12);
      if(!current.forced) {
        seasonState.eventTriggeredAt.push(seasonState.played);
        seasonState.eventDue=false;
      }
      renderSeason();
      renderSeasonEvent();
    }

    function closeSeasonEvent() {
      document.getElementById('seasonEventOverlay').classList.add('hidden');
      seasonState.currentEvent=null;
      renderSeason();
      window.__OWL_RUNTIME?.simulation?.resumeAfterEvent?.({message:'事件处理完成，继续模拟剩余常规赛。',delay:450,wholeDelay:180});
    }
