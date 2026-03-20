# pick-one
2択から一つを選択するアプリ

> サイト訪問者が2つのカードから1つを選ぶだけのシンプルな投票アプリ。おしゃれなダークUI、リアルタイムな投票結果表示付き。

![Pick One Screenshot](https://github.com/user-attachments/assets/3fef8aae-b939-4167-ae7b-432e30f5a6d1)

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | React Router v7 (SSR / フレームワークモード) |
| UI | React 18, TailwindCSS v4, Lucide React |
| 言語 | TypeScript |
| ORM | Prisma v6 |
| DB | PostgreSQL |
| ビルド | Vite |
| パッケージ管理 | pnpm |

## セットアップ

### 前提条件

- Node.js 20+
- pnpm
- PostgreSQL

### インストール

```bash
# 依存パッケージのインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .env を編集して DATABASE_URL を設定

# Prisma クライアントの生成
pnpm db:generate

# データベースのマイグレーション
pnpm db:push

# 初期データの投入 (オプション)
pnpm db:seed
```

### 開発サーバーの起動

```bash
pnpm dev
# http://localhost:5173
```

### プロダクションビルド

```bash
pnpm build
pnpm start
# http://localhost:3000
```

## デプロイ (Vercel)

1. [Vercel](https://vercel.com) にリポジトリをインポート
2. 環境変数 `DATABASE_URL` を設定 (Vercel Postgres / Neon / Supabase など)
3. ビルドコマンド: `pnpm build`
4. 出力ディレクトリ: `build/client`
5. デプロイ！

## 機能

- 🗳️ **2択投票** — 2つのカードから1つをクリックして投票
- 📊 **結果表示** — 投票後にリアルタイムで票数とパーセンテージを表示
- 🍪 **重複防止** — セッションCookieで1人1票を管理
- 🌙 **ダークUI** — グラデーション背景、グローエフェクト付きのおしゃれなデザイン
- 🔄 **SSR対応** — React Router v7 フレームワークモードによるサーバーサイドレンダリング

