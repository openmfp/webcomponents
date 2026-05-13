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
