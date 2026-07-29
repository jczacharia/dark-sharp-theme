# Dark Sharp — Rename, Production Readiness & Automated Publishing

**Date:** 2026-07-29
**Status:** Approved

## Goal

Rename the `jomby-theme` extension to **Dark Sharp**, make the repo a clean, modern VS Code theme repo, and automate publishing to the Visual Studio Marketplace (`jczacharia.dark-sharp-theme`) and Open VSX on every main-branch push, publishing only when the version changes.

## Positioning

Dark Sharp targets **Angular and .NET developers**: full semantic color tokens with shared color customizations between C#/.NET and Angular/TypeScript. The theme was designed and scrutinized specifically for Angular templates (separate-file and inline) so Angular concepts are easy to identify — semantic HTML vs Angular input/attribute bindings and similar constructs are visually discernible. This positioning drives the marketplace description, keywords, and README.

## Decisions (settled with user)

| Decision | Choice |
|---|---|
| Release trigger | Push to main; publish only when `package.json` version is new (`skipDuplicate`) |
| Registries | VS Marketplace **and** Open VSX (Cursor/Windsurf/VSCodium) |
| Rename scope | Full: extension id, display name, theme picker label, theme filename |
| First published version | `1.0.0` |
| License | MIT |
| JetBrains files (`Jomby.icls`) | Delete — repo is VS Code only |
| Committed `.vsix` files | Delete and gitignore |
| GitHub repo | Already renamed to `jczacharia/dark-sharp-theme`; update local remote URL |
| Publisher account | Does not exist yet — manual setup steps below |
| Workflow implementation | `HaaLeo/publish-vscode-extension@v2` (packages once, publishes to both registries, built-in duplicate-version skip) |

## Changes

### 1. package.json (full rewrite)

```json
{
  "name": "dark-sharp-theme",
  "displayName": "Dark Sharp",
  "description": "A sharp dark theme built for Angular and .NET developers — full semantic token support with consistent colors across C# and Angular templates.",
  "version": "1.0.0",
  "publisher": "jczacharia",
  "license": "MIT",
  "icon": "icon.png",
  "engines": { "vscode": "^1.0.0" },
  "categories": ["Themes"],
  "keywords": ["theme", "dark", "dark theme", "color-theme", "sharp", "angular", "dotnet", ".net", "csharp", "c#", "semantic", "semantic tokens", "typescript"],
  "galleryBanner": { "color": "<theme editor.background>", "theme": "dark" },
  "pricing": "Free",
  "repository": { "type": "git", "url": "https://github.com/jczacharia/dark-sharp-theme" },
  "contributes": {
    "themes": [
      { "label": "Dark Sharp", "uiTheme": "vs-dark", "path": "./themes/dark-sharp-color-theme.json" }
    ]
  }
}
```

Notes:
- `engines.vscode: "^1.0.0"` — a pure color theme uses no extension API, so the loosest engine maximizes installability.
- No `vscode:prepublish` script (nothing to build). No devDependencies; CI uses the action's bundled tooling.
- `galleryBanner.color` = the theme's `editor.background` value, read from the theme JSON at implementation time.
- Description text may be tuned at implementation time to match the theme's actual character.

### 2. Theme file

- `themes/Jomby-color-theme.json` → `themes/dark-sharp-color-theme.json` (git mv).
- Internal `"name"` field inside the JSON → `"Dark Sharp"`.
- **Colors are not touched.**

### 3. Files added

- `LICENSE` — MIT, copyright Jeremy C. Zacharia.
- `README.md` — replaces boilerplate. Content, leading with the theme's positioning:
  - **Who it's for**: Angular and .NET developers wanting full semantic color tokens and shared color customizations across both stacks.
  - **What's distinctive**: designed and scrutinized for Angular templates — both separate-file and inline templates — so Angular concepts read at a glance: semantic HTML vs Angular input/attribute bindings, and similar template constructs are visually distinct. Consistent semantic coloring between C#/.NET and Angular/TypeScript code.
  - Screenshot section pointing at `images/*.png` (user adds screenshots later — ideally one C# file and one Angular template; publish works without them).
  - Install instructions (Marketplace, Open VSX, manual VSIX); recommended settings note if semantic highlighting must be enabled; link to repo/issues.
- `CHANGELOG.md` — Keep-a-Changelog format, `## [1.0.0] - <release date>` initial entry.
- `icon.png` — 256×256 PNG, simple geometric mark generated from the theme's palette (ImageMagick). Placeholder quality; swappable anytime. SVG is not allowed by the Marketplace.
- `.github/workflows/publish.yml` — see §5.
- `images/` — not created now (git doesn't track empty dirs); the README references `images/*.png` paths and the directory comes into existence when the user adds screenshots.

### 4. Files removed / hygiene

- Delete: `jomby-theme-0.0.{1..5}.vsix`, `themes/Jomby.icls`, `vsc-extension-quickstart.md`.
- `.gitignore` add: `*.vsix`, `node_modules/`.
- `.vscodeignore` — package only what ships: exclude `.vscode/**`, `.github/**`, `.gitignore`, `.gitattributes`, `docs/**`, `images/**` (README references them by URL from GitHub, no need to ship them in the VSIX), `.pi/**`.
- Local git remote: `git remote set-url origin git@github.com:jczacharia/dark-sharp-theme.git`.
- Commit the pending version bump/changes as part of this work.

### 5. CI/CD workflow

`.github/workflows/publish.yml`:

```yaml
name: Publish
on:
  push:
    branches: [main]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Publish to Open VSX
        id: publishToOpenVSX
        uses: HaaLeo/publish-vscode-extension@v2
        with:
          pat: ${{ secrets.OVSX_PAT }}
          skipDuplicate: true
      - name: Publish to VS Marketplace
        uses: HaaLeo/publish-vscode-extension@v2
        with:
          pat: ${{ secrets.VSCE_PAT }}
          registryUrl: https://marketplace.visualstudio.com
          extensionFile: ${{ steps.publishToOpenVSX.outputs.vsixPath }}
          skipDuplicate: true
```

Behavior: every push to main packages the extension; if the version already exists on a registry, that publish step is skipped (green, no-op). Releasing = bump `version` + add CHANGELOG entry + push.

The Open VSX step runs first so its packaged `.vsix` is reused for the Marketplace step (identical artifact on both registries).

### 6. One-time manual setup (user)

Nothing publishes until these exist; code can land first. Steps:

1. **Azure DevOps org**: sign in at https://dev.azure.com with a Microsoft account; create an org if prompted.
2. **PAT**: User settings → Personal access tokens → New Token. **Organization: "All accessible organizations"** (required); Scopes: Custom defined → Show all scopes → **Marketplace → Manage**. Max expiry (~1 year). Copy the token.
3. **Publisher**: at https://marketplace.visualstudio.com/manage create publisher with ID `jczacharia` (ID is immutable).
4. **Open VSX**: sign in at https://open-vsx.org with GitHub → sign the Eclipse publisher agreement (one-time) → Settings → Access Tokens → create token. Create the namespace: `npx ovsx create-namespace jczacharia -p <token>`.
5. **GitHub secrets**: repo → Settings → Secrets and variables → Actions → add `VSCE_PAT` (step 2) and `OVSX_PAT` (step 4).

**Maintenance note:** the Azure PAT expires in ≤1 year — set a reminder to rotate the `VSCE_PAT` secret. Microsoft retires *global* Azure DevOps PATs Dec 2026; marketplace-scoped PAT + GitHub Actions remains the working pattern for now, revisit before then.

### 7. Error handling / verification

- First publish of a new publisher passes through the Marketplace's automated verification scan (minutes, not a manual review).
- Local verification before first push: `npx @vscode/vsce package` must succeed with no warnings (catches missing repository/license/icon issues that would break CI).
- If a registry publish fails, the workflow fails visibly in Actions; the two registries are independent steps so one failing doesn't corrupt the other.
- Known failure causes documented above: PAT scope/org wrong (401/TF400813), missing LICENSE (Open VSX blocks), SVG assets (rejected).

### 8. Out of scope

- No screenshots taken as part of this work (section is wired in README; user adds PNGs later).
- No theme color changes.
- No tests/lint tooling — a theme is data; `vsce package` is the validation.
- No tag-based releases or GitHub Releases automation (can add later if wanted).
