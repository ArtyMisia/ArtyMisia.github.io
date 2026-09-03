# Portfolio site

Google Drive上のMarkdownから抽出・確認した実績を掲載する、Eugene / ArtyMisiaの静的ポートフォリオサイトです。

## 確認方法

このフォルダでローカルWebサーバーを起動し、次のURLを開きます。

- 公開版: `http://localhost:8000/`
- Poker向け: `http://localhost:8000/?mode=poker`
- Video向け: `http://localhost:8000/?mode=video`
- Tech向け: `http://localhost:8000/?mode=tech`

## 公開前の更新

公開サイトでは `portfolio.json` が正本です。公開確認前の候補データはリポジトリ外で管理し、一次証拠のない順位、人数、「世界初」などの表現は公開しません。

## 実績スロット番号

スロット番号は実績ごとの固定番号です。新しい実績は末尾の未使用番号へ追加し、既存実績は並べ替えや追加のたびに採番し直しません。`09`は永久欠番として予約し、表示上は常に最後へ置きます。次に追加できる番号は`12`です。

- `01` FPS学院
- `02` Lesath
- `03` Project LUNA
- `04` POAMY
- `05` Delta DQ9
- `06` FretMapper
- `07` GAS Sheet Server BYOK
- `08` SCIENTIA Horologium Perpetuum
- `09` NULL（永久欠番）
- `10` Rhythm Chain
- `11` リリバーシ

GitHub Pages: https://artymisia.github.io/

## SCIENTIA Horologium Perpetuum

独立作品「SCIENTIA Horologium Perpetuum」の従来版静的ビルドを `horologium/` 配下へ収録し、最新版を独立したGitHub Pages作品として公開しています。金庫左上の`SCIENTIA EST ARMA`紋章からは、従来版の時計専用ページと総合実績金庫を歯車式トランジションで往復できます。`MECHANISM 08`の外部サイトボタンからは、正確な歯数比、204個の可動輪、階層型9軸ジャイロ調速機、永久カレンダー、宝石オーラリーを備えた最新版を開きます。金庫側の小型`O/D`ラチェットは、ページ移動とは独立した主動力スイッチです。

- エクスポート元: `digital-mechanical-watch`
- エクスポート元コミット: `c4100c2`
- ポートフォリオ内の入口: `MECHANISM 08`
- 最新版: https://eugenenumata.github.io/scientia-horologium/
- 最新版ソース: https://github.com/EugeneNumata/scientia-horologium
- ローカルURL: `http://localhost:8000/horologium/`
- アセット出典: `horologium/ASSET_LICENSES.md`
