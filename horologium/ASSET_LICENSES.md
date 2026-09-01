# Asset licenses

## `public/scientia-emblem.png`

- 作品名: `SCIENTIA EST ARMA` emblem
- 権利者: Eugene Numata（ユーザー本人）
- 用途: 馬蹄型時計ケース上部の紋章
- 備考: ユーザーが本セッションで自身の著作物であることを明示した素材。第三者向けライセンスは付与しない。

## `public/gear-metal-texture.jpg`

- 写真: “Cogs and gears”
- 撮影者: Tim Mossholder
- 配布元: Unsplash
- Source: https://unsplash.com/photos/cogs-and-gears-GmvH5v9l3K4
- License: https://unsplash.com/license
- 用途: 機能歯車の歯面内へクリップする金属テクスチャ
- 加工: 表示用リサイズ、SVGパターン化、色調補正

この写真を独立した背景や装飾歯車としては使用しない。シミュレーション上の伝達経路を持つ歯車形状の内部質感に限定する。

## `public/sapphire-gem.jpg`

- 作品名: “Sapphire Gem”
- 撮影者: Sapphiredge
- 配布元: Wikimedia Commons
- Source: https://commons.wikimedia.org/wiki/File:Sapphire_Gem.jpg
- License: CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/)
- 用途: 地球オーラリーのサファイア球体表現
- 加工: 円形クリップ、色調・コントラスト調整、ファセット線と光沢の合成

表示用に加工した`public/sapphire-gem.jpg`およびその表示上の派生表現は、原素材と同じCC BY-SA 3.0で利用できます。帰属表示は本ファイルに集約し、原作者による本作品への推奨・承認を意味しません。

## `public/gear-assets/*.svg`

- 作品名: SCIENTIA exact-tooth ornamental gear library
- 権利者: Eugene Numata
- 生成方法: `scripts/generate-gear-assets.mjs`が、20度圧力角・正規化モジュール1の歯形と指定歯数から決定論的に生成
- 内容: 37種類の歯数、金・鋼・青焼き・ローズの4材質、合計148点
- 備考: ユーザー提供の参考画像から、段付きリム、装飾スポーク、金属の明暗構成という一般的な造形要素だけを参照したオリジナル画像素材。参考画像そのもの、透かし、ロゴ、画素、装飾トレースは収録しない。

各SVGでは`data-teeth`と可視歯を作る`#tooth`参照数が一致する。時計側はこの画像外周を見た目に用い、回転比、中心距離、位相は従来どおり機構モデルの整数歯数から計算する。

## NASA/JPLの静的データ

- `public/data/comet-candidates.json`: NASA/JPL SBDB Query APIから生成
- `public/data/comets-tokyo.json`: NASA/JPL Horizons Observer Ephemerisから生成
- 用途: 彗星の軌道・東京からの幾何学的観測窓の表示
- 備考: API応答を加工した静的スナップショット。NASA/JPLによる本作品への推奨・承認を意味しない。
