# Pulled gate-verification reports

Device-playtest reports submitted from the deck (the **⇪ Submit report**
button) land here when you run:

```sh
SERFBOUND_REPORTS_TOKEN=<token> npm run pull:reports
```

Each file is one submitted run — the per-phase verdicts and notes the
maintainer recorded on a device. This is the shared work surface: the
maintainer plays and submits, the harness reads the files here, and
together we act on the fails (fix the engine, re-rig, re-run the gate).

Files are named `<received-timestamp>-<short-id>.md`. The token comes
from the cluster secret:

```sh
kubectl -n serfbound get secret reports-token -o jsonpath='{.data.token}' | base64 -d
```
