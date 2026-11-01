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
