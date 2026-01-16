# Husky + Prettier Setup

This directory contains Git hooks configured via Husky.

## Pre-commit Hook

The pre-commit hook automatically:

- Runs ESLint with auto-fix on staged JS/JSX files
- Runs Prettier to format staged files
- Blocks commits if ESLint finds unfixable errors

## Setup

Husky is automatically initialized when you run `npm install` via the `prepare` script in package.json.
