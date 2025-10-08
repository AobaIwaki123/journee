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
