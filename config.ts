import { path, toml } from "./deps.ts";

export interface Config {
  editor: string;
  default: string;
  journals: {
    [name: string]: {
      journal: string;
    };
  };
}

function homeDir(): string {
  if (Deno.build.os === "windows") {
    throw new Error("Not supported yet");
  } else {
    const home = Deno.env.get("HOME");
    if (home == null) throw new Error("$HOME missing");
    return home;
  }
}

function configDir(): string {
  if (Deno.build.os === "windows") {
    throw new Error("Not supported yet");
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
  return path.join(homeDir(), ".journal");
}

function defaultEditor(): string {
  const editor = Deno.env.get("EDITOR");
  if (editor != null) return editor;
  // FIXME: should do something more reasonable than this
  if (Deno.build.os == "windows") return "notepad.exe";
  else return "nano";
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
    return { ...defaultConfig, ...userConfig };
  } catch {
    return defaultConfig;
  }
}
