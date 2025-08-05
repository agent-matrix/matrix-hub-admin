// src/lib/settings.ts
export const settings = {
  get hubUrl() { return process.env.NEXT_PUBLIC_HUB_URL as string; },
  get gwUrl()  { return process.env.NEXT_PUBLIC_GW_URL as string; },

  get hubToken() {
    return (typeof window !== "undefined" && localStorage.getItem("HUB_TOKEN")) || "";
  },
  set hubToken(v: string) {
    if (typeof window !== "undefined") localStorage.setItem("HUB_TOKEN", v);
  },

  get gwToken() {
    return (typeof window !== "undefined" && localStorage.getItem("GW_TOKEN")) || "";
  },
  set gwToken(v: string) {
    if (typeof window !== "undefined") localStorage.setItem("GW_TOKEN", v);
  },
};
