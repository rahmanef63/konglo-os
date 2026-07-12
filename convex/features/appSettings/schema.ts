import { defineTable } from "convex/server";
import { v } from "convex/values";

// Org-level app settings (singleton, key="current"). `honorific` = how the OS
// addresses the owner (principal) across greetings/onboarding/asisten: "Tuan" or
// "Nyonya". Unset → the client shows the neutral "Tuan/Nyonya" default.
export const appSettingsTables = {
  appSettings: defineTable({
    key: v.string(), // always "current"
    honorific: v.optional(v.string()),
  }).index("by_key", ["key"]),
};
