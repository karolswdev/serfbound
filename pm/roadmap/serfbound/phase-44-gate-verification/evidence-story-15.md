# Evidence — SB-44-15 Fast-Forward in the Rig Debugger

## Browser-verified (real Chromium, real SPAU.PA, embedded rig)

```
ok - speed bar mounts in the embedded rig
ok - 20× sets game speed (serfboundGameSpeed=20)
ok - at 20× the rig staffs quickly (serfs=4 after 4s)
SPEED OK
```

`artifacts/rig-speed.png` — the embedded rig with the ⏸/1×/2×/4×/8×/20× bar
(active speed in gold), the rigged road staffing as the clock runs fast.

The bar wires to the engine's existing `setGameSpeed`/`gameSpeedMultiplier`
(the tick loop runs `8 * gameSpeedMultiplier` sim ticks per frame) — no engine
change.

## No regressions

```
tsc -b packages/app → exit 0
check:design → ratchet 0/0
```
