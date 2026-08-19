/* ===== BUNDLE MODULE: data/history_2019_2023.js ===== */
/* ==========================================================================
   MODULE: data/history_2019_2023.js
   Historical DB: 2019–2023 season rosters and franchise transitions
   Migrated from V6.2 lines 10127-10443; execution order is defined by manifest.json.
   ========================================================================== */
    /* ================= V5.0 · 2019-2023 OWL 历史赛季数据库 ================= */

    // 2020-2023 使用“赛季在册代表阵容”。同一名选手会按当年表现拥有不同玩法化 OVR。
    // 第4位为国家/地区代码，用于真实旗帜图标。
    const V50_OWL_ROSTERS={
      2020:{
        ATL:[['Edison','长枪输出',89,'kr'],['Erster','弹道输出',87,'kr'],['babybay','长枪输出',84,'us'],['SharP','长枪输出',82,'se'],['Saucy','弹道输出',79,'us'],['Gator','坦克',87,'us'],['Hawk','坦克',88,'us'],['Pokpo','坦克',85,'kr'],['frd','坦克',82,'us'],['Dogman','输出支援',84,'us'],['Ir1s','输出支援',88,'kr'],['Masaa','战术支援',88,'fi'],['Fire','战术支援',78,'us']],
        BOS:[['Jerry','长枪输出',85,'kr'],['Colourhex','弹道输出',80,'nz'],['Fusions','坦克',79,'gb'],['Axxiom','坦克',77,'kr'],['brussen','坦克',76,'nl'],['Mikeyy','坦克',78,'us'],['Myunbong','输出支援',90,'kr'],['Halo','战术支援',78,'us'],['Swimmer','战术支援',76,'us']],
        CDH:[['Leave','弹道输出',92,'cn'],['JinMu','弹道输出',91,'cn'],['Baconjack','长枪输出',80,'tw'],['Ameng','坦克',88,'cn'],['Elsa','坦克',86,'cn'],['LateYoung','坦克',86,'cn'],['ATing','坦克',78,'cn'],['Molly','输出支援',89,'cn'],['Kyo','输出支援',84,'cn'],['Yveltal','战术支援',90,'cn']],
        DAL:[['Decay','长枪输出',91,'kr'],['Doha','弹道输出',89,'kr'],['Onigod','长枪输出',84,'dk'],['Gamsu','坦克',87,'kr'],['NotE','坦克',84,'ca'],['Trill','坦克',78,'au'],['Crimzo','输出支援',88,'ca'],['Closer','战术支援',82,'kr'],['HarryHook','战术支援',79,'es']],
        FLA:[['Yaki','弹道输出',93,'kr'],['BQB','长枪输出',91,'kr'],['Fate','坦克',90,'kr'],['Gargoyle','坦克',92,'kr'],['Karayan','坦克',80,'kr'],['Gangnamjin','输出支援',92,'kr'],['Byrem','输出支援',80,'kr'],['Kris','战术支援',86,'kr']],
        GZC:[['Happy','长枪输出',92,'kr'],['Eileen','弹道输出',88,'cn'],['nero','弹道输出',89,'us'],['Rio','坦克',88,'kr'],['Cr0ng','坦克',92,'kr'],['shu','输出支援',94,'kr'],['Wya','输出支援',83,'cn'],['Chara','战术支援',87,'kr'],['neptuNo','战术支援',84,'es']],
        HZS:[['GodsB','长枪输出',88,'kr'],['Architect','弹道输出',89,'kr'],['Adora','弹道输出',80,'kr'],['Bazzi','长枪输出',82,'kr'],['Ado','弹道输出',80,'kr'],['guxue','坦克',91,'cn'],['Ria','坦克',86,'kr'],['QoQ','坦克',87,'kr'],['SASIN','坦克',81,'kr'],['BeBe','输出支援',88,'kr'],['Coldest','输出支援',82,'cn'],['iDK','战术支援',85,'kr'],['M1ka','战术支援',83,'cn']],
        HOU:[['Danteh','弹道输出',91,'us'],['LiNkzr','长枪输出',84,'fi'],['Hydration','弹道输出',84,'us'],['blasé','弹道输出',80,'us'],['Muma','坦克',78,'us'],['MekO','坦克',89,'kr'],['SPREE','坦克',80,'be'],['Rapel','输出支援',87,'kr'],['Rawkus','输出支援',84,'us'],['Jecse','战术支援',88,'kr'],['Boink','战术支援',78,'us']],
        LDN:[['Glister','长枪输出',88,'kr'],['Babel','长枪输出',81,'kr'],['Schwi','弹道输出',81,'kr'],['Although','弹道输出',83,'kr'],['JMac','坦克',82,'kr'],['BERNAR','坦克',85,'kr'],['Clestyn','坦克',80,'kr'],['Highly','输出支援',83,'kr'],['Krillin','输出支援',84,'kr'],['Sanguinar','战术支援',84,'kr'],['Fuze','战术支援',79,'kr']],
        GLA:[['birdring','长枪输出',92,'kr'],['Mirror','弹道输出',87,'us'],['Kevster','弹道输出',88,'se'],['Jaru','弹道输出',81,'us'],['OGE','坦克',86,'kr'],['SPACE','坦克',91,'us'],['Shaz','输出支援',88,'fi'],['BigGoose','战术支援',86,'fi'],['Paintbrush','战术支援',82,'us']],
        VAL:[['KSP','长枪输出',92,'gb'],['Shax','长枪输出',91,'dk'],['KSF','弹道输出',86,'us'],['Dreamer','坦克',87,'au'],['GiG','坦克',80,'us'],['McGravy','坦克',88,'us'],['Lastro','输出支援',90,'kr'],['Rain','战术支援',87,'kr']],
        NYXL:[['Nenne','长枪输出',91,'kr'],['Saebyeolbe','长枪输出',87,'kr'],['Libero','弹道输出',89,'kr'],['WhoRU','弹道输出',84,'kr'],['Haksal','弹道输出',90,'kr'],['Mano','坦克',93,'kr'],['HOTBA','坦克',88,'kr'],['Bianca','坦克',82,'kr'],['JJoNak','输出支援',94,'kr'],['Anamo','战术支援',90,'kr'],['Mandu','战术支援',82,'kr']],
        PAR:[['Xzi','长枪输出',94,'kr'],['SoOn','长枪输出',88,'fr'],['Sp9rk1e','弹道输出',95,'kr'],['NiCOgdh','弹道输出',86,'fr'],['BenBest','坦克',89,'fr'],['NoSmite','坦克',85,'kr'],['Hanbin','坦克',95,'kr'],['Fielder','输出支援',93,'kr'],['Greyy','输出支援',82,'pt'],['FDGod','战术支援',93,'fr'],['Kruise','战术支援',81,'gb']],
        PHI:[['Carpe','长枪输出',95,'kr'],['Heesu','长枪输出',91,'kr'],['Ivy','弹道输出',93,'kr'],['Eqo','弹道输出',90,'il'],['SADO','坦克',92,'kr'],['Fury','坦克',95,'kr'],['Poko','坦克',89,'fr'],['Alarm','输出支援',97,'kr'],['Boombox','输出支援',86,'gb'],['FunnyAstro','战术支援',94,'gb']],
        SFS:[['ANS','长枪输出',95,'kr'],['Striker','长枪输出',95,'kr'],['Rascal','弹道输出',93,'kr'],['Architect','弹道输出',88,'kr'],['sinatraa','弹道输出',87,'us'],['super','坦克',93,'us'],['smurf','坦克',95,'kr'],['ChoiHyoBin','坦克',96,'kr'],['Viol2t','输出支援',96,'kr'],['Twilight','输出支援',94,'kr'],['Moth','战术支援',94,'us']],
        SEO:[['FITS','长枪输出',91,'kr'],['Profit','弹道输出',95,'kr'],['ILLICIT','弹道输出',79,'kr'],['Gesture','坦克',91,'kr'],['Michelle','坦克',86,'kr'],['Marve1','坦克',87,'kr'],['Bdosin','输出支援',90,'kr'],['Creative','输出支援',87,'kr'],['tobi','战术支援',89,'kr'],['SLIME','战术支援',89,'kr']],
        SHD:[['LIP','长枪输出',96,'kr'],['Diem','长枪输出',91,'kr'],['Fleta','弹道输出',98,'kr'],['DDing','弹道输出',86,'kr'],['Fearless','坦克',95,'kr'],['Stand1','坦克',86,'kr'],['Void','坦克',97,'kr'],['Geguri','坦克',82,'kr'],['Izayaki','输出支援',94,'kr'],['Luffy','输出支援',84,'kr'],['LeeJaeGon','战术支援',96,'kr']],
        TOR:[['Logix','长枪输出',88,'be'],['Surefour','长枪输出',85,'ca'],['Agilities','弹道输出',86,'ca'],['Beast','坦克',80,'us'],['Nevix','坦克',84,'se'],['numlocked','坦克',82,'gb'],['KariV','输出支援',88,'kr'],['RoKy','战术支援',80,'kr'],['Kruise','战术支援',82,'gb']],
        VAN:[['Stitch','长枪输出',84,'kr'],['Haksal','弹道输出',92,'kr'],['SeoMinSoo','弹道输出',88,'kr'],['Dalton','长枪输出',80,'us'],['Shockwave','长枪输出',86,'dk'],['Tsuna','弹道输出',78,'fr'],['Fissure','坦克',86,'kr'],['JJANU','坦克',88,'kr'],['KSAA','坦克',81,'sa'],['ShRedLock','坦克',76,'ca'],['Twilight','输出支援',92,'kr'],['Roolf','输出支援',78,'ca'],['SLIME','战术支援',90,'kr'],['CarCar','战术支援',77,'us']],
        WAS:[['Corey','长枪输出',82,'us'],['Stratus','弹道输出',79,'us'],['TTuba','弹道输出',88,'kr'],['Stitch','长枪输出',87,'kr'],['Decay','长枪输出',94,'kr'],['rOar','坦克',80,'kr'],['JJANU','坦克',90,'kr'],['AimGod','输出支援',89,'kr'],['ArK','战术支援',86,'kr']]
      },
      2021:{
        ATL:[['Kai','长枪输出',93,'gb'],['Edison','长枪输出',89,'kr'],['Pelican','弹道输出',96,'kr'],['Gator','坦克',91,'us'],['Hawk','坦克',93,'us'],['Ir1s','输出支援',92,'kr'],['Masaa','战术支援',92,'fi']],
        BOS:[['im37','长枪输出',82,'kr'],['Valentine','弹道输出',88,'kr'],['Colourhex','弹道输出',78,'nz'],['Stand1','坦克',85,'kr'],['Punk','坦克',87,'au'],['GaeBullSsi','坦克',84,'kr'],['Myunbong','输出支援',89,'kr'],['Faith','战术支援',88,'kr']],
        CDH:[['Jimmy','长枪输出',84,'cn'],['Leave','弹道输出',98,'cn'],['JinMu','弹道输出',92,'cn'],['Kaneki','弹道输出',79,'cn'],['GA9A','坦克',92,'cn'],['LateYoung','坦克',88,'cn'],['Elsa','坦克',84,'cn'],['Mmonk','输出支援',92,'cn'],['Farway1987','输出支援',89,'cn'],['Nisha','战术支援',91,'cn'],['Yveltal','战术支援',90,'cn']],
        DAL:[['Xzi','长枪输出',85,'kr'],['Doha','弹道输出',92,'kr'],['Sp9rk1e','弹道输出',95,'kr'],['Fearless','坦克',96,'kr'],['Hanbin','坦克',96,'kr'],['Fielder','输出支援',96,'kr'],['Rapel','输出支援',84,'kr'],['Jecse','战术支援',93,'kr']],
        FLA:[['BQB','长枪输出',89,'kr'],['Yaki','弹道输出',94,'kr'],['Checkmate','弹道输出',84,'kr'],['OGE','坦克',85,'kr'],['Gargoyle','坦克',88,'kr'],['Gangnamjin','输出支援',91,'kr'],['SLIME','战术支援',86,'kr']],
        GZC:[['MYKaylee','长枪输出',80,'cn'],['Eileen','弹道输出',86,'cn'],['ChoiSehwan','弹道输出',89,'kr'],['Rio','坦克',84,'kr'],['Cr0ng','坦克',88,'kr'],['KariV','输出支援',85,'kr'],['Mandu','战术支援',80,'kr']],
        HZS:[['Shy','长枪输出',94,'cn'],['GodsB','长枪输出',82,'kr'],['Architect','弹道输出',88,'kr'],['SeoMinSoo','弹道输出',79,'kr'],['guxue','坦克',90,'cn'],['BERNAR','坦克',89,'kr'],['LiGe','坦克',83,'cn'],['Takoyaki','坦克',79,'kr'],['MCD','输出支援',87,'kr'],['Coldest','输出支援',81,'cn'],['iDK','战术支援',83,'kr'],['M1ka','战术支援',82,'cn']],
        HOU:[['Happy','长枪输出',93,'kr'],['Danteh','弹道输出',92,'us'],['KSF','弹道输出',82,'us'],['JJANGGU','坦克',89,'kr'],['PIGGY','坦克',91,'kr'],['Crimzo','输出支援',91,'ca'],['Joobi','战术支援',84,'us']],
        LDN:[['Hybrid','长枪输出',78,'gb'],['SparkR','长枪输出',83,'gb'],['blasé','弹道输出',79,'us'],['Hadi','坦克',80,'de'],['Molf1g','坦克',78,'dk'],['Ripa','输出支援',79,'fi'],['Kellex','战术支援',78,'dk']],
        GLA:[['birdring','长枪输出',93,'kr'],['Kevster','弹道输出',96,'se'],['Mirror','弹道输出',85,'us'],['MuZe','坦克',91,'kr'],['SPACE','坦克',92,'us'],['Shu','输出支援',97,'kr'],['skewed','输出支援',92,'kr'],['FunnyAstro','战术支援',91,'gb'],['Moth','战术支援',88,'us']],
        VAL:[['Krystal','长枪输出',78,'cn'],['MoLanran','弹道输出',76,'cn'],['ShowCheng','弹道输出',74,'cn'],['Silver3','坦克',72,'cn'],['HIGBEE','坦克',70,'cn'],['Wya','输出支援',80,'cn'],['Haker','战术支援',70,'cn']],
        NYXL:[['Flora','长枪输出',89,'kr'],['Gwangboong','长枪输出',86,'kr'],['Ivy','弹道输出',83,'kr'],['FEATH5R','弹道输出',82,'kr'],['Yakpung','坦克',82,'kr'],['Bianca','坦克',83,'kr'],['JJoNak','输出支援',92,'kr'],['Friday','战术支援',80,'kr']],
        PAR:[['Onigod','长枪输出',88,'dk'],['Naga','弹道输出',90,'dk'],['Daan','坦克',87,'nl'],['ELLIVOTE','坦克',80,'se'],['Vestola','坦克',87,'fi'],['Kaan','输出支援',93,'de'],['dridro','战术支援',88,'fr'],['neptuNo','战术支援',80,'es']],
        PHI:[['Carpe','长枪输出',93,'kr'],['Shockwave','长枪输出',86,'dk'],['Rascal','弹道输出',91,'kr'],['Eqo','弹道输出',86,'il'],['Mano','坦克',92,'kr'],['HOTBA','坦克',88,'kr'],['Alarm','输出支援',97,'kr'],['tobi','战术支援',87,'kr'],['FunnyAstro','战术支援',91,'gb']],
        SFS:[['Glister','长枪输出',89,'kr'],['ANS','长枪输出',91,'kr'],['Striker','长枪输出',90,'kr'],['nero','弹道输出',91,'us'],['super','坦克',92,'us'],['smurf','坦克',93,'kr'],['ChoiHyoBin','坦克',93,'kr'],['Viol2t','输出支援',95,'kr'],['Twilight','输出支援',95,'kr'],['FDGod','战术支援',88,'fr']],
        SEO:[['FITS','长枪输出',93,'kr'],['Saebyeolbe','长枪输出',82,'kr'],['Profit','弹道输出',96,'kr'],['Gesture','坦克',88,'kr'],['Toyou','坦克',87,'kr'],['Creative','输出支援',90,'kr'],['Anamo','战术支援',88,'kr']],
        SHD:[['LIP','长枪输出',98,'kr'],['Fleta','弹道输出',97,'kr'],['WhoRU','弹道输出',89,'kr'],['Fate','坦克',94,'kr'],['Void','坦克',97,'kr'],['Izayaki','输出支援',96,'kr'],['Molly','输出支援',85,'cn'],['LeeJaeGon','战术支援',96,'kr']],
        TOR:[['Heesu','长枪输出',91,'kr'],['Logix','长枪输出',84,'be'],['Na1st','弹道输出',86,'kr'],['SADO','坦克',88,'kr'],['Michelle','坦克',85,'kr'],['Lastro','输出支援',90,'kr'],['Aztac','输出支援',81,'kr'],['ANSOONJAE','战术支援',82,'kr']],
        VAN:[['Dalton','长枪输出',79,'us'],['LiNkzr','长枪输出',80,'fi'],['Teru','弹道输出',83,'kr'],['frd','坦克',80,'us'],['ShRedLock','坦克',74,'ca'],['Roolf','输出支援',76,'ca'],['Fire','战术支援',78,'us']],
        WAS:[['Jerry','长枪输出',84,'kr'],['Decay','弹道输出',94,'kr'],['Assassin','弹道输出',89,'kr'],['TTuba','弹道输出',80,'kr'],['Mag','坦克',92,'kr'],['Fury','坦克',92,'kr'],['Bebe','输出支援',89,'kr'],['Closer','战术支援',84,'kr']]
      },
      2022:{
        ATL:[['Kai','长枪输出',92,'gb'],['Venom','弹道输出',88,'kr'],['nero','弹道输出',89,'us'],['Speedily','弹道输出',87,'us'],['Gator','坦克',85,'us'],['Hawk','坦克',93,'us'],['UltraViolet','输出支援',93,'us'],['Vigilante','输出支援',91,'kr'],['Ojee','战术支援',91,'us']],
        BOS:[['Victoria','长枪输出',84,'kr'],['Striker','长枪输出',88,'kr'],['Valentine','弹道输出',88,'kr'],['Punk','坦克',90,'au'],['Mag','坦克',88,'kr'],['Marve1','坦克',84,'kr'],['Crimzo','输出支援',91,'ca'],['MCD','输出支援',86,'kr'],['Faith','战术支援',89,'kr']],
        CDH:[['Leave','长枪输出',95,'cn'],['JinMu','弹道输出',91,'cn'],['GA9A','坦克',90,'cn'],['Daizi','坦克',84,'cn'],['Mmonk','输出支援',91,'cn'],['Nisha','战术支援',88,'cn']],
        DAL:[['Edison','长枪输出',94,'kr'],['Guriyo','长枪输出',81,'kr'],['Sp9rk1e','弹道输出',95,'kr'],['Fearless','坦克',94,'kr'],['Hanbin','坦克',97,'kr'],['Fielder','输出支援',97,'kr'],['ChiYo','战术支援',96,'kr']],
        FLA:[['Hydron','长枪输出',91,'us'],['Xzi','长枪输出',88,'kr'],['Checkmate','弹道输出',92,'kr'],['SOMEONE','坦克',95,'kr'],['Adam','坦克',82,'au'],['Rupal','输出支援',91,'us'],['SirMajed','输出支援',89,'sa'],['Anamo','战术支援',88,'kr']],
        GZC:[['Develop','长枪输出',80,'kr'],['Jimmy','长枪输出',87,'cn'],['ChoiSehwan','弹道输出',91,'kr'],['Eileen','弹道输出',82,'cn'],['Cr0ng','坦克',86,'kr'],['Farway1987','输出支援',89,'cn'],['Molly','输出支援',86,'cn'],['Unique','战术支援',83,'kr']],
        HZS:[['Shy','长枪输出',96,'cn'],['AlphaYi','弹道输出',93,'kr'],['Architect','弹道输出',87,'kr'],['Pineapple','弹道输出',84,'cn'],['guxue','坦克',91,'cn'],['BERNAR','坦克',92,'kr'],['LiGe','坦克',81,'cn'],['irony','输出支援',87,'kr'],['Superich','战术支援',89,'cn']],
        HOU:[['MER1T','长枪输出',94,'kr'],['Pelican','弹道输出',94,'kr'],['Danteh','弹道输出',91,'us'],['PIGGY','坦克',88,'kr'],['Danteh-Tank','坦克',90,'us'],['Ir1s','输出支援',91,'kr'],['Lastro','输出支援',92,'kr'],['Lep','战术支援',83,'us']],
        LDN:[['SparkR','长枪输出',91,'gb'],['Backbone','弹道输出',90,'gb'],['Hadi','坦克',93,'de'],['Poko','坦克',87,'fr'],['Landon','输出支援',90,'us'],['Admiral','战术支援',89,'gb']],
        GLA:[['ANS','长枪输出',91,'kr'],['Happy','长枪输出',91,'kr'],['Kevster','弹道输出',97,'se'],['Patiphan','弹道输出',91,'th'],['Reiner','坦克',94,'us'],['SPACE','坦克',91,'us'],['Shu','输出支援',96,'kr'],['skewed','输出支援',93,'kr'],['FunnyAstro','战术支援',94,'gb']],
        VAL:[['Diya','长枪输出',90,'cn'],['Ezhan','长枪输出',86,'kr'],['Becky','弹道输出',88,'kr'],['Innovation','弹道输出',83,'kr'],['Marve1','坦克',88,'kr'],['SASIN','坦克',84,'kr'],['Molly','输出支援',88,'cn'],['Lengsa','战术支援',87,'cn']],
        NYXL:[['Flora','长枪输出',87,'kr'],['Yaki','弹道输出',90,'kr'],['Kellan','坦克',86,'kr'],['Vulcan','坦克',78,'us'],['Myunbong','输出支援',84,'kr'],['Gangnamjin','输出支援',86,'kr'],['ANSOONJAE','战术支援',80,'kr']],
        PAR:[['Glister','长枪输出',86,'kr'],['Dove','长枪输出',80,'us'],['Naga','弹道输出',82,'dk'],['Wub','弹道输出',81,'us'],['Daan','坦克',83,'nl'],['Vestola','坦克',84,'fi'],['Krawi','坦克',78,'us'],['Kaan','输出支援',87,'de'],['dridro','战术支援',82,'fr'],['Rakattack','战术支援',78,'us']],
        PHI:[['Carpe','长枪输出',88,'kr'],['MN3','长枪输出',95,'kr'],['ZEST','弹道输出',94,'kr'],['Belosrea','坦克',88,'kr'],['Fury','坦克',90,'kr'],['AimGod','输出支援',88,'kr'],['FiXa','战术支援',91,'kr']],
        SFS:[['Kilo','长枪输出',89,'kr'],['Proper','弹道输出',99,'kr'],['s9mm','弹道输出',87,'us'],['Coluge','坦克',92,'us'],['Mikeyy','坦克',86,'us'],['FiNN','输出支援',94,'kr'],['Viol2t','战术支援',95,'kr']],
        SEO:[['FITS','长枪输出',94,'kr'],['Profit','弹道输出',97,'kr'],['Stalk3r','弹道输出',91,'kr'],['smurf','坦克',96,'kr'],['Creative','输出支援',91,'kr'],['Ir1s','输出支援',91,'kr'],['Vindaim','战术支援',93,'kr']],
        SHD:[['LIP','长枪输出',98,'kr'],['Fleta','弹道输出',93,'kr'],['WhoRU','弹道输出',93,'kr'],['Fate','坦克',91,'kr'],['Void','坦克',94,'kr'],['Izayaki','输出支援',94,'kr'],['BeBe','输出支援',84,'kr'],['LeeJaeGon','战术支援',94,'kr']],
        TOR:[['Heesu','长枪输出',91,'kr'],['Finale','弹道输出',87,'kr'],['Although','弹道输出',85,'kr'],['HOTBA','坦克',89,'kr'],['MuZe','坦克',87,'kr'],['Twilight','输出支援',94,'kr'],['CH0R0NG','战术支援',92,'kr']],
        VAN:[['Aspire','长枪输出',90,'us'],['Shockwave','长枪输出',84,'dk'],['Mirror','弹道输出',84,'us'],['Punk','坦克',88,'au'],['False','坦克',80,'ca'],['Aztac','输出支援',82,'kr'],['Skairipa','输出支援',82,'gb'],['Masaa','战术支援',86,'fi']],
        WAS:[['Happy','长枪输出',91,'kr'],['Decay','弹道输出',93,'kr'],['Assassin','弹道输出',86,'kr'],['Kalios','坦克',88,'kr'],['Mag','坦克',88,'kr'],['Krillin','输出支援',88,'kr'],['Vigilante','输出支援',88,'kr'],['Opener','战术支援',85,'kr']]
      },
      2023:{
        ATL:[['LIP','长枪输出',98,'kr'],['Stalk3r','弹道输出',97,'kr'],['D0NGHAK','坦克',94,'kr'],['Hawk','坦克',91,'us'],['Fielder','输出支援',97,'kr'],['vigilante','输出支援',90,'kr'],['ChiYo','战术支援',97,'kr']],
        BOS:[['birdring','长枪输出',94,'kr'],['Striker','长枪输出',89,'kr'],['Decay','弹道输出',95,'kr'],['smurf','坦克',96,'kr'],['Kalios','坦克',88,'kr'],['Twilight','输出支援',95,'kr'],['Izayaki','输出支援',94,'kr'],['LeeJaeGon','战术支援',94,'kr']],
        DAL:[['Edison','长枪输出',89,'kr'],['Sp9rk1e','弹道输出',92,'kr'],['Hanbin','坦克',96,'kr'],['MCD','输出支援',87,'kr'],['Bliss','战术支援',89,'kr']],
        FLA:[['MER1T','长枪输出',97,'kr'],['Checkmate','弹道输出',95,'kr'],['Sauna','弹道输出',82,'fi'],['SOMEONE','坦克',99,'kr'],['Rupal','输出支援',96,'us'],['MAKA','输出支援',82,'kr'],['CH0R0NG','战术支援',96,'kr']],
        GZC:[['Jimmy','长枪输出',92,'cn'],['ChoiSehwan','弹道输出',90,'kr'],['JinMu','弹道输出',88,'cn'],['PIGGY','坦克',88,'kr'],['GA9A','坦克',91,'cn'],['Farway1987','输出支援',91,'cn'],['Xerneas','战术支援',92,'cn']],
        HZS:[['Shy','长枪输出',97,'cn'],['Leave','弹道输出',97,'cn'],['Pineapple','弹道输出',85,'cn'],['guxue','坦克',96,'cn'],['Twenty','坦克',91,'cn'],['Mmonk','输出支援',94,'cn'],['Lengsa','战术支援',93,'cn']],
        HOU:[['Happy','长枪输出',94,'kr'],['Pelican','弹道输出',96,'kr'],['Fearless','坦克',95,'kr'],['Gargoyle','坦克',87,'kr'],['Shu','输出支援',97,'kr'],['Viol2t','战术支援',96,'kr']],
        LDN:[['SparkR','长枪输出',91,'gb'],['Backbone','弹道输出',91,'gb'],['Lethal','弹道输出',82,'ie'],['Hadi','坦克',94,'de'],['Landon','输出支援',93,'us'],['Admiral','战术支援',91,'gb']],
        GLA:[['Kai','长枪输出',90,'gb'],['Kevster','弹道输出',96,'se'],['Yaki','弹道输出',89,'kr'],['Danteh','坦克',91,'us'],['Marve1','坦克',88,'kr'],['Lastro','输出支援',91,'kr'],['Babel','输出支援',84,'kr'],['cal','输出支援',80,'ca'],['FunnyAstro','战术支援',91,'gb']],
        VAL:[['Seeker','长枪输出',88,'us'],['NOS','弹道输出',78,'us'],['Krawi','坦克',79,'us'],['Cjay','输出支援',79,'us'],['Lyar','战术支援',81,'us'],['Paintbrush','战术支援',80,'us']],
        NYXL:[['FITS','长枪输出',91,'kr'],['Shockwave','长枪输出',86,'dk'],['Seicoe','弹道输出',87,'at'],['Kellan','坦克',87,'kr'],['Creative','输出支援',89,'kr'],['Aniyun','输出支援',78,'us'],['Ojee','战术支援',83,'us'],['Lep','战术支援',80,'us']],
        PAR:[['Dove','长枪输出',81,'us'],['Malthel','弹道输出',76,'us'],['KNIFE','弹道输出',84,'kr'],['Finale','弹道输出',82,'kr'],['Vulcan','坦克',76,'us'],['Toyou','坦克',83,'kr'],['irony','输出支援',82,'kr'],['Lukemino','输出支援',82,'us'],['Rakattack','战术支援',80,'us']],
        PHI:[['MN3','长枪输出',93,'kr'],['ZEST','弹道输出',95,'kr'],['Mag','坦克',91,'kr'],['Poko','坦克',84,'fr'],['skewed','输出支援',94,'kr'],['FiXa','战术支援',91,'kr'],['Hyunjae','战术支援',80,'kr']],
        SFS:[['Probe','长枪输出',84,'kr'],['Striker','长枪输出',86,'kr'],['Proper','弹道输出',97,'kr'],['HeeSang','弹道输出',87,'kr'],['Junbin','坦克',90,'kr'],['MAX','坦克',87,'kr'],['FiNN','输出支援',91,'kr'],['Renko','输出支援',80,'us'],['Vindaim','战术支援',84,'kr'],['Lukemino','战术支援',82,'us']],
        SEO:[['Prophet','长枪输出',81,'kr'],['Ezhan','长枪输出',83,'kr'],['Profit','弹道输出',93,'kr'],['SeonJun','弹道输出',81,'kr'],['Belosrea','坦克',84,'kr'],['Void','坦克',90,'kr'],['Krillin','战术支援',88,'kr'],['LeeSooMin','输出支援',80,'kr']],
        SHD:[['Heesu','长枪输出',88,'kr'],['Viper','弹道输出',86,'kr'],['Fleta','坦克',80,'kr'],['Fate','坦克',86,'kr'],['Gangnamjin','输出支援',86,'kr'],['BeBe','输出支援',80,'kr'],['Ir1s','战术支援',86,'kr']],
        TOR:[['Hydron','长枪输出',89,'us'],['Speedily','弹道输出',83,'us'],['s9mm','弹道输出',82,'us'],['Spectra','弹道输出',89,'kr'],['Coluge','坦克',89,'us'],['UltraViolet','输出支援',90,'us'],['SirMajed','输出支援',86,'sa'],['Ojee','战术支援',81,'us'],['OPENER','战术支援',83,'kr']],
        VAN:[['Aspire','长枪输出',87,'us'],['Sugarfree','弹道输出',94,'us'],['HeeSang','弹道输出',91,'kr'],['Punk','坦克',92,'au'],['Crimzo','输出支援',92,'ca'],['Faith','战术支援',91,'kr']],
        WAS:[['Flora','长枪输出',91,'kr'],['AlphaYi','弹道输出',93,'kr'],['BenBest','坦克',84,'fr'],['Mirror','坦克',89,'us'],['Teru','输出支援',89,'kr'],['FDGod','战术支援',88,'fr']]
      }
    };

    // 各年队伍强度只作为AI模拟基线；玩家的加入会通过实际阵容重新改变比赛概率。
    const V50_TEAM_STRENGTH={
      2019:{ATL:84,BOS:75,CDH:81,DAL:78,FLA:73,GZC:83,HZS:86,HOU:77,LDN:83,GLA:86,VAL:80,NYXL:90,PAR:78,PHI:82,SFS:93,SEO:83,SHD:82,TOR:76,VAN:92,WAS:76},
      2020:{ATL:84,BOS:71,CDH:84,DAL:78,FLA:89,GZC:87,HZS:83,HOU:74,LDN:76,GLA:87,VAL:86,NYXL:91,PAR:92,PHI:95,SFS:98,SEO:90,SHD:98,TOR:78,VAN:73,WAS:84},
      2021:{ATL:95,BOS:80,CDH:93,DAL:97,FLA:83,GZC:77,HZS:83,HOU:90,LDN:68,GLA:97,VAL:61,NYXL:78,PAR:85,PHI:87,SFS:90,SEO:87,SHD:99,TOR:84,VAN:68,WAS:86},
      2022:{ATL:89,BOS:82,CDH:81,DAL:99,FLA:90,GZC:79,HZS:93,HOU:92,LDN:89,GLA:98,VAL:78,NYXL:70,PAR:67,PHI:90,SFS:98,SEO:95,SHD:92,TOR:82,VAN:75,WAS:83},
      2023:{ATL:98,BOS:96,DAL:85,FLA:99,GZC:85,HZS:96,HOU:97,LDN:90,GLA:88,VAL:67,NYXL:80,PAR:64,PHI:91,SFS:82,SEO:79,SHD:69,TOR:85,VAN:87,WAS:82}
    };

    // franchise key 保持 short 不变，以免改名破坏存档引用。
    const V50_BASE_TEAM_META={};
    TEAMS.forEach(t=>V50_BASE_TEAM_META[t.short]={name:t.name,enName:t.enName||t.name,city:t.city,division:t.division,logo:t.logo,color:t.color});
    const V50_2023_REBRANDS={
      PAR:{name:'维加斯永生',enName:'Vegas Eternal',city:'拉斯维加斯',logo:'https://en.wikipedia.org/wiki/Special:FilePath/Vegas_Eternal_logo.svg',displayShort:'VEG'},
      PHI:{name:'首尔烈火',enName:'Seoul Infernal',city:'首尔',logo:'https://en.wikipedia.org/wiki/Special:FilePath/Seoul_Infernal_logo.svg',displayShort:'INF'},
      CDH:{active:false}
    };

    function v50WorldYear(year){return year<=2019?2019:year>=2023?2023:year;}
    function v50RosterEntriesFor(team,year=careerState.seasonYear||2019){
      if(!team)return [];
      const y=v50WorldYear(year);
      if(y===2019)return OWL2019_ROSTERS[team.enName||V50_BASE_TEAM_META[team.short]?.enName||team.name]||OWL2019_ROSTERS[V50_BASE_TEAM_META[team.short]?.enName]||[];
      return V50_OWL_ROSTERS[y]?.[team.short]||[];
    }
    historicalRosterEntries=function(team){return v50RosterEntriesFor(team,careerState.seasonYear||2019);};

    // 所有年份的国家/地区信息汇总；优先于旧版 Emoji 映射。
    const V50_COUNTRY_BY_NAME={};
    Object.values(V50_OWL_ROSTERS).forEach(year=>Object.values(year).forEach(list=>list.forEach(e=>{if(e[3])V50_COUNTRY_BY_NAME[e[0]]=e[3];})));
    const _v50OldCountryCode=v36CountryCode;
    v36CountryCode=function(name,isUser=false){
      if(isUser||name===getPlayerName())return state.playerCountry||'cn';
      return V50_COUNTRY_BY_NAME[name]||_v50OldCountryCode(name,false)||'kr';
    };

    function v50TeamMetaForYear(team,year){
      const base=V50_BASE_TEAM_META[team.short]||{};
      const y=v50WorldYear(year);
      const reb=(y===2023?V50_2023_REBRANDS[team.short]:null)||{};
      return {...base,...reb,strength:V50_TEAM_STRENGTH[y]?.[team.short]??team.strength??80,active:reb.active!==false,displayShort:reb.displayShort||team.short};
    }
    function v50ActiveTeams(){return TEAMS.filter(t=>t.active!==false);}
    function v50ApplySeasonWorld(year){
      const y=v50WorldYear(year);
      TEAMS.forEach(team=>{
        const meta=v50TeamMetaForYear(team,y);
        team.name=meta.name;team.enName=meta.enName;team.city=meta.city;team.division=meta.division;team.logo=meta.logo;team.color=meta.color;
        team.strength=meta.strength;team.active=meta.active;team.displayShort=meta.displayShort;
      });
      if(careerState.team){
        const current=TEAMS.find(t=>t.short===careerState.team.short)||careerState.team;
        careerState.team=current;
        if(careerState.contract)careerState.contract.teamName=current.name;
        matchState.homeTeam=current;
      }
      return y;
    }

    // 2023 成都退出联盟；2024+ 暂时使用2023世界作为架空延续基底，后续再单独接赛制/新联盟。
    function v50TeamActiveNextYear(team,nextYear){return v50TeamMetaForYear(team,nextYear).active!==false;}

    function v50RosterTransition(team,fromYear,toYear){
      const before=v50RosterEntriesFor(team,fromYear),after=v50RosterEntriesFor(team,toYear);
      const beforeNames=new Set(before.map(e=>e[0])),afterNames=new Set(after.map(e=>e[0]));
      const joined=after.filter(e=>!beforeNames.has(e[0])).map(e=>e[0]);
      const left=before.filter(e=>!afterNames.has(e[0])).map(e=>e[0]);
      return {fromYear,toYear,teamShort:team.short,joined,left,beforeCount:before.length,afterCount:after.length};
    }
    function v50StoreTransition(team,fromYear,toYear){
      careerState.lastRosterTransition=v50RosterTransition(team,fromYear,toYear);
    }

    // 历史选手ID带年份，避免跨年同名对象在调试时难以区分。
    historicalPlayer=function(entry,team,index=0){
      const [name,role,ovr]=entry,attrs=historicalAttributes(entry);
      return {id:`hist-${careerState.seasonYear}-${team.short}-${name}-${index}`,name,role,attrs,overall:ovr,color:team.color,isUser:false,historical:true,country:entry[3]||V50_COUNTRY_BY_NAME[name]||null};
    };

    // 2019创角只抽2019名单；生涯进入后再按年份切换，所以开局体验不被未来名单污染。
    const _v50GeneratePlayersBase=generatePlayers;
    generatePlayers=function(team){
      if(!careerState?.active && (careerState?.careerYears||1)<=1){
        const oldYear=careerState.seasonYear;careerState.seasonYear=2019;
        const result=_v50GeneratePlayersBase(team);careerState.seasonYear=oldYear||2019;return result;
      }
      return _v50GeneratePlayersBase(team);
    };

    // 28场赛程暂时保留当前游戏规则，但自动忽略已经退出联盟的队伍。
    buildOwl2019Schedule=function(){
      const me=careerState.team,all=v50ActiveTeams().filter(x=>x.name!==me.name),same=all.filter(x=>x.division===me.division),cross=all.filter(x=>x.division!==me.division);
      const first=shuffle([...all]).map(opponent=>({opponent,venue:Math.random()<.5?'home':'away',tag:'首次交手'}));
      const extrasNeeded=Math.max(0,28-first.length),weighted=shuffle([...same,...same,...cross,...all,...all]);
      const extras=[];for(let i=0;i<extrasNeeded;i++)extras.push({opponent:weighted[i%weighted.length]||pick(all),venue:Math.random()<.5?'home':'away',tag:'追加对局'});
      const pool=[...first,...extras];
      for(let i=1;i<pool.length;i++)if(pool[i].opponent?.name===pool[i-1].opponent?.name){const j=pool.findIndex((x,k)=>k>i&&x.opponent?.name!==pool[i-1].opponent?.name);if(j>i)[pool[i],pool[j]]=[pool[j],pool[i]];}
      seasonState.opponents=pool.slice(0,28).map(x=>x.opponent);seasonState.venues=pool.slice(0,28).map(x=>x.venue);seasonState.legs=pool.slice(0,28).map((x,i)=>`Stage ${Math.floor(i/7)+1} · ${x.tag}`);
    };

    // 排名和Stage表同样只纳入当季有效队伍。
    syntheticFinalStandings=function(){
      if(seasonState.finalStandingsCache)return seasonState.finalStandingsCache;
      const year=careerState.seasonYear||2019,rows=v50ActiveTeams().map(team=>{
        if(team.name===careerState.team?.name){const avg=seasonState.userRatings.reduce((a,b)=>a+b,0)/(seasonState.userRatings.length||1),md=Math.round((seasonState.wins-seasonState.losses)*2.4+(avg-7)*5);return{team,wins:seasonState.wins,losses:28-seasonState.wins,mapDiff:md,isUser:true};}
        const histBase=year===2019?OWL2019_BASE_WINS[team.name]:null;
        const base=histBase??Math.round(14+(team.strength-80)*.64),drift=stableSeasonNoise(team.name,year,year===2019?1:3),wins=clamp(base+drift,2,26),md=(year===2019?(OWL2019_BASE_MD[team.name]??(wins-14)*3):(wins-14)*3)+stableSeasonNoise(team.name,year+99,6);
        return{team,wins,losses:28-wins,mapDiff:md,isUser:false};
      }).sort((a,b)=>b.wins-a.wins||b.mapDiff-a.mapDiff||b.team.strength-a.team.strength);
      rows.forEach((r,i)=>r.rank=i+1);
      const atl=rows.filter(r=>r.team.division==='Atlantic')[0],pac=rows.filter(r=>r.team.division==='Pacific')[0],direct=[atl,pac].filter(Boolean).sort((a,b)=>a.rank-b.rank);
      for(const row of rows){if(direct.includes(row))continue;if(direct.length<6)direct.push(row);else break;}
      const directSet=new Set(direct.map(r=>r.team.name)),playIn=rows.filter(r=>!directSet.has(r.team.name)).slice(0,6);
      rows.forEach(r=>{r.divisionLeader=direct.slice(0,2).includes(r);r.direct=directSet.has(r.team.name);r.directSeed=r.direct?direct.findIndex(x=>x.team.name===r.team.name)+1:null;r.playIn=playIn.some(x=>x.team.name===r.team.name);});
      seasonState.finalStandingsCache=rows;return rows;
    };
    buildStageTable=function(stageNo){
      seasonState.stageTables=seasonState.stageTables||{};if(seasonState.stageTables[stageNo])return seasonState.stageTables[stageNo];
      const rec=stageRecord(stageNo),year=careerState.seasonYear||2019,rows=v50ActiveTeams().map(team=>{
        if(team.name===careerState.team?.name)return{team,wins:rec.wins,losses:7-rec.wins,mapDiff:(rec.wins-(7-rec.wins))*2+stableSeasonNoise(team.name,stageNo,2),isUser:true};
        const expected=3.5+(team.strength-80)*.12+stableSeasonNoise(team.name,year*10+stageNo,2)*.55,wins=clamp(Math.round(expected),0,7);
        return{team,wins,losses:7-wins,mapDiff:Math.round((wins-(7-wins))*2+stableSeasonNoise(team.name,stageNo+30,3)),isUser:false};
      }).sort((a,b)=>b.wins-a.wins||b.mapDiff-a.mapDiff||b.team.strength-a.team.strength);
      rows.forEach((r,i)=>r.rank=i+1);const atl=rows.filter(r=>r.team.division==='Atlantic')[0],pac=rows.filter(r=>r.team.division==='Pacific')[0],qualifiers=[atl,pac].filter(Boolean);
      for(const row of rows){if(qualifiers.includes(row))continue;if(qualifiers.length<8)qualifiers.push(row);else break;}const qset=new Set(qualifiers.map(r=>r.team.name));rows.forEach(r=>r.qualified=qset.has(r.team.name));seasonState.stageTables[stageNo]=rows;return rows;
    };
    stageEstimatedRank=function(stageNo){const mine=buildStageTable(stageNo).find(r=>r.isUser);return mine?.rank||v50ActiveTeams().length;};
    stageQualified=function(stageNo){return!!buildStageTable(stageNo).find(r=>r.isUser)?.qualified;};

    // 报价不向下一赛季已经退出联盟的队伍发出；其余逻辑保留V3.7三层适配模型。
    generateContractOffers=function(){
      const avg=seasonState.userRatings.length?seasonState.userRatings.reduce((a,b)=>a+b,0)/seasonState.userRatings.length:6.8,ovr=Number(getMyOvr()==='--'?78:getMyOvr()),rank=estimateSeasonRank(),post=playoffState.round==='champion'?2:playoffState.results.length?1:0;
      let count=avg>=8.2||post===2?5:avg>=7.65||rank<=6?4:avg>=7.0||rank<=12?3:avg>=6.35?2:1;count=clamp(count+rand(-1,1),1,5);
      const market=ovr*.62+avg*4.2+(21-rank)*.35+post*7+careerState.popularity*.05,renewalTeam=careerState.team,renewalTactic=careerState.tactic||pick(TACTICS),nextYear=careerState.seasonYear+1;
      const eligible=v50ActiveTeams().filter(t=>t.name!==renewalTeam.name&&v50TeamActiveNextYear(t,nextYear));
      const externalPool=eligible.map(team=>{const tactic=pick(TACTICS),teamPower=Math.round(careerLikeTeamPower(team)),fitBreakdown=v37SystemFit(team,tactic,state.role),interest=fitBreakdown.total*.45+fitBreakdown.rosterNeed*.30+(market-teamPower)*.18+randomCentered(6);return{team,tactic,teamPower,fitBreakdown,interest};}).sort((a,b)=>b.interest-a.interest);
      const proposals=[];
      if(v50TeamActiveNextYear(renewalTeam,nextYear))proposals.push({team:renewalTeam,tactic:renewalTactic,teamPower:Math.round(careerLikeTeamPower(renewalTeam)),fitBreakdown:v37SystemFit(renewalTeam,renewalTactic,state.role),renewal:true});
      proposals.push(...externalPool.slice(0,Math.max(1,count-proposals.length)).map(x=>({...x,renewal:false})));
      offseasonState.offers=proposals.slice(0,Math.max(1,count)).map((p,index)=>{const{team,tactic,teamPower,fitBreakdown}=p,renewal=!!p.renewal,fit=fitBreakdown.total,years=rand(1,3),salary=Math.max(8,Math.round((market-55)*.8+(teamPower-78)*.6+fit*.05+rand(-3,5))),starterScore=ovr*.45+fitBreakdown.personal*.20+fitBreakdown.rosterNeed*.25+(avg-7)*8-Math.max(0,teamPower-82)*.40+rand(-3,3),rolePromise=starterScore>=88?'核心首发':starterScore>=80?'稳定首发':starterScore>=71?'首发竞争':'轮换选手';return{id:`offer-${index}-${Date.now()}-${Math.random()}`,team,renewal,tactic,fit,fitBreakdown,years,salary,rolePromise,teamPower,starterScore,note:v37OfferNote(renewal,fitBreakdown,teamPower)};});
    };

    // 跨年顺序修正：先进入新年份、加载真实世界，再建立新赛季阵容。
    continueExistingContract=function(){
      const team=careerState.team,fromYear=careerState.seasonYear,toYear=fromYear+1;
      offseasonState.contractContinued=true;offseasonState.signedOffer=null;v50StoreTransition(team,fromYear,toYear);
      careerState.seasonYear=toYear;careerState.careerYears+=1;v50ApplySeasonWorld(toYear);
      if(!careerState.team.active){
        careerState.contract.remaining=0;offseasonState.contractExpired=true;offseasonState.contractContinued=false;offseasonState.phase='contract';generateContractOffers();renderOffseason();return;
      }
      const status=v32RebuildLineup(careerState.team,null,true);if(careerState.contract)careerState.contract.rolePromise=status.label;
      seasonState.active=false;seasonState.baseLocked=null;resetPlayoffState();offseasonState.phase='signed';renderCareerTeam();renderOffseason();
    };
    applyTeamFromOffer=function(offer){
      const fromYear=careerState.seasonYear,toYear=fromYear+1,oldTeam=careerState.team,newTeam=offer.team;
      v50StoreTransition(newTeam,fromYear,toYear);careerState.team=newTeam;careerState.contract={years:offer.years,remaining:offer.years,salary:offer.salary,rolePromise:offer.rolePromise,teamName:newTeam.name};careerState.contractTickYear=null;careerState.tactic=offer.tactic;
      careerState.seasonYear=toYear;careerState.careerYears+=1;v50ApplySeasonWorld(toYear);
      const nextMeta=v50TeamMetaForYear(careerState.team,toYear);careerState.rank=clamp(Math.round(11-(nextMeta.strength||80)*.08+rand(-1,1)),2,10);careerState.goal=(nextMeta.strength||80)>=85?'争夺联赛冠军':(nextMeta.strength||80)>=80?'冲击季后赛':'完成阵容磨合';matchState.homeTeam=careerState.team;
      v32RebuildLineup(careerState.team,offer.rolePromise,false);careerState.contract.rolePromise=offer.rolePromise;
      // 真正转会才重建关系；同一franchise续约/改名不清零。
      if(oldTeam?.short!==careerState.team.short){careerState.coachTrust=clamp(48+rand(-6,10),35,68);careerState.teammateBond=clamp(48+rand(-7,10),34,68);}
      seasonState.active=false;seasonState.baseLocked=null;resetPlayoffState();renderCareerTeam();
    };

    // 2022成都休赛期：队伍下一年退出联盟时，合同自动终止并进入自由市场。
    const _v50RenderContractMarketBase=renderContractMarket;
    renderContractMarket=function(wrap){
      const nextYear=careerState.seasonYear+1;
      if(!v50TeamActiveNextYear(careerState.team,nextYear)&&!offseasonState.franchiseExitHandled){
        offseasonState.franchiseExitHandled=true;offseasonState.contractExpired=true;if(careerState.contract)careerState.contract.remaining=0;generateContractOffers();
      }
      _v50RenderContractMarketBase(wrap);
      if(offseasonState.franchiseExitHandled&&!wrap.querySelector('.v50-franchise-exit'))wrap.insertAdjacentHTML('afterbegin',`<div class="v50-franchise-exit"><strong>联盟变动</strong><p>${careerState.team.name} 将不会参加 ${nextYear} 赛季，你的剩余合同因此终止，本休赛期直接进入自由市场。</p></div>`);
    };

    // 签约完成页补一张“新赛季真实阵容变动”，让跨年不是后台偷偷换名单。
    const _v50RenderSigningCompleteBase=renderSigningComplete;
    renderSigningComplete=function(wrap){
      _v50RenderSigningCompleteBase(wrap);
      const t=careerState.lastRosterTransition;if(!t||wrap.querySelector('.v50-roster-transition'))return;
      const joined=t.joined.slice(0,8),left=t.left.slice(0,8),era=careerState.seasonYear<=2023?'真实OWL历史赛季':'架空延续赛季';
      const title=careerState.seasonYear===2023&&careerState.team.short==='PHI'?'费城融合迁往首尔并更名为首尔烈火':careerState.seasonYear===2023&&careerState.team.short==='PAR'?'巴黎永生迁往拉斯维加斯并更名为维加斯永生':`${careerState.seasonYear} 阵容已经更新`;
      const card=`<div class="v50-roster-transition"><div class="offseason-kicker">${careerState.seasonYear} · ${era}</div><h4>${title}</h4><div class="v50-transition-grid"><div><span>新加入 / 回归</span><strong>${joined.length?joined.join(' · '):'核心阵容延续'}</strong></div><div><span>离队 / 不在当季名单</span><strong>${left.length?left.join(' · '):'暂无主要离队'}</strong></div></div><p>阵容已切换为 ${careerState.seasonYear} 赛季名单。</p></div>`;
      const btn=wrap.querySelector('#viewNewRosterBtn');if(btn)btn.insertAdjacentHTML('beforebegin',card);else wrap.insertAdjacentHTML('beforeend',card);
    };

    // 战队简称在2023改名后用新品牌缩写；内部 franchise key 仍保持原 short。
    const _v50TeamLogoMarkupBase=teamLogoMarkup;
    teamLogoMarkup=function(team,alt=''){
      if(!team)return _v50TeamLogoMarkupBase(team,alt);
      const safe=(alt||team.name).replace(/"/g,'&quot;'),abbr=team.displayShort||team.short;
      return `<img class="owl-logo-img" src="${team.logo}" alt="${safe}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="team-logo-fallback">${abbr}</span>`;
    };

    // 奖项候选池现在来自“当前年份真实名单”，而不是永远用2019选手。
    buildRegularAwardLeaguePool=function(){
      const pool=[];v50ActiveTeams().forEach(team=>historicalRosterEntries(team).forEach((e,i)=>{const[name,role,ovr]=e;pool.push({id:`ai-${careerState.seasonYear}-${team.short}-${name}`,isUser:false,name,team:team.name,role,rating:clamp(6.35+(ovr-78)*.095+(team.strength-80)*.022+randomCentered(.34),5.8,9.55),ovr,wins:clamp(Math.round(14+(team.strength-80)*.75+rand(-3,3)),3,26),popularity:clamp(30+(ovr-78)*3+rand(-12,12),10,98),rookie:false,roleQuality:ovr});}));
      const rookieClass={
        2019:['Haksal','guxue','Corey','DDing','Erster','Happy','shu','Masaa','Diem','Decay','GodsB','JinMu'],
        2020:['Alarm','ANS','LIP','LeeJaeGon','Hanbin','Sp9rk1e','Xzi','Yaki','Gangnamjin','FDGod'],
        2021:['Pelican','Leave','Shy','Mmonk','Mag','Kaan','Faith','Valentine'],
        2022:['Proper','ZEST','MN3','AlphaYi','Hydron','SOMEONE','Reiner','ChiYo','Ojee'],
        2023:['D0NGHAK','Sugarfree','Junbin','MAX','Viper','Bliss','Prophet']
      }[careerState.seasonYear]||[];
      const rookieSet=new Set(rookieClass);pool.forEach(p=>p.rookie=rookieSet.has(p.name));pool.push(getSeasonUserAwardProfile());return pool;
    };

    // 生涯/赛季页显示当前历史年份状态。
    const _v50RenderSeasonBase=renderSeason;
    renderSeason=function(){
      _v50RenderSeasonBase();
      const league=document.getElementById('seasonLeagueText');if(league&&careerState.seasonYear>=2020)league.innerHTML=`守望先锋联赛 · ${careerState.seasonYear} 历史阵容 · Stage ${currentStageNumber()}`;
    };
    const _v50RenderCareerTeamBase=renderCareerTeam;
    renderCareerTeam=function(){
      _v50RenderCareerTeamBase();
      const meta=document.getElementById('careerContractMeta');if(meta&&careerState.team)meta.textContent=`守望先锋联赛 · ${careerState.seasonYear} · ${careerState.contract?`${careerState.contract.years}年合同 · 剩余${careerState.contract.remaining}年 · 年薪${careerState.contract.salary}万 · ${careerState.contract.rolePromise}`:'合同待定'} · 季前排名第${careerState.rank}`;
    };

    // 初始化/载入当前年份世界。正常新角色仍从2019开始。
    v50ApplySeasonWorld(careerState.seasonYear||2019);




