function runImportAutumn2025() {
  // 1. AutumnCup2025 の設定
  const CONFIG = {
    totalGames: 20,  // 全20戦予定
    startPt: 50000,
    returnPt: 50000, // オカなし
    uma: [20, 0, -20],
    rules: {
        red: "2枚",
        flower: "なし",
        north: "なし",
        other: "表ドラ2枚" // その他のルールに追加
    }
  };

  // 2. AutumnCup2025 のデータテキスト（頂いた6戦分）
  const rawText = `
松下	27,200	野田	-5,000	青木	〇127800
松下	37,000	野田	38,000	青木	75,000
松下	56,000	野田	35,800	青木	58,200
松下	-2,000	野田	〇88000	青木	64,000
松下	60,000	野田	-2,000	青木	92,000
松下	60,000	野田	47,000	青木	43,000
  `;

  // ============================================
  // 3. 既存データの読み込みとアーカイブ処理
  // ============================================
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const json = sheet.getRange('A1').getValue();
  let appData = { current: { active: false }, archives: [] };

  if (json && json !== "") {
    appData = JSON.parse(json);
  }

  // 現在進行中のシーズンがあればアーカイブに移動
  if (appData.current && appData.current.active) {
    const oldSeason = appData.current;
    
    // アーカイブ用にスタッツ計算（連対率なども含む）
    const stats = calculateStats(oldSeason.games);
    
    const archiveData = {
      name: oldSeason.name,
      date: new Date().toLocaleDateString(),
      gamesCount: oldSeason.games.length,
      config: oldSeason.config,
      stats: stats,
      games: oldSeason.games
    };
    
    if (!appData.archives) appData.archives = [];
    appData.archives.unshift(archiveData);
    Logger.log("前のシーズン(" + oldSeason.name + ")をアーカイブに移動しました。");
  }

  // ============================================
  // 4. 新データのパースと設定
  // ============================================
  const finalGames = [];
  const lines = rawText.trim().split('\n');
  
  for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;
      
      const gameId = i + 1;
      const scores = [0, 0, 0];
      const busts = [0, 0, 0];

      // 正規表現でのパース
      // 〇の直後に数字が来ても大丈夫なように \s* (スペース0個以上) に対応
      const regex = /松下\s+(?:(〇)\s*)?(-?[\d,]+)\s+野田\s+(?:(〇)\s*)?(-?[\d,]+)\s+青木\s+(?:(〇)\s*)?(-?[\d,]+)/;
      const match = line.replace(/,/g, '').match(regex);

      if (match) {
          scores[0] = parseInt(match[2]);
          scores[1] = parseInt(match[4]);
          scores[2] = parseInt(match[6]);

          // 飛び判定 (0点以下)
          let flyCount = scores.filter(s => s <= 0).length;

          if (match[1] === '〇') busts[0] = flyCount;
          if (match[3] === '〇') busts[1] = flyCount;
          if (match[5] === '〇') busts[2] = flyCount;
      }
      
      const pts = calculatePoints(scores, busts, CONFIG);

      finalGames.push({
            id: Date.now().toString() + "_" + gameId,
            displayId: gameId,
            rawScores: scores,
            busts: busts,
            finalPts: pts
      });
  }

  // 5. 新しいシーズンをセット
  appData.current = {
      active: true,
      name: "AutumnCup2025",
      config: CONFIG,
      games: finalGames
  };

  // 6. 保存
  sheet.getRange('A1').setValue(JSON.stringify(appData));
  Logger.log("AutumnCup2025 を開始しました！(現在" + finalGames.length + "戦)");
}

// --------------------------------------------
// 共通計算ロジック
// --------------------------------------------
function calculatePoints(rawScores, bustCounts, config) {
    const indices = [0, 1, 2].sort((a, b) => rawScores[b] - rawScores[a]);
    const finalPts = [0, 0, 0];
    const { returnPt, uma } = config;

    indices.forEach((pIdx, rank) => {
        let pt = (rawScores[pIdx] - returnPt) / 1000;
        pt += uma[rank];
        // オカなしのためトップ賞加算なし
        if(bustCounts) pt += (bustCounts[pIdx] * 10);
        if(rawScores[pIdx] <= 0) pt -= 10;
        finalPts[pIdx] = Math.round(pt * 10) / 10;
    });
    return finalPts;
}

function calculateStats(games) { // アーカイブ移動用
    const PLAYERS = ["松下", "野田", "青木"];
    let stats = PLAYERS.map(name => ({ name: name, total: 0, ranks: [0,0,0], gameCount: 0 }));
    games.forEach(g => {
        const pIds = [0,1,2].sort((a,b) => g.rawScores[b] - g.rawScores[a]);
        g.finalPts.forEach((pt, idx) => {
            stats[idx].total += pt;
            stats[idx].gameCount++;
            stats[idx].ranks[pIds.indexOf(idx)]++;
        });
    });
    return stats.map(s => {
        s.total = parseFloat(s.total.toFixed(1));
        s.rentai = s.gameCount > 0 ? ((s.ranks[0] + s.ranks[1]) / s.gameCount * 100).toFixed(1) + '%' : '-';
        s.lastAvoid = s.gameCount > 0 ? ((s.gameCount - s.ranks[2]) / s.gameCount * 100).toFixed(1) + '%' : '-';
        s.avgRank = s.gameCount > 0 ? ((s.ranks[0]*1 + s.ranks[1]*2 + s.ranks[2]*3) / s.gameCount).toFixed(2) : "-";
        return s;
    }).sort((a,b) => b.total - a.total);
}