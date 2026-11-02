# Exercise animation artwork / ilustraciones animadas

## Source / Fuente

- Project: **Flow Exercise Dataset**, by ozansozuozgit:
  https://github.com/ozansozuozgit/flow-exercise-dataset
- Original dataset: `data/exercises.json` and `assets/<id>/frame-0{0,1,2}.svg`.
- Original code/data license: MIT.
- Artwork: declared **CC0-1.0** by the source **only to the extent of rights held**:
  https://github.com/ozansozuozgit/flow-exercise-dataset/blob/main/ARTWORK-LICENSE
- Source provenance/caveats:
  https://github.com/ozansozuozgit/flow-exercise-dataset/blob/main/NOTICE.md

The repository explicitly states that **most original prompts/provenance are not preserved** and
the artwork is **not professionally verified coaching**. For these reasons, the artwork is
labelled *orientative*, no technical accuracy or complete legal clearance is claimed, and a
precise Garmin exercise mapping is required. Unknown variants remain without a video rather
than showing an unrelated demonstration.

## Packaged assets / Recursos incorporados

The 36 SVG files under `public/exercise-demos/<id>/` are self-hosted copies of the
source dataset's three frames for each of the following 12 records:

| Source ID | Source exercise name | Matched Garmin exercise |
| --- | --- | --- |
| 1760 | dumbbell goblet squat | SQUAT / GOBLET_SQUAT |
| 0381 | dumbbell rear lunge | LUNGE / DUMBBELL_REVERSE_LUNGE |
| 1379 | dumbbell seated calf raise | CALF_RAISE / WEIGHTED_SEATED_CALF_RAISE |
| 0276 | dead bug | HIP_STABILITY / DEAD_BUG |
| 0289 | dumbbell bench press | BENCH_PRESS / DUMBBELL_BENCH_PRESS |
| 0314 | dumbbell incline bench press | BENCH_PRESS / INCLINE_DUMBBELL_BENCH_PRESS |
| 0315 | dumbbell incline biceps curl | CURL / INCLINE_DUMBBELL_BICEPS_CURL |
| 0351 | dumbbell lying triceps extension | TRICEPS_EXTENSION / DUMBBELL_LYING_TRICEPS_EXTENSION |
| 1459 | dumbbell romanian deadlift | DEADLIFT / ROMANIAN_DEADLIFT (dumbbell variant) |
| 0405 | dumbbell seated shoulder press | SHOULDER_PRESS / DUMBBELL_SHOULDER_PRESS (seated variant) |
| 3144 | resistance band seated straight back row | BANDED_EXERCISES / ROW (seated variant) |
| 3123 | resistance band seated biceps curl | BANDED_EXERCISES / CURL (seated variant) |

These are **SVG frame animations**, visually looping like a GIF but not binary GIF files.
They are bundled in the Next.js `public/` folder to avoid external CDN, CORS, service-token,
API-key or third-party availability dependencies. The UI supports pause/play, reduced-motion
accessibility, lazy loading, preload and load-error fallback. Unmatched exercises are not
automatically associated with a visually similar but potentially incorrect variant.

The animations are decorative/educational references, not a substitution for individual
technique evaluation, instruction by a professional, or medical advice.


## Complete Flow library for the Exercises Dataset catalog (2026-11-01)

In addition to the 12 manually verified Garmin demonstrations, the independent
Exercises Dataset catalog uses a pinned Flow snapshot at commit
`961bb2739015da373daa43b960c28ee839fe93e6`.

`npm run sync:flow` downloads that snapshot **during the Docker build** and
copies SVG frames into `public/flow-demos/<id>/frame-0{0,1,2}.svg`. It writes
`public/data/flow-animation-index.json` with only **ID and exercise-name
verified** matches against the bundled MIT exercise catalog. It does not
copy frames or GIFs from Gym visual. No external media servers are called by
browsers: the assets are self-hosted and remain behind Fitness's Cloudflare
Access protection.

The expected source coverage is 1,257 animated exercises and 67 instructions-only
exercises (plus any ID/name mismatches skipped for safety). These are short
loops of three stylized **SVG frames**, not bitmap GIF files, and are not
technically or medically validated exercise demonstrations.

The source declares CC0 to the extent of the rights it holds. Its NOTICE.md
records insufficient prompt provenance for 1,244 out of 1,257 sequences.
Private deployment does **not** change the copyright status of third-party
content. Keep the upstream notices available and reassess if future evidence
indicates any artwork is not authorized for use.
