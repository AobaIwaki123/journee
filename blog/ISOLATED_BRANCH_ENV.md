---
title : "【AI駆動開発】まだレビューする時にブランチ移動してるの？ブランチごとに独立環境を立てて爆速開発する方法"
emoji : "⚡"
type : "tech" # tech : 技術記事 / idea : アイデア
topics : ["kubernetes","argocd","zennfes2025infra","cloudflare"]
published : true
---

## 😱 ブランチを切り替えるたびに「儀式」をしていませんか？

正直、しんどいですよね。
ブランチを切り替えるたびに、ローカル環境の再構築地獄が始まる問題。

PRのレビュー依頼が来た → `git checkout feature/xxx` → 依存関係が違うから`npm install` → ローカルサーバー立ち上げ → やっと確認できる → 次のPR見たいからまた`git checkout` → また`npm install...`

せっかくCursorやDevinなど自律型AI Agentの登場により、1人で同時に10個、20個のブランチを管理するなんていうことも現実味を帯びてきたというのに、レビューと確認のフローがボトルネックになっていたら本末転倒です。

そこで大きな役割を果たすのが、**ブランチごとに独立した環境を自動で立ち上げ、それぞれに固有のURLを割り当てる仕組み**です。
これにより、ブランチを切り替えることなく、URLにアクセスするだけで各ブランチの動作を確認できるようになります。
大企業では一般的なプレビュー環境ですが、**個人開発でここまでの仕組みを構築している例はまだ少ない**のが現状かと思います。
そこで本記事では、KubernetesとArgoCDを活用し、GitHub Actionsで完全自動化する方法を、実際のコードとともに詳しく解説していきます。

**この記事を読むことでできるようになること：**
- ブランチ移動なしで複数PRを同時レビュー
- 各ブランチの動作を独立したURLで確認（例：`feature-123.example.com`）
- CI/CDパイプラインの高速化と自動化
- PRクローズ時の自動クリーンアップ（リソース管理の完全自動化）
- AI駆動開発での並列タスク処理が劇的に効率化
- ステークホルダーへのプレビュー共有が簡単に

## なぜブランチごとに独立環境が必要なのか

### 具体的にどんな問題があるのか

想像してみてください。あなたは今、Cursor AIに5つの機能を同時に作らせています。

- ブランチA：ユーザー認証機能
- ブランチB：コメント機能
- ブランチC：PDF出力機能
- ブランチD：検索機能
- ブランチE：通知機能

それぞれのブランチでコードは順調に進んでいます。
しかし、レビューしようとした瞬間に地獄が始まります。

```bash
# ブランチAを確認
git checkout feature/auth
npm install  # 依存関係が違う...待ち時間
npm run dev  # ポート3000で起動

# 確認完了。次はブランチB
git checkout feature/comments
npm install  # また待つ...
npm run dev  # また起動

# あれ、ブランチAの動作ってどうだったっけ？
git checkout feature/auth
# また最初から...
```

これ、**時間の無駄**ですよね。
しかも、ローカルで複数のブランチを同時に立ち上げようとすると、ポートの競合やメモリ不足に悩まされます。

### 独立環境があると何が変わるのか

ブランチごとに独立した環境とURLがあれば、こうなります：

- `feature-auth.example.com` ← ブランチAの環境（常時稼働）
- `feature-comments.example.com` ← ブランチBの環境（常時稼働）
- `feature-pdf.example.com` ← ブランチCの環境（常時稼働）

ブランチを切り替える必要なし。URLにアクセスするだけで各ブランチの動作が確認できます。

**さらに、** 複数のブラウザタブで同時に開いて、機能を比較することだってできます。
「こっちのデザインの方が良かったかも」と感じた場合には、即座に見比べて比較することができます。

### ステークホルダーへの共有も爆速に

「この機能、どんな感じか見てもらえますか？」ってときに、URLをSlackに投げるだけでOKです。
従来であれば、

- スクリーンショットを撮る
- または動画を録画する
- またはZoomで画面共有する

などする必要がありました。
一方、独立環境があれば

1. URLを共有するだけ（終わり）

相手は自分のペースで確認できるし、フィードバックももらいやすい。
特にデザイナーやPMとの協働がスムーズになるかと思います。
自分は個人開発なのであまり関係ないですが、**新機能を友達に見せつつフィードバックをもらう**ということに活用しています。

### AI駆動開発の時代だからこそ

AI駆動開発では、**開発速度が圧倒的に上がります**。
Cursor AIが1日で5機能を同時に進めてくれるなんてのは、もう普通になってきました。
Issue Driven開発を活用している人の中には、自動で開発を進めている人も多いかと思います。

しかし、レビューと確認のフローが旧態依然のままだったら？
せっかくの高速開発が台無しになります。
AIが高速化してくれた分、**確認作業もスケールさせないと意味がない**んです。

個人開発だからこそ、1人で10ブランチ、20ブランチを同時に管理する時代です。
そのような状況では、ブランチごとの独立環境が開発体験を左右する重要な要素になると考えています。
特に新規プロジェクト立ち上げ時は複数の機能開発が同時進行するので、その恩恵は非常に大きいです。

## 想定読者

### このブログが役立つ人
- `kubectl`コマンドを使ったことがある、または学習意欲がある
- Kubernetesの基本概念を理解している
- ブランチごとのデプロイに興味があるが実装方法がわからなかった
- 個人開発でCI/CDを構築したい
- AI駆動開発で複数タスクを並列処理している

### 想定しないレベル
- Docker/Kubernetesを全く触ったことがない方
  - （ただし、興味があれば環境構築の参考にはなります）

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
- **ArgoCD**: GitOpsツール
- **Cloudflare Tunnel Controller**: ドメイン自動発行・SSL自動設定
- **Google Container Registry (GCR)**: コンテナイメージレジストリ
- **GitHub Actions**: CI/CDパイプライン

### ワークフロー

**環境構築時：**
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

**環境削除時：**
1. PRをマージまたはクローズ
2. GitHub ActionsがArgoCD Applicationを削除（関連リソースも一緒に削除）
3. ブランチ固有のマニフェストディレクトリを削除
4. PRにクリーンアップ完了を通知

![](https://storage.googleapis.com/zenn-user-upload/1b52f2dcf4b9-20251010.png)

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

## 環境構築

### 6.1 Kubernetes環境のセットアップ

#### オプションA: 自前のクラスタ構築

私はミニPC3台で自宅にKubernetesクラスタを構築しています（写真を挿入予定）。
やったことはありませんが、RaspberryPiでの構築も可能なはずです。
オンプレk8sクラスタ構築に挑戦する場合は、[k8s-cluster](https://github.com/AobaIwaki123/k8s-cluster)を参考にしてみてください。
`k0sctl`というツールを使ったクラスタ構築の手順を解説しています。
SSHが理解できるなら実装できる程度のシンプルな手順なので興味があればぜひチェックしてみてください。

**メリット：**
- 無料で運用可能（電気代のみ）

**デメリット：**
- 初期設定の手間
- メンテナンスが必要
- 可用性は自己責任 (おうちインフラ使っているとクラウドのありがたみが身に沁みます...)

**我が家のミニPCインフラ**

![](https://storage.googleapis.com/zenn-user-upload/8225a5d8c034-20251010.jpeg)

#### オプションB: マネージドKubernetes（GKE）

> **注意**: 以下のチュートリアルはAIによって作成されました。公式ドキュメントも併せてご確認ください。

```bash
# GKEクラスタの作成例
gcloud container clusters create my-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-2

# kubectlの設定
gcloud container clusters get-credentials my-cluster --zone us-central1-a
```

**メリット：**
- セットアップが簡単
- 高可用性
- Google Cloudとの統合

**デメリット：**
- コストがかかる
- Google Cloudアカウント必須

#### オプションC: マネージドKubernetes（EKS）

> **注意**: 以下のチュートリアルはAIによって作成されました。公式ドキュメントも併せてご確認ください。

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

**メリット：**
- AWSエコシステムとの統合
- エンタープライズグレード

**デメリット：**
- コストがかかる
- AWSアカウント必須

#### k8sクラスタのセットアップ

どのオプションを選んでも、基本的なセットアップは共通です。

**参考リポジトリ: [k8s-cluster](https://github.com/AobaIwaki123/k8s-cluster)**

このリポジトリは、Kubernetesクラスタの基本的なセットアップを自動化するために作成しました。
どこでクラスタを立てるかに関わらず、このリポジトリを使えば以下のような基本的なセットアップがすぐに完了します：

- **ArgoCD**: GitOpsデプロイ
- **Cloudflare Tunnel Controller**: ドメイン自動発行

個人開発でここまでのインフラを簡単にセットアップできるのは、本当に便利です。
ぜひ使ってみてください！
このリポジトリをもっと多くの人に知ってもらい、**個人開発のインフラ構築のハードルを下げていきたい**と思っています。

詳細なセットアップ手順はリポジトリのREADMEを参照してください。**手順1まで進めれば、ArgoCDとCloudflare Tunnel Controllerが動作する環境が整います。**（以下でも同様の手順を説明しています）

#### k8sクラスタの動作確認
```bash
# クラスタ情報の確認
kubectl cluster-info

# ノードの確認
kubectl get nodes

# Namespaceの確認
kubectl get namespaces
```

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

#### Ingress で公開するための SSL リダイレクトの無効化

```sh
kubectl apply -n argocd -f manifests/argocd-cmd-params-cm.yml
kubectl rollout restart deployment argocd-server -n argocd # ArgoCDサーバーを再起動
```

#### ArgoCD の Service を NodePort に変更

ArgoCDサーバーにアクセスできるなら必ずしもNodePortを使う必要はありません。
個人的にはこれが一番簡単だと思っています。
よくわからない場合は、Cloudflare Ingress Controllerで公開した後に初期パスワードの設定などを行っても大丈夫です。

```sh
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort"}}'
```

#### 初期パスワードの取得とログイン

```sh
argocd admin initial-password -n argocd # 初期パスワードの取得
gQz9mVAdH7UgkdyI
argocd login argocd.example.com
argocd account update-password
Current Password: gQz9mVAdH7UgkdyI
New Password: <NEW_PASSWORD>
Repeat New Password: <NEW_PASSWORD>
```

#### APIトークンの作成

トークンを発行するには、事前にArgoCDの設定を変更する必要があります。

**1. ConfigMapを適用してAPIキーを有効化**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  accounts.admin: login,apiKey
```

このConfigMapを適用します：

```bash
kubectl apply -f argocd-configmap.yaml

# ArgoCDサーバーを再起動して設定を反映
kubectl rollout restart deployment argocd-server -n argocd
```

**2. トークンの生成**

```bash
# CLIでログイン
argocd login argocd.example.com:8080

# トークンの生成
argocd account generate-token --account admin
```

このトークンをGitHubシークレット`ARGOCD_TOKEN`に設定します。

### Cloudflare Ingress Controllerのセットアップ後

Cloudflare経由でArgoCDを公開します。
こうすることで、GitHub Actionsなど外部サービスからKubernetesクラスタ上のArgoCDにアクセスできるようになります。

```yaml
# ArgoCDサーバーを外部に公開するための Ingress 設定
# Cloudflare Tunnel Ingress Controller を使用して外部からアクセス可能にする
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    # SSL リダイレクトを無効化 - ArgoCDサーバーが insecure モードで動作するため
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
    # バックエンドプロトコルを HTTP に指定
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
spec:
  # Cloudflare Tunnel Ingress Controller を使用
  ingressClassName: "cloudflare-tunnel"
  
  rules:
  # 公開ホスト名の設定
  - host: argocd.example.com
    http:
      paths:
      # ルートパス以下のすべてのリクエストを ArgoCDサーバーに転送
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 80  # ArgoCDサーバーの HTTP ポート
```

ArgoCDサーバーを外部に公開するためのIngress設定を適用します。
これにより、Cloudflare Tunnelを通じてArgoCD UIとAPIにアクセスできるようになります。

```sh
kubectl apply -f manifests/ingress.yml
```

### 6.3 Cloudflare Tunnel Controllerのセットアップ

#### なぜCloudflare Tunnel Controllerなのか

従来のIngress Controllerと比較して、Cloudflare Tunnel Controllerには圧倒的なメリットがあります：

**メリット：**
- **ドメインをYAMLに書くだけで自動発行**（DNS設定不要！）
- **SSL証明書の自動設定**（Let's Encrypt不要）
- **DDoS保護が標準で有効**（Cloudflareのネットワークを経由）
- **無料プランでも十分な機能**
- **プライベートIPでも公開可能**（Tunnelを使用）
- **ファイアウォールの穴あけ不要**（アウトバウンド接続のみ）

これは特に、自宅サーバーや企業ネットワーク内でKubernetesを運用している場合に絶大な効果を発揮します。

#### インストール手順

**前提条件：**
1. Cloudflareアカウントの作成・ドメインの追加
2. Cloudflare Tunnelの作成（Cloudflareダッシュボードで）
3. Cloudflare API Tokenの作成（Zone:Zone:Read, Zone:DNS:Edit, Account:Cloudflare Tunnel:Edit 権限）

**ArgoCD Applicationでのデプロイ：**

```yaml
# cloudflare-tunnel-controller.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: cloudflare-tunnel-ingress-controller
  namespace: argocd
spec:
  project: default
  
  # Helm チャートのソース設定
  source:
    repoURL: https://helm.strrl.dev
    chart: cloudflare-tunnel-ingress-controller
    targetRevision: 0.0.12
    
    helm:
      valuesObject:
        cloudflare:
          # Cloudflare API トークン
          apiToken: YOUR_CLOUDFLARE_API_TOKEN
          # Cloudflare アカウント ID
          accountId: YOUR_CLOUDFLARE_ACCOUNT_ID
          # Cloudflare Tunnel 名（事前作成が必要）
          tunnelName: cf-tunnel-ingress-controller

  # デプロイ先の設定
  destination:
    server: https://kubernetes.default.svc
    namespace: cloudflare-tunnel-ingress-controller
  
  # 自動同期の設定
  syncPolicy:
    automated:
      prune: true     # 不要なリソースを自動削除
      selfHeal: true  # ドリフトを自動修正
    syncOptions:
      - CreateNamespace=true    # Namespace自動作成
      - ServerSideApply=true   # Server-side applyを使用
```

**適用方法：**

```bash
# ArgoCD Applicationを作成
argocd app create --file ./argocd/cloudflare-tunnel-ingress-controller.yml

# デプロイ状況を確認
argocd app get cloudflare-tunnel-ingress-controller

# または kubectl で確認
kubectl get pods -n cloudflare-tunnel-ingress-controller
```

> **Note**: このセットアップは初回のみ必要です。一度設定すれば、以降はIngressリソースを作成するだけで自動的にドメインが発行されます。

#### サンプルIngress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  namespace: my-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-cloudflare
spec:
  ingressClassName: "cloudflare-tunnel"
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app
            port:
              number: 80
```

実際に公開するにはServiceやDeploymentなどが必要となりますが、Cloudflare Ingress Controllerのセットアップは以上となります。



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
  name: nginx-ingress
  namespace: test-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-cloudflare
spec:
  ingressClassName: "cloudflare-tunnel"
  rules:
  - host: test-app.example.com 
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
  --dest-namespace test-app \
  --revision main # ブランチ名

# 同期
argocd app sync test-app

# 状態確認
argocd app get test-app
```

#### ArgoCD上での見た目

![](https://storage.googleapis.com/zenn-user-upload/34e82ad0746b-20251010.png)

#### リソースのクリーンアップ

動作確認が完了したら、作成したリソースをクリーンアップしましょう。

**ArgoCD Applicationの削除：**

```bash
# ArgoCD Applicationを削除（管理しているリソースも一緒に削除）
argocd app delete test-app --cascade
```

**オプション：Namespaceごと削除**

```bash
# Namespaceを削除（中のすべてのリソースも削除される）
kubectl delete namespace test-app
```

**確認：**

```bash
# ArgoCD Applicationが削除されたことを確認
argocd app list | grep test-app

# Namespaceが削除されたことを確認
kubectl get namespace test-app
# Error from server (NotFound): namespaces "test-app" not found
```

> **Note**: `--cascade` オプションを使うと、ArgoCD Applicationが管理しているKubernetesリソース（Deployment、Service、Ingressなど）も自動的に削除されます。これにより、クリーンアップが簡単になります。

## 実装編

### 7.1 GitHub Actionsワークフローの作成

#### 全体の流れ
1. **`.github/workflows/push.yml`**: ブランチプッシュ時にイメージビルド・マニフェスト生成
2. **`.github/workflows/create-argo-app.yml`**: ArgoCD Applicationの作成・同期
3. **`.github/workflows/deploy.yml`**: mainブランチのデプロイ
4. **`.github/workflows/destroy.yml`**: PRクローズ時にリソース削除

#### ディレクトリ構成

実装の全体像を理解するため、まずディレクトリ構成を見ていきましょう。

```
k8s/
├── manifests/                    # メインブランチ用のマニフェスト
│   ├── deployment.yml           # アプリケーションのDeployment
│   ├── service.yml              # Service定義
│   ├── ingress.yml              # Ingress定義（ドメイン設定）
│   └── kustomization.yml        # Kustomize設定
├── manifests-<hash>/            # ブランチ固有のマニフェスト（動的生成）
│   ├── deployment.yml           # リソース名が`<app>-<hash>`に変更される
│   ├── service.yml
│   ├── ingress.yml
│   └── kustomization.yml
├── argocd/                      # メインブランチ用のArgoCD Application
│   └── app.yml                  # ArgoCD Application定義
└── argocd-<hash>/               # ブランチ固有のArgoCD Application（動的生成）
    └── app.yml
```

**キーポイント：**
- メインブランチ（main）は`manifests/`と`argocd/`を使用
- 各ブランチは`manifests-<hash>/`と`argocd-<hash>/`を動的に作成
- `<hash>`はブランチ名から生成されるMD5ハッシュの最初の6文字

#### サンプルコード

実際のマニフェストファイルの例を見ていきましょう。

**deployment.yml（メインブランチ用）**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: my-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      imagePullSecrets:
        - name: gcr-pull-secret
      containers:
        - name: my-app
          image: gcr.io/my-project/my-app:v1.0.0
          env:
            # Secretから環境変数を注入
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: my-app-secrets
                  key: DATABASE_URL
            - name: API_KEY
              valueFrom:
                secretKeyRef:
                  name: my-app-secrets
                  key: API_KEY
          ports:
            - containerPort: 3000
```

**service.yml**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
  namespace: my-app
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 3000
```

**ingress.yml**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  namespace: my-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-cloudflare
spec:
  ingressClassName: "cloudflare-tunnel"
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app
            port:
              number: 80
```

**kustomization.yml**

```yaml
resources:
- deployment.yml
- service.yml
- ingress.yml
```

**argocd/app.yml**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/your-username/my-app'
    targetRevision: HEAD
    path: k8s/manifests
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: my-app
  syncPolicy:
    automated:
      selfHeal: true
      prune: true
```

これらのファイルが、GitHub Actionsによってブランチ固有のリソース名に変換されます。例えば：

- `my-app` → `my-app-a1b2c3`
- `my-app.example.com` → `my-app-a1b2c3.example.com`

次のセクションで、この変換を自動化する方法を見ていきましょう。

### 7.2 ブランチ固有のマニフェスト管理

#### `.github/workflows/push.yml`の詳細

**ワークフローの役割：**
1. ブランチごとにDockerイメージをビルド・GCRにプッシュ
2. Kubernetesマニフェストをブランチ固有に変換
3. 変換したマニフェストをコミット・プッシュ
4. ArgoCD同期をトリガー

**キーポイント：ブランチハッシュの生成**

ブランチ名をそのままリソース名に使うと、長すぎたり特殊文字が含まれる問題があります。そこで、ブランチ名からMD5ハッシュの最初の6文字を生成し、それを使用します：

```bash
BRANCH="feature/add-new-component"
BRANCH_HASH=$(echo -n "$BRANCH" | md5sum | cut -c1-6)
# 例: "a1b2c3"
```

これにより、どんなブランチ名でも短くユニークなIDに変換できます。

- スラッシュなどが削除されるため安全
- 同じ長さに統一されるため、理解しやすい

**実際のワークフローコード：**

```yaml
name: push
run-name: Push Branch Image to GCR

on:
  push:
    branches-ignore:
      - main
    paths:
      - "app/**"
      - "components/**"
      - "lib/**"
      # ... その他のパス

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  GCR_REGISTRY: gcr.io
  PROJECT_ID: my-gcp-project
  IMAGE_NAME: my-app

jobs:
  # まず ArgoCD Application を作成（初回のみ）
  create-argo-app:
    uses: ./.github/workflows/create-argo-app.yml
    secrets: inherit
    with:
      branch: ${{ github.ref_name }}

  # Dockerイメージのビルド・プッシュ
  push:
    needs: [create-argo-app]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate branch hash
        run: |
          BRANCH="${{ github.ref_name }}"
          BRANCH_HASH=$(echo -n "$BRANCH" | md5sum | cut -c1-6)
          echo "BRANCH_HASH=$BRANCH_HASH" >> $GITHUB_ENV

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.GCR_REGISTRY }}
          username: _json_key
          password: ${{ secrets.GCP_SA_KEY }}

      - name: Push image to GCR
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ./Dockerfile.prod
          push: true
          tags: ${{ env.GCR_REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.IMAGE_NAME }}:${{ env.BRANCH_HASH }}-${{ env.SHORT_SHA }}

  # マニフェストの更新
  update-deployment-manifest:
    runs-on: ubuntu-latest
    needs: [push]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate branch hash
        run: |
          BRANCH="${{ github.ref_name }}"
          BRANCH_HASH=$(echo -n "$BRANCH" | md5sum | cut -c1-6)
          echo "BRANCH_HASH=$BRANCH_HASH" >> $GITHUB_ENV

      - name: Install yq
        run: |
          sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
          sudo chmod +x /usr/local/bin/yq

      - name: Update deployment manifest
        run: |
          yq -i '.spec.template.spec.containers[0].image = "${{ env.GCR_REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.IMAGE_NAME }}:${{ env.BRANCH_HASH }}-${{ env.SHORT_SHA }}"' k8s/manifests-${{ env.BRANCH_HASH }}/deployment.yml

      - name: Commit and push deployment manifest
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add .
          git commit -m "Update deployment manifest"
          git push

  # ArgoCD同期
  sync:
    runs-on: ubuntu-latest
    needs: [update-deployment-manifest]
    steps:
      - name: Trigger ArgoCD sync via API
        env:
          ARGOCD_TOKEN: ${{ secrets.ARGOCD_TOKEN }}
        run: |
          curl -X POST https://argocd.example.com/api/v1/applications/${{ env.IMAGE_NAME }}-${{ env.BRANCH_HASH }}/sync \
            -H "Authorization: Bearer $ARGOCD_TOKEN" \
            -H "Content-Type: application/json"
```

**キーポイント：**

1. **paths指定**: ビルドが不要なファイルの変更では実行されない
2. **concurrency**: 同じブランチへの複数プッシュは最新のみ実行

### 7.3 ArgoCD Applicationの自動作成

#### `.github/workflows/create-argo-app.yml`の詳細

**ワークフローの役割：**
1. ArgoCD Applicationが既に存在するかチェック
2. 存在しない場合のみ、以下を実行：
   - ブランチ固有のマニフェストディレクトリを作成
   - リソース名をハッシュ付きに変更
   - ArgoCD Applicationを作成
   - PRに自動的にデプロイURLをコメント

このワークフローは何度実行しても安全です。既にApplicationが存在する場合はスキップされます。これにより、ブランチへの複数回のプッシュでも問題ありません。

**実際のワークフローコード（抜粋）：**

```yaml
name: Create ArgoCD Application

on:
  workflow_call:
    inputs:
      branch:
        required: true
        type: string

jobs:
  check-and-create-app:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate branch hash
        id: branch_hash
        run: |
          BRANCH="${{ inputs.branch }}"
          BRANCH_HASH=$(echo -n "$BRANCH" | md5sum | cut -c1-6)
          echo "hash=$BRANCH_HASH" >> $GITHUB_OUTPUT

      # ArgoCD Applicationの存在チェック
      - name: Check if ArgoCD Application exists
        id: check_app
        env:
          ARGOCD_TOKEN: ${{ secrets.ARGOCD_TOKEN }}
        run: |
          BRANCH_HASH="${{ steps.branch_hash.outputs.hash }}"
          APP_NAME="${{ env.IMAGE_NAME }}-$BRANCH_HASH"
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $ARGOCD_TOKEN" \
            https://argocd.example.com/api/v1/applications/$APP_NAME)
          
          if [ "$HTTP_CODE" = "200" ]; then
            echo "exists=true" >> $GITHUB_OUTPUT
          else
            echo "exists=false" >> $GITHUB_OUTPUT
          fi

      # マニフェストディレクトリの作成
      - name: Create manifests directory for branch
        if: steps.check_app.outputs.exists == 'false'
        run: |
          BRANCH_HASH="${{ steps.branch_hash.outputs.hash }}"
          cp -r k8s/manifests k8s/manifests-$BRANCH_HASH

      # yqでリソース名を更新
      - name: Update resource names in manifests
        if: steps.check_app.outputs.exists == 'false'
        run: |
          BRANCH_HASH="${{ steps.branch_hash.outputs.hash }}"
          MANIFEST_DIR="k8s/manifests-$BRANCH_HASH"
          
          # Deployment名の更新
          yq -i '.metadata.name = "my-app-'"$BRANCH_HASH"'"' "$MANIFEST_DIR/deployment.yml"
          
          # Service名とselectorの更新
          yq -i '.metadata.name = "my-app-'"$BRANCH_HASH"'"' "$MANIFEST_DIR/service.yml"
          yq -i '.spec.selector.app = "my-app-'"$BRANCH_HASH"'"' "$MANIFEST_DIR/service.yml"
          
          # Ingress名とホストの更新
          yq -i '.metadata.name = "my-app-'"$BRANCH_HASH"'"' "$MANIFEST_DIR/ingress.yml"
          yq -i '.spec.rules[0].host = "my-app-'"$BRANCH_HASH"'.example.com"' "$MANIFEST_DIR/ingress.yml"
          yq -i '.spec.rules[0].http.paths[0].backend.service.name = "my-app-'"$BRANCH_HASH"'"' "$MANIFEST_DIR/ingress.yml"
          
          # DeploymentのラベルとselectorMatchLabelsの更新
          yq -i '.metadata.labels.app = "my-app-'"$BRANCH_HASH"'"' "$MANIFEST_DIR/deployment.yml"
          yq -i '.spec.selector.matchLabels.app = "my-app-'"$BRANCH_HASH"'"' "$MANIFEST_DIR/deployment.yml"
          yq -i '.spec.template.metadata.labels.app = "my-app-'"$BRANCH_HASH"'"' "$MANIFEST_DIR/deployment.yml"

      # マニフェストをコミット
      - name: Commit and push manifests
        if: steps.check_app.outputs.exists == 'false'
        run: |
          BRANCH_HASH="${{ steps.branch_hash.outputs.hash }}"
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add k8s/manifests-$BRANCH_HASH
          git commit -m "🚀 Create ArgoCD manifests for branch (hash: $BRANCH_HASH)"
          git push

      # ArgoCD CLIのインストール
      - name: Install ArgoCD CLI
        if: steps.check_app.outputs.exists == 'false'
        run: |
          curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
          chmod +x /usr/local/bin/argocd

      # ArgoCD Applicationの作成（CLI使用）
      - name: Create ArgoCD Application
        if: steps.check_app.outputs.exists == 'false'
        env:
          ARGOCD_TOKEN: ${{ secrets.ARGOCD_TOKEN }}
        run: |
          BRANCH="${{ inputs.branch }}"
          BRANCH_HASH="${{ steps.branch_hash.outputs.hash }}"
          APP_NAME="my-app-$BRANCH_HASH"
          
          echo "🚀 Creating ArgoCD Application: $APP_NAME (branch: $BRANCH)"
          
          argocd app create -f k8s/argocd-$BRANCH_HASH/app.yml \
            --server argocd.example.com \
            --auth-token $ARGOCD_TOKEN \
            --grpc-web
          
          echo "✅ ArgoCD Application '$APP_NAME' created successfully"

      # PRにデプロイURLをコメント
      - name: Comment deployment URL on PR
        if: steps.check_app.outputs.exists == 'false'
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          BRANCH_HASH="${{ steps.branch_hash.outputs.hash }}"
          DEPLOYMENT_URL="https://my-app-$BRANCH_HASH.example.com"
          
          # PRを検索
          PR_NUMBER=$(gh pr list --head "${{ inputs.branch }}" --json number --jq '.[0].number')
          
          if [ -n "$PR_NUMBER" ]; then
            gh pr comment "$PR_NUMBER" --body "🚀 **Preview Deployment Created**
            
            **Branch:** \`${{ inputs.branch }}\`
            **Hash:** \`$BRANCH_HASH\`
            **URL:** $DEPLOYMENT_URL
            
            The preview environment will be available shortly."
          fi
```

**キーポイント：**

1. **ArgoCD CLI**: マニフェストファイルから直接Applicationを作成
2. **workflow_call**: 他のワークフローから呼び出し可能
3. **PRへの自動コメント**: GitHub CLIでURLを通知

## 運用編

### ブランチのライフサイクル

#### ブランチ作成時
1. 通常通りブランチを作成
2. プッシュすると自動的に環境が構築される
3. `<branch-name>.yourdomain.com`でアクセス可能に

#### レビュー時

1. PRにブランチのURLが自動的にコメントされる
2. レビュアーはURLにアクセスして動作確認
3. ブランチを切り替える必要なし

#### マージ・クローズ時

1. PRをマージまたはクローズ
2. GitHub Actionsが自動的に環境をクリーンアップ
   - ArgoCD Applicationを削除（関連リソースも一緒に削除）
   - マニフェストディレクトリを削除
   - PRにクリーンアップ完了を通知
3. 必要に応じてブランチを削除

### コスト管理

**注意点：**
- ブランチが増えるとKubernetesリソースも増える
- 各ブランチがPod、Service、Ingressを持つため、リソース消費に注意
- 定期的な棚卸しとクリーンアップが重要

### ブランチ環境の自動削除

PRがクローズされた際に、ブランチ環境を自動的に削除する仕組みを実装しています。

**`.github/workflows/destroy.yml`**

```yaml
name: Destroy ArgoCD Application
run-name: Destroy ArgoCD Application for ${{ github.event.pull_request.head.ref }}

on:
  pull_request:
    types: [closed]

permissions:
  contents: write
  pull-requests: write

env:
  ARGOCD_SERVER: argocd.example.com
  IMAGE_NAME: my-app

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          ref: main

      - name: Generate branch hash
        id: branch_hash
        run: |
          BRANCH="${{ github.event.pull_request.head.ref }}"
          BRANCH_HASH=$(echo -n "$BRANCH" | md5sum | cut -c1-6)
          echo "hash=$BRANCH_HASH" >> $GITHUB_OUTPUT
          echo "✅ Generated hash for branch '$BRANCH': $BRANCH_HASH"

      - name: Install ArgoCD CLI
        run: |
          curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
          chmod +x /usr/local/bin/argocd

      - name: Check if ArgoCD Application exists
        id: check_app
        env:
          ARGOCD_TOKEN: ${{ secrets.ARGOCD_TOKEN }}
        run: |
          BRANCH_HASH="${{ steps.branch_hash.outputs.hash }}"
          APP_NAME="${{ env.IMAGE_NAME }}-$BRANCH_HASH"
          
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $ARGOCD_TOKEN" \
            https://${{ env.ARGOCD_SERVER }}/api/v1/applications/$APP_NAME)
          
          if [ "$HTTP_CODE" = "200" ]; then
            echo "exists=true" >> $GITHUB_OUTPUT
          else
            echo "exists=false" >> $GITHUB_OUTPUT
          fi

      - name: Delete ArgoCD Application
        if: steps.check_app.outputs.exists == 'true'
        env:
          ARGOCD_TOKEN: ${{ secrets.ARGOCD_TOKEN }}
        run: |
          BRANCH_HASH="${{ steps.branch_hash.outputs.hash }}"
          APP_NAME="${{ env.IMAGE_NAME }}-$BRANCH_HASH"
          
          argocd app delete $APP_NAME \
            --server ${{ env.ARGOCD_SERVER }} \
            --auth-token $ARGOCD_TOKEN \
            --grpc-web \
            --yes

      - name: Delete manifests directories
        run: |
          BRANCH_HASH="${{ steps.branch_hash.outputs.hash }}"
          
          rm -rf "k8s/manifests-$BRANCH_HASH"
          rm -rf "k8s/argocd-$BRANCH_HASH"

      - name: Commit and push cleanup
        run: |
          BRANCH_HASH="${{ steps.branch_hash.outputs.hash }}"
          
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add k8s/
          git commit -m "🗑️ Cleanup ArgoCD manifests for branch (hash: $BRANCH_HASH)"
          git push

      - name: Comment cleanup status on PR
        if: steps.check_app.outputs.exists == 'true'
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          BRANCH_HASH="${{ steps.branch_hash.outputs.hash }}"
          PR_NUMBER="${{ github.event.pull_request.number }}"
          
          gh pr comment "$PR_NUMBER" --body "🗑️ **Preview Deployment Cleaned Up**
          
          **Branch:** \`${{ github.event.pull_request.head.ref }}\`
          **Hash:** \`$BRANCH_HASH\`
          
          The preview environment has been deleted."
```

**キーポイント：**

1. **PRクローズ時にトリガー**: `pull_request.types: [closed]`でマージ時・クローズ時に自動実行
2. **ArgoCD Application削除**: `--cascade`オプションで関連リソースも一緒に削除
3. **マニフェスト削除**: ブランチ固有のマニフェストディレクトリを削除
4. **PRへの通知**: クリーンアップ完了をPRにコメント

これにより、PRをマージ・クローズするだけで、ブランチ環境が完全に削除されます。手動での管理は不要です。

## まとめ

### 実現できたこと
- ブランチプッシュだけで独立環境が自動構築
- 各ブランチが独自のURLを持つ
- ブランチ移動なしで複数PRを同時レビュー
- GitOpsによる宣言的で信頼性の高いデプロイ
- PRクローズ時の自動クリーンアップ（リソース削除）
- AI駆動開発との高い親和性

### 参考リンク

**参考リポジトリ：**
- [k8s-clusterリポジトリ](https://github.com/AobaIwaki123/k8s-cluster) - Kubernetesクラスタ自動セットアップ

**公式ドキュメント：**
- [ArgoCD公式ドキュメント](https://argo-cd.readthedocs.io/)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Tunnel Controller（非公式）](https://github.com/cloudflare/cloudflare-ingress-controller)

この記事が役に立ったら、[k8s-clusterリポジトリ](https://github.com/AobaIwaki123/k8s-cluster)にスターをいただけると嬉しいです ⭐
