const appName = "outfittr.xyz";
const developmentApiPort = "5001";

export function buildApiPath(route: string) {
  if (import.meta.env.MODE !== "development") {
    return `http://${appName}:5000/${route}`;
  }

  return `http://localhost:${developmentApiPort}/${route}`;
}
