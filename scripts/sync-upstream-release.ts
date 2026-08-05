import * as NodeChildProcess from "node:child_process";
import * as NodeFS from "node:fs";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";

interface Options {
  readonly upstream: string;
  readonly repo: string;
  readonly arch: string;
  readonly releasePrefix: string;
  readonly skipRelease: boolean;
}

const repoRoot = NodePath.resolve(import.meta.dirname, "..");

function parseOptions(argv: ReadonlyArray<string>): Options {
  const options = {
    upstream: "upstream/main",
    repo: "alecramos-sudo/t3code",
    arch: "arm64",
    releasePrefix: "alec",
    skipRelease: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--upstream" && next) {
      options.upstream = next;
      index += 1;
    } else if (arg === "--repo" && next) {
      options.repo = next;
      index += 1;
    } else if (arg === "--arch" && next) {
      options.arch = next;
      index += 1;
    } else if (arg === "--release-prefix" && next) {
      options.releasePrefix = next;
      index += 1;
    } else if (arg === "--skip-release") {
      options.skipRelease = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function run(command: string, args: ReadonlyArray<string>) {
  console.log(`$ ${[command, ...args].join(" ")}`);
  const result = NodeChildProcess.spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${command} exited with ${result.status ?? "unknown status"}`);
  }
}

function output(command: string, args: ReadonlyArray<string>): string {
  const result = NodeChildProcess.spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} exited with ${result.status ?? "unknown status"}\n${result.stderr.trim()}`,
    );
  }
  return result.stdout.trim();
}

function git(args: ReadonlyArray<string>) {
  run("git", args);
}

function gitOutput(args: ReadonlyArray<string>): string {
  return output("git", args);
}

function assertCleanWorktree() {
  const status = gitOutput(["status", "--porcelain"]);
  if (status.length > 0) {
    throw new Error(
      [
        "Worktree is not clean. Commit, stash, or discard local changes before releasing.",
        status,
      ].join("\n"),
    );
  }
}

function timestamp() {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function assertFileContains(relativePath: string, needle: string) {
  const fullPath = NodePath.join(repoRoot, relativePath);
  const content = NodeFS.readFileSync(fullPath, "utf8");
  if (!content.includes(needle)) {
    throw new Error(`Local feature sentinel missing in ${relativePath}: ${needle}`);
  }
}

function assertLocalFeatureSentinels() {
  assertFileContains("apps/web/src/themes/presets.ts", 'name: "Cobalt2"');
  assertFileContains("apps/web/src/components/settings/ThemePicker.tsx", "customThemeName");
  assertFileContains(
    "apps/web/src/components/settings/SettingsPanels.tsx",
    'searchableSetting("project-expansion")',
  );
  assertFileContains("packages/contracts/src/keybindings.ts", '"commandPalette.addProject"');
  assertFileContains("apps/server/src/provider/Layers/ClaudeProvider.ts", "Claude Opus 4.7");
}

function packageVersion() {
  const packageJson = JSON.parse(
    NodeFS.readFileSync(NodePath.join(repoRoot, "apps/desktop/package.json"), "utf8"),
  ) as { readonly version?: string };
  if (!packageJson.version) {
    throw new Error("apps/desktop/package.json is missing version.");
  }
  return packageJson.version;
}

function requiredAsset(pathname: string) {
  const fullPath = NodePath.join(repoRoot, pathname);
  if (!NodeFS.existsSync(fullPath)) {
    throw new Error(`Expected release asset was not produced: ${pathname}`);
  }
  return pathname;
}

function sha256(pathname: string) {
  return output("shasum", ["-a", "256", pathname]).split(/\s+/)[0] ?? "";
}

function assertMacDiskImageSignature(dmgPath: string) {
  // oxlint-disable-next-line t3code/no-global-process-runtime -- Standalone release script has no Effect runtime.
  if (NodeOS.platform() !== "darwin") {
    throw new Error("macOS DMG signature verification must run on macOS.");
  }

  const mountDir = NodeFS.mkdtempSync(NodePath.join(NodeOS.tmpdir(), "t3-dmg-verify-"));
  let attached = false;
  try {
    run("hdiutil", ["attach", "-readonly", "-nobrowse", "-mountpoint", mountDir, dmgPath]);
    attached = true;

    const appName = NodeFS.readdirSync(mountDir).find((entry) => entry.endsWith(".app"));
    if (!appName) {
      throw new Error(`No app bundle found in ${dmgPath}.`);
    }

    run("codesign", [
      "--verify",
      "--deep",
      "--strict",
      "--verbose=2",
      NodePath.join(mountDir, appName),
    ]);
  } finally {
    if (attached) {
      run("hdiutil", ["detach", mountDir]);
    }
    NodeFS.rmSync(mountDir, { recursive: true, force: true });
  }
}

function createRelease(options: Options, version: string) {
  const head = gitOutput(["rev-parse", "HEAD"]);
  const shortHead = gitOutput(["rev-parse", "--short=9", "HEAD"]);
  const tag = `${options.releasePrefix}-v${version}-merged-${timestamp()}-${shortHead}`;
  const title = `T3 Code ${version} merged macOS ${options.arch}`;
  const dmg = requiredAsset(`release/T3-Code-${version}-${options.arch}.dmg`);
  const dmgBlockmap = requiredAsset(`release/T3-Code-${version}-${options.arch}.dmg.blockmap`);
  const zip = requiredAsset(`release/T3-Code-${version}-${options.arch}.zip`);
  const zipBlockmap = requiredAsset(`release/T3-Code-${version}-${options.arch}.zip.blockmap`);
  const builderDebug = requiredAsset("release/builder-debug.yml");
  const notesPath = NodePath.join(
    NodeFS.mkdtempSync(NodePath.join(NodeOS.tmpdir(), "t3-release-notes-")),
    "notes.md",
  );

  NodeFS.writeFileSync(
    notesPath,
    [
      `Merged build from ${gitOutput(["branch", "--show-current"])} at ${head}.`,
      "",
      `Upstream: ${options.upstream}`,
      "",
      "Local feature sentinels verified before packaging:",
      "- Cobalt2/custom theme support",
      "- Theme picker customThemeName support",
      "- Project expansion setting and settings-search anchor",
      "- commandPalette.addProject keybinding support",
      "- Claude Opus 4.7 provider support",
      "",
      "macOS signing:",
      "- This community build is ad-hoc signed and is not Apple-notarized.",
      "- On first launch, Control-click the app, choose Open, then confirm Open.",
      "",
      "SHA256:",
      `- DMG: ${sha256(dmg)}`,
      `- ZIP: ${sha256(zip)}`,
      "",
    ].join("\n"),
  );

  git(["tag", "-a", tag, "-m", title, head]);
  git(["push", "origin", `refs/tags/${tag}`]);
  run("gh", [
    "release",
    "create",
    tag,
    "--repo",
    options.repo,
    "--target",
    head,
    "--title",
    title,
    "--notes-file",
    notesPath,
    dmg,
    dmgBlockmap,
    zip,
    zipBlockmap,
    builderDebug,
  ]);

  console.log(`Release: https://github.com/${options.repo}/releases/tag/${tag}`);
  console.log(
    `DMG: https://github.com/${options.repo}/releases/download/${tag}/${NodePath.basename(dmg)}`,
  );
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  assertCleanWorktree();

  run("gh", ["auth", "status"]);
  git(["fetch", "--all", "--prune"]);

  const branch = gitOutput(["branch", "--show-current"]);
  const backupBranch = `backup/${branch.replaceAll("/", "-")}-pre-release-${timestamp()}`;
  git(["branch", backupBranch, "HEAD"]);

  const [ahead = "0", behind = "0"] = gitOutput([
    "rev-list",
    "--left-right",
    "--count",
    `HEAD...${options.upstream}`,
  ]).split(/\s+/);
  console.log(`Divergence before merge: ${ahead} ahead / ${behind} behind ${options.upstream}`);

  if (behind !== "0") {
    git(["merge", options.upstream, "--no-edit"]);
  }

  assertLocalFeatureSentinels();
  run("pnpm", ["install", "--frozen-lockfile"]);
  run("pnpm", [
    "exec",
    "vp",
    "test",
    "run",
    "apps/web/src/themes/presets.test.ts",
    "apps/web/src/components/settings/settingsSearch.test.ts",
    "packages/contracts/src/keybindings.test.ts",
    "packages/contracts/src/settings.test.ts",
  ]);
  run("pnpm", ["exec", "vp", "run", "--filter", "@t3tools/contracts", "typecheck"]);
  run("pnpm", ["exec", "vp", "run", "--filter", "@t3tools/web", "typecheck"]);

  const version = packageVersion();
  run("pnpm", ["run", `dist:desktop:dmg:${options.arch}`]);
  assertMacDiskImageSignature(`release/T3-Code-${version}-${options.arch}.dmg`);

  git(["push", "origin", `HEAD:refs/heads/${branch}`]);
  if (!options.skipRelease) {
    createRelease(options, version);
  }

  const [finalAhead = "0", finalBehind = "0"] = gitOutput([
    "rev-list",
    "--left-right",
    "--count",
    `HEAD...${options.upstream}`,
  ]).split(/\s+/);
  console.log(
    `Divergence after release: ${finalAhead} ahead / ${finalBehind} behind ${options.upstream}`,
  );
  console.log(`Backup branch: ${backupBranch}`);
}

main();
