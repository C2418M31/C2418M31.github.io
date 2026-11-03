# Growth Protocol — Systems Thinking

> **Everything in here is a concept.** The specifics — mechanics, rewards, targets, tiers and
> timing — will change as each idea gets tested and validated. Treat the numbers as illustrative,
> not committed. The thinking behind each system is the point, not the exact detail.

## Priority Tiers

Tiers describe **what has to exist before a feature can work** — not how valuable it is.

| Tier | Meaning |
| --- | --- |
| **T1** | Can start right away. Launches on its own, with no other feature in place. Produces the user behaviour data everything else is built on. |
| **T2** | Needs T1 running first. Requires T1 features live and generating data. Does **not** depend on any T2 or T3 feature. |
| **T3** | Needs the ecosystem mature. Requires critical mass of users, signed partners, physical infrastructure, **or a mature T2 feature**. |

The rule that keeps this honest: **if a feature needs another feature of the same tier to be
mature, it belongs one tier higher.**

## Launch Mode vs. Full Mode

Every system is described twice — the stripped-back version that can ship first, and the
version once the surrounding ecosystem is feeding it.

- **T1 Launch Mode** — works standalone, no dependencies needed
- **T1 Full Mode** — enhanced by T2/T3 inputs when they come online
- **T2 Launch Mode** — works with T1 infrastructure available, but without T3 inputs
- **T2 Full Mode** — enhanced by T3 inputs and mature T1 data
- **T3 Launch Mode** — works with T1+T2 ecosystem in place
- **T3 Full Mode** — fully connected to the entire system

## Files

- `home.html` — overview-first view: 5 pillars, then the system map. Own maintenance
  screen; the "2" in "ESTIMATED DURATION" deactivates it for the current browser
  session only (sessionStorage) and reveals this page's own dashboard content.
- `index2.html` — dashboard view, straight into the node detail. This is the real
  working dashboard, with no maintenance gate.
- `index.html` — a dedicated, static maintenance page (no React/dashboard code).
  The "2" in "ESTIMATED DURATION" navigates to `home.html`.
- `home.html` and `index2.html` share an identical 35-node dataset; edit them together.
