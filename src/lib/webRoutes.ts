// The web's addresses, opened in the app. Shared rules hand back web paths
// (releaseNews' "Buy it" link, the price pages' seriesPath / volumePath):
// this turns each into the app's own screen, so the rules stay the web's
import { router, type Href } from "expo-router";

export function hrefOf(webPath: string): Href | null {
  const [path, query = ""] = webPath.split("?");
  const params = new URLSearchParams(query);
  const name = params.get("name");
  if (path!.startsWith("/prices/series/") && name) {
    const extra: Record<string, string> = { name };
    if (params.get("edition")) extra.edition = params.get("edition")!;
    if (params.get("toget")) extra.toget = "1";
    return { pathname: "/prices/series", params: extra };
  }
  const volume = path!.match(/^\/prices\/(97[89]\d{10})(?:\/|$)/);
  if (volume) return `/prices/${volume[1]}`;
  const series = path!.match(/^\/details\/(\d+)$/);
  if (series) return `/details/${series[1]}`;
  // the New tab and To buy (an alert for several things at once opens New)
  if (path === "/new-releases") return "/new";
  if (path === "/to-buy") return "/to-buy";
  if (path === "/after-the-anime") return "/after-anime";
  const show = path!.match(/^\/after-the-anime\/([^/]+)$/);
  if (show)
    return {
      pathname: "/after-anime/[slug]",
      params: { slug: show[1]!, ...(name ? { name } : {}) },
    };
  return null;
}

// opens it; false when the app has no screen for it yet
export function openWebPath(webPath: string) {
  const href = hrefOf(webPath);
  if (href) router.push(href);
  return Boolean(href);
}
