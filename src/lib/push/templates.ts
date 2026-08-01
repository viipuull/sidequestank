/**
 * SideQuest notification template library.
 * Built-in templates are code-defined (instant search, zero DB round-trips).
 * Founder-saved templates live in `notification_templates` and are merged in.
 */

export type PushPriority = "info" | "success" | "reminder" | "important" | "critical";

export type TemplateCategory =
  | "quests" | "verification" | "progression" | "events"
  | "engagement" | "announcements" | "social" | "rewards"
  | "account" | "moderation";

export type PushKind =
  | "new_quest_nearby" | "quest_reminder" | "event_reminder" | "achievement_unlocked"
  | "level_up" | "collection_completed" | "founder_announcement" | "daily_reminder" | "weekly_summary";

export type NotificationTemplate = {
  slug: string;
  name: string;
  category: TemplateCategory;
  icon: string;
  title: string;
  body: string;
  kind: PushKind;
  priority: PushPriority;
  deep_link: string;
  action_label?: string;
  action_url?: string | null;
  variations?: string[];
  requires_confirm?: boolean;
  quick?: boolean;
  favorite?: boolean;
  id?: string;
  built_in?: boolean;
};

export const CATEGORY_META: Record<TemplateCategory, { label: string; icon: string }> = {
  quests: { label: "Quests", icon: "🧭" },
  verification: { label: "Verification", icon: "📸" },
  progression: { label: "Progression", icon: "🏆" },
  events: { label: "Events", icon: "🎉" },
  engagement: { label: "Player engagement", icon: "👋" },
  announcements: { label: "Announcements", icon: "📢" },
  social: { label: "Social", icon: "👥" },
  rewards: { label: "Rewards", icon: "💰" },
  account: { label: "Account", icon: "⚠️" },
  moderation: { label: "Moderation", icon: "🛡️" },
};

export const PRIORITY_META: Record<PushPriority, { label: string; dot: string; ring: string; weight: number }> = {
  info:      { label: "🟢 Info",      dot: "bg-emerald-500", ring: "border-emerald-500/40", weight: 0 },
  success:   { label: "🔵 Success",   dot: "bg-sky-500",     ring: "border-sky-500/40",     weight: 10 },
  reminder:  { label: "🟡 Reminder",  dot: "bg-amber-400",   ring: "border-amber-400/40",   weight: 20 },
  important: { label: "🟠 Important", dot: "bg-orange-500",  ring: "border-orange-500/40",  weight: 40 },
  critical:  { label: "🔴 Critical",  dot: "bg-red-500",     ring: "border-red-500/50",     weight: 90 },
};

const t = (x: NotificationTemplate) => x;

export const BUILT_IN_TEMPLATES: NotificationTemplate[] = [
  // ───────────────────────── Quests
  t({ slug: "quest-new", name: "New Quest Available", category: "quests", icon: "🧭", priority: "info", kind: "new_quest_nearby", deep_link: "/quests", action_label: "Explore",
      title: "🧭 A New Adventure Awaits", body: "A mysterious quest has appeared nearby. Ready to explore?", quick: true,
      variations: ["A fresh quest just dropped in {{city}}. Go claim it.", "New quest unlocked near you. The map has changed."] }),
  t({ slug: "quest-hidden", name: "Hidden Quest Nearby", category: "quests", icon: "🕵️", priority: "important", kind: "new_quest_nearby", deep_link: "/quests",
      title: "🕵️ A hidden quest is close", body: "Something secret is hiding in {{city}}. Only a few will find it." }),
  t({ slug: "quest-nearby", name: "Nearby Quest", category: "quests", icon: "📍", priority: "reminder", kind: "new_quest_nearby", deep_link: "/quests", quick: true,
      title: "📍 Quest {{quest_name}} is nearby", body: "You're close to {{quest_name}}. Want to take it on right now?" }),
  t({ slug: "quest-limited", name: "Limited-Time Quest", category: "quests", icon: "⏳", priority: "important", kind: "quest_reminder", deep_link: "/quests",
      title: "⏳ Limited-time quest live", body: "{{quest_name}} is only available for a short while. Don't miss it." }),
  t({ slug: "quest-daily", name: "Daily Quest", category: "quests", icon: "🌅", priority: "reminder", kind: "daily_reminder", deep_link: "/quests", quick: true,
      title: "🌅 Your daily quest is ready", body: "A new daily adventure is waiting, {{player_name}}.",
      variations: ["Today's quest just unlocked. Ten minutes of adventure?", "Daily quest online. Keep your streak alive."] }),
  t({ slug: "quest-weekly", name: "Weekly Quest", category: "quests", icon: "🗓️", priority: "reminder", kind: "weekly_summary", deep_link: "/quests", quick: true,
      title: "🗓️ Weekly quest unlocked", body: "This week's challenge is live. Bigger quest, bigger XP." }),
  t({ slug: "quest-resume", name: "Resume Quest", category: "quests", icon: "▶️", priority: "reminder", kind: "quest_reminder", deep_link: "/quests",
      title: "▶️ Pick up where you left off", body: "{{quest_name}} is still in progress. Finish it and claim {{xp}} XP." }),
  t({ slug: "quest-updated", name: "Quest Updated", category: "quests", icon: "✏️", priority: "info", kind: "quest_reminder", deep_link: "/quests",
      title: "✏️ {{quest_name}} was updated", body: "We refreshed the objectives. Take another look before you play." }),
  t({ slug: "quest-ending", name: "Quest Ending Soon", category: "quests", icon: "⌛", priority: "important", kind: "quest_reminder", deep_link: "/quests",
      title: "⌛ {{quest_name}} ends soon", body: "Last chance to complete this quest and grab the reward." }),
  t({ slug: "quest-completed", name: "Quest Completed", category: "quests", icon: "🏁", priority: "success", kind: "quest_reminder", deep_link: "/profile",
      title: "🏁 Quest complete", body: "You finished {{quest_name}} and earned +{{xp}} XP. Legend." }),
  t({ slug: "quest-failed", name: "Quest Failed", category: "quests", icon: "💀", priority: "important", kind: "quest_reminder", deep_link: "/quests",
      title: "💀 Quest failed", body: "{{quest_name}} didn't go your way this time. Try again when you're ready." }),

  // ───────────────────────── Verification
  t({ slug: "sub-received", name: "Submission Received", category: "verification", icon: "📸", priority: "info", kind: "quest_reminder", deep_link: "/quests",
      title: "📸 Submission received", body: "We've received your submission. Our reviewers will check it shortly." }),
  t({ slug: "photo-review", name: "Photo Under Review", category: "verification", icon: "🔍", priority: "info", kind: "quest_reminder", deep_link: "/quests",
      title: "🔍 Photo under review", body: "Your photo for {{quest_name}} is being reviewed by {{reviewer}}." }),
  t({ slug: "photo-approved", name: "Photo Approved", category: "verification", icon: "✅", priority: "success", kind: "quest_reminder", deep_link: "/quests",
      title: "✅ Photo approved", body: "Excellent work! Your photo for {{quest_name}} has been approved. +{{xp}} XP awarded." }),
  t({ slug: "photo-rejected", name: "Photo Rejected", category: "verification", icon: "❌", priority: "important", kind: "quest_reminder", deep_link: "/quests",
      title: "❌ Photo rejected", body: "Your submission couldn't be approved. Reason: {{reason}}. Attempts remaining: {{attempts_left}}. Please try again." }),
  t({ slug: "objective-approved", name: "Objective Approved", category: "verification", icon: "☑️", priority: "success", kind: "quest_reminder", deep_link: "/quests",
      title: "☑️ Objective approved", body: "{{objective_name}} is verified. On to the next one." }),
  t({ slug: "objective-rejected", name: "Objective Rejected", category: "verification", icon: "⚠️", priority: "important", kind: "quest_reminder", deep_link: "/quests",
      title: "⚠️ Objective rejected", body: "{{objective_name}} wasn't accepted. Reason: {{reason}}." }),
  t({ slug: "review-started", name: "Manual Review Started", category: "verification", icon: "🧑‍⚖️", priority: "info", kind: "quest_reminder", deep_link: "/quests",
      title: "🧑‍⚖️ Manual review started", body: "A reviewer is checking your proof for {{quest_name}} right now." }),
  t({ slug: "review-complete", name: "Manual Review Complete", category: "verification", icon: "📝", priority: "success", kind: "quest_reminder", deep_link: "/quests",
      title: "📝 Review complete", body: "Your submission for {{quest_name}} has been reviewed. Open the quest to see the result." }),
  t({ slug: "retry-required", name: "Retry Required", category: "verification", icon: "🔁", priority: "reminder", kind: "quest_reminder", deep_link: "/quests",
      title: "🔁 One more try needed", body: "We need a clearer proof for {{objective_name}}. Attempts remaining: {{attempts_left}}." }),
  t({ slug: "quest-approved", name: "Quest Approved", category: "verification", icon: "🎯", priority: "success", kind: "quest_reminder", deep_link: "/profile",
      title: "🎯 Quest approved", body: "{{quest_name}} is approved. Your rewards are unlocked." }),
  t({ slug: "quest-rejected", name: "Quest Rejected", category: "verification", icon: "🚫", priority: "important", kind: "quest_reminder", deep_link: "/quests",
      title: "🚫 Quest rejected", body: "{{quest_name}} couldn't be verified. Reason: {{reason}}." }),
  t({ slug: "quest-verified", name: "Quest Fully Verified", category: "verification", icon: "🏆", priority: "success", kind: "quest_reminder", deep_link: "/profile",
      title: "🏆 Quest verified", body: "Congratulations! Quest completed successfully. Rewards: +{{xp}} XP {{badge}} {{title}}" }),

  // ───────────────────────── Progression
  t({ slug: "xp-earned", name: "XP Earned", category: "progression", icon: "⚡", priority: "success", kind: "level_up", deep_link: "/xp-history",
      title: "⚡ +{{xp}} XP earned", body: "Nice move, {{player_name}}. {{xp_remaining}} XP to level {{level}}." }),
  t({ slug: "level-up", name: "Level Up", category: "progression", icon: "🎚️", priority: "success", kind: "level_up", deep_link: "/profile",
      title: "🎚️ Level {{level}} reached", body: "You levelled up! New quests and titles just opened up.",
      variations: ["You're now level {{level}}. The map keeps growing.", "Level {{level}}! The Guild noticed."] }),
  t({ slug: "achievement", name: "Achievement Unlocked", category: "progression", icon: "🏅", priority: "success", kind: "achievement_unlocked", deep_link: "/achievements",
      title: "🏅 Achievement unlocked", body: "You unlocked {{badge}}. Nice work, explorer." }),
  t({ slug: "badge-earned", name: "Badge Earned", category: "progression", icon: "🎖️", priority: "success", kind: "achievement_unlocked", deep_link: "/achievements",
      title: "🎖️ New badge earned", body: "{{badge}} is now on your profile." }),
  t({ slug: "collection-progress", name: "Collection Progress", category: "progression", icon: "📈", priority: "reminder", kind: "collection_completed", deep_link: "/collections",
      title: "📈 {{collection}} is close", body: "You're almost done with {{collection}}. One more quest to go." }),
  t({ slug: "collection-done", name: "Collection Completed", category: "progression", icon: "📚", priority: "success", kind: "collection_completed", deep_link: "/collections",
      title: "📚 Collection complete", body: "You completed {{collection}}. Rewards are waiting in your profile." }),
  t({ slug: "new-title", name: "New Title", category: "progression", icon: "🎗️", priority: "success", kind: "achievement_unlocked", deep_link: "/titles",
      title: "🎗️ New title unlocked", body: "You earned the title \"{{title}}\". Equip it and show it off." }),
  t({ slug: "rank-up", name: "Leaderboard Rank Improved", category: "progression", icon: "📊", priority: "success", kind: "weekly_summary", deep_link: "/leaderboard",
      title: "📊 You climbed to #{{rank}}", body: "Your rank improved in {{city}}. Keep the streak going." }),
  t({ slug: "top-10", name: "Top 10", category: "progression", icon: "🔟", priority: "success", kind: "weekly_summary", deep_link: "/leaderboard",
      title: "🔟 You're in the Top 10", body: "You're now #{{rank}} in {{city}}. Elite company." }),
  t({ slug: "top-3", name: "Top 3", category: "progression", icon: "🥉", priority: "success", kind: "weekly_summary", deep_link: "/leaderboard",
      title: "🥉 Top 3 in {{city}}", body: "You reached #{{rank}}. The podium is yours to defend." }),
  t({ slug: "rank-lost", name: "Rank Lost", category: "progression", icon: "📉", priority: "reminder", kind: "weekly_summary", deep_link: "/leaderboard",
      title: "📉 You dropped to #{{rank}}", body: "Someone passed you. Time to take the lead back." }),

  // ───────────────────────── Events
  t({ slug: "event-started", name: "Event Started", category: "events", icon: "🎉", priority: "important", kind: "event_reminder", deep_link: "/events", quick: true,
      title: "🎉 {{event_name}} is live", body: "The event has begun. Jump in and start earning." }),
  t({ slug: "event-soon", name: "Event Starts Soon", category: "events", icon: "⏰", priority: "reminder", kind: "event_reminder", deep_link: "/events", quick: true,
      title: "⏰ {{event_name}} starts soon", body: "Get ready — the event kicks off shortly." }),
  t({ slug: "event-ending", name: "Event Ending Soon", category: "events", icon: "🔔", priority: "important", kind: "event_reminder", deep_link: "/events", quick: true,
      title: "🔔 {{event_name}} ends today", body: "Final hours to finish your progress and claim rewards." }),
  t({ slug: "event-completed", name: "Event Completed", category: "events", icon: "✅", priority: "success", kind: "event_reminder", deep_link: "/events",
      title: "✅ {{event_name}} complete", body: "You finished the event. Well played, {{player_name}}." }),
  t({ slug: "event-reward", name: "Event Reward Ready", category: "events", icon: "🎁", priority: "success", kind: "event_reminder", deep_link: "/events",
      title: "🎁 Event reward ready", body: "Your rewards from {{event_name}} are ready to claim." }),
  t({ slug: "double-xp", name: "Double XP", category: "events", icon: "⚡", priority: "important", kind: "event_reminder", deep_link: "/events", quick: true,
      title: "⚡ Double XP is live", body: "Every quest pays double until the timer runs out. Go, go, go." }),
  t({ slug: "weekend-event", name: "Weekend Event", category: "events", icon: "🌤️", priority: "reminder", kind: "event_reminder", deep_link: "/events",
      title: "🌤️ Weekend event unlocked", body: "Special weekend quests are live in {{city}}." }),
  t({ slug: "festival-event", name: "Festival Event", category: "events", icon: "🪔", priority: "important", kind: "event_reminder", deep_link: "/events",
      title: "🪔 {{event_name}} festival begins", body: "Celebrate with limited festival quests and exclusive titles." }),
  t({ slug: "community-event", name: "Community Event", category: "events", icon: "🤝", priority: "important", kind: "event_reminder", deep_link: "/events",
      title: "🤝 Community goal started", body: "{{event_name}} needs everyone. Every quest you finish counts." }),
  t({ slug: "seasonal-event", name: "Seasonal Event", category: "events", icon: "❄️", priority: "important", kind: "event_reminder", deep_link: "/events",
      title: "❄️ New season: {{event_name}}", body: "A new season of SideQuest starts now. Fresh leaderboard, fresh rewards." }),

  // ───────────────────────── Engagement
  t({ slug: "welcome", name: "Welcome To SideQuest", category: "engagement", icon: "👋", priority: "success", kind: "founder_announcement", deep_link: "/quests", quick: true,
      title: "👋 Welcome to SideQuest", body: "Your adventure starts now, {{player_name}}. Find your first quest in {{city}}." }),
  t({ slug: "welcome-back", name: "Welcome Back", category: "engagement", icon: "🔮", priority: "reminder", kind: "daily_reminder", deep_link: "/home", quick: true,
      title: "🔮 Welcome back, {{player_name}}", body: "Adventure awaits.",
      variations: ["The Guild has another mission.", "Ready for another discovery?", "The world has changed since you left.", "Your next quest is waiting."] }),
  t({ slug: "continue-journey", name: "Continue Your Journey", category: "engagement", icon: "🧗", priority: "reminder", kind: "quest_reminder", deep_link: "/quests",
      title: "🧗 Continue your journey", body: "You're {{xp_remaining}} XP from level {{level}}. One quest could do it." }),
  t({ slug: "we-miss-you", name: "We Miss You", category: "engagement", icon: "💜", priority: "reminder", kind: "daily_reminder", deep_link: "/home",
      title: "💜 We miss you, {{player_name}}", body: "New quests appeared in {{city}} while you were away.",
      variations: ["The map moved on without you. Come back and catch up.", "Your streak misses you. So do we."] }),
  t({ slug: "daily-adventure", name: "Daily Adventure", category: "engagement", icon: "🌅", priority: "reminder", kind: "daily_reminder", deep_link: "/quests", quick: true,
      title: "🌅 Today's adventure is ready", body: "A short quest, a big reward. Take five minutes for yourself." }),
  t({ slug: "weekly-adventure", name: "Weekly Adventure", category: "engagement", icon: "🗓️", priority: "reminder", kind: "weekly_summary", deep_link: "/quests", quick: true,
      title: "🗓️ Your week in SideQuest", body: "You earned {{xp}} XP this week and sit at #{{rank}}. Ready for more?" }),
  t({ slug: "continue-active", name: "Continue Active Quest", category: "engagement", icon: "▶️", priority: "reminder", kind: "quest_reminder", deep_link: "/quests",
      title: "▶️ {{quest_name}} is still open", body: "Your session is waiting. Finish it before it goes stale." }),
  t({ slug: "finish-collection", name: "Finish Your Collection", category: "engagement", icon: "📚", priority: "reminder", kind: "collection_completed", deep_link: "/collections",
      title: "📚 Finish {{collection}}", body: "You're one quest away from completing this collection." }),
  t({ slug: "streak-ending", name: "Your Streak Is Ending", category: "engagement", icon: "🔥", priority: "important", kind: "daily_reminder", deep_link: "/quests",
      title: "🔥 Your streak ends tonight", body: "Complete one quest to keep the fire alive." }),
  t({ slug: "next-adventure", name: "Your Next Adventure Awaits", category: "engagement", icon: "🧭", priority: "info", kind: "new_quest_nearby", deep_link: "/quests",
      title: "🧭 Your next adventure awaits", body: "The map in {{city}} just changed. Come see what's new." }),

  // ───────────────────────── Announcements
  t({ slug: "new-update", name: "New Update", category: "announcements", icon: "🚀", priority: "info", kind: "founder_announcement", deep_link: "/home",
      title: "🚀 SideQuest just got better", body: "A new update is live with improvements across the app." }),
  t({ slug: "new-features", name: "New Features", category: "announcements", icon: "✨", priority: "info", kind: "founder_announcement", deep_link: "/home",
      title: "✨ New features unlocked", body: "Fresh features just landed in SideQuest. Take a look." }),
  t({ slug: "new-quests-added", name: "New Quests Added", category: "announcements", icon: "🗺️", priority: "info", kind: "new_quest_nearby", deep_link: "/quests", quick: true,
      title: "🗺️ New quests added", body: "We just added new quests in {{city}}. Go get them." }),
  t({ slug: "new-locations", name: "New Locations Added", category: "announcements", icon: "📍", priority: "info", kind: "new_quest_nearby", deep_link: "/quests",
      title: "📍 New locations on the map", body: "Fresh spots to explore just went live." }),
  t({ slug: "new-city", name: "New City Added", category: "announcements", icon: "🏙️", priority: "important", kind: "founder_announcement", deep_link: "/quests",
      title: "🏙️ SideQuest is now in {{city}}", body: "A whole new city just opened up. Be the first to explore it." }),
  t({ slug: "community-announcement", name: "Community Announcement", category: "announcements", icon: "📢", priority: "info", kind: "founder_announcement", deep_link: "/home",
      title: "📢 A note from the Guild", body: "We have news for the SideQuest community." }),
  t({ slug: "maintenance", name: "Maintenance", category: "announcements", icon: "🛠️", priority: "important", kind: "founder_announcement", deep_link: "/home", quick: true, requires_confirm: true,
      title: "🛠️ Scheduled maintenance", body: "SideQuest will be briefly unavailable while we upgrade the servers. Reason: {{reason}}." }),
  t({ slug: "maintenance-done", name: "Maintenance Complete", category: "announcements", icon: "✅", priority: "success", kind: "founder_announcement", deep_link: "/home",
      title: "✅ We're back online", body: "Maintenance is complete. Everything is running again." }),
  t({ slug: "emergency", name: "Emergency Notice", category: "announcements", icon: "🚨", priority: "critical", kind: "founder_announcement", deep_link: "/home", quick: true, requires_confirm: true,
      title: "🚨 Important notice", body: "{{reason}}. Please read this carefully." }),

  // ───────────────────────── Social
  t({ slug: "passed-you", name: "Someone Passed You", category: "social", icon: "👀", priority: "reminder", kind: "weekly_summary", deep_link: "/leaderboard",
      title: "👀 Someone just passed you", body: "You slipped to #{{rank}} in {{city}}. Take it back." }),
  t({ slug: "now-top-10", name: "You're Now Top 10", category: "social", icon: "🔟", priority: "success", kind: "weekly_summary", deep_link: "/leaderboard",
      title: "🔟 You're in the Top 10", body: "Big climb, {{player_name}}. You're #{{rank}} now." }),
  t({ slug: "community-milestone", name: "Community Milestone", category: "social", icon: "🌍", priority: "important", kind: "founder_announcement", deep_link: "/home",
      title: "🌍 Community milestone reached", body: "Together we hit a huge milestone in {{city}}. Thank you, explorers." }),
  t({ slug: "compare-progress", name: "Compare Progress", category: "social", icon: "⚖️", priority: "info", kind: "weekly_summary", deep_link: "/players",
      title: "⚖️ How do you compare?", body: "See how your progress stacks up against other explorers." }),
  t({ slug: "friend-joined", name: "Friend Joined", category: "social", icon: "🙌", priority: "info", kind: "founder_announcement", deep_link: "/players",
      title: "🙌 {{username}} joined SideQuest", body: "A new explorer joined your city. Say hello on the leaderboard." }),

  // ───────────────────────── Rewards
  t({ slug: "daily-reward", name: "Daily Reward", category: "rewards", icon: "🎁", priority: "success", kind: "daily_reminder", deep_link: "/challenges",
      title: "🎁 Daily reward ready", body: "Your daily reward is waiting. Open the app to claim it." }),
  t({ slug: "weekly-reward", name: "Weekly Reward", category: "rewards", icon: "🎀", priority: "success", kind: "weekly_summary", deep_link: "/challenges",
      title: "🎀 Weekly reward unlocked", body: "You earned this week's reward. Claim it now." }),
  t({ slug: "mystery-reward", name: "Mystery Reward", category: "rewards", icon: "🎲", priority: "important", kind: "founder_announcement", deep_link: "/challenges",
      title: "🎲 A mystery reward appeared", body: "Something's waiting for you, {{player_name}}. Open it to find out what." }),
  t({ slug: "bonus-xp", name: "Bonus XP", category: "rewards", icon: "⚡", priority: "success", kind: "level_up", deep_link: "/xp-history",
      title: "⚡ Bonus +{{xp}} XP", body: "We dropped bonus XP into your account. Enjoy." }),
  t({ slug: "coupon", name: "Coupon Available", category: "rewards", icon: "🏷️", priority: "important", kind: "founder_announcement", deep_link: "/home",
      title: "🏷️ A real-life reward is waiting", body: "You unlocked a partner coupon in {{city}}. Check your rewards." }),
  t({ slug: "reward-claim", name: "Reward Ready To Claim", category: "rewards", icon: "📦", priority: "success", kind: "founder_announcement", deep_link: "/profile",
      title: "📦 Reward ready to claim", body: "You have an unclaimed reward: {{badge}} {{title}}." }),

  // ───────────────────────── Account
  t({ slug: "email-verified", name: "Email Verified", category: "account", icon: "✉️", priority: "success", kind: "founder_announcement", deep_link: "/settings",
      title: "✉️ Email verified", body: "Your email is confirmed. Your account is fully set up." }),
  t({ slug: "password-changed", name: "Password Changed", category: "account", icon: "🔑", priority: "important", kind: "founder_announcement", deep_link: "/settings",
      title: "🔑 Password changed", body: "Your password was updated. If this wasn't you, contact us immediately." }),
  t({ slug: "profile-updated", name: "Profile Updated", category: "account", icon: "🪪", priority: "info", kind: "founder_announcement", deep_link: "/settings/profile",
      title: "🪪 Profile updated", body: "Your profile changes were saved, {{player_name}}." }),
  t({ slug: "new-device", name: "Login From New Device", category: "account", icon: "🖥️", priority: "important", kind: "founder_announcement", deep_link: "/settings",
      title: "🖥️ New sign-in detected", body: "Your account was accessed from a new device. Wasn't you? Secure your account." }),
  t({ slug: "notif-settings", name: "Notification Settings Updated", category: "account", icon: "🔔", priority: "info", kind: "founder_announcement", deep_link: "/settings/notifications",
      title: "🔔 Notification settings updated", body: "Your notification preferences were saved." }),

  // ───────────────────────── Moderation
  t({ slug: "friendly-reminder", name: "Friendly Reminder", category: "moderation", icon: "🙂", priority: "info", kind: "founder_announcement", deep_link: "/rules",
      title: "🙂 A friendly reminder", body: "Keep quests safe and respectful. Thanks for being part of SideQuest." }),
  t({ slug: "guideline-reminder", name: "Community Guideline Reminder", category: "moderation", icon: "📜", priority: "reminder", kind: "founder_announcement", deep_link: "/rules",
      title: "📜 Community guidelines", body: "Please take a moment to re-read the SideQuest community rules." }),
  t({ slug: "warning", name: "Warning Issued", category: "moderation", icon: "⚠️", priority: "important", kind: "founder_announcement", deep_link: "/rules", requires_confirm: true,
      title: "⚠️ Warning", body: "Your recent activity violated our Community Guidelines. Reason: {{reason}}. Please review the rules to avoid further action." }),
  t({ slug: "final-warning", name: "Final Warning", category: "moderation", icon: "🛑", priority: "critical", kind: "founder_announcement", deep_link: "/rules", requires_confirm: true,
      title: "🛑 Final warning", body: "This is a final warning. Reason: {{reason}}. Further violations will suspend your account." }),
  t({ slug: "suspended", name: "Account Suspended", category: "moderation", icon: "🚫", priority: "critical", kind: "founder_announcement", deep_link: "/rules", requires_confirm: true,
      title: "🚫 Account suspended", body: "Your account has been temporarily suspended. Reason: {{reason}}. If you believe this is incorrect you may submit an appeal." }),
  t({ slug: "restored", name: "Account Restored", category: "moderation", icon: "✅", priority: "success", kind: "founder_announcement", deep_link: "/home",
      title: "✅ Suspension removed", body: "Welcome back! Your account has been restored. Enjoy your next adventure." }),
  t({ slug: "appeal-submitted", name: "Appeal Submitted", category: "moderation", icon: "📨", priority: "info", kind: "founder_announcement", deep_link: "/rules",
      title: "📨 Appeal received", body: "We received your appeal and will review it shortly." }),
  t({ slug: "appeal-approved", name: "Appeal Approved", category: "moderation", icon: "✅", priority: "success", kind: "founder_announcement", deep_link: "/home",
      title: "✅ Appeal approved", body: "Good news — your appeal was approved and your access is restored." }),
  t({ slug: "appeal-rejected", name: "Appeal Rejected", category: "moderation", icon: "❌", priority: "important", kind: "founder_announcement", deep_link: "/rules", requires_confirm: true,
      title: "❌ Appeal rejected", body: "After review, your appeal was not approved. Reason: {{reason}}." }),
  t({ slug: "report-resolved", name: "Report Resolved", category: "moderation", icon: "📋", priority: "info", kind: "founder_announcement", deep_link: "/home",
      title: "📋 Report resolved", body: "Thanks for the report — we reviewed it and took the appropriate action." }),
  t({ slug: "content-removed", name: "Content Removed", category: "moderation", icon: "🗑️", priority: "important", kind: "founder_announcement", deep_link: "/rules", requires_confirm: true,
      title: "🗑️ Content removed", body: "Some of your content was removed. Reason: {{reason}}." }),
];

export const QUICK_SEND = BUILT_IN_TEMPLATES.filter((x) => x.quick);

export function searchTemplates(list: NotificationTemplate[], query: string, category: TemplateCategory | "all" | "favorites", favorites: Set<string>) {
  const q = query.trim().toLowerCase();
  return list.filter((tpl) => {
    if (category === "favorites" ? !(favorites.has(tpl.slug) || tpl.favorite) : category !== "all" && tpl.category !== category) return false;
    if (!q) return true;
    return (
      tpl.name.toLowerCase().includes(q) ||
      tpl.title.toLowerCase().includes(q) ||
      tpl.body.toLowerCase().includes(q) ||
      tpl.category.includes(q)
    );
  });
}