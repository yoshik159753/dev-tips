# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

開発者向けTipsを集約したドキュメントサイト。11ty (Eleventy) で AsciiDoc を HTML に変換して静的サイトを生成する。テストやリンタは無い。

## コマンド

```bash
# 開発サーバーの起動 (ホットリロード付き)
npm run dev

# _site を削除してから開発サーバーを起動 (クリーンビルドしたいとき)
sh run.sh dev

# 静的サイトのビルド (出力先: _site/)
npm run build
```

## アーキテクチャ

### ビルドフロー

- 入力は `src/`、出力は `_site/` (Git管理外)。`src/{category}.adoc` → `_site/{category}/index.html`
- **`src/articles/` は `.eleventyignore` でビルド対象外**。個別記事は単独ページにはならず、カテゴリページから `include::` されて初めて出力に含まれる。この `include` を許可するため Asciidoctor のセーフモードを `unsafe` に設定している (eleventy.config.js)
- 各ページは YAML Front Matter で `layout` を指定し、AsciiDoc の文書タイトル (`= ...`) がレイアウトの `{{ title }}` に入る

### コンテンツの2パターン

1. **include型**: `src/nix.adoc`, `python.adoc`, `php.adoc`, `vue.adoc`, `unittest-cheatsheet.adoc` — `include::articles/{category}/{article}.adoc[]` で `src/articles/{category}/` 配下の個別記事を統合する
2. **直接記述型**: `src/tips.adoc`, `ubuntu.adoc`, `5w2h.adoc` など — カテゴリページに直接コンテンツを書く

### レイアウトと目次生成

- `src/_includes/layouts/index.njk`: トップページ (`src/index.adoc`) 用。目次なし
- `src/_includes/layouts/contents.njk`: コンテンツページ用。`asciidocToc` フィルタで左サイドバーの目次を生成し、highlight.js と Font Awesome を CDN から読み込む
- `plugins/eleventy-plugin-asciidoc-toc/`: 自作の目次生成プラグイン。Asciidoctor が出力する sect1/sect2/sect3 の `<div>` ネスト構造を cheerio で走査し、h2〜h4 (`==` 〜 `====`) から階層的な目次を作る `asciidocToc` フィルタを登録する

## コンテンツ追加の規約

- **個別記事** (`src/articles/{category}/*.adoc`): Front Matter は書かない。カテゴリページに include される前提なので、文書タイトル (`= `) ではなく `== ` (h2) の見出しから始める
- **新しい記事**: ファイル作成後、対応するカテゴリページに `include::articles/{category}/新ファイル.adoc[]` を追加する
- **新しいカテゴリ**: `src/{category}.adoc` を作成して Front Matter で `layout: "layouts/contents.njk"` を指定し、さらに `src/index.adoc` のリンク一覧に `link:/{category}[...]` を追加する (トップページは手動管理のリンク集)
- カテゴリページ共通の AsciiDoc 属性: `:icons: font` (Font Awesomeアイコン)、`:source-highlighter: highlightjs`、`:prewrap!:` (コードの自動折り返し無効)
