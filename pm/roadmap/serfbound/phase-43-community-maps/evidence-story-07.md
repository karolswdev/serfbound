# Evidence — SB-43-07 — Gallery, Library, and Device Gate

**Date:** 2026-06-22.
**Status:** done.

## Files changed

- `packages/app/src/online-config.ts` — adds `mapsUrl` and `?mapsApi=`
  endpoint resolution.
- `packages/app/src/community-map-library-store.ts` — adds the
  `serfbound-custom-maps` IndexedDB library store and operation helpers.
- `packages/app/src/main.ts` — adds the Community maps shell panel,
  editor-publish bridge, gallery/library state, PNG thumbnail wrapper,
  download/play/rate/report handlers, and map-play editor closeout.
- `packages/app/src/styles.css` — adds token-based community map panel,
  controls, cards, and thumbnails.
- `tests/ci/online-config.test.mjs` — pins `/maps` default and
  `?mapsApi=` override behavior.
- `tests/ci/app-maps-client.test.mjs` — adds local library helper
  contract coverage.
- `tests/browser/community-maps.spec.ts` — browser gate against local
  identity + maps services.

## Verification

Focused unit/service gate:

```text
npm run build && node --test tests/ci/online-config.test.mjs tests/ci/app-maps-client.test.mjs tests/ci/service-maps.test.mjs
1..14
# tests 14
# pass 14
# fail 0
```

Focused browser gate:

```text
CI=1 npm run build:web && CI=1 npx playwright test tests/browser/community-maps.spec.ts --project=chromium
1 passed
```

Broad non-browser gates:

```text
npm run test:unit && npm run check:boundaries && npm run check:design
1..343
# tests 343
# pass 343
# fail 0
serfbound-boundaries-ok
serfbound-design-tokens-ok: 44 tokens defined, 44 consumed, 0 reserved, raw-color ratchet 0/0.
```

Full browser gate:

```text
CI=1 npm run test:browser
37 passed
```

Docs gate:

```text
npm run test:docs
serfbound-docs-ok: player, developer, and static hosting docs cover required release topics.
```

## Acceptance check

- [x] Publish from the open editor map is signed by the device key and
  accepted by the maps service.
- [x] Gallery browse renders the published card with a sprite-free
  PNG thumbnail.
- [x] Rating and reporting use signed map actions.
- [x] Download saves the map into the local library.
- [x] Library play starts a running local game with the downloaded
  custom map and the player's imported data.
- [x] Sign-in for maps does not depend on the mailbox service.
