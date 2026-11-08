# Bytebeam Fleet Status Dashboard

A React + TypeScript implementation of the Bytebeam Fleet Status take-home assignment.

## Requirements implemented

- Loads the supplied `telemetry.json` locally when the app starts; no backend.
- One fleet row per truck, latest SOC, speed, last-seen timestamp and status.
- Search by truck ID and filter by all four assignment statuses.
- Click a truck to open signal details, per-signal age/stale state and SOC history.
- Status text is always visible; status is not communicated by colour alone.
- Responsive layout for desktop and mobile.

## Telemetry processing

All processing is in `src/utils/fleet.ts`, outside React components:

1. De-duplicate packets by `packet_id`.
2. Find the newest event time in the complete de-duplicated dataset.
3. Group packets by `vehicle_id` and sort by `event_time` descending.
4. Find the newest packet that actually contains each signal independently. Missing keys are not converted to zero.
5. A signal is stale only when its newest reading is **more than** 10 minutes older than the newest event time in the full file. Exactly 10 minutes is still fresh.
6. A truck is `No recent data` when it has no fresh signals. Otherwise, a fresh SOC below 10% is `Critical battery`; a fresh SOC below 20% is `Low battery`; all other cases are `OK`. Stale SOC never triggers a battery status.
7. SOC history includes all distinct SOC-bearing packets, sorted by event time ascending.

The input file's newest event time is used as the reference clock because the assignment defines freshness relative to the newest event in the file, not the wall-clock time when the browser is opened.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Tests and production build

```bash
npm test
npm run build
npm run preview
```

Unit tests cover duplicate packet IDs, out-of-order packets, missing signals, independent signal freshness, battery thresholds, no-recent-data status and the 10-minute boundary.

## Project structure

```text
src/
  components/
    SignalCard.tsx
    StatusBadge.tsx
    VehicleDetail.tsx
  data/
    telemetry.json
  test/
    setup.ts
  utils/
    fleet.ts
    fleet.test.ts
  App.tsx
  main.tsx
  styles.css
  types.ts
```

## Product and UI decisions

- A dark operations-console visual theme keeps dense fleet data readable.
- Summary cards surface fleet health before the operator scans individual rows.
- Search and status filters are placed directly above the fleet table.
- Status labels include text and an icon/dot; colour is only supplementary.
- Per-signal ages make partial telemetry and stale values explicit.
- The truck detail view separates current signal state from historical SOC trend.
- No extra alert acknowledgement or replay feature was added; the core assignment behaviour takes priority.

## Known limitations / possible improvements

- The supplied file is a static snapshot; this implementation does not simulate live packet arrival.
- The dashboard's “last seen” is the latest packet event time for that truck. Per-signal ages are calculated separately.
- For a production system, telemetry ingestion, clock-skew handling, pagination/virtualization, alert acknowledgement persistence, accessibility testing and end-to-end tests would be useful next steps.
- The assignment does not define a special status for a truck with fresh speed but no SOC; this implementation treats it as `OK` because it has fresh telemetry and no fresh low-battery reading.

## AI tool disclosure

AI assistance was used to help plan the component structure, draft the telemetry transformation and test cases, and review the assignment rules. The implementation should be reviewed, run, tested and understood by the candidate before submission. Add the actual AI conversation export/share link required by the assignment before submitting.
