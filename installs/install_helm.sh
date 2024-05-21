# helm upgrade --install code-server ci/helm-chart -f test-values.yaml
# helm upgrade --install gpu-12c ci/helm-chart -f values-test.yaml -n gpu-12c
# helm upgrade --install gpu-12a ci/helm-chart -f values-test.yaml -n gpu-12a
# helm upgrade --install gpu-12b ci/helm-chart -f values-cpu.yaml -n gpu-12b
# helm upgrade --install gpu-1 ci/helm-chart -f values-1gpu.yaml -n gpu-1
# helm upgrade --install cs-ridwan ci/helm-chart -f values-test.yaml -n cs-ridwan --create-namespace
# helm upgrade --install cs-akhmed ci/helm-chart -f values-akhmed.yaml -n cs-akhmed --create-namespace
# helm upgrade --install cs-omar ci/helm-chart -f values-1gpux.yaml -n cs-omar --create-namespace
helm upgrade --install cs-cpu-1 ../ci/helm-chart -f values-base-docker.yaml -n cs-cpu-1 --create-namespace
helm upgrade --install cs-cpu-chip ../ci/helm-chart -f values-base-docker.yaml -f values-ws-mounts.yaml -n cs-cpu-chip --create-namespace
helm upgrade --install cs-cpu-qinghao ../ci/helm-chart -f values-base-docker.yaml -n cs-cpu-qinghao --create-namespace
helm upgrade --install cs-ws-gpu1 ../ci/helm-chart -f values-base-docker.yaml -f values-4gpu.yaml -f values-ws89.yaml -f values-ws-mounts.yaml -n cs-ws-gpu1 --create-namespace
helm upgrade --install cs-ws-gpu2 ../ci/helm-chart -f values-base-docker.yaml -f values-4gpu.yaml -f values-ws89.yaml -f values-ws-mounts.yaml -n cs-ws-gpu2 --create-namespace
helm upgrade --install cs-ws-gpu3 ../ci/helm-chart -f values-base-docker.yaml -f values-1gpu.yaml -f values-ws89.yaml -f values-ws-mounts.yaml -n cs-ws-gpu3 --create-namespace



## Bright Cluster
helm upgrade --install cs-ridwan2 ../ci/helm-chart -f values-base-docker.yaml -f values-4gpu.yaml -f values-bright-mounts.yaml -n cs-ridwan2 --create-namespace
helm upgrade --install cs-chong ../ci/helm-chart -f values-base-docker.yaml -f values-1gpu.yaml -f values-bright-mounts.yaml -n cs-chong --create-namespace

## K3S
helm upgrade --install cs-gpu-chip ../ci/helm-chart -f values-base-docker.yaml -f values-1gpu.yaml -n cs-gpu-chip --create-namespace

## AIOS
helm upgrade --install cs-akhmed ../ci/helm-chart -f values-base-docker.yaml -f values-4gpu.yaml -f values-bright-mounts.yaml -n cs-akhmed --create-namespace
helm upgrade --install cs-ridwan ../ci/helm-chart -f values-base-docker.yaml -f values-3gpu.yaml  -f values-bright-mounts.yaml -n cs-ridwan --create-namespace
helm upgrade --install cs-hanshuo ../ci/helm-chart -f values-base-docker.yaml -f values-1gpu.yaml  -f values-bright-mounts.yaml -n cs-hanshuo --create-namespace


## AIOS-ws
helm upgrade --install cs-gpu-chip ../ci/helm-chart -f values-base-docker.yaml -f values-1gpu-shared.yaml -n cs-gpu-chip --create-namespace
