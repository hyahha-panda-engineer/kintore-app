# プロジェクト概要・開発方針

本プロジェクト（筋トレ記録アプリ）の基本構成と開発方針です。

---

## 1. プロジェクト概要

- **名称**: 筋トレ記録アプリ (`50_kintore`)
- **目的**: スマートフォンから素早く・手軽にトレーニング記録・振り返りができる軽量Webアプリ
- **全体構成**:
  - **フロントエンド (`index.html`, `css/style.css`, `js/app.js`)**: HTML5 / CSS3 / Vanilla JavaScript の分離構成（外部ライブラリ非依存、ダークテーマ、モバイル最適化）。
  - **バックエンド (`gas_side/gas.js`)**: Google Apps Script (Web App)。
  - **データベース**: Google スプレッドシート (`Settings` シート: 種目マスター、`Logs` シート: 実績データ)。
  - **ホスティング**: GitHub Pages (`.github/workflows/static.yml` により `master` ブランチ反映で自動デプロイ)。
- **詳細設計ドキュメント**: [docs/design_memo.md](file:///C:/Users/pyana/udd/toto/50_kintore/docs/design_memo.md)

---

## 2. 開発・実装ルール

1. **軽量・シンプル構成の維持**:
   - フロントエンドは CDN や重いビルド環境を追加せず、素のJavaScript（Vanilla JS）とCSSによる軽快さを維持すること。
   - モバイルファーストで設計されており、スマホ画面でのタップ領域や操作感を最優先する。
2. **GAS連携・CORS考慮**:
   - GAS Web App との POST 通信は、ブラウザの CORS プリフライト（OPTIONS）制限を回避するため `Content-Type: text/plain;charset=utf-8` を使用し、ボディに JSON 文字列を載せています。通信仕様を変更する際は注意すること。
3. **機密情報の保護**:
   - スプレッドシートURLや `memo.txt`、GAS の実行URLなどのプライベートな情報はGitにコミットしない（`.gitignore` 遵守）。
