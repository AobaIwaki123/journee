# k8sへのデプロイ方法

## 環境変数の設定

```sh
$ cp k8s/manifests/secret.template.yml k8s/manifests/secret.yml
$ kubectl apply -f k8s/manifests/secret.yml
```

## デプロイ

```sh
$ kubectl apply -f k8s/manifests/
```
