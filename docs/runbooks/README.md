# Operational Runbooks

Step-by-step procedures for deployments and incidents.

**Pilot / production start here (Compose on OVH):**

| Runbook | Description |
|---------|-------------|
| **[Pilot kickoff](./pilot-kickoff.md)** | Closed pilot: deploy, Stripe, email, invite users |
| **[Pilot VPS day-by-day](./pilot-vps-day-by-day.md)** | Granular checklist: R2, email, Stripe, deploy |
| **[OVH VPS deploy](./ovh-vps-deploy.md)** | Docker deploy on OVH for `sellnearby.ie` |
| **[Pilot feedback](./pilot-feedback.md)** | Google Form setup, invite copy, check-in scripts |

**Other:**

| Runbook | Description |
|---------|-------------|
| [Troubleshooting](../troubleshooting.md) | Local dev: ports, API, DB, Prisma, Docker |
| [Deploy](./deploy.md) | Optional K8s-oriented deploy notes (not primary for pilot) |
| [Rollback](./rollback.md) | Revert a bad deployment (Compose: `api` / `web` / `worker`) |
| **[Unified account rollback](./unified-account-rollback.md)** | Git tag `pre-unified-account-v1`, VPS redeploy, DB notes |
| [Restore backup](./restore-backup.md) | Disaster recovery |
| [Scaling](./scaling.md) | Horizontal scaling & capacity |

## On-call quick reference

```bash
# Health (Compose / VPS)
curl https://api.<domain>/api/health/ready
curl https://api.<domain>/api/health/live

# Queue depth
curl https://api.<domain>/api/health/queues

# Optional K8s (if used)
kubectl rollout status deployment/<prefix>-api -n <namespace>
```

## Escalation

1. Check Grafana alerts (error rate, latency, queue backlog) if observability is enabled
2. Review API logs
3. Rollback if user-facing regression
4. Restore from backup if data corruption
