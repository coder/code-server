# Contributing

Headscale is "Open Source, acknowledged contribution", this means that any contribution will have to be discussed with the maintainers before being added to the project.
This model has been chosen to reduce the risk of burnout by limiting the maintenance overhead of reviewing and validating third-party code.

## Why do we have this model?

Headscale has a small maintainer team that tries to balance working on the project, fixing bugs and reviewing contributions.

When we work on issues ourselves, we develop first hand knowledge of the code and it makes it possible for us to maintain and own the code as the project develops.

Code contributions are seen as a positive thing. People enjoy and engage with our project, but it also comes with some challenges; we have to understand the code, we have to understand the feature, we might have to become familiar with external libraries or services and we think about security implications. All those steps are required during the reviewing process. After the code has been merged, the feature has to be maintained. Any changes reliant on external services must be updated and expanded accordingly.

The review and day-1 maintenance adds a significant burden on the maintainers. Often we hope that the contributor will help out, but we found that most of the time, they disappear after their new feature was added.

This means that when someone contributes, we are mostly happy about it, but we do have to run it through a series of checks to establish if we actually can maintain this feature.

## What do we require?

A general description is provided here and an explicit list is provided in our pull request template.

All new features have to start out with a design document, which should be discussed on the issue tracker (not discord). It should include a use case for the feature, how it can be implemented, who will implement it and a plan for maintaining it.

All features have to be end-to-end tested (integration tests) and have good unit test coverage to ensure that they work as expected. This will also ensure that the feature continues to work as expected over time. If a change cannot be tested, a strong case for why this is not possible needs to be presented.

The contributor should help to maintain the feature over time. In case the feature is not maintained probably, the maintainers reserve themselves the right to remove features they redeem as unmaintainable. This should help to improve the quality of the software and keep it in a maintainable state.

## Bug fixes

Headscale is open to code contributions for bug fixes without discussion.

## Documentation

If you find mistakes in the documentation, please submit a fix to the documentation.
