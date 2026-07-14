# Operational Runbooks

Step-by-step procedures for deployments and incidents.

| Runbook | Description |
|---------|-------------|
| **[Pilot kickoff](./pilot-kickoff.md)** | **Start here** — closed pilot: deploy, Stripe, email, invite users |
| **[Pilot VPS day-by-day](./pilot-vps-day-by-day.md)** | **Granular checklist: R2, email, Stripe, deploy** |
| **[Pilot feedback](./pilot-feedback.md)** | Google Form setup, invite copy, check-in scripts |
| **[OVH VPS deploy](./ovh-vps-deploy.md)** | Docker deploy on OVH for `sellnearby.ie` |
| [Troubleshooting](../troubleshooting.md) | Local dev: ports, API, DB, Prisma, Docker |
| [Deploy](./deploy.md) | Deploy to dev, staging, production |
| [Rollback](./rollback.md) | Revert a bad deployment |
| [Restore backup](./restore-backup.md) | Disaster recovery |
| [Scaling](./scaling.md) | Horizontal scaling & capacity |

## On-call quick reference

```bash
# Health
curl https://api.<env>/api/health/ready

# Queue depth
curl https://api.<env>/api/health/queues

# K8s rollout status
kubectl rollout status deployment/<prefix>-api -n <namespace>
```

## Escalation

1. Check Grafana alerts (error rate, latency, queue backlog)
2. Review API logs (Pino JSON → Loki)
3. Rollback if user-facing regression
4. Restore from backup if data corruption
