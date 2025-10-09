# マルチブランチ環境の認証ソリューション

## 概要

ブランチごとに動的環境を作成する際、Google OAuthの「承認済みリダイレクトURI」にはワイルドカードが使用できないという制限があります。この制限を回避するため、**認証プロキシパターン**を実装しました。

## アーキテクチャ

### URL構造

すべてのブランチ環境を `*.preview.aooba.net` ドメイン配下に統一：

- **認証サービス**: `auth.preview.aooba.net` - 認証専用エンドポイント
- **Dev環境**: `dev.preview.aooba.net` - 開発環境
- **Feature環境**: `feature-xyz.preview.aooba.net` - 機能ブランチ環境
- **Bugfix環境**: `bugfix-abc.preview.aooba.net` - バグ修正ブランチ環境

### 認証フロー

```
1. ユーザーが任意のブランチ環境でログインボタンをクリック
   URL: https://feature-xyz.preview.aooba.net
   ↓
2. /api/auth-proxy にリダイレクト
   元のURL (returnUrl) を保存
   ↓
3. 認証サービスにリダイレクト
   URL: https://auth.preview.aooba.net/api/auth/signin?callbackUrl=https://feature-xyz.preview.aooba.net/
   ↓
4. NextAuth.jsが Google OAuth 認証を開始
   ↓
5. Google認証画面でユーザーが承認
   ↓
6. Google OAuthコールバック
   URL: https://auth.preview.aooba.net/api/auth/callback/google
   ↓
7. NextAuth.jsがJWTトークンを生成
   Cookie Domain: .preview.aooba.net (全環境で共有)
   ↓
8. 元のブランチ環境にリダイレクト
   URL: https://feature-xyz.preview.aooba.net/
   ↓
9. セッションCookieが共有されているため、ログイン完了
```

### セッション共有の仕組み

認証サービスで発行されたセッションCookieは、`domain=.preview.aooba.net` で設定されるため、すべての `*.preview.aooba.net` サブドメインで共有されます。

```
Cookie設定例:
  Name: __Secure-next-auth.session-token
  Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Domain: .preview.aooba.net
  Path: /
  Secure: true
  HttpOnly: true
  SameSite: Lax
```

## 実装内容

### 1. NextAuth設定の拡張

**ファイル**: `lib/auth/auth-options.ts`

```typescript
// Cookie設定（ドメイン共有対応）
cookies: {
  sessionToken: {
    name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      // ブランチ環境間でセッション共有
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
  },
},
```

```typescript
// リダイレクトコールバックで同一ドメイン配下を許可
async redirect({ url, baseUrl }) {
  const authProxyMode = process.env.AUTH_PROXY_MODE === 'true';
  const cookieDomain = process.env.COOKIE_DOMAIN;
  
  if (authProxyMode && cookieDomain) {
    const urlHost = new URL(url).hostname;
    if (urlHost.endsWith(cookieDomain.replace(/^\./, ''))) {
      return url; // 同一ドメイン配下なら許可
    }
  }
  
  return baseUrl;
}
```

### 2. 認証プロキシエンドポイント

**ファイル**: `app/api/auth-proxy/route.ts`

ブランチ環境から認証サービスへのリダイレクトを処理します。

```typescript
export async function GET(request: NextRequest) {
  const authProxyMode = process.env.AUTH_PROXY_MODE === "true";
  const authServiceUrl = process.env.AUTH_SERVICE_URL;
  
  if (!authProxyMode) {
    // 通常のNextAuth認証にフォールバック
    return NextResponse.redirect(new URL("/api/auth/signin", request.url));
  }
  
  const currentOrigin = request.nextUrl.origin;
  const returnUrl = `${currentOrigin}/`;
  
  // 認証サービスへリダイレクト
  const authUrl = new URL("/api/auth/signin", authServiceUrl);
  authUrl.searchParams.set("callbackUrl", returnUrl);
  
  return NextResponse.redirect(authUrl);
}
```

### 3. ログインボタンの更新

**ファイル**: `components/auth/LoginButton.tsx`

認証プロキシ経由でログインするように変更：

```typescript
const handleLogin = async () => {
  window.location.href = '/api/auth-proxy?action=signin&callbackUrl=/';
};
```

## Kubernetes設定

### 認証サービス（auth.preview.aooba.net）

**ファイル**: `k8s/manifests/auth-service.yml`

```yaml
env:
  - name: NEXTAUTH_URL
    value: https://auth.preview.aooba.net
  - name: AUTH_PROXY_MODE
    value: "false"  # 認証サービス自体はプロキシモードOFF
  - name: AUTH_SERVICE_URL
    value: https://auth.preview.aooba.net
  - name: COOKIE_DOMAIN
    value: .preview.aooba.net
```

### ブランチ環境（dev.preview.aooba.net等）

**ファイル**: `k8s/manifests/deployment.yml`

```yaml
env:
  - name: NEXTAUTH_URL
    value: https://dev.preview.aooba.net
  - name: AUTH_PROXY_MODE
    value: "true"  # ブランチ環境はプロキシモードON
  - name: AUTH_SERVICE_URL
    value: https://auth.preview.aooba.net
  - name: COOKIE_DOMAIN
    value: .preview.aooba.net
```

## Google OAuth設定

Google Cloud Consoleで以下の設定を行います：

### 1. 承認済みのJavaScript生成元

```
https://auth.preview.aooba.net
```

### 2. 承認済みのリダイレクトURI

```
https://auth.preview.aooba.net/api/auth/callback/google
```

**重要**: この1つのリダイレクトURIで、すべてのブランチ環境の認証をカバーできます。

## DNS/Cloudflare設定

### Cloudflare Tunnelの設定

Cloudflare Tunnel Ingress Controllerで以下のホスト名を設定：

```yaml
# Ingress設定
- host: auth.preview.aooba.net
  service: journee-auth:80
- host: dev.preview.aooba.net
  service: journee-dev:80
- host: feature-*.preview.aooba.net
  service: <動的にルーティング>
```

または、Cloudflare DNSでワイルドカードレコードを設定：

```
Type: CNAME
Name: *.preview.aooba.net
Target: <Cloudflare Tunnel ID>.cfargotunnel.com
```

## デプロイ手順

### 1. Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. **APIとサービス** → **認証情報**
3. OAuth 2.0 クライアントIDを編集
4. **承認済みのリダイレクトURI** に追加:
   ```
   https://auth.preview.aooba.net/api/auth/callback/google
   ```
5. 保存

### 2. Kubernetesマニフェストの適用

```bash
# 認証サービスのデプロイ
kubectl apply -f k8s/manifests/auth-service.yml

# Dev環境の更新（環境変数追加）
kubectl apply -f k8s/manifests/deployment.yml
kubectl apply -f k8s/manifests/ingress.yml
```

### 3. ArgoCDで自動デプロイ

```bash
# 変更をコミット
git add k8s/manifests/
git commit -m "feat: Add multi-branch auth proxy support"
git push origin dev

# ArgoCDが自動的に同期（selfHeal: true）
```

### 4. DNS設定の確認

```bash
# DNSレコードの確認
dig auth.preview.aooba.net
dig dev.preview.aooba.net

# Cloudflare Tunnel設定の確認
kubectl logs -n cloudflare-tunnel-ingress-controller controlled-cloudflared-connector-xxx
```

### 5. 動作確認

```bash
# 1. Dev環境にアクセス
open https://dev.preview.aooba.net

# 2. ログインボタンをクリック
# 3. auth.preview.aooba.net にリダイレクトされることを確認
# 4. Google認証画面が表示されることを確認
# 5. 認証後、dev.preview.aooba.net に戻ることを確認
```

## トラブルシューティング

### 認証サービスにリダイレクトされない

**原因**: AUTH_PROXY_MODE環境変数が設定されていない

**解決策**:
```bash
kubectl get pods -n journee
kubectl describe pod journee-dev-xxx -n journee | grep AUTH_PROXY_MODE
```

### Cookieが共有されない

**原因**: COOKIE_DOMAIN設定が正しくない

**確認方法**:
```bash
# ブラウザの開発者ツールでCookieを確認
# Domain: .preview.aooba.net になっているか確認
```

**解決策**:
```bash
# Podの環境変数を確認
kubectl exec -n journee journee-dev-xxx -- env | grep COOKIE_DOMAIN
```

### Google OAuthエラー: "redirect_uri_mismatch"

**原因**: Google Cloud ConsoleのリダイレクトURIが正しく設定されていない

**解決策**:
1. Google Cloud Consoleで設定を確認
2. `https://auth.preview.aooba.net/api/auth/callback/google` が登録されているか確認
3. URLの末尾スラッシュの有無も正確に一致させる

### セッションが保持されない

**原因**: Secure Cookieの設定問題

**確認ポイント**:
- HTTPSで接続しているか（HTTP接続ではSecure Cookieが送信されない）
- SameSite=Lax設定が正しいか
- ブラウザのサードパーティCookie設定

## ブランチ環境の追加方法

新しいブランチ環境を追加する手順：

### 1. Kubernetes Deploymentを作成

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: journee-feature-xyz
  namespace: journee
spec:
  replicas: 1
  selector:
    matchLabels:
      app: journee-feature-xyz
  template:
    metadata:
      labels:
        app: journee-feature-xyz
    spec:
      containers:
        - name: journee
          image: gcr.io/my-docker-471807/journee:latest
          env:
            - name: NEXTAUTH_URL
              value: https://feature-xyz.preview.aooba.net
            - name: AUTH_PROXY_MODE
              value: "true"
            - name: AUTH_SERVICE_URL
              value: https://auth.preview.aooba.net
            - name: COOKIE_DOMAIN
              value: .preview.aooba.net
            # その他の環境変数...
```

### 2. Serviceを作成

```yaml
apiVersion: v1
kind: Service
metadata:
  name: journee-feature-xyz
  namespace: journee
spec:
  selector:
    app: journee-feature-xyz
  ports:
  - port: 80
    targetPort: 3000
```

### 3. Ingressを追加

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: journee-ingress-feature-xyz
  namespace: journee
spec:
  ingressClassName: "cloudflare-tunnel"
  rules:
  - host: feature-xyz.preview.aooba.net
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: journee-feature-xyz
            port:
              number: 80
```

### 4. デプロイ

```bash
kubectl apply -f feature-xyz-deployment.yml
```

**重要**: Google OAuthの設定変更は不要です！

## ArgoCD ApplicationSetによる自動化（オプション）

PRごとに自動的に環境を作成する場合：

**ファイル**: `k8s/argocd/applicationset.yml`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: journee-preview-environments
  namespace: argocd
spec:
  generators:
  - pullRequest:
      github:
        owner: AobaIwaki123
        repo: journee
        tokenRef:
          secretName: github-token
          key: token
  template:
    metadata:
      name: 'journee-pr-{{number}}'
    spec:
      project: default
      source:
        repoURL: 'https://github.com/AobaIwaki123/journee'
        targetRevision: '{{head_sha}}'
        path: k8s/manifests
      destination:
        server: 'https://kubernetes.default.svc'
        namespace: journee
      syncPolicy:
        automated:
          selfHeal: true
          prune: true
```

## メリット

1. **スケーラビリティ**: 無制限にブランチ環境を作成可能
2. **シンプル**: Google OAuthには1つのリダイレクトURIのみ登録
3. **透過的**: ユーザーは認証プロキシの存在を意識しない
4. **セキュア**: 実際のGoogle OAuth認証を使用
5. **メンテナンス性**: 新しい環境追加時にOAuth設定変更不要

## 参考リンク

- [NextAuth.js - Cookies](https://next-auth.js.org/configuration/options#cookies)
- [Google OAuth 2.0 - Redirect URIs](https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation)
- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

