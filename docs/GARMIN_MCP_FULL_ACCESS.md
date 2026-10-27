# Garmin MCP — Full tool access (Codapia)

**Status:** staged configuration change. All tools are exposed only **after** this branch is merged, deployed successfully in Coolify, the Cloudflare MCP server is resynced and ChatGPT refreshes the connection.

## Why

The existing production configuration uses `GARMIN_TOOL_PROFILE: minimal` with a small explicit extra-tool list and denylist. This prevents ChatGPT from accessing other tools already implemented in the project, including `delete_workout`, `delete_workouts`, `reschedule_workout`, `unschedule_workout` and `unschedule_workouts`.

The proposed Compose switches to:

```yaml
GARMIN_TOOL_PROFILE: all
```

It removes both `GARMIN_ENABLED_TOOLS` and `GARMIN_DISABLED_TOOLS`. All of these settings are composed by the server, so leaving an allowlist/denylist would still restrict the exported catalog. The underlying `tool_profiles.py` maps `all` to the full list of registered tools (155 in the reviewed README, but the live count must be verified).

## Security consequences

**Full access is much broader than workout management.** It also exposes write and destructive functions for Garmin activities, courses, gear, weight, nutrition and other health data. These are real account operations, not local simulations. Grant only to the intended user and connected client.

The Compose retains:

- Bearer protection via `GARMIN_MCP_HTTP_TOKEN` (secret value kept in Coolify).
- Cloudflare Tunnel and OAuth MCP portal on `mcp-garmin.codapia.cl`.
- Loopback-only VPS bind `127.0.0.1:18080:8000` (never change to public `0.0.0.0` on the host).
- Nonroot UID/GID 10001, read-only root filesystem, dropped Linux capabilities, `no-new-privileges`, resource limits and persistent Garmin token storage.

For irreversible changes, **request explicit user authorization for each concrete target**; do not use an open-ended daily automation to issue delete calls. `delete_workout` and `delete_workouts` in this project already support a preview with `confirm=false` and require `confirm=true` to delete. Do not assume every other destructive tool implements this preview gate. `unschedule_workout` and `unschedule_workouts` act on scheduled-entry IDs, not workout library IDs.

## What this does and does not provide

- The source code already provides `reschedule_workout`, `unschedule_workout` and `delete_workout`. They were omitted from the existing Coolify tool filter.
- There is **no identified direct workout-library update tool** for replacing the exercise structure of an existing workout ID. Editing a plan may require reading the original, uploading a revised workout as a new ID, rescheduling, and — with deliberate confirmation — removing the old version.
- The change does **not** install Garmin's official API, make a scheduler, build an adaptive trainer, or grant live device control.
- ChatGPT and Cloudflare may impose practical limits when presenting a large MCP catalog. A successful container deployment does not prove that all tools appear in the client.

## Controlled rollout / verification

1. Review branch diff. Confirm only filtering lines changed and all network/auth/hardening are preserved.
2. Merge after review; build and deploy the main branch using existing Coolify project `Garmin` and application `garmin_mcp`.
3. Verify `running:healthy`, no container restarts, logs without secret disclosure, `/healthz` success locally and unauthenticated request to `https://garmin.codapia.cl/mcp` returns HTTP 401.
4. In Cloudflare Zero Trust → AI Controls → MCP servers, **sync** the upstream server `garmin-connect` (upstream `https://garmin.codapia.cl/mcp`) and check status `ready`. The portal `mcp-garmin.codapia.cl` may need reconnection/refresh of permissions.
5. In ChatGPT, reload/refresh the Garmin Connect plugin and inspect whether the newly published tools appear: `delete_workout`, `delete_workouts`, `reschedule_workout`, `unschedule_workout`, `unschedule_workouts`. Confirm health read tools still work.
6. Verify only **non-destructive calls** initially: `get_workouts`, `get_scheduled_workouts`, `get_stats`, and `delete_workout(workout_id=<existing ID>, confirm=false)` which only previews. **Never issue `confirm=true` as a test**, and never use bulk deletion to prove availability.
7. Record the commit, deployment result and tool count in Craft under `Infraestructura - MCP Garmin`.

## Rollback

Use Coolify to redeploy the previous verified Git commit / Compose containing `GARMIN_TOOL_PROFILE: minimal`, `GARMIN_ENABLED_TOOLS` and `GARMIN_DISABLED_TOOLS`; resync the Cloudflare MCP upstream and refresh ChatGPT. No new OAuth credentials are required merely to change filters. The original repository history and existing Garmin records are not touched by changing the filter; data could be affected only if write/destructive tools are called afterward.

## For the proposed autonomous daily trainer

Prefer a dedicated restricted server or MCP profile for automation (read health and activities, create/schedule workouts only) while keeping all-powerful tools for manual/admin use. A daily agent should never receive unrestricted deletion of unrelated Garmin personal data. Implement idempotency, max one generated session per date, recovery safeguards, duplicate checks and audit logs before any unattended uploads.
