<!-- 2ef2ab32-b7e4-461d-883c-2ee2eeffe40a a29bb81c-206d-453f-a976-ff73f594b41a -->
# Docker Build速度改善

## 問題分析

現在の設定では：

- `cache-to: type=gha,mode=max` により、初回ビルドで全レイヤーをキャッシュ保存する際のオーバーヘッドが大きい
- npmインストールやNext.jsビルドのキャッシュが毎回再生成される
- 2回目以降もnode_modulesを毎回ダウンロード・インストール

## 改善戦略

### 1. BuildKitマウントキャッシュの導入

`Dockerfile.prod`にBuildKitの`--mount=type=cache`を追加し、以下をビルド間で永続化：

- npmキャッシュディレクトリ（`~/.npm`）
- Next.jsビルドキャッシュ（`.next/cache`）

これにより、パッケージのダウンロードとNext.jsの増分ビルドが高速化されます。

**参考**: [Dockerfile best practices - mount cache](https://docs.docker.com/build/cache/#use-the-dedicated-run-cache)

### 2. キャッシュモードの最適化

`mode=max` から `mode=min` に変更し、初回ビルドのキャッシュ保存オーバーヘッドを削減します。BuildKitマウントキャッシュがあれば、レイヤーキャッシュは最小限でも十分効果があります。

### 3. npm ciコマンドの最適化

既に`--prefer-offline --no-audit`が設定されていますが、マウントキャッシュと組み合わせることで効果を最大化します。

## 実装内容

### ファイル: `Dockerfile.prod`

**deps ステージ（11-13行目）**:

```dockerfile
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit
```

**builder ステージ（32行目）**:

```dockerfile
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build
```

### ファイル: `.github/workflows/push.yml`

**cache-to設定（80行目）**:

```yaml
cache-to: type=gha,mode=min
```

### ファイル: `.github/workflows/deploy.yml`

deploy.ymlでもキャッシュ設定を追加（現在未設定）:

```yaml
cache-from: type=gha
cache-to: type=gha,mode=min
```

## 期待される効果

### 初回ビルド

- キャッシュ保存が`mode=min`により軽量化：**10-30%高速化**
- npmダウンロードは初回のみ実行

### 2回目以降ビルド

- npmパッケージのダウンロードをスキップ：**30-50%高速化**
- Next.jsの増分ビルドが有効化：**20-40%高速化**
- 変更がない場合は大幅に短縮

### 具体例（目安）

- 初回: 8分 → 6-7分（15-25%改善）
- 2回目以降（コード変更あり）: 8分 → 4-5分（40-50%改善）
- 2回目以降（依存関係変更なし）: 8分 → 2-3分（60-70%改善）

## 追加の最適化（オプション）

`.dockerignore`はすでに最適化されているため、追加変更は不要です。

## 参考資料

- [Google Cloud Build - ビルドの高速化](https://cloud.google.com/build/docs/optimize-builds/speeding-up-builds?hl=ja)
- [Docker Build cache documentation](https://docs.docker.com/build/cache/)
- [GitHub Actions cache documentation](https://docs.docker.com/build/ci/github-actions/cache/)

### To-dos

- [ ] Dockerfile.prodのdepsステージにnpmキャッシュマウントを追加
- [ ] Dockerfile.prodのbuilderステージにNext.jsキャッシュマウントを追加
- [ ] push.ymlのcache-toをmode=minに変更
- [ ] deploy.ymlにキャッシュ設定を追加