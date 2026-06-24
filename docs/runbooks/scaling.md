# Runbook: Scaling

## Kubernetes HPA

HPAs defined in `infra/k8s/base/hpa.yaml`:

| Deployment | Min | Max | Metric |
|------------|-----|-----|--------|
| api | 2 | 10 | CPU 70% |
| web | 2 | 8 | CPU 70% |
| worker | 1 | 6 | CPU 75% |

```bash
kubectl get hpa -n community-marketplace
kubectl describe hpa api-hpa -n community-marketplace
```

## Manual scale

```bash
kubectl scale deployment/prod-api --replicas=5 -n community-marketplace
kubectl scale deployment/prod-worker --replicas=3 -n community-marketplace
```

## When to scale workers

Monitor `bullmq_queue_waiting` metric. Scale workers when:

- Waiting jobs > 100 for 10+ minutes
- Reindex jobs backlog growing

## Data layer

| Service | Scaling approach |
|---------|------------------|
| PostgreSQL | Vertical scale or read replicas (future) |
| Redis | Increase memory; cluster for HA (future) |
| Meilisearch | Dedicated node; horizontal replicas |

## Related

- [Infrastructure](../infrastructure/README.md)
- [Deploy](./deploy.md)
