# Security policy

Walleto stores people's personal finance data, so security reports are taken seriously. It is maintained by one person, in their spare time.

## Reporting a vulnerability

Please report it privately. Don't open a public issue, pull request or discussion.

Use GitHub's private vulnerability reporting: go to the **Security** tab of this repository and choose **Report a vulnerability**, or open [a new advisory](https://github.com/glrodasz/walleto/security/advisories/new) directly. Only you and the maintainer can see it.

Please include:

- What the issue is and what an attacker could do with it (for example, read or change another user's data).
- Steps to reproduce it: the affected page or API route, the requests involved and what you expected to happen.
- The commit or deployment you tested against, if you know it.
- Any proof of concept, logs or screenshots. Leave out real personal or financial data.

Test only with accounts and data that are yours. Don't access, change or delete other people's data, and don't run tests that would degrade the service for others.

## Supported versions

Only the latest deployment of the `main` branch is supported. Fixes land on `main` and are not backported.

## What to expect

Responses are best effort: there's no guaranteed response time, but I'll acknowledge your report as soon as I can and keep you updated in the advisory while I work on it. Once a fix is deployed, I'll publish the advisory and credit you, unless you'd rather stay anonymous. Please give me a reasonable chance to fix the issue before you disclose it anywhere else.
