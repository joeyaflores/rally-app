import config from "@rally";

export const BASE_URL = config.url;

export const links = {
  join: `${BASE_URL}/join`,
  checkin: `${BASE_URL}/checkin`,
};

export const socials = config.socials;
