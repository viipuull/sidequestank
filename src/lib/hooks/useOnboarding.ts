const KEY_ONBOARDED = "sq_onboarded_v1";
const KEY_TUTORIAL = "sq_tutorial_done_v1";

export const onboarding = {
  isOnboarded: () => typeof window !== "undefined" && localStorage.getItem(KEY_ONBOARDED) === "1",
  setOnboarded: () => localStorage.setItem(KEY_ONBOARDED, "1"),
  isTutorialDone: () => typeof window !== "undefined" && localStorage.getItem(KEY_TUTORIAL) === "1",
  setTutorialDone: () => localStorage.setItem(KEY_TUTORIAL, "1"),
  reset: () => {
    localStorage.removeItem(KEY_ONBOARDED);
    localStorage.removeItem(KEY_TUTORIAL);
  },
};