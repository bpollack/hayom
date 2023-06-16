import { path, toml } from "./deps.ts";

export interface Config {
  editor: string[];
  default: string;
  journals: {
    [name: string]: {
      journal: string;
    };
  };
}

function homeDir(): string {
  if (Deno.build.os === "windows") {
    const home = Deno.env.get("USERPROFILE");
    if (home == null) throw new Error("USERPROFILE missing");
    return home;
  } else {
    const home = Deno.env.get("HOME");
    if (home == null) throw new Error("$HOME missing");
    return home;
  }
}

function configDir(): string {
  if (Deno.build.os === "windows") {
    const profile = Deno.env.get("APPDATA");
    if (profile == null) throw new Error("APPDATA missing");
    return profile;
  } else {
    let configRoot = Deno.env.get("XDG_CONFIG_HOME");
    if (configRoot == null) {
      configRoot = path.join(homeDir(), ".config");
    }
    return configRoot;
  }
}

function defaultConfigPath(): string {
  return path.join(configDir(), "hayom", "hayom.toml");
}

function defaultJournalPath(): string {
  return path.join(
    homeDir(),
    Deno.build.os === "windows" ? "hayom.md" : ".hayom.md",
  );
}

function defaultEditor(): string[] {
  const editor = Deno.env.get("EDITOR");
  if (editor != null) return editor.split(" ");

  if (Deno.build.os == "windows") return ["cmd", "/c", "start"];
  else return ["nano"];
}

export function loadConfig(): Config {
  const defaultConfig: Config = {
    default: "default",
    editor: defaultEditor(),
    journals: {
      default: {
        journal: defaultJournalPath(),
      },
    },
  };

  try {
    const userConfig = toml.parse(Deno.readTextFileSync(defaultConfigPath()));
    const mergedConfig = { ...defaultConfig, ...userConfig };
    if (typeof userConfig.editor === "string") {
      mergedConfig.editor = userConfig.editor.split(" ");
    }
    return mergedConfig;
  } catch {
    return defaultConfig;
  }
}
