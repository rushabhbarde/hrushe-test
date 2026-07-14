# HRUSHE Backup Restore Drill Template - 2026-07-13

Do not include database credentials, connection strings, cookies, JWTs, OTPs, or full customer PII in this report.

## Drill Metadata

- Backup timestamp:
- Restore timestamp:
- Restore duration:
- Database size:
- Source environment:
- Restore environment:
- Operator:
- Result: Not run

## Verification Checklist

- Users restored.
- Products restored.
- Orders restored.
- Verification codes restored appropriately.
- Product reservation fields restored.
- Paise fields restored.
- Admin workspace version restored.
- Reconciliation fields restored.
- Indexes can be recreated.
- Application starts against restored data.
- `/healthz` responds correctly.
- `/readyz` responds correctly.
- One test product can be read.
- One test order can be read.
- No production notifications or emails are triggered from restored staging data.

## Issues

- None recorded yet.
