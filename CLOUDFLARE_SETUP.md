# Cloudflare Workers セットアップガイド
## 動的OGP対応で画像付きSNSシェアを実現

## 📋 概要

Cloudflare Workersを使って、URLパラメータに応じてOGP画像を出し分けます。
これにより、SNS（X/LINE/Instagram等）でシェア時に、結果のレーティング画像が自動的に表示されます。

**シェアURL例:**
- `https://your-domain.com/?result=rainbow` → 虹の画像
- `https://your-domain.com/?result=gold` → 金の画像

## 🚀 セットアップ手順

### ステップ1: Cloudflareアカウント作成

1. https://dash.cloudflare.com/sign-up にアクセス
2. メールアドレスで無料アカウント作成
3. メール認証を完了

### ステップ2: サイトをCloudflareに追加

1. **「Add a Site」をクリック**
2. **ドメインを入力**
   - 独自ドメインを持っている場合: そのドメインを入力
   - 独自ドメインなし: `workers.dev`の無料サブドメインを使用（後述）

#### オプションA: 独自ドメインがある場合

3. **プランを選択**: 「Free」プランを選択
4. **DNSレコードをスキャン**: 自動的にスキャンされます
5. **ネームサーバーを変更**:
   - Cloudflareが提供するネームサーバー2つをコピー
   - ドメイン管理画面（お名前.com、ムームードメイン等）でネームサーバーを変更
   - 反映まで最大24時間（通常は数時間）

#### オプションB: 独自ドメインがない場合

3. Workers経由で`*.workers.dev`の無料サブドメインを使用
4. この場合、ステップ4に直接進む

### ステップ3: Workersスクリプトをデプロイ

1. **Cloudflare Dashboard → Workers & Pages**
2. **「Create Application」→「Create Worker」**
3. **Worker名を入力**: 例 `pachinkas-uranai`
4. **「Deploy」をクリック**
5. **「Edit Code」をクリック**
6. **提供した`worker.js`の内容を全てコピー&ペースト**
7. **「Save and Deploy」をクリック**

### ステップ4: Routesの設定（独自ドメインの場合のみ）

1. **Workers & Pages → 作成したWorker → Settings → Triggers**
2. **「Add Route」をクリック**
3. **Route設定**:
   - Route: `your-domain.com/*`（あなたのドメインに置き換え）
   - Zone: あなたのドメインを選択
4. **「Save」をクリック**

### ステップ5: workers.devサブドメインの設定（独自ドメインなしの場合）

1. **Workers & Pages → 作成したWorker**
2. **Triggers → workers.dev**
3. **サブドメイン確認**: `your-worker-name.workers.dev`
4. **このURLがシェア用URLになります**

### ステップ6: JavaScriptの更新

`script.js`の`shareScreenshot`関数で使用するドメインを更新：

```javascript
// 結果ページのURL（OGP画像付き）
const shareUrl = `https://your-domain.com/?result=${ratingParam}`;
// または
const shareUrl = `https://your-worker.workers.dev/?result=${ratingParam}`;
```

### ステップ7: 動作確認

1. **占いを実行して結果を表示**
2. **「シェアする」ボタンをタップ/クリック**
3. **生成されたURLをコピー**
4. **X（Twitter）の投稿画面にURLを貼り付け**
5. **プレビューでレーティング画像が表示されるか確認** ✨

## 🔍 トラブルシューティング

### OGP画像が表示されない

**1. キャッシュをクリア**
- X: Card Validator（https://cards-dev.twitter.com/validator）でURLをチェック
- Facebook: Sharing Debugger（https://developers.facebook.com/tools/debug/）

**2. 画像URLを確認**
```javascript
// worker.jsで画像URLが正しいか確認
'rainbow': 'https://jaga291.github.io/pachinkas-uranai/images/rainbow.png',
```

**3. 画像が存在するか確認**
- ブラウザで直接画像URLにアクセス
- GitHub Pagesで画像がホストされているか確認

### Workerが動作しない

**1. Routeが正しく設定されているか確認**
- Workers & Pages → Settings → Triggers
- Route設定を再確認

**2. Workerのログを確認**
- Workers & Pages → 作成したWorker → Logs
- エラーメッセージを確認

**3. GitHub PagesのURLが正しいか確認**
```javascript
const githubUrl = 'https://jaga291.github.io/pachinkas-uranai/';
```

## 💰 料金

**Cloudflare Workers 無料プラン:**
- ✅ 月間リクエスト: 100,000回
- ✅ CPU時間: リクエストあたり10ms
- ✅ 十分すぎる無料枠！

**参考**: 1日3,000アクセスまで無料で対応可能

## 🎨 カスタマイズ

### OGPタイトルを変更

`worker.js`の以下を編集：
```javascript
const ogpTitle = `今日の運勢は【${ratingNames[rating]}】でした！`;
```

### OGP説明文を変更

```javascript
const ogpDescription = 'パチンカス占い - あなたの今日の勝負運を占う';
```

### 画像サイズを変更

```javascript
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```

## 📱 シェア方法（ユーザー向け説明）

### スマホ（iPhone/Android）
1. 「🔗 シェアする」ボタンをタップ
2. シェアメニューが表示される
3. X、LINE、Instagram等を選択
4. 画像付きで投稿される ✨

### PC
1. 「🔗 シェアする」ボタンをクリック
2. URLがコピーされる
3. SNSの投稿欄にペースト
4. 画像付きプレビューが表示される

## 🔄 更新方法

### Workerスクリプトを更新

1. Workers & Pages → 作成したWorker
2. 「Quick Edit」をクリック
3. コードを編集
4. 「Save and Deploy」

### 即座に反映されます！

## 📊 分析

Cloudflare Workers Analyticsで以下を確認可能：
- リクエスト数
- エラー率
- レスポンスタイム
- 地域別アクセス

Workers & Pages → Analytics で確認

## ✅ 完了チェックリスト

- [ ] Cloudflareアカウント作成
- [ ] Workerスクリプトをデプロイ
- [ ] Route設定（独自ドメインの場合）
- [ ] script.jsのURL更新
- [ ] GitHubにpush
- [ ] 動作確認（SNSでシェアテスト）
- [ ] OGP画像がSNSで表示されることを確認

---

**参考リンク:**
- Cloudflare Workers公式: https://workers.cloudflare.com/
- OGP確認ツール（X）: https://cards-dev.twitter.com/validator
- Cloudflare Workers料金: https://developers.cloudflare.com/workers/platform/pricing/

**質問があれば**: https://community.cloudflare.com/
