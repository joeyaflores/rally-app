import path from "path";

export function getUploadDir() {
  if (process.env.NODE_ENV !== "production")
    return path.join(process.cwd(), "uploads");
  return "/data/uploads";
}
