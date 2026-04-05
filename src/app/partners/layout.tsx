import type { Metadata } from "next";
import config from "@rally";

export const metadata: Metadata = {
  title: `Partners — ${config.fullName}`,
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
