# Contributing to AI Screen Guide

Thank you for your interest in contributing! Here's how to get started.

## Ways to contribute

- **Report a bug** — open an [Issue](../../issues) and describe what happened vs. what you expected
- **Suggest a feature** — open an Issue with the `enhancement` label
- **Fix a bug or add a feature** — open a Pull Request

## Local setup

1. Clone the repo
2. Open Chrome → `chrome://extensions/` → enable **Developer mode**
3. Click **Load unpacked** → select the cloned folder
4. Edit files and click **Reload** on the extension card to apply changes

No build step required — this is a plain Chrome Extension (Manifest V3).

## Submitting a Pull Request

1. Fork the repo and create a branch from `master`
2. Make your changes
3. Test manually: load the extension, run through the main flow (Scan & Analyze)
4. Open a PR and describe **what** you changed and **why**

## Adding a new AI provider

See the `PROVIDERS` object in `popup.js`. Each entry needs:
- `name` — display label
- API call logic wired into the `analyzeImage` function

Please include a brief note in the PR about the provider's vision API docs.

## Code style

- Plain JavaScript, no build tools
- Keep changes focused — one PR per fix/feature
