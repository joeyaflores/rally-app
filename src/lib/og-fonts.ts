const UNBOUNDED_URL =
  "https://fonts.gstatic.com/s/unbounded/v12/Yq6F-LOTXCb04q32xlpat-6uR42XTqtG67H2040.ttf";

let cached: Promise<ArrayBuffer> | null = null;

export function getUnboundedFont(): Promise<ArrayBuffer> {
  if (!cached) {
    cached = fetch(UNBOUNDED_URL).then((r) => r.arrayBuffer());
  }
  return cached;
}
