# HRUSHE Staging Deployment Report

Reviewed on: 2026-07-24  
Status: `NOT EXECUTED`

## Summary

No exact release-candidate SHA was deployed to staging in Phase 4.

## Release Candidate

- Release branch: `release/hrushe-prelaunch`
- Starting SHA: `7585b15b003983e2c7d66fe6239c5249142f682f`
- Release-candidate commit SHA: `NOT CREATED`
- Immutable tag: `NOT CREATED`
- Working tree clean: no
- Frontend audit: failing

## Backend Staging Deployment

Status: `NOT EXECUTED`

Required evidence not captured:

- Render service id.
- Correct repository.
- Correct release branch or immutable SHA.
- Backend root directory.
- Build command.
- Start command.
- Node version.
- Health-check path.
- Environment group.
- Staging MongoDB.
- Razorpay test variables.
- Media-storage staging variables.
- Scheduler secret.
- Logging integration.
- Health result.

Blocker:

- Render CLI was not installed and Render MCP/Dashboard/API access was unavailable.

## Frontend Staging Deployment

Status: `NOT EXECUTED`

Vercel inspection evidence:

- Team id: `team_EvIEcptJT2DkpkH07qtUbSLE`
- Project id: `prj_ZCMRDtfpw0iYZVbDy5i0nFoZexkx`
- Project: `hrushe-test`
- Framework: `nextjs`
- Project Node version: `24.x`

Existing latest deployment:

- Deployment id: `dpl_BnbogvCXa1MmBH4HAKeEsAGLCDTk`
- URL: `hrushe-test-dtxn5xs2x-rushabhbardes-projects.vercel.app`
- State: `READY`
- Target: `production`
- Commit: `7585b15b003983e2c7d66fe6239c5249142f682f`
- Created: `2026-07-23T07:15:11.622Z`

This existing deployment does not count as Phase 4 staging evidence because it is production-target and not an immutable RC from the release branch.

No new Vercel deploy was created because no clean RC SHA exists and no backend staging target exists.

## Staging Smoke

Status: `NOT EXECUTED`

No deployed staging URLs were available for route, console, hydration, cookie, CSRF, auth, API timeout, image, layout, mobile overflow, or inventory checks.

## Decision Impact

Result: `NO-GO`.

The exact-SHA staging deployment gate remains unexecuted.

