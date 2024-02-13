export NS=cs-ciai-ws-gpu1
helm uninstall $NS -n $NS
sleep 10
helm upgrade --install $NS ../ci/helm-chart -f values-base-docker.yaml -f values-1gpu.yaml -n $NS --create-namespace
echo $(kubectl get secret --namespace $NS "$NS-code-server" -o jsonpath="{.data.password}" | base64 --decode)
kubectl get svc -n $NS
watch -n 1 kubectl get po -n $NS