# Releasing

This repository is **self-contained**: all build, test, and publish logic lives here (no
`openmfp/gha` reusable workflows). Pushes to `main` only build and test — they never publish.
Releases are cut manually.

The repo publishes two npm packages in lockstep at the same version, taken from the root
`package.json`:

- **`@openmfp/webcomponents`** — built to `dist/webcomponents`; includes the dashboard as its
  `./dashboard` export.
- **`@openmfp/ngx`** — built to `dist/ngx`.

A single release produces one git tag, one GitHub Release, and one `CHANGELOG.md` entry.

## How releases are secured

Releases publish via **npm Trusted Publishing (OIDC)** — no long-lived npm token. The `release` job
runs in a GitHub Environment named `release`, which is the primary release gate: it restricts
publishing to the `main` and `release/*` branches (and, if configured, requires human approval).

This matters because `workflow_dispatch` can be triggered by anyone with write access, the job
checks out `github.ref_name`, and `id-token: write` mints an npm-usable OIDC token. Trusted
Publishing binds to the _workflow file_, not to a branch, so without the environment gate a rogue
branch could publish arbitrary contents under our package names. Both packages share the same
neutral `release` environment name in their npm Trusted Publisher config, so npm only accepts a
token that carries the `release` environment claim.

The gate closes the widest hole — write-access → arbitrary publish — but is **not** a complete
guarantee: it does not vet the _contents_ of protected branches (rely on PR review + branch
protection), does not stop a compromised **admin**, and does not cover build-time supply-chain
compromise (mitigated by SHA-pinned actions + lockfile) or npm-side account takeover (mitigated by
npm 2FA/org controls).

## Normal release

1. Ensure `main` is green.
2. Go to _Actions → release → Run workflow_, select branch `main`.
3. Leave `dry-run` unchecked and `release-as` empty.
4. Run.

The workflow will: compute the next version from Conventional Commit PR titles since the last tag →
set the root version → build & test → write the version into `dist/ngx/package.json` → generate the
changelog section and insert it into `CHANGELOG.md` → **publish both packages to npm** →
commit/tag/push → publish a GitHub Release with the generated notes.

Publishing happens **before** the git tag is pushed, so a failed publish never leaves a tag pointing
at an unreleased version. If the tag/push step fails after a successful publish, simply re-run — npm
rejects duplicate versions, so the republish is a safe no-op.

Version increments follow Conventional Commits (see [CONTRIBUTING.md](CONTRIBUTING.md)):
`feat` → minor, `fix`/`perf` → patch, breaking → minor while on `0.x`. Housekeeping-only periods
produce no release (the workflow exits early).

## Preview (dry run)

To see the computed version and changelog **without** publishing, tagging, or committing:

- **CI:** run the `release` workflow with `dry-run` checked. The next version and changelog preview
  are written to the workflow run summary.
- **Local** (read-only):

  ```bash
  git cliff --bumped-version        # prints the next version
  git cliff --unreleased --bump     # prints the pending changelog
  ```

## Promoting to 1.0.0

Set the `release-as` input to `1.0.0` when running the workflow. This bypasses the pre-1.0
major→minor guard and ships the exact version. `release-as` accepts any explicit version.

## Backports

A normal release is just a tag on `main`. Long-lived release branches are created only when a
backport to an older line is actually needed.

To backport a fix to, e.g., the `0.18` line:

1. Branch from the relevant tag:

   ```bash
   git checkout -b release/0.18 0.18.7
   ```

2. Cherry-pick or merge the fix onto that branch and push it.
3. Run the `release` workflow **on branch `release/0.18`**.

The workflow is branch-aware (`github.ref_name`) and derives the baseline from the branch's own
history (`git describe --tags --abbrev=0`), so it computes the next `0.18.x` patch rather than
picking up newer tags from `main`. Because it reuses OIDC Trusted Publishing, backport branches
publish too.
