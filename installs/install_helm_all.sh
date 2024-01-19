helm upgrade --install gpu-12a ci/helm-chart -f values.yaml -n gpu-12a
helm upgrade --install gpu-12b ci/helm-chart -f values.yaml -n gpu-12b
helm upgrade --install gpu-12c ci/helm-chart -f values.yaml -n gpu-12c
helm upgrade --install gpu-12d ci/helm-chart -f values.yaml -n gpu-12d
echo "gpu-12a: $(kubectl get secret --namespace gpu-12a gpu-12a-code-server -o jsonpath="{.data.password}" | base64 --decode)"
echo "gpu-12b: $(kubectl get secret --namespace gpu-12b gpu-12b-code-server -o jsonpath="{.data.password}" | base64 --decode)"
echo "gpu-12c: $(kubectl get secret --namespace gpu-12c gpu-12c-code-server -o jsonpath="{.data.password}" | base64 --decode)"
echo "gpu-12d: $(kubectl get secret --namespace gpu-12d gpu-12d-code-server -o jsonpath="{.data.password}" | base64 --decode)"