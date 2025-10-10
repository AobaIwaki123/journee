# デプロイメント手順

## 📋 目次

1. [概要](#概要)
2. [デプロイ前の準備](#デプロイ前の準備)
3. [Google Cloud Runへのデプロイ](#google-cloud-runへのデプロイ)
4. [Kubernetesへのデプロイ](#kubernetesへのデプロイ)
5. [環境変数設定](#環境変数設定)
6. [Webhook URL設定](#webhook-url設定)
7. [SSL/HTTPS設定](#sslhttps設定)
8. [モニタリングとログ](#モニタリングとログ)
9. [トラブルシューティング](#トラブルシューティング)

---

## 概要

LINE botを本番環境にデプロイする手順を説明します。JourneeはすでにGoogle Cloud RunとKubernetesでの運用実績があるため、既存のインフラを活用します。

### デプロイ先の選択肢

| 環境 | 推奨用途 | メリット | デメリット |
|------|---------|---------|----------|
| **Google Cloud Run** | 開発・テスト・小規模運用 | セットアップ簡単、自動スケール、コスト効率 | コールドスタート、実行時間制限 |
| **Kubernetes** | 本番運用 | 柔軟性、長時間実行可能、完全制御 | セットアップ複雑、運用コスト高 |

---

## デプロイ前の準備

### 1. コードの準備

```bash
# リポジトリをクローン
git clone https://github.com/your-org/journee.git
cd journee

# LINE bot用ブランチを作成
git checkout -b line-bot-integration

# 必要なパッケージをインストール
npm install @line/bot-sdk
```

### 2. 環境変数ファイルの準備

```bash
# .env.production を作成
cp .env.example .env.production
```

`.env.production` の内容:

```bash
# Node環境
NODE_ENV=production

# Next.js
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_nextauth_secret_here

# LINE Bot
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token

# AI API
GEMINI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth (既存)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Dockerfileの準備

既存の `Dockerfile.prod` を使用しますが、LINE bot用の設定を追加します。

```dockerfile
# Dockerfile.prod (一部抜粋)
FROM node:18-alpine AS base

# 依存関係のインストール
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# ビルド
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# 実行
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

---

## Google Cloud Runへのデプロイ

### Step 1: Google Cloud SDKのセットアップ

```bash
# Google Cloud SDKをインストール（未インストールの場合）
# https://cloud.google.com/sdk/docs/install

# 認証
gcloud auth login

# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID
```

### Step 2: Container Registryにイメージをプッシュ

```bash
# プロジェクトIDを環境変数に設定
export PROJECT_ID=your-gcp-project-id
export REGION=asia-northeast1
export SERVICE_NAME=journee-line-bot

# Dockerイメージをビルド
docker build -t gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest -f Dockerfile.prod .

# Container Registryにプッシュ
docker push gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest
```

### Step 3: Cloud Runにデプロイ

```bash
# Cloud Runにデプロイ
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "LINE_CHANNEL_SECRET=line-channel-secret:latest,LINE_CHANNEL_ACCESS_TOKEN=line-channel-access-token:latest,GEMINI_API_KEY=gemini-api-key:latest,SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --port 3000
```

### Step 4: カスタムドメインの設定（オプション）

```bash
# カスタムドメインをマッピング
gcloud run domain-mappings create \
  --service ${SERVICE_NAME} \
  --domain line-bot.journee.example.com \
  --region ${REGION}
```

### Step 5: デプロイスクリプトの作成

```bash
# scripts/deploy-line-bot.sh
#!/bin/bash

set -e

PROJECT_ID="your-gcp-project-id"
REGION="asia-northeast1"
SERVICE_NAME="journee-line-bot"
IMAGE_TAG=$(git rev-parse --short HEAD)

echo "Building Docker image..."
docker build -t gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${IMAGE_TAG} -f Dockerfile.prod .
docker tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${IMAGE_TAG} gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest

echo "Pushing to Container Registry..."
docker push gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${IMAGE_TAG}
docker push gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest

echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${IMAGE_TAG} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --set-secrets "LINE_CHANNEL_SECRET=line-channel-secret:latest,LINE_CHANNEL_ACCESS_TOKEN=line-channel-access-token:latest" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10

echo "Deployment completed!"
echo "Service URL:"
gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)'
```

```bash
# 実行権限を付与
chmod +x scripts/deploy-line-bot.sh

# デプロイ実行
./scripts/deploy-line-bot.sh
```

---

## Kubernetesへのデプロイ

### Step 1: マニフェストファイルの準備

```yaml
# k8s/line-bot/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: journee-line-bot
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: journee-line-bot
  template:
    metadata:
      labels:
        app: journee-line-bot
    spec:
      containers:
      - name: journee-line-bot
        image: gcr.io/YOUR_PROJECT_ID/journee-line-bot:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        envFrom:
        - secretRef:
            name: journee-line-bot-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

```yaml
# k8s/line-bot/service.yml
apiVersion: v1
kind: Service
metadata:
  name: journee-line-bot-service
  namespace: default
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  selector:
    app: journee-line-bot
```

```yaml
# k8s/line-bot/ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: journee-line-bot-ingress
  namespace: default
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - line-bot.journee.example.com
    secretName: line-bot-tls
  rules:
  - host: line-bot.journee.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: journee-line-bot-service
            port:
              number: 80
```

### Step 2: シークレットの作成

```bash
# Kubernetesシークレットを作成
kubectl create secret generic journee-line-bot-secrets \
  --from-literal=LINE_CHANNEL_SECRET=your_channel_secret \
  --from-literal=LINE_CHANNEL_ACCESS_TOKEN=your_access_token \
  --from-literal=GEMINI_API_KEY=your_gemini_key \
  --from-literal=ANTHROPIC_API_KEY=your_anthropic_key \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY=your_supabase_key \
  --from-literal=NEXTAUTH_SECRET=your_nextauth_secret
```

### Step 3: デプロイ実行

```bash
# マニフェストを適用
kubectl apply -f k8s/line-bot/deployment.yml
kubectl apply -f k8s/line-bot/service.yml
kubectl apply -f k8s/line-bot/ingress.yml

# デプロイ状態を確認
kubectl get deployments
kubectl get pods
kubectl get services
kubectl get ingress
```

### Step 4: ArgoCD設定（継続的デプロイ）

```yaml
# k8s/argocd/line-bot-app.yml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: journee-line-bot
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/journee.git
    targetRevision: line-bot-integration
    path: k8s/line-bot
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

```bash
# ArgoCD Applicationを作成
kubectl apply -f k8s/argocd/line-bot-app.yml
```

---

## 環境変数設定

### Google Secret Managerの使用

```bash
# シークレットを作成
echo -n "your_line_channel_secret" | \
  gcloud secrets create line-channel-secret --data-file=-

echo -n "your_line_channel_access_token" | \
  gcloud secrets create line-channel-access-token --data-file=-

# Cloud Runにアクセス権を付与
gcloud secrets add-iam-policy-binding line-channel-secret \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 環境変数のベストプラクティス

1. **機密情報は環境変数で管理**
   - APIキー、トークン、シークレット

2. **非機密情報はコードで管理**
   - API URL、タイムアウト設定

3. **環境ごとに異なる設定**
   - 開発: `.env.local`
   - ステージング: `.env.staging`
   - 本番: Secret Manager / Kubernetes Secrets

---

## Webhook URL設定

### Step 1: デプロイ完了後のURL取得

**Cloud Runの場合:**
```bash
gcloud run services describe journee-line-bot \
  --region asia-northeast1 \
  --format 'value(status.url)'

# 出力例: https://journee-line-bot-abc123.run.app
```

**Kubernetesの場合:**
```bash
kubectl get ingress journee-line-bot-ingress \
  -o jsonpath='{.spec.rules[0].host}'

# 出力例: line-bot.journee.example.com
```

### Step 2: LINE DevelopersでWebhook URL設定

1. LINE Developersコンソールにアクセス
2. チャネルを選択
3. 「Messaging API」タブを開く
4. Webhook URL欄に入力:
   ```
   https://your-domain.com/api/line/webhook
   ```
5. 「Verify」ボタンをクリックして検証
6. 「Use webhook」をONに設定

---

## SSL/HTTPS設定

### Let's Encryptを使用したSSL証明書

**Kubernetesの場合（cert-manager使用）:**

```yaml
# k8s/cert-manager/cluster-issuer.yml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@journee.example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

```bash
# cert-managerのインストール（未インストールの場合）
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# ClusterIssuerを適用
kubectl apply -f k8s/cert-manager/cluster-issuer.yml
```

**Cloud Runの場合:**
- Cloud Runは自動的にHTTPSを提供
- カスタムドメインの場合、Google-managed SSL証明書を自動発行

---

## モニタリングとログ

### Google Cloud Loggingの設定

```bash
# ログを確認
gcloud run services logs read journee-line-bot \
  --region asia-northeast1 \
  --limit 50

# リアルタイムでログをフォロー
gcloud run services logs tail journee-line-bot \
  --region asia-northeast1
```

### Kubernetesのログ確認

```bash
# Podのログを確認
kubectl logs -l app=journee-line-bot --tail=100 -f

# 特定のPodのログ
kubectl logs journee-line-bot-xxxxx-yyyyy
```

### アプリケーションログの実装

```typescript
// lib/line/logger.ts
export class LineLogger {
  log(level: 'info' | 'warn' | 'error', message: string, meta?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
      service: 'line-bot',
    };

    console.log(JSON.stringify(logEntry));
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: any) {
    this.log('error', message, meta);
  }
}

export const logger = new LineLogger();
```

### エラートラッキング（Sentry）

```typescript
// lib/line/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

export function captureLineError(error: Error, context?: any) {
  Sentry.captureException(error, {
    tags: {
      service: 'line-bot',
    },
    extra: context,
  });
}
```

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. Webhook検証が失敗する

**症状**: LINE DevelopersでWebhook URLの検証が「Failed」になる

**原因と解決策:**
```bash
# 1. サービスが起動しているか確認
kubectl get pods | grep journee-line-bot

# 2. ヘルスチェックエンドポイントを確認
curl https://your-domain.com/api/line/webhook

# 3. ログを確認
kubectl logs -l app=journee-line-bot --tail=50

# 4. 署名検証が正しいか確認
# LINE_CHANNEL_SECRETが正しく設定されているか
```

#### 2. メッセージが送信されない

**症状**: botがメッセージに応答しない

**デバッグ手順:**
```typescript
// lib/line/handlers/text-message-handler.ts に追加
console.log('Received message:', {
  userId,
  message: userMessage,
  timestamp: new Date().toISOString(),
});
```

```bash
# ログを確認
kubectl logs -l app=journee-line-bot --tail=100 | grep "Received message"
```

#### 3. タイムアウトエラー

**症状**: 「504 Gateway Timeout」エラー

**解決策:**
```yaml
# Cloud Runのタイムアウトを延長
gcloud run services update journee-line-bot \
  --timeout 300 \
  --region asia-northeast1

# Kubernetesの場合、Ingress設定を調整
# k8s/line-bot/ingress.yml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
```

---

## チェックリスト

デプロイ完了前に以下を確認してください：

- [ ] Dockerイメージのビルド成功
- [ ] Container Registryへのプッシュ成功
- [ ] Cloud Run / Kubernetesへのデプロイ成功
- [ ] 環境変数の設定完了
- [ ] シークレットの設定完了
- [ ] Webhook URLの設定と検証成功
- [ ] HTTPS対応完了
- [ ] ヘルスチェックエンドポイント動作確認
- [ ] ログ出力確認
- [ ] エラートラッキング設定（オプション）
- [ ] 実際のメッセージ送受信テスト成功

---

## 次のステップ

デプロイが完了したら、次のドキュメントに進んでください：

- **テストと検証**: [08_TESTING.md](./08_TESTING.md)

---

**最終更新**: 2025-10-10  
**関連ドキュメント**: [06_STREAMING_PARSER.md](./06_STREAMING_PARSER.md), [08_TESTING.md](./08_TESTING.md)
