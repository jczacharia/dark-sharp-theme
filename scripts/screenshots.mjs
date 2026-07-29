import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  downloadAndUnzipVSCode,
  resolveCliArgsFromVSCodeExecutablePath,
} from '@vscode/test-electron';
import { _electron } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKBENCH = join(ROOT, '.screenshot-workbench');
const USER_DATA = join(WORKBENCH, 'user-data');
const EXT_DIR = join(WORKBENCH, 'extensions');
const IMAGES = join(ROOT, 'images');
const SAMPLES = join(ROOT, 'samples');
const TIMEOUT_MS = Number(process.env.SCREENSHOT_TIMEOUT_MS ?? 120_000);

const SHOTS = [
  { open: 'Sample.cs', out: 'csharp.png' },
  { open: 'inline-badge.component.ts', out: 'angular-inline.png' },
  { open: 'task-list.component.html', out: 'angular-template.png' },
];

mkdirSync(IMAGES, { recursive: true });
mkdirSync(join(USER_DATA, 'User'), { recursive: true });
mkdirSync(EXT_DIR, { recursive: true });

// 1. Package the current theme into the workbench dir.
const vsix = join(WORKBENCH, 'dark-sharp-theme.vsix');
execFileSync('npx', ['@vscode/vsce', 'package', '-o', vsix], {
  cwd: ROOT,
  stdio: 'inherit',
});

// 2. Sample project dependencies (language servers need them for semantic tokens).
if (!existsSync(join(SAMPLES, 'angular', 'node_modules'))) {
  execFileSync('npm', ['install'], { cwd: join(SAMPLES, 'angular'), stdio: 'inherit' });
}
execFileSync('dotnet', ['restore'], { cwd: join(SAMPLES, 'csharp'), stdio: 'inherit' });

// 3. Download VS Code stable and install theme + language extensions into an isolated profile.
const exe = await downloadAndUnzipVSCode('stable');
const [cli, ...cliArgs] = resolveCliArgsFromVSCodeExecutablePath(exe);
execFileSync(
  cli,
  [
    ...cliArgs,
    '--user-data-dir', USER_DATA,
    '--extensions-dir', EXT_DIR,
    '--install-extension', vsix,
    '--install-extension', 'ms-dotnettools.csharp',
    '--install-extension', 'Angular.ng-template',
  ],
  { stdio: 'inherit' },
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
    '--user-data-dir', USER_DATA,
    '--extensions-dir', EXT_DIR,
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
  await page.keyboard.type(name, { delay: 30 });
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
}

let failed = false;
for (const shot of SHOTS) {
  await page.keyboard.press('Control+p');
  await page.keyboard.type(shot.open, { delay: 40 });
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');

  // Language-server warm-up: minimum wait, then poll until frames stop changing.
  await page.waitForTimeout(15_000);
  await runCommand('Notifications: Clear All Notifications');
  await runCommand('View: Close Panel'); // C# extension auto-opens its Output panel on activation

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
