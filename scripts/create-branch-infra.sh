#!/bin/bash

BRANCH=$1
if [ -z "$BRANCH" ]; then
    echo "Usage: $0 <branch>"
    exit 1
fi

cp -r k8s/manifests k8s/manifests-${BRANCH}
cp -r k8s/argocd k8s/argocd-${BRANCH}
