# Atlas Adaları — Focus Hunt

Atlas Adaları is now the main Focus Hunt at `/play/kids/focus-hunt` and
`/play/teen/focus-hunt` after `pnpm dev` (default origin `http://localhost:3000`).
`/play/focus-hunt` redirects to the Kids route. The approved 54-second game is
unchanged. `/play/kids/focus-hunt/visual-lab` uses exactly the same `RunnerGame`
with development labels. The old space game remains at
`/play/kids/focus-hunt/classic` (also available for Teen), using its original
120-second configuration and flight controls. No classic files were removed.
Classic is intentionally not linked from the main Atlas UI.

## Play

Models load before the start button becomes available. Click “Parkura başla”.
The ship advances automatically for 54 active seconds across a 972 m course.
Use arrow keys/A–D, move the mouse inside the canvas, or touch and drag horizontally.
Steering is relative to the curved track. Ramps launch automatically. There are
three physical gaps, ballistic jumps, gravitational descent and damped landings.
Cross gold stars; avoid the other six models. The finish line opens the result screen.
Escape, the pause button or leaving the browser pauses the course; resuming is explicit.
An interrupted visible trial closes without a response. Unseen stimuli are not recorded.

Nine reusable 108 m modules provide start island, curves, ramps, arch passage,
tunnel, viaduct and finish gate. `course.ts` supplies both the rendered road
surface and the collision/flight simulation. The course never loops.

## Measurement boundary

`LabSession` delegates classification, adaptive blocks and summary/scoring to the
existing Focus Hunt exports. It does not implement another scoring formula or
modify the common engine. Its first model draw calls `presented(performance.now())`;
a swept ship interception calls `respond(..., performance.now())`. The existing
response windows and target rate are used. A per-trial guard prevents repeat rewards.
Only a correct responded gold trial increments the lab reward counter and pickup FX.

The lab deliberately changes travel, controls and presentation; its results are
experimental and not psychometrically equivalent to standard Focus Hunt. Results
use the existing summary fields/calculation but remain in memory, outside clinician
history and production localStorage. This route does not create clinical norms.

## Performance and verification

Physics uses a 120 Hz fixed step; render frames do not allocate new model geometry.
Models/materials are cloned once; shared GLTF geometry/textures remain cached.
Cloned materials and custom road geometries are disposed on unmount. HUD updates
are throttled to 10 Hz, and the 3D subtree is memoized. Geometry frustum culling
and depth fog restrict the visible world. The fixed, short course needs no endless
pool. Low quality disables real shadows and uses DPR 1; desktop caps DPR at 1.5.
Reduced motion disables camera roll and dynamic FOV. Asset download is about 17 MB
before browser cache; a lighter mobile asset set remains a useful follow-up.

Run production checks separately:

```sh
./node_modules/.bin/vitest run src/features/focus-hunt/engine/focus-hunt.test.ts src/features/focus-hunt/visual-lab/production-contract.test.ts
```

Run the parkur adapter/physics checks:

```sh
./node_modules/.bin/vitest run src/features/focus-hunt/visual-lab/course.test.ts src/features/focus-hunt/visual-lab/session-adapter.test.ts src/features/focus-hunt/visual-lab/runtime.test.ts
```

The automated full-run test uses synthetic draw acknowledgements and steering.
It covers finish at 30/60/120 simulated FPS, three launches/landings, gold-only
rewards/FX, omissions, commissions, duplicate guards and pre-draw exclusion.
Synthetic Kids/Teen event replays compare complete records and summaries with the
shared engine. These tests are not browser render or measured GPU performance tests.

Validation at implementation time: production 6/6; lab 20/20. New-code ESLint,
Prettier and diff checks pass. Next compiles, but project type-checking remains
blocked by the three difficulty narrowing errors in `focus-hunt-game.tsx`, observed
before this task. Baseline full suite was 63/64 (Selective Attention adaptive test).
The local server is blocked by `listen EPERM`, so visual/browser/mobile QA and a
gameplay recording have not been performed. Do not treat this as visual acceptance.
