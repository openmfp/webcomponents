# Contributing to webcomponents

We want to make contributing to this project as easy and transparent as possible.

## Development Setup

Prerequisites:

- Node.js >= 20.0.0
- npm >= 10.0.0

```bash
# Clone the repository
git clone https://github.com/openmfp/webcomponents.git
cd webcomponents

# Install dependencies
npm install
```

## Building

```bash
# Build all packages (ngx library + web components bundles)
npm run build

# Build the Angular library only
npm run build:ngx

# Build the web component bundles only
npm run build:wc

# Build in watch mode with yalc publish (for local testing with consumer apps)
npm run build:watch
```

Build artifacts are stored in the `dist/` directory.

## Testing

> **NOTE:** Always add tests when contributing code.

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

## Code Quality

```bash
# Lint
npm run lint

# Fix linting issues
npm run lint:fix

# Format with Prettier
npm run format

# Check formatting
npm run check-format
```

## Commit conventions & versioning

This repository squash-merges pull requests, so **the PR title becomes the commit that lands on
`main`**. That title must follow [Conventional Commits](https://www.conventionalcommits.org) — it
is the only message that drives versioning and the changelog. A required check lints the PR title
and blocks merge if it does not conform. Individual in-branch commits are not constrained.

Allowed types: `feat`, `fix`, `perf`, `docs`, `chore`, `ci`, `build`, `refactor`, `test`, `style`,
`revert`. The type determines the version increment on the next release:

| PR title                                                               | Increment        | Example (pre-1.0) |
| ---------------------------------------------------------------------- | ---------------- | ----------------- |
| `feat: …`                                                              | minor            | 0.18.11 → 0.19.0  |
| `fix: …` / `perf: …`                                                   | patch            | 0.18.11 → 0.18.12 |
| `feat!: …` or a `BREAKING CHANGE:` footer                              | minor (see note) | 0.18.11 → 0.19.0  |
| `docs:` `chore:` `ci:` `build:` `refactor:` `test:` `style:` `revert:` | none             | —                 |

> **Pre-1.0 breaking changes.** While the project is on `0.y.z` the public API is not considered
> stable (SemVer §4), so breaking changes bump the **minor** version rather than jumping to `1.0.0`.
> Promotion to `1.0.0` is a deliberate action via the release workflow's `release-as` input.

A period of only housekeeping PRs (`docs`/`chore`/…) intentionally produces no release. See
[RELEASING.md](RELEASING.md) for how releases are cut.

## Pull Requests

1. Fork the repository and create your branch from `main`.
2. Add tests for your code.
3. If you've changed APIs, update the documentation.
4. Make sure the tests pass.
5. Sign your commits with the Developer Certificate of Origin (DCO) — see below.

## Developer Certificate of Origin (DCO)

Contributors must sign off on their commits to certify they have the right to submit the code. Add a `Signed-off-by` trailer to every commit:

```bash
git commit -s -m "Your commit message"
```

This appends a line like `Signed-off-by: Your Name <your@email.com>` to the commit message. We use [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

The DCO check is enforced on all pull requests. Commits without a sign-off will fail CI.

## Issues

We use GitHub issues to track bugs and feature requests. Please ensure your description is clear and includes sufficient instructions to reproduce the issue.

## License

By contributing to webcomponents, you agree that your contributions will be licensed under the [Apache-2.0 license](LICENSE).
