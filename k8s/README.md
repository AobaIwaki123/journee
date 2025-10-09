# k8sへのデプロイ方法

## GCRに接続するための認証情報をSecretに設定

```sh
$ kubectl create secret docker-registry gcr-pull-secret \
  --docker-server=gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat ./k8s/key.json)" \
  --docker-email=unused@example.com \
  --namespace=journee
```

## 環境変数の設定

```sh
$ cp k8s/manifests/secret.template.yml k8s/manifests/secret.yml
$ kubectl apply -f k8s/manifests/secret.yml
```

## デプロイ

```sh
$ kubectl apply -f k8s/manifests/
```

## ArgoCDでデプロイ

```sh
$ argocd app create -f ./k8s/argocd/app.yml --upsert
$ argocd app get journee-dev
$ argocd app sync journee-dev   # 手動で今すぐ同期したい時
```

## マルチブランチ認証について

ブランチごとに動的環境を作成する際、Google OAuthのリダイレクトURI制限を回避するため、**認証プロキシパターン**を実装しています。

詳細は [../docs/MULTI_BRANCH_AUTH.md](../docs/MULTI_BRANCH_AUTH.md) を参照してください。

### 認証サービスのデプロイ

```sh
# 認証サービス専用のPodをデプロイ
$ kubectl apply -f k8s/manifests/auth-service.yml

# Ingressの確認
$ kubectl get ingress -n journee
```

### URL構造

- 認証サービス: `auth.preview.aooba.net`
- Dev環境: `dev.preview.aooba.net`
- Feature環境: `feature-*.preview.aooba.net`
