# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue, discussion, or any other method with the owners of this repository before making a change.

Please note we have a code of conduct, please follow it in all your interactions with the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How to Contribute](#how-to-contribute)
3. [Development Setup](#development-setup)
4. [Style Guides](#style-guides)
5. [AI Policy](#ai-policy)

## Code of Conduct

Please read and follow our [Code of Conduct](code-of-conduct.md) to keep our community approachable and respectful.

## How to Contribute

### Reporting Bugs

If you find a bug in the project, please check if the bug is already reported. If not, open a new issue and include the following details:
- A clear and descriptive title.
- A detailed description of the bug.
- Steps to reproduce the bug.
- Any relevant logs, error messages, or screenshots.

### Suggesting Enhancements

If you have an idea for an enhancement or a new feature, please open an issue and describe:
- The problem you are trying to solve.
- The solution or enhancement you propose.
- Any alternatives you have considered.

### Submitting Pull Requests

The `develop` branch is used for ongoing development and should always be in sync with the `main` branch. All new features and bug fixes should be developed in feature branches created from `develop`, and pull requests should be submitted to the `develop` branch.

1. Fork the repository and create your branch from `develop`.
2. Ensure your code follows the project's coding standards.
3. If you have added or changed functionality, update the documentation accordingly.
4. Add or update automated tests when production behavior changes.
5. Run the relevant validation commands before opening a pull request:

```bash
npm run test
npm run build
```

6. Commit your changes with a descriptive commit message.
7. Push your branch to your fork and open a Pull Request to the `develop` branch of the repository.

Please ensure your pull request adheres to the following guidelines:
- Provide a clear description of what your pull request does.
- Include the issue number if your pull request addresses a specific issue.
- Review the changes to make sure they are well-tested and documented.
- Include screenshots or recordings when the change affects the UI.

The repository owner will:
1. Review and test the changes.
2. Merge the changes into the `main` branch after successful review and testing in the next version release.

## Development Setup

For local setup and validation details, see [local-development.md](local-development.md).

## Style Guides

For repository-specific engineering rules and coding conventions, see [style-guides.md](style-guides.md).

## AI Policy

If you use AI tools while contributing, follow [ai-policy.md](ai-policy.md).
