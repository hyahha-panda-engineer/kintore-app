# AI エージェント作業ガイドライン (Agent Guidelines)

本プロジェクト（筋トレ記録アプリ）で作業を行う AI エージェント用の指示・ルールブックです。
詳細は [GEMINI.md](file:///C:/Users/pyana/udd/toto/50_kintore/GEMINI.md) または [docs/design_memo.md](file:///C:/Users/pyana/udd/toto/50_kintore/docs/design_memo.md) を参照してください。

---

## 1. プロジェクト概要

- **名称**: 筋トレ記録アプリ (`50_kintore`)
- **フロントエンド (`index.html`)**: HTML/CSS/Vanilla JS 単一ファイル（ダークテーマ・モバイル最適化）
- **バックエンド (`gas_side/gas.js`)**: Google Apps Script (Web App)
- **データベース**: Google スプレッドシート (`Settings` / `Logs`)
- **ホスティング**: GitHub Pages (`master` ブランチへのプッシュで自動デプロイ)

---

## 2. コミットルール (必須)

エージェントが変更（コード、ドキュメント、設定等）を行った際は、以下のルールに従って**作業単位ごとにコミットを作成**すること。

1. **コミットのタイミング**:
   - 作業完了時や区切りごとに必ずコミットする（放置しない）。
2. **コミット前確認**:
   - `git status` / `git diff` で差分を確認し、`.gitignore` 対象（`memo.txt` など）が含まれていないかチェックする。
3. **コミットメッセージ命名規則**:
   - `feat: <機能追加>`
   - `fix: <バグ修正>`
   - `docs: <ドキュメント整備>`
   - `style: <見た目・UI調整>`
   - `refactor: <リファクタリング>`
4. **push の扱い**:
   - `master` への push は本番反映（GitHub Pages 自動デプロイ）を伴うため、push はユーザーの確認・指示を受けてから実行する。
