# 🔧 テキストボックスが無効な問題 - 即座に解決

## 問題

ブラウザでアプリを開いても、チャットのテキストボックスが無効（グレーアウト）になっていてテストできない。

## 原因

**Phase 2の認証機能が有効**になっているため、ログインしていない状態ではアプリが使えません。

## ✅ 解決方法（3分で完了）

### ステップ1: `.env.local`を編集

```bash
# .env.localを開く
nano .env.local
# または
code .env.local
```

### ステップ2: 以下の行を追加

```bash
# この1行を追加
NEXT_PUBLIC_DEV_MODE=true
```

完全な`.env.local`の例：

```bash
# 必須
GEMINI_API_KEY=your_gemini_api_key_here

# これを追加（認証をバイパス）
NEXT_PUBLIC_DEV_MODE=true

# 以下は開発モードでは不要
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=...
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
```

### ステップ3: サーバーを再起動

```bash
# 現在のサーバーを停止（Ctrl+C）
# 再起動
npm run dev
```

### ステップ4: ブラウザで確認

```
http://localhost:3000
```

**これでテキストボックスが使えるようになります！**

---

## 🎯 即座に試す（ワンライナー）

```bash
# .env.localに追加してサーバーを再起動
echo "NEXT_PUBLIC_DEV_MODE=true" >> .env.local && npm run dev
```

---

## ✨ 確認方法

1. ブラウザで `http://localhost:3000` を開く
2. ログインページにリダイレクトされない
3. チャットのテキストボックスが白色（有効）になっている
4. 「東京で3日間の旅行計画」と入力して送信できる

---

## 🔍 それでも動かない場合

### チェック1: 環境変数が反映されているか

```bash
# 設定を確認
cat .env.local | grep NEXT_PUBLIC_DEV_MODE

# 期待される出力:
# NEXT_PUBLIC_DEV_MODE=true
```

### チェック2: キャッシュをクリア

```bash
# サーバーを停止（Ctrl+C）
rm -rf .next
npm run dev
```

### チェック3: ブラウザのキャッシュ

1. ブラウザで F12 を押す
2. Network タブを開く
3. 「Disable cache」にチェック
4. ページをリロード（Ctrl+R）

---

## 📊 状態の確認

### 開発モードが有効な場合

✅ ログインページにリダイレクトされない  
✅ テキストボックスが白色  
✅ メッセージを送信できる  
✅ AIの応答が返ってくる  

### 開発モードが無効な場合

❌ ログインページにリダイレクトされる  
❌ メインページにアクセスできない  
❌ チャット機能が使えない  

---

## 🎬 動画デモ（想定）

```
1. .env.localを開く
2. NEXT_PUBLIC_DEV_MODE=true を追加
3. 保存
4. ターミナルで Ctrl+C
5. npm run dev
6. ブラウザで http://localhost:3000
7. チャットが使える！✅
```

---

## 📝 よくある質問

### Q: 本番環境で使っても大丈夫？

**A: 絶対にダメです！** 開発モードは認証をバイパスするので、本番環境では使用しないでください。

### Q: 認証機能もテストしたい場合は？

**A:** `.env.local`から`NEXT_PUBLIC_DEV_MODE=true`を削除し、Google OAuthの設定を追加してください。

### Q: この設定はGitにコミットすべき？

**A: いいえ。** `.env.local`は`.gitignore`に含まれているので、コミットされません。個人の開発環境用の設定です。

---

## 🚀 次のステップ

開発モードが動作したら：

1. **チャット機能をテスト**
   - 「東京で3日間の旅行計画を立てたいです」
   
2. **自動テストを実行**
   ```bash
   ./test-phase3.sh
   ```

3. **ブラウザテストツール**
   ```
   http://localhost:3000/test-api.html
   ```

---

## 📚 詳細ドキュメント

- [開発モードセットアップガイド](./DEV_MODE_SETUP.md) - 詳細な説明
- [テストクイックスタート](./TESTING_QUICKSTART.md) - テスト方法
- [完全テストガイド](./docs/PHASE3_TESTING_GUIDE.md) - 全テストケース

---

**これで解決しない場合は、エラーメッセージをコピーして質問してください！**
