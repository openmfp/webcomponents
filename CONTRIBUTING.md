# Contributing

We want to make contributing to this project as easy and transparent as possible.

## Our development process

We use GitHub to track issues and feature requests, as well as accept pull requests.

## Pull requests

You are welcome to contribute with your pull requests. These steps explain the contribution process:

1. Fork the repository and create your branch from `main`.
2. [Add tests](#testing) for your code.
3. If you've changed APIs, update the documentation.
4. Make sure the tests pass. Our GitHub actions pipeline is running the unit tests for your PR and will indicate any issues.
5. Sign your commits with the Developer Certificate of Origin (DCO) — see below.

## Building

Run `npm run build` to build the project.
The build artifacts will be stored in the `dist/` directory.

## Testing

> **NOTE:** You should always add tests when contributing code.

Run `npm test` to execute the unit tests.

## Code Quality

```bash
# Lint
npm run lint

# Format
npm run format
```

## Issues

We use GitHub issues to track bugs. Please ensure your description is
clear and includes enough instructions to reproduce the issue.

## License

By contributing to this project, you agree that your contributions will be licensed
under its [Apache-2.0 license](LICENSE).
