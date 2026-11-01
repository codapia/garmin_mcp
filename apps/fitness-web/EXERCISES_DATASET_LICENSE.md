# Exercises Dataset metadata integration — licenses and boundaries

Upstream project: https://github.com/hasaneyldrm/exercises-dataset

Data source at import time:
- `data/exercises.json` Git blob: `3cbb77b678c40d7342897d38e4c61e9502f829a7`
- Author: Hasan Emir Yıldırım
- Original dataset count: 1,324 exercise records
- License for **data, tooling, and instructions/translations**: MIT, copyright © 2026 Hasan Emir Yıldırım.
- Original LICENSE: https://github.com/hasaneyldrm/exercises-dataset/blob/main/LICENSE

This integration imports the following **metadata only**:
`id, name, body_part, equipment, target, muscle_group, secondary_muscles, instructions_es`.

The imported file is `public/data/exercises-dataset-metadata.json`, deliberately
excluding original `gif_url`, `image`, `media_id`, and `attribution` fields
that point to proprietary media. The original dataset has 1,324 entries; the
optimized JSON metadata asset is fetched lazily only when the user opens the
**Músculos** catalog mode.

**PROPRIETARY MEDIA IS NOT LICENSED BY THIS PROJECT.** The upstream source
has written permission to distribute reduced-resolution Gym visual assets
within its own repository, not permission to sublicense them to us.

Source NOTICE: https://github.com/hasaneyldrm/exercises-dataset/blob/main/NOTICE.md

Gym visual Terms: https://gymvisual.com/content/3-terms-and-conditions-of-use

The Gym visual terms state that purchased, properly licensed images can be used
in applications and websites, while use of unlicensed/preview images and
redistribution are restricted. Before using any Gym visual GIFs in Fitness,
the rights holder must provide the appropriate license directly to the
owner of this deployment and its intended usage must be confirmed.

No Gym visual GIF, screenshot, thumbnail, derivative image, or CDN URL is
embedded, rehosted, proxied or fetched by this integration.

The display of exercise targets and synergists is educational metadata and
not a quantitative measurement of muscular activation. Exact correspondence
between a dataset exercise and a Garmin category/exercise code requires
manual review; this integration does not silently map approximate variants.

The existing independent self-hosted SVG exercises (Flow Exercise Dataset)
remain available in the other catalog tab, with their own provenance notice
in `EXERCISE_MEDIA.md`.
