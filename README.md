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

GitHub Pages: https://artymisia.github.io/

## ブランチ限定作品

`feature/scientia-horologium` ブランチには、独立作品「SCIENTIA Horologium Perpetuum」の静的ビルドを `horologium/` 配下へ収録しています。

- エクスポート元: `digital-mechanical-watch`
- エクスポート元コミット: `2af530c`
- ポートフォリオ内の入口: `MECHANISM 12`
- ローカルURL: `http://localhost:8000/horologium/`

このブランチを作成しただけでは公開中の `main` とGitHub Pagesは変わりません。公開する場合は、内容を確認してから明示的にpushまたはmergeします。
