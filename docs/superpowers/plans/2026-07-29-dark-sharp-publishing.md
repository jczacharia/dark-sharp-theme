# Dark Sharp Rename, Production Readiness & Automated Publishing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the `jomby-theme` extension to Dark Sharp, make the repo production-ready, auto-publish to VS Marketplace + Open VSX on main pushes (version-change gated), and add a local Playwright script that generates semantic-token screenshots.

**Architecture:** Pure-data VS Code theme extension (no build step). One GitHub Actions workflow using `HaaLeo/publish-vscode-extension@v2` with `skipDuplicate` publishes both registries. A local-only Node script drives desktop VS Code via Playwright's Electron driver against a `samples/` workspace (C# + Angular) to capture README screenshots with real language servers running.

**Tech Stack:** VS Code theme JSON, GitHub Actions, `@vscode/vsce`, `@vscode/test-electron`, Playwright (Electron), ImageMagick, .NET SDK 10, Angular 22.

## Global Constraints

- Extension `name`: `dark-sharp-theme`; `displayName`: `Dark Sharp`; `publisher`: `jczacharia`; `version`: `1.0.0`; theme picker `label`: `Dark Sharp`.
- `engines.vscode`: `"^1.0.0"` (pure theme, no API usage).
- License: MIT, copyright `Jeremy C. Zacharia`.
- Theme **colors must not change** — only the file is renamed and a `"name"` field added.
- Screenshot output filenames (README depends on them): `images/csharp.png`, `images/angular-inline.png`, `images/angular-template.png`.
- Node ≥ 22 required (local machine has v24; Angular 22 samples need Node `^22.22 || ^24.13.1` — satisfied).
- Angular samples use **the latest Angular major — 22 at time of provisioning** (`^22.0.0`, TypeScript `~6.0.0`, no zone.js).
- **DO NOT `git push` until Task 8.** The GitHub repo already has `VSCE_PAT`/`OVSX_PAT` secrets; once the workflow file lands on `origin/main`, any push can publish for real. All tasks commit locally only.
- Repo root: `/home/jcz/dev/vscode/dark-sharp-theme`. Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Repo cleanup and rename

**Files:**

- Delete: `jomby-theme-0.0.1.vsix` … `jomby-theme-0.0.5.vsix`, `themes/Jomby.icls`, `vsc-extension-quickstart.md`
- Rename: `themes/Jomby-color-theme.json` → `themes/dark-sharp-color-theme.json`
- Modify: `.gitignore`
- Modify: git remote URL (repo config, not a file)

**Interfaces:**

- Produces: `themes/dark-sharp-color-theme.json` (path used by Task 2's `package.json`).

- [ ] **Step 1: Delete stray artifacts and rename the theme file**

```bash
cd /home/jcz/dev/vscode/dark-sharp-theme
git rm jomby-theme-0.0.*.vsix vsc-extension-quickstart.md
rm themes/Jomby.icls   # untracked, so plain rm
git mv themes/Jomby-color-theme.json themes/dark-sharp-color-theme.json
```

- [ ] **Step 2: Replace `.gitignore`**

Overwrite `.gitignore` with exactly:

```gitignore
node_modules/
*.vsix
.screenshot-workbench/
samples/**/bin/
samples/**/obj/
```

- [ ] **Step 3: Point the remote at the renamed GitHub repo**

```bash
git remote set-url origin git@github.com:jczacharia/dark-sharp-theme.git
git remote -v
```

Expected: both fetch and push show `git@github.com:jczacharia/dark-sharp-theme.git`.

- [ ] **Step 4: Verify tree state**

```bash
git status --short
```

Expected: deletions of the five `.vsix` + quickstart staged, rename staged, `.gitignore` modified, `package.json` modified (pre-existing version bump — fine, Task 2 rewrites it). No `Jomby.icls` anywhere.

- [ ] **Step 5: Commit**

```bash
git add .gitignore
git commit -m "chore: remove build artifacts and JetBrains file, rename theme file to dark-sharp

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Manifest rewrite and theme label

**Files:**

- Modify: `package.json` (full rewrite)
- Modify: `themes/dark-sharp-color-theme.json` (add one field)
- Modify: `.vscodeignore` (full rewrite)

**Interfaces:**

- Consumes: `themes/dark-sharp-color-theme.json` from Task 1.
- Produces: theme label `Dark Sharp` (Task 7's settings reference it as `workbench.colorTheme`); npm script `screenshots` (implemented in Task 7); devDependencies used by Task 7.

- [ ] **Step 1: Rewrite `package.json`**

Replace the entire file with:

```json
{
  "name": "dark-sharp-theme",
  "displayName": "Dark Sharp",
  "description": "A sharp dark theme built for Angular and .NET developers — full semantic token support with consistent colors across C# and Angular templates.",
  "version": "1.0.0",
  "publisher": "jczacharia",
  "license": "MIT",
  "icon": "icon.png",
  "engines": {
    "vscode": "^1.0.0"
  },
  "categories": ["Themes"],
  "keywords": [
    "theme",
    "dark",
    "dark theme",
    "color-theme",
    "sharp",
    "angular",
    "dotnet",
    ".net",
    "csharp",
    "c#",
    "semantic",
    "semantic tokens",
    "typescript"
  ],
  "galleryBanner": {
    "color": "#1e1e1e",
    "theme": "dark"
  },
  "pricing": "Free",
  "repository": {
    "type": "git",
    "url": "https://github.com/jczacharia/dark-sharp-theme"
  },
  "contributes": {
    "themes": [
      {
        "label": "Dark Sharp",
        "uiTheme": "vs-dark",
        "path": "./themes/dark-sharp-color-theme.json"
      }
    ]
  },
  "scripts": {
    "screenshots": "node scripts/screenshots.mjs"
  },
  "devDependencies": {
    "@vscode/test-electron": "^2.4.1",
    "@vscode/vsce": "^3.2.1",
    "playwright": "^1.49.0"
  }
}
```

(`galleryBanner.color` `#1e1e1e` = the theme's `editor.background`.)

- [ ] **Step 2: Add the internal name to the theme JSON**

In `themes/dark-sharp-color-theme.json`, after the line `"$schema": "vscode://schemas/color-theme",` insert:

```json
  "name": "Dark Sharp",
```

Change nothing else in the file (it is JSONC with commented-out lines — leave them).

- [ ] **Step 3: Rewrite `.vscodeignore`**

Replace the entire file with:

```
.vscode/**
.github/**
.pi/**
docs/**
images/**
samples/**
scripts/**
node_modules/**
.screenshot-workbench/**
.gitignore
.gitattributes
package-lock.json
```

- [ ] **Step 4: Validate both JSON files parse**

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json OK')"
node -e "const s=require('fs').readFileSync('themes/dark-sharp-color-theme.json','utf8'); if(!/\"name\": \"Dark Sharp\"/.test(s)) throw new Error('name missing'); console.log('theme OK')"
```

Expected: `package.json OK` and `theme OK`. (The theme file is JSONC so we regex-check rather than JSON.parse.)

- [ ] **Step 5: Commit**

```bash
git add package.json themes/dark-sharp-color-theme.json .vscodeignore
git commit -m "feat: rename extension to Dark Sharp, rewrite manifest for marketplace

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: LICENSE, CHANGELOG, README

**Files:**

- Create: `LICENSE`
- Modify: `CHANGELOG.md` (full rewrite)
- Modify: `README.md` (full rewrite)

**Interfaces:**

- Produces: README image references `images/csharp.png`, `images/angular-inline.png`, `images/angular-template.png` (created by Task 7 — broken links until then, resolved before the Task 8 push).

- [ ] **Step 1: Create `LICENSE`**

```
MIT License

Copyright (c) 2026 Jeremy C. Zacharia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Rewrite `CHANGELOG.md`**

```markdown
# Changelog

All notable changes to the Dark Sharp theme are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/); versions follow
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-07-29

### Added

- Initial release of **Dark Sharp**, a dark theme built for Angular and .NET
  developers.
- Full semantic token support with shared color customizations across C#/.NET
  and Angular/TypeScript.
- Angular template highlighting tuned for both inline and separate-file
  templates: semantic HTML, input/attribute bindings, structural directives,
  and interpolation are visually distinct.
```

- [ ] **Step 3: Rewrite `README.md`**

````markdown
# Dark Sharp

A sharp dark theme for VS Code, built for **Angular** and **.NET** developers —
full semantic color tokens with consistent, shared color customizations across
C# and Angular/TypeScript.

## Get set up in 60 seconds

1. **Install the theme:** press `Ctrl+P`, run `ext install jczacharia.dark-sharp-theme`
   (or grab it from the
   [Marketplace](https://marketplace.visualstudio.com/items?itemName=jczacharia.dark-sharp-theme) /
   [Open VSX](https://open-vsx.org/extension/jczacharia/dark-sharp-theme)),
   then **Preferences: Color Theme** → **Dark Sharp**.

2. **Install the language extensions** that produce the semantic tokens Dark
   Sharp colors:

   | Stack     | Extension                                                                                                                   | Notes                                                             |
   | --------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
   | Angular   | [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template) (`Angular.ng-template`) | Inline **and** separate-file templates, zero config               |
   | C# / .NET | [C#](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp) (`ms-dotnettools.csharp`)                   | Ships the Roslyn language server that provides C# semantic tokens |

   [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit)
   is optional — it adds solution explorer and test tooling on top of the C#
   extension, not highlighting.
   [C# by ReSharper](https://marketplace.visualstudio.com/items?itemName=JetBrains.resharper-code)
   works too, but it uses its own analysis engine — the stock C# extension is
   what Dark Sharp is tuned against.

3. **Add to your `settings.json`:**

   ```json
   "editor.semanticHighlighting.enabled": true
   ```
````

Dark Sharp already opts into semantic highlighting on its own
(`"semanticHighlighting": true` in the theme), so this line is a guarantee —
it re-enables semantic tokens if another profile or setting turned them off.

That's it. No other settings are needed for either stack.

## Why Dark Sharp

- **Semantic tokens first.** Colors are driven by semantic tokens from the
  language servers (Roslyn, Angular Language Service, TypeScript), not just
  TextMate scopes — so a parameter, field, or interface looks the same
  everywhere it appears.
- **Tuned for Angular templates.** Designed and scrutinized for both inline
  and separate-file templates: semantic HTML elements, Angular input and
  attribute bindings, structural directives, and interpolation are each easy
  to tell apart at a glance.
- **Consistent across stacks.** C# and Angular/TypeScript share the same
  semantic palette, so switching between backend and frontend doesn't mean
  re-learning colors.

## Screenshots

### C\#

![C# with semantic highlighting](images/csharp.png)

### Angular — inline template

![Angular component with inline template](images/angular-inline.png)

### Angular — separate template

![Angular separate-file template](images/angular-template.png)

## Development

Screenshots are generated automatically (requires Node ≥ 22 and the .NET SDK):

```bash
npm install
npm run screenshots
```

This spins up an isolated VS Code instance with the C# and Angular Language
Service extensions, opens the sample workspace in `samples/`, waits for
semantic highlighting to settle, and writes PNGs to `images/`.

## License

[MIT](LICENSE)

````

- [ ] **Step 4: Verify no template text remains**

```bash
grep -ri "quickstart\|jomby\|Working with Markdown" README.md CHANGELOG.md LICENSE || echo CLEAN
````

Expected: `CLEAN`.

- [ ] **Step 5: Commit**

```bash
git add LICENSE CHANGELOG.md README.md
git commit -m "docs: add MIT license, real README and changelog for 1.0.0

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Icon and package validation

**Files:**

- Create: `icon.png` (256×256, generated with ImageMagick)

**Interfaces:**

- Consumes: `package.json` (`"icon": "icon.png"`) from Task 2; LICENSE/README from Task 3.
- Produces: a `.vsix` that packages cleanly — the gate for everything before it.

- [ ] **Step 1: Generate the placeholder icon**

A slanted "sharp" (♯) mark in the theme's accent blue on the editor background:

```bash
cd /home/jcz/dev/vscode/dark-sharp-theme
magick -size 256x256 xc:'#1e1e1e' -fill '#007acc' \
  -draw "polygon 88,200 114,56 136,56 110,200" \
  -draw "polygon 146,200 172,56 194,56 168,200" \
  -draw "rectangle 58,94 210,114" \
  -draw "rectangle 46,144 198,164" \
  icon.png
```

- [ ] **Step 2: Eyeball the icon**

View `icon.png` (Read tool / image viewer). Expected: a recognizable sharp/hash mark, blue on near-black, nothing clipped. Nudge polygon coordinates if it looks off — placeholder quality is acceptable per spec.

- [ ] **Step 3: Install devDependencies and package**

```bash
npm install
npx @vscode/vsce package
```

Expected: `Packaged: .../dark-sharp-theme-1.0.0.vsix` with **no warnings** about missing repository/license/icon and no interactive prompts.

- [ ] **Step 4: Verify VSIX contents**

```bash
npx @vscode/vsce ls
```

Expected file list (nothing else): `package.json`, `README.md`, `CHANGELOG.md`, `LICENSE` (packaged as `LICENSE.txt` is fine), `icon.png`, `themes/dark-sharp-color-theme.json`.

- [ ] **Step 5: Clean up and commit**

```bash
rm -f dark-sharp-theme-1.0.0.vsix
git add icon.png package-lock.json
git commit -m "feat: add extension icon; verify clean vsce package

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

(`package-lock.json` is committed for reproducible local tooling; it's excluded from the VSIX by `.vscodeignore`.)

---

### Task 5: Publish workflow

**Files:**

- Create: `.github/workflows/publish.yml`

**Interfaces:**

- Consumes: repo secrets `VSCE_PAT` and `OVSX_PAT` (already configured on GitHub by the user).
- Produces: auto-publish on main push, skipped when the version already exists.

- [ ] **Step 1: Create `.github/workflows/publish.yml`**

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
          node-version: 22
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

- [ ] **Step 2: Validate the YAML parses**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/publish.yml')); print('YAML OK')"
```

Expected: `YAML OK`.

- [ ] **Step 3: Commit (do NOT push)**

```bash
git add .github/workflows/publish.yml
git commit -m "ci: auto-publish to VS Marketplace and Open VSX on main push

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Sample workspace for screenshots

**Files:**

- Create: `samples/csharp/Sample.csproj`
- Create: `samples/csharp/Sample.cs`
- Create: `samples/angular/package.json`
- Create: `samples/angular/tsconfig.json`
- Create: `samples/angular/src/inline-badge.component.ts`
- Create: `samples/angular/src/task-list.component.ts`
- Create: `samples/angular/src/task-list.component.html`

**Interfaces:**

- Produces: the three files Task 7 opens and screenshots: `csharp/Sample.cs`, `angular/src/inline-badge.component.ts`, `angular/src/task-list.component.html`.

- [ ] **Step 1: Create the C# project**

`samples/csharp/Sample.csproj`:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <OutputType>Library</OutputType>
  </PropertyGroup>
</Project>
```

`samples/csharp/Sample.cs` — written to exercise semantic token variety (interfaces, generics, records, enums, properties, LINQ, async, pattern matching):

```csharp
namespace DarkSharp.Samples;

public enum OrderStatus { Pending, Shipped, Delivered, Cancelled }

public record OrderLine(string Sku, int Quantity, decimal UnitPrice)
{
    public decimal Total => Quantity * UnitPrice;
}

public interface IOrderRepository
{
    Task<IReadOnlyList<Order>> GetByStatusAsync(OrderStatus status, CancellationToken ct = default);
}

public class Order
{
    public required Guid Id { get; init; }
    public required string Customer { get; set; }
    public OrderStatus Status { get; private set; } = OrderStatus.Pending;
    public List<OrderLine> Lines { get; } = [];

    public decimal GrandTotal => Lines.Sum(line => line.Total);

    public void Advance() => Status = Status switch
    {
        OrderStatus.Pending => OrderStatus.Shipped,
        OrderStatus.Shipped => OrderStatus.Delivered,
        var other => other,
    };
}

public class OrderService(IOrderRepository repository)
{
    private const decimal FreeShippingThreshold = 50m;

    public async Task<decimal> OutstandingRevenueAsync(CancellationToken ct)
    {
        var pending = await repository.GetByStatusAsync(OrderStatus.Pending, ct);
        return pending
            .Where(order => order.GrandTotal > FreeShippingThreshold)
            .Sum(order => order.GrandTotal);
    }
}
```

- [ ] **Step 2: Create the Angular project scaffolding**

Use **the latest Angular major — 22 at time of provisioning** (TypeScript peer range `>=6.0 <6.1`; zone.js is not needed — optional peer, zoneless is the default; the Angular Language Service extension bundles its own compiler, so `@angular/compiler-cli` is not needed either).

`samples/angular/package.json`:

```json
{
  "name": "dark-sharp-angular-sample",
  "private": true,
  "dependencies": {
    "@angular/common": "^22.0.0",
    "@angular/core": "^22.0.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "typescript": "~6.0.0"
  }
}
```

`samples/angular/tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "experimentalDecorators": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "angularCompilerOptions": {
    "strictTemplates": true
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Create the Angular components**

Design intent: condense maximum modern template syntax into screenshot-sized components, with **semantic HTML elements carrying native/ARIA attributes and Angular `[input]`/`[attr.x]`/`(event)` bindings on the same element** — the discernment the theme was tuned for. Coverage across the two components: interpolation, property/attribute/class/style bindings, event bindings, two-way `[(expanded)]` with `model()`, template reference variables, `@if/@else` (incl. `; as`), `@for` with `track` + `$index`, `@switch/@case/@default`, `@defer/@placeholder` with triggers, `@let`, pipes with args, host bindings, and the signal APIs (`input()`, `input.required()`, `output()`, `model()`, `viewChild()`, `computed()`, `signal()`).

`samples/angular/src/inline-badge.component.ts` — the **inline-template** screenshot (TS class + template in one frame; the TS side is where TypeScript's semantic tokens shine):

```typescript
import {Component, ElementRef, computed, input, model, output, viewChild} from '@angular/core';
import {TitleCasePipe} from '@angular/common';

export type BadgeTone = 'info' | 'success' | 'warning';

@Component({
  selector: 'app-inline-badge',
  imports: [TitleCasePipe],
  host: {'[class.expanded]': 'expanded()'},
  template: `
    <section class="badges" [attr.aria-label]="label()">
      <header>
        <h2>{{ label() }}</h2>
        <button type="button" [attr.aria-expanded]="expanded()" (click)="expanded.set(!expanded())">
          {{ expanded() ? 'Collapse' : 'Expand' }}
        </button>
        <button type="button" (click)="dismissed.emit()">Dismiss</button>
      </header>
      @if (expanded()) {
        <ul #list [class.compact]="count() > 5">
          @for (tone of tones(); track tone) {
            <li [attr.data-tone]="tone" [title]="tone">
              <strong>{{ tone | titlecase }}</strong>
              <output>{{ count() }} active</output>
            </li>
          }
        </ul>
      } @else {
        <p>{{ count() }} hidden badges.</p>
      }
    </section>
  `,
})
export class InlineBadgeComponent {
  label = input.required<string>();
  count = input(0);
  expanded = model(false);
  dismissed = output<void>();

  list = viewChild<ElementRef<HTMLUListElement>>('list');

  tones = computed<BadgeTone[]>(() => (this.count() > 3 ? ['warning', 'info'] : ['success']));
}
```

`samples/angular/src/task-list.component.ts` (not screenshotted itself — it backs the separate-template shot):

```typescript
import {Component, computed, input, output, signal} from '@angular/core';
import {DatePipe, TitleCasePipe, UpperCasePipe} from '@angular/common';
import {InlineBadgeComponent} from './inline-badge.component';

export type TaskStatus = 'all' | 'open' | 'done';

export interface TaskItem {
  id: number;
  title: string;
  done: boolean;
  priority: 'low' | 'high';
  dueDate?: string;
}

@Component({
  selector: 'app-task-list',
  imports: [DatePipe, TitleCasePipe, UpperCasePipe, InlineBadgeComponent],
  templateUrl: './task-list.component.html',
})
export class TaskListComponent {
  tasks = input.required<TaskItem[]>();
  heading = input('Task Board');
  compact = input(false);
  loading = input(false);
  toggled = output<TaskItem>();

  query = signal('');
  filter = signal<TaskStatus>('open');
  showBadges = signal(false);
  today = signal(new Date().toISOString());
  statuses: readonly TaskStatus[] = ['all', 'open', 'done'];

  isOverdue = (task: TaskItem): boolean => !task.done && task.dueDate != null && task.dueDate < this.today();

  visible = computed(() => {
    const query = this.query().toLowerCase();
    return this.tasks()
      .filter((task) => this.filter() === 'all' || task.done === (this.filter() === 'done'))
      .filter((task) => task.title.toLowerCase().includes(query));
  });
}
```

`samples/angular/src/task-list.component.html` — the **separate-template** screenshot:

```html
@let overdue = tasks().filter(isOverdue);

<article class="board" [class.compact]="compact()" [attr.aria-busy]="loading()">
  <header>
    <h1>{{ heading() | uppercase }}</h1>
    <time [attr.datetime]="today()" [style.opacity]="loading() ? 0.5 : 1">{{ today() | date: 'EEEE, MMM d' }}</time>
    <input
      #search
      type="search"
      placeholder="Filter tasks…"
      [value]="query()"
      (input)="query.set(search.value)"
      (keydown.escape)="search.blur()"
    />
  </header>

  <nav aria-label="Status filters">
    @for (status of statuses; track status) {
    <button
      type="button"
      [class.active]="filter() === status"
      [attr.aria-pressed]="filter() === status"
      (click)="filter.set(status)"
    >
      {{ status | titlecase }}
    </button>
    }
  </nav>

  @switch (visible().length) { @case (0) {
  <p role="status">Nothing matches “{{ query() }}”.</p>
  } @default {
  <ol>
    @for (task of visible(); track task.id; let i = $index) {
    <li [class.done]="task.done" [attr.data-priority]="task.priority">
      <label>
        <input type="checkbox" [checked]="task.done" (change)="toggled.emit(task)" />
        <strong>{{ i + 1 }}</strong>
        {{ task.title }}
      </label>
      @if (task.dueDate; as due) {
      <time [attr.datetime]="due">due {{ due | date: 'MMM d' }}</time>
      }
    </li>
    }
  </ol>
  } }

  <footer>
    @defer (on viewport; prefetch on idle) {
    <app-inline-badge
      label="Overdue"
      [count]="overdue.length"
      [(expanded)]="showBadges"
      (dismissed)="filter.set('open')"
    />
    } @placeholder {
    <p>{{ overdue.length }} overdue — scroll for details.</p>
    }
  </footer>
</article>
```

- [ ] **Step 4: Verify both projects are healthy**

```bash
cd /home/jcz/dev/vscode/dark-sharp-theme/samples/csharp && dotnet build
cd ../angular && npm install && npx tsc --noEmit
cd ../..
```

Expected: `Build succeeded` from dotnet; `tsc` exits 0 with no output. (Template type errors would surface later via the Angular Language Service — `tsc` validates the TS files.)

- [ ] **Step 5: Commit**

```bash
git add samples/
git commit -m "feat: add C# and Angular sample workspace for screenshot generation

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Screenshot automation script

**Files:**

- Create: `scripts/screenshots.mjs`
- Create (output): `images/csharp.png`, `images/angular-inline.png`, `images/angular-template.png`

**Interfaces:**

- Consumes: theme label `Dark Sharp` (Task 2), sample files (Task 6), devDependencies + `screenshots` npm script (Task 2).
- Produces: the three PNGs referenced by the README (Task 3).

- [ ] **Step 1: Write `scripts/screenshots.mjs`**

```javascript
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath} from '@vscode/test-electron';
import {_electron} from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKBENCH = join(ROOT, '.screenshot-workbench');
const USER_DATA = join(WORKBENCH, 'user-data');
const EXT_DIR = join(WORKBENCH, 'extensions');
const IMAGES = join(ROOT, 'images');
const SAMPLES = join(ROOT, 'samples');
const TIMEOUT_MS = Number(process.env.SCREENSHOT_TIMEOUT_MS ?? 120_000);

const SHOTS = [
  {open: 'Sample.cs', out: 'csharp.png'},
  {open: 'inline-badge.component.ts', out: 'angular-inline.png'},
  {open: 'task-list.component.html', out: 'angular-template.png'},
];

mkdirSync(IMAGES, {recursive: true});
mkdirSync(join(USER_DATA, 'User'), {recursive: true});
mkdirSync(EXT_DIR, {recursive: true});

// 1. Package the current theme into the workbench dir.
const vsix = join(WORKBENCH, 'dark-sharp-theme.vsix');
execFileSync('npx', ['@vscode/vsce', 'package', '-o', vsix], {
  cwd: ROOT,
  stdio: 'inherit',
});

// 2. Sample project dependencies (language servers need them for semantic tokens).
if (!existsSync(join(SAMPLES, 'angular', 'node_modules'))) {
  execFileSync('npm', ['install'], {cwd: join(SAMPLES, 'angular'), stdio: 'inherit'});
}
execFileSync('dotnet', ['restore'], {cwd: join(SAMPLES, 'csharp'), stdio: 'inherit'});

// 3. Download VS Code stable and install theme + language extensions into an isolated profile.
const exe = await downloadAndUnzipVSCode('stable');
const [cli, ...cliArgs] = resolveCliArgsFromVSCodeExecutablePath(exe);
execFileSync(
  cli,
  [
    ...cliArgs,
    '--user-data-dir',
    USER_DATA,
    '--extensions-dir',
    EXT_DIR,
    '--install-extension',
    vsix,
    '--install-extension',
    'ms-dotnettools.csharp',
    '--install-extension',
    'Angular.ng-template',
  ],
  {stdio: 'inherit'},
);

// 4. Deterministic, chrome-free frames.
writeFileSync(
  join(USER_DATA, 'User', 'settings.json'),
  JSON.stringify(
    {
      'workbench.colorTheme': 'Dark Sharp',
      'editor.semanticHighlighting.enabled': true,
      'workbench.activityBar.location': 'hidden',
      'workbench.statusBar.visible': false,
      'workbench.layoutControl.enabled': false,
      'workbench.startupEditor': 'none',
      'workbench.secondarySideBar.defaultVisibility': 'hidden',
      'window.commandCenter': false,
      'chat.commandCenter.enabled': false,
      'editor.minimap.enabled': false,
      'editor.fontSize': 13,
      'breadcrumbs.enabled': false,
      'editor.scrollBeyondLastLine': false,
      'editor.cursorBlinking': 'solid',
      'editor.renderLineHighlight': 'none',
      'update.mode': 'none',
      'telemetry.telemetryLevel': 'off',
      'extensions.autoUpdate': false,
      'extensions.autoCheckUpdates': false,
      'security.workspace.trust.enabled': false,
      'git.openRepositoryInParentFolders': 'never',
    },
    null,
    2,
  ),
);

// 5. Launch VS Code with the samples workspace.
const app = await _electron.launch({
  executablePath: exe,
  args: [
    '--user-data-dir',
    USER_DATA,
    '--extensions-dir',
    EXT_DIR,
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-workspace-trust',
    SAMPLES,
  ],
});
const page = await app.firstWindow();
const browserWindow = await app.browserWindow(page);
await browserWindow.evaluate((win) => win.setSize(1500, 1250)); // tall enough for the ~55-line template sample
await page.waitForTimeout(8_000);
await page.keyboard.press('Control+b'); // close the (default-open) sidebar

async function runCommand(name) {
  await page.keyboard.press('Control+Shift+p');
  await page.keyboard.type(name, {delay: 30});
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
}

let failed = false;
for (const shot of SHOTS) {
  await page.keyboard.press('Control+p');
  await page.keyboard.type(shot.open, {delay: 40});
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');

  // Language-server warm-up: minimum wait, then poll until frames stop changing.
  await page.waitForTimeout(15_000);
  await runCommand('Notifications: Clear All Notifications');

  const started = Date.now();
  let prev = null;
  let stable = 0;
  let timedOut = false;
  while (stable < 3) {
    if (Date.now() - started > TIMEOUT_MS) {
      timedOut = true;
      break;
    }
    const frame = await page.screenshot();
    stable = prev && frame.equals(prev) ? stable + 1 : 0;
    prev = frame;
    await page.waitForTimeout(2_000);
  }

  writeFileSync(join(IMAGES, shot.out), prev);
  if (timedOut) {
    failed = true;
    console.error(`TIMEOUT: ${shot.open} never stabilized — inspect images/${shot.out} before committing`);
  } else {
    console.log(`captured images/${shot.out}`);
  }
}

await app.close();
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run it**

```bash
cd /home/jcz/dev/vscode/dark-sharp-theme
npm run screenshots
```

Expected: three `captured images/...` lines, exit 0. First run downloads VS Code + extensions (a few minutes). If it exits 1 with a `TIMEOUT` line, re-run once (first-run language-server downloads are the usual cause) before investigating.

- [ ] **Step 3: Inspect all three PNGs**

View each of `images/csharp.png`, `images/angular-inline.png`, `images/angular-template.png`. Expected: Dark Sharp colors (near-black `#1e1e1e` background), code fully highlighted — in the C# shot, types/parameters/properties must have distinct colors (semantic tokens working, not flat TextMate coloring); in the template shots, bindings vs elements visibly distinct. No notification toasts, no half-loaded spinners.

If a shot shows flat/partial highlighting, the language server wasn't ready: re-run with `SCREENSHOT_TIMEOUT_MS=240000 npm run screenshots`.

- [ ] **Step 4: Commit script and images**

```bash
git add scripts/screenshots.mjs images/
git commit -m "feat: Playwright screenshot automation with generated README images

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Push and verify the live publish

**Files:** none (git push + external verification).

**Interfaces:**

- Consumes: everything above; repo secrets `VSCE_PAT`/`OVSX_PAT` on GitHub.

- [ ] **Step 1: Final pre-flight**

```bash
cd /home/jcz/dev/vscode/dark-sharp-theme
git status --short          # expect: empty (everything committed)
npx @vscode/vsce package    # expect: clean package, then: rm -f dark-sharp-theme-1.0.0.vsix
rm -f dark-sharp-theme-1.0.0.vsix
```

- [ ] **Step 2: Push to main**

This is the moment publishing goes live — 1.0.0 will be published to both registries.

```bash
git push origin main
```

- [ ] **Step 3: Watch the workflow**

```bash
gh run watch $(gh run list --workflow=Publish --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

Expected: both publish steps succeed. Failure triage: `401`/`TF400813` → PAT scope/org wrong (needs Marketplace→Manage, All accessible organizations); Open VSX namespace error → `npx ovsx create-namespace jczacharia -p <token>` wasn't run.

- [ ] **Step 4: Verify both listings**

```bash
npx @vscode/vsce show jczacharia.dark-sharp-theme
curl -sf https://open-vsx.org/api/jczacharia/dark-sharp-theme | head -c 400
```

Expected: vsce shows the extension at version 1.0.0 (a new publisher's first extension may show a "Verifying" status for a few minutes before going public — re-check after ~10 min, not an error); the Open VSX API returns JSON with `"version": "1.0.0"`.

- [ ] **Step 5: Confirm skipDuplicate behaves (no-op push)**

The next real content push (any docs tweak) should show both publish steps as "skipped duplicate" without error. Nothing to do now — just note it for the user in the final report.
