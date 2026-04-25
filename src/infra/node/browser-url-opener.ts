import { spawn } from "node:child_process";
import { BrowserOpenError } from "../../core/domain/errors";
import type { UrlOpener } from "../../core/ports/url-opener";

export function createBrowserUrlOpener(): UrlOpener {
  return {
    openUrl(url: string): Promise<void> {
      return new Promise((resolve, reject) => {
        try {
          const child =
            process.platform === "darwin"
              ? spawn("open", [url], { detached: true, stdio: "ignore" })
              : process.platform === "win32"
                ? spawn("cmd", ["/c", "start", "", url], {
                    detached: true,
                    stdio: "ignore",
                  })
                : spawn("xdg-open", [url], { detached: true, stdio: "ignore" });

          child.once("error", (error) =>
            reject(new BrowserOpenError(`Failed to open ${url}`, error)),
          );
          child.unref();
          resolve();
        } catch (error) {
          reject(new BrowserOpenError(`Failed to open ${url}`, error));
        }
      });
    },
  };
}
