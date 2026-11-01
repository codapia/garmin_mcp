# Exercises Dataset integration — data / media license boundary

Upstream: https://github.com/hasaneyldrm/exercises-dataset
Attribution: © 2026 Hasan Emir Yıldırım.

## MIT-licensed information imported

Imported `public/data/exercises-dataset-mit.json`: exactly 1,324 exercises, preserving these fields:

| Field | Description |
| --- | --- |
| `id` | source exercise identifier |
| `n` | exercise name (English source) |
| `c`, `b` | category and body part |
| `e` | required equipment |
| `t`, `m`, `s` | target, group and secondary muscles |
| `es` | Spanish-language exercise instructions |

Renamed to compact keys to avoid a large bundle. The source file is
`data/exercises.json`, revision as retrieved on 2026-11-01.

The exercise metadata, instructions/translations and dataset structure are offered under the
MIT license by the project. Preserve copyright and license notices when redistributing substantial portions.

## Copyright notice (non-media)

MIT License

Copyright (c) 2026 Hasan Emir Yıldırım

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation and data files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

## Media explicitly NOT imported

The upstream `images/` thumbnails and `videos/` GIFs are © Gym visual
(https://gymvisual.com/). Upstream `LICENSE` contains a **media exception**:
the contributor's permission does not automatically authorize third parties
to redistribute, serve or embed them in their own project.

See:
- https://github.com/hasaneyldrm/exercises-dataset/blob/main/NOTICE.md
- https://github.com/hasaneyldrm/exercises-dataset/blob/main/LICENSE
- https://gymvisual.com/content/3-terms-and-conditions-of-use

**No image/GIF URL, image binaries or thumbnails were copied.** Their use in the Fitness
production domain must remain disabled pending a license granted to Codapia
that explicitly covers hosting and displaying the media in this app.

## Visualization

The `lib/exercises-dataset-catalog.tsx` muscle-map illustration is a new
approximate SVG region diagram authored for Fitness. Lime indicates primary
target muscle regions, cyan indicates secondary/synergist regions based on
the metadata. It does **not** measure electromyographic activation, exertion
or exact anatomical recruitment. Data labels retain the original names
where an accurate translation isn't available.

The Exercises Dataset catalog is deliberately separate from the official
Garmin codes. An identical or similar name alone does not authorize
scheduling an exercise to Garmin; explicit verified mapping is required.

## Deploy and test

- `npm run test:exercises` validates all 1,324 records and excludes media.
- `npm run typecheck` and `npm run build` validate the UI.
- No migrations, Garmin writes, external media calls or API credentials are required.
- When a valid media license is granted, a separate implementation will add an
  allowlisted, attributable asset manifest and licensed 180x180 GIFs; **do not**
  automatically download all upstream GIFs without this permission.
