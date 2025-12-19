# 非鉄金属ポジション損益シミュレーター（Next.js版）

非鉄金属（錫）のLMEポジション損益シミュレーションMVPをNext.jsで実装したWebアプリケーションです。

## 技術スタック

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Plotly.js** (可視化)
- **xlsx** (Excelファイル読み込み)

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 3. ビルド

```bash
npm run build
npm start
```

## AWS Amplify へのデプロイ

### 1. Amplifyコンソールで設定

1. AWS Amplifyコンソールにアクセス
2. 「新しいアプリ」→「GitHubからホスト」を選択
3. リポジトリを選択
4. ビルド設定は `amplify.yml` が自動的に使用されます

### 2. 手動デプロイ

```bash
# Amplify CLIをインストール（初回のみ）
npm install -g @aws-amplify/cli

# Amplifyプロジェクトを初期化
amplify init

# ホスティングを追加
amplify add hosting

# デプロイ
amplify publish
```

## 機能

### Tab1: 限月別P/L
- 各限月の損益計算と表示
- Hold戦略とActual戦略のP/L比較
- 限月別P/L比較グラフ

### Tab2: Spread分析
- Cash-3M間のSpread分析
- Spread変動とSpread P/L計算
- Spread推移グラフ

### Tab3: 戦略比較
- Hold vs Actual戦略の総合比較
- ウォーターフォールチャート
- 限月別内訳テーブル

### Tab4: 限月間P/L寄与分析
- 限月ペア間のスプレッド損益ヒートマップ
- Actual/Hold/差分の3つの戦略を選択可能

## データ形式

Excelファイルには以下の2つのシートが必要です：

1. **価格シート**: Prompt列と日付列（例: 1月末、2月末）
2. **数量シート**: Prompt列と日付列（例: 1月末、2月末）

## ライセンス

MIT

