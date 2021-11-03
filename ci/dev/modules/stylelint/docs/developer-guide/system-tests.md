# Writing system tests

System tests verify that stylelint works as expected. They are another line of defense against regressions, after the unit tests and integration tests.

Each of these system tests asserts that we end up with some expected output, given a configuration and a stylesheet.

These tests should not be comprehensive and systematic (_the unit tests should_). They should reproduce real use-cases and verify that those use-cases work as expected.

## Jest snapshots

The tests use Jest snapshots, so we can easily:

- assert against potentially large objects and strings
- update expectations as needed.

## The pattern

To add a system test, you should:

- add a test-case folder to `system-tests/` incrementing the number from existing test cases
- add a configuration file and a stylesheet
- add a `fs.test.js` and `no-fs.test.js` following the format established by existing tests, and using the `systemTestUtils`
- take a snapshot of `output`
