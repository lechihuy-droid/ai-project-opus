import fs from "node:fs";
import path from "node:path";

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

export const loadProductionDirector = ({ appRoot = process.cwd() } = {}) => {
  const rules = readJson(path.join(appRoot, "design", "directors", "selection-rules.json"));
  const packages = Object.fromEntries((rules.productionCandidates ?? []).map((candidate) => {
    const packagePath = path.resolve(appRoot, candidate.packageRef);
    const pkg = readJson(packagePath);
    const componentMap = pkg.files?.componentMap
      ? readJson(path.resolve(path.dirname(packagePath), pkg.files.componentMap))
      : null;
    return [candidate.id, { ...pkg, componentMap }];
  }));
  return { rules, packages };
};
