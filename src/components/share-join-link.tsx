"use client";

import { ShareLink } from "@/components/share-link";
import { links } from "@/lib/socials";
import config from "@rally";

export function ShareJoinLink() {
  return (
    <ShareLink
      url={links.join}
      title={config.fullName}
      text={`Come run with us \u2014 ${config.terms.welcome.toLowerCase()}.`}
    />
  );
}
