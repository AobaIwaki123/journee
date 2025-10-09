# 【AI駆動開発】まだレビューする時にブランチ移動してるの？ブランチごとに独立環境を立てて爆速開発する方法

## 目次
1. [はじめに](#はじめに)
2. [なぜブランチごとに独立環境が必要なのか](#なぜブランチごとに独立環境が必要なのか)
3. [想定読者](#想定読者)
4. [システム概要](#システム概要)
5. [前提条件](#前提条件)
6. [環境構築](#環境構築)
   - [6.1 Kubernetes環境のセットアップ](#61-kubernetes環境のセットアップ)
   - [6.2 ArgoCD環境のセットアップ](#62-argocd環境のセットアップ)
   - [6.3 Cloudflare Ingress Controllerのセットアップ](#63-cloudflare-ingress-controllerのセットアップ)
   - [6.4 動作確認](#64-動作確認)
7. [実装編](#実装編)
   - [7.1 GitHub Actionsワークフローの作成](#71-github-actionsワークフローの作成)
   - [7.2 ブランチ固有のマニフェスト管理](#72-ブランチ固有のマニフェスト管理)
   - [7.3 ArgoCD Applicationの自動作成](#73-argocd-applicationの自動作成)
8. [運用編](#運用編)
9. [まとめ](#まとめ)

---

## はじめに

<!-- ここに記載する内容 -->
- 個人開発でも複数タスクを並列に進める現代の開発スタイルについて
- ブランチ移動してレビューする手間の問題提起
- AI駆動開発で10タスクを同時進行する際の課題
- この記事で解決できること：ブランチごとの独立環境で即座にレビュー可能に
- 技術的に面白く、個人レベルではまだあまり実践されていない手法の紹介

**期待できるメリット：**
- ✅ ブランチ移動なしで複数PRを同時レビュー
- ✅ 各ブランチの動作を独立したURLで確認
- ✅ CI/CDパイプラインの高速化
- ✅ チーム開発での衝突回避
- ✅ AI駆動開発との親和性が高い

---

## なぜブランチごとに独立環境が必要なのか

<!-- ここに記載する内容 -->
### 従来の開発フロー（問題点）
- ブランチAの実装完了 → ブランチBに切り替え → ローカル環境再構築 → 動作確認
- 複数のブランチを行き来する度に環境を再構築する手間
- メモリやリソースの消費
- 時間のロス

### ブランチごとに独立環境を持つメリット
- 各ブランチが独自のURLを持つ（例：`feature-a.example.com`, `feature-b.example.com`）
- 同時に複数のブランチを確認可能
- ステークホルダーに直接URLを共有して確認してもらえる
- AI駆動開発で10タスクを並列処理する際も、各タスクの進捗を即座に確認できる

### 個人開発こそ必要な理由
- AIエージェントが複数のタスクを並列実行する時代
- 1人で10ブランチ管理することも珍しくない
- 効率化の積み重ねが開発速度に直結

---

## 想定読者

### このブログが役立つ人
- ✅ `kubectl`コマンドを使ったことがある、または学習意欲がある
- ✅ Kubernetesの基本概念を理解している
- ✅ ブランチごとのデプロイに興味があるが実装方法がわからなかった
- ✅ 個人開発でCI/CDを構築したい
- ✅ AI駆動開発で複数タスクを並列処理している

### 想定しないレベル
- ❌ Docker/Kubernetesを全く触ったことがない方
  - （ただし、興味があれば環境構築の参考にはなります）

---

## システム概要

<!-- ここに記載する内容 -->
### アーキテクチャ図
```
[GitHub] → [GitHub Actions]
              ↓
         [Docker Build]
              ↓
      [Container Registry (GCR)]
              ↓
         [ArgoCD] → [Kubernetes Cluster]
                         ↓
              [Cloudflare Ingress Controller]
                         ↓
                   [Public URL]
```

### 使用する技術スタック
- **Kubernetes**: コンテナオーケストレーション
- **ArgoCD**: GitOpsツール（宣言的デプロイ）
- **Cloudflare Tunnel Controller**: ドメイン自動発行・SSL自動設定
- **Google Container Registry (GCR)**: コンテナイメージレジストリ
- **GitHub Actions**: CI/CDパイプライン
- **yq**: YAMLプロセッサ（マニフェスト動的生成用）

### ワークフロー
1. ブランチにプッシュ
2. GitHub ActionsがArgoCD Applicationを作成（初回のみ）
3. Dockerイメージをビルド・GCRにプッシュ
4. ブランチ固有のKubernetesマニフェストを動的生成
   - ブランチ名からMD5ハッシュ（6文字）を生成
   - リソース名に`-<hash>`を付与してユニーク化
5. マニフェストをコミット・プッシュ
6. ArgoCDが自動的にデプロイを実行
7. Cloudflare Tunnel Controllerが`<app-name>-<hash>.example.com`を自動発行
8. PRに自動的にデプロイURLをコメント

---

## 前提条件

### 必要なもの
1. **Kubernetesクラスタ**
   - 自前のクラスタ（Raspberry PiやミニPC）
   - または、GKE/EKS/AKSなどのマネージドサービス
   
2. **Cloudflareアカウント**
   - ドメインの管理用
   - API Tokenの発行

3. **Google Cloud Platformアカウント**
   - Container Registry (GCR)の使用
   - サービスアカウントキーの作成

4. **GitHubリポジトリ**
   - GitHub Actionsの使用

### 必要な環境変数（GitHubシークレット）
| 環境変数名 | 説明 | 取得方法 |
|-----------|------|----------|
| `ARGOCD_TOKEN` | ArgoCD APIトークン | ArgoCDの設定から生成 |
| `GCP_SA_KEY` | GCPサービスアカウントキー | GCP IAMから作成・ダウンロード |
| `KUBECONFIG_CONTENT` | Kubernetesクラスタの接続情報 | `~/.kube/config`の内容 |

---

## 環境構築

### 6.1 Kubernetes環境のセットアップ

#### オプションA: 自前のクラスタ構築
<!-- ここに記載する内容 -->
- ミニPC3台でのクラスタ構築例 (自宅の写真を挿入予定)
- RaspberryPiでの構築も可能


#### オプションB: マネージドKubernetes（GKE）
<!-- ここに記載する内容 -->
```bash
# GKEクラスタの作成例
gcloud container clusters create my-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-2

# kubectlの設定
gcloud container clusters get-credentials my-cluster --zone us-central1-a
```

#### オプションC: マネージドKubernetes（EKS）
<!-- ここに記載する内容 -->
```bash
# EKSクラスタの作成例（eksctl使用）
eksctl create cluster \
  --name my-cluster \
  --region us-west-2 \
  --nodes 3 \
  --node-type t3.medium

# kubectlの設定
aws eks update-kubeconfig --name my-cluster --region us-west-2
```

#### k8sクラスタのセットアップ

- 参考リポジトリ: [k8s-cluster](https://github.com/AobaIwaki123/k8s-cluster)
  - このリポジトリを使えばどこで立てるかに関わらず基本的なセットアップが直ぐに完了する
  - このリポジトリのREADMEを参考にしてブログに引用する
  - このリポジトリを流行らせていきたい気持ちを綴る

#### 動作確認
```bash
# クラスタ情報の確認
kubectl cluster-info

# ノードの確認
kubectl get nodes

# Namespaceの確認
kubectl get namespaces
```

---

### 6.2 ArgoCD環境のセットアップ

#### ArgoCDのインストール
```bash
# Namespaceの作成
kubectl create namespace argocd

# ArgoCDのインストール
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# ArgoCD CLIのインストール（macOS）
brew install argocd

# または（Linux）
curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x /usr/local/bin/argocd
```

#### 初期パスワードの取得とログイン
```bash
# 初期パスワードの取得
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port Forwardでアクセス
kubectl port-forward svc/argocd-server -n argocd 8080:443

# ブラウザで https://localhost:8080 にアクセス
# ユーザー名: admin
# パスワード: 上記で取得したパスワード
```

#### APIトークンの作成
```bash
# CLIでログイン
argocd login localhost:8080

# トークンの生成
argocd account generate-token --account admin
```

このトークンをGitHubシークレット`ARGOCD_TOKEN`に設定する。

---

### 6.3 Cloudflare Ingress Controllerのセットアップ

#### なぜCloudflare Ingress Controllerなのか
- ドメインをYAMLに書くだけで自動発行
- SSL証明書の自動設定（Let's Encrypt不要）
- DDoS保護が標準で有効
- 無料プランでも十分な機能

#### インストール手順
<!-- ここに記載する内容 -->
詳細は[k8s-clusterリポジトリ](https://github.com/AobaIwaki123/k8s-cluster)の手順`1'`まで実施。

概要：
1. Cloudflare APIトークンの作成
2. Cloudflare Tunnel Controllerのインストール
3. Ingressリソースの作成

#### サンプルIngress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
  annotations:
    # Cloudflareの設定
spec:
  rules:
  - host: example.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: example-service
            port:
              number: 80
```

---

### 6.4 動作確認

#### 基本的なアプリケーションのデプロイ
<!-- ここに記載する内容 -->
```bash
# Namespaceの作成
kubectl create namespace test-app

# サンプルアプリのデプロイ
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: test-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx
  namespace: test-app
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx
  namespace: test-app
spec:
  rules:
  - host: test.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx
            port:
              number: 80
EOF

# デプロイの確認
kubectl get pods -n test-app
kubectl get svc -n test-app
kubectl get ingress -n test-app

# ブラウザで https://test.yourdomain.com にアクセス
```

#### ArgoCDでの管理
<!-- ここに記載する内容 -->
```bash
# ArgoCD Applicationの作成
argocd app create test-app \
  --repo https://github.com/your-username/your-repo.git \
  --path k8s/manifests \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace test-app

# 同期
argocd app sync test-app

# 状態確認
argocd app get test-app
```

---

## 実装編

### 7.1 GitHub Actionsワークフローの作成

#### 全体の流れ
1. **`.github/workflows/push.yml`**: ブランチプッシュ時にイメージビルド・マニフェスト生成
2. **`.github/workflows/create-argo-app.yml`**: ArgoCD Applicationの作成・同期
3. **`.github/workflows/deploy.yml`**: mainブランチのデプロイ

---

### 7.2 ブランチ固有のマニフェスト管理

#### `.github/workflows/push.yml`の詳細
<!-- ここに記載する内容 -->

**ワークフローの役割：**
- ブランチごとにDockerイメージをビルド
- GCRにプッシュ
- Kubernetesマニフェストをブランチ固有に変換
  - `metadata.name` → `<app-name>-<branch-name>`
  - `namespace` → `<branch-name>`
  - `image` → `gcr.io/<project>/<app-name>:<branch-name>-<sha>`

**サンプルコード：**
```yaml
name: Build and Push Branch Image

on:
  push:
    branches-ignore:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Authenticate to GCR
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Configure Docker for GCR
        run: gcloud auth configure-docker

      - name: Extract branch name
        id: branch
        run: echo "BRANCH_NAME=${GITHUB_REF#refs/heads/}" >> $GITHUB_OUTPUT

      - name: Build and Push Docker Image
        run: |
          BRANCH_NAME=${{ steps.branch.outputs.BRANCH_NAME }}
          IMAGE_TAG=gcr.io/${{ secrets.GCP_PROJECT_ID }}/journee:${BRANCH_NAME}-${GITHUB_SHA::7}
          docker build -t $IMAGE_TAG -f Dockerfile.prod .
          docker push $IMAGE_TAG

      - name: Generate Branch-specific Manifests
        run: |
          BRANCH_NAME=${{ steps.branch.outputs.BRANCH_NAME }}
          mkdir -p k8s/manifests-${BRANCH_NAME}
          
          # Copy base manifests
          cp -r k8s/manifests/* k8s/manifests-${BRANCH_NAME}/
          
          # Update metadata.name and namespace
          sed -i "s/name: journee/name: journee-${BRANCH_NAME}/g" k8s/manifests-${BRANCH_NAME}/*.yml
          sed -i "s/namespace: default/namespace: ${BRANCH_NAME}/g" k8s/manifests-${BRANCH_NAME}/*.yml
          
          # Update image tag
          sed -i "s|image: gcr.io/.*/journee:.*|image: gcr.io/${{ secrets.GCP_PROJECT_ID }}/journee:${BRANCH_NAME}-${GITHUB_SHA::7}|g" k8s/manifests-${BRANCH_NAME}/deployment.yml
          
          # Update ingress host
          sed -i "s/host: .*/host: ${BRANCH_NAME}.yourdomain.com/g" k8s/manifests-${BRANCH_NAME}/ingress.yml

      - name: Commit and Push Manifests
        run: |
          BRANCH_NAME=${{ steps.branch.outputs.BRANCH_NAME }}
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add k8s/manifests-${BRANCH_NAME}/
          git commit -m "Update manifests for branch ${BRANCH_NAME}"
          git push
```

---

### 7.3 ArgoCD Applicationの自動作成

#### `.github/workflows/create-argo-app.yml`の詳細
<!-- ここに記載する内容 -->

**ワークフローの役割：**
- ブランチごとにNamespaceを作成
- ArgoCD Applicationを作成
- 自動同期の設定

**サンプルコード：**
```yaml
name: Create ArgoCD Application

on:
  workflow_run:
    workflows: ["Build and Push Branch Image"]
    types:
      - completed

jobs:
  create-argo-app:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Extract branch name
        id: branch
        run: echo "BRANCH_NAME=${GITHUB_REF#refs/heads/}" >> $GITHUB_OUTPUT

      - name: Install ArgoCD CLI
        run: |
          curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
          chmod +x /usr/local/bin/argocd

      - name: Set up kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubeconfig
        run: |
          echo "${{ secrets.KUBECONFIG_CONTENT }}" | base64 -d > $HOME/.kube/config

      - name: Create Namespace
        run: |
          BRANCH_NAME=${{ steps.branch.outputs.BRANCH_NAME }}
          kubectl create namespace ${BRANCH_NAME} --dry-run=client -o yaml | kubectl apply -f -

      - name: Login to ArgoCD
        run: |
          argocd login ${{ secrets.ARGOCD_SERVER }} \
            --auth-token ${{ secrets.ARGOCD_TOKEN }} \
            --insecure

      - name: Create ArgoCD Application
        run: |
          BRANCH_NAME=${{ steps.branch.outputs.BRANCH_NAME }}
          
          argocd app create journee-${BRANCH_NAME} \
            --repo https://github.com/${{ github.repository }}.git \
            --path k8s/manifests-${BRANCH_NAME} \
            --dest-server https://kubernetes.default.svc \
            --dest-namespace ${BRANCH_NAME} \
            --sync-policy automated \
            --auto-prune \
            --self-heal \
            || echo "Application already exists"

      - name: Sync Application
        run: |
          BRANCH_NAME=${{ steps.branch.outputs.BRANCH_NAME }}
          argocd app sync journee-${BRANCH_NAME} --force
```

---

## 運用編

### ブランチのライフサイクル

#### ブランチ作成時
1. 通常通りブランチを作成
2. プッシュすると自動的に環境が構築される
3. `<branch-name>.yourdomain.com`でアクセス可能に

#### レビュー時
1. PRにブランチのURLが自動的にコメントされる（オプション）
2. レビュアーはURLにアクセスして動作確認
3. ブランチを切り替える必要なし

#### マージ時
1. PRをマージ
2. ブランチを削除
3. 対応するArgoCD Applicationとリソースも自動削除（オプション）

### リソースのクリーンアップ

#### 削除用のワークフロー
```yaml
name: Cleanup Branch Resources

on:
  delete:
    branches:
      - '*'

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Extract branch name
        id: branch
        run: echo "BRANCH_NAME=${GITHUB_REF#refs/heads/}" >> $GITHUB_OUTPUT

      - name: Delete ArgoCD Application
        run: |
          BRANCH_NAME=${{ steps.branch.outputs.BRANCH_NAME }}
          argocd app delete journee-${BRANCH_NAME} --cascade

      - name: Delete Namespace
        run: |
          BRANCH_NAME=${{ steps.branch.outputs.BRANCH_NAME }}
          kubectl delete namespace ${BRANCH_NAME}
```

### コスト管理
- ブランチが増えるとリソースも増える
- 定期的な棚卸しとクリーンアップが重要
- 未使用ブランチの自動削除スクリプト導入を推奨
  - これは自分もまだ実装してしないので、ブログの今後の展望に加えたい

---

## まとめ

### 実現できたこと
- ✅ ブランチプッシュだけで独立環境が自動構築
- ✅ 各ブランチが独自のURLを持つ
- ✅ ブランチ移動なしで複数PRを同時レビュー
- ✅ GitOpsによる宣言的で信頼性の高いデプロイ
- ✅ AI駆動開発との高い親和性

### 今後の発展
- Ephemeral環境（一定期間後自動削除）の実装
- プレビュー環境へのBasic認証追加
- コメントでのデプロイ制御（ChatOps）
- メトリクス・ログの集約

### 参考リンク
- [本プロジェクトのリポジトリ](https://github.com/your-username/journee)
- [Kubernetesクラスタ構築リポジトリ](https://github.com/AobaIwaki123/k8s-cluster)
- [ArgoCD公式ドキュメント](https://argo-cd.readthedocs.io/)
- [Cloudflare Tunnel Controller](https://github.com/cloudflare/cloudflare-ingress-controller)

---

## 著者について
<!-- 自己紹介・SNSリンクなど -->

---

**質問・フィードバックは[GitHub Issues](https://github.com/your-username/journee/issues)までお願いします！**

