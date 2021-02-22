import os from "os";
import path from "path";
import fs from "fs";
import { to, readJSON, failIf } from "./utils";

interface ObsidianVaultDefinition {
  path: string;
  ts: number;
  open?: true;
}

interface Vault {
  name: string;
  path: string;
  open?: boolean;
}

export const isVault = (vaultPath: any): boolean => {
  if (
    typeof vaultPath === "string" &&
    fs.existsSync(path.join(vaultPath, ".obsidian"))
  ) {
    return true;
  }
  return false;
};

const getVaultFromPath = (vaultPath: string, open?: boolean): Vault => {
  return {
    name: path.basename(vaultPath),
    path: vaultPath,
    open,
  };
};

export const findVault = async (vaultPath?: string): Promise<Vault[]> => {
  if (isVault(vaultPath)) {
    return [getVaultFromPath(vaultPath!)];
  }
  if (vaultPath && fs.existsSync(vaultPath)) {
    return [getVaultFromPath(vaultPath)];
  }
  const home = os.homedir();
  let obsidianPath = "";
  switch (os.platform()) {
    case "win32":
      obsidianPath = path.join(home, "AppData", "Local", "Obsidian");
      break;
    case "darwin":
      obsidianPath = path.join(
        home,
        "Library",
        "Application Support",
        "Obsidian"
      );
      break;
    default:
      obsidianPath = path.join(home, ".Obsidian");
  }

  failIf(
    !fs.existsSync(obsidianPath),
    "Can't find obsidian settings directory, won't be able to read vaults"
  );

  const [obsidianReadError, obsidian] = await to(
    readJSON(path.join(obsidianPath, "obsidian.json"))
  );

  failIf(
    obsidianReadError,
    `Could not read obsidian.json: ${obsidianReadError}\nVaults won't be retrievable`
  );

  return Object.values<ObsidianVaultDefinition>(obsidian.vaults).map<Vault>(
    (vault) => getVaultFromPath(vault.path, vault.open)
  );
};
