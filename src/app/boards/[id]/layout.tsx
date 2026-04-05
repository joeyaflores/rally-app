import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Board",
};

export default function BoardDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
