# 麻雀スコア管理

3人麻雀のリーグ戦スコアを管理するGoogle Apps Scriptアプリです。

## ファイル構成

```
├── コード.gs          # メインのサーバーサイド（doGet, saveToSheet, loadFromSheet）
├── index.html         # フロントエンド（スコア入力・集計・グラフ表示）
├── Import.gs          # スコア一括インポート用スクリプト
├── appsscript.json    # GASマニフェスト
└── .clasp.json        # claspの設定（スクリプトIDを記入してください）
```

## セットアップ

### 1. スクリプトIDの設定

`.clasp.json` を開き、`scriptId` にGASプロジェクトのスクリプトIDを入力してください。

スクリプトIDの確認方法：GASエディタ → 歯車アイコン（プロジェクトの設定）→ スクリプトID

### 2. GitHub Secretsの設定

自動デプロイを使う場合、以下のSecretを登録してください。

- **名前**: `CLASP_CREDENTIALS`
- **値**: ローカルで `clasp login` 後に生成される `~/.clasprc.json` の中身

登録場所：GitHubリポジトリ → Settings → Secrets and variables → Actions

### 3. 自動デプロイ

`main` ブランチにpushすると、GitHub Actionsが自動でGASにデプロイします。

## 手動デプロイ（ローカルから）

```bash
npm install -g @google/clasp
clasp login
clasp push
```

## 機能

- シーズン管理（新規作成・アーカイブ）
- スコア入力・修正
- トータル成績・順位表示
- 推移グラフ
- 通算データ分析（レーダーチャート）
- チップ貯金管理
