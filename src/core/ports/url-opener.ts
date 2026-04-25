export interface UrlOpener {
  openUrl(url: string): Promise<void>;
}
