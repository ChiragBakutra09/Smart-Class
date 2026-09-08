export function getFirebaseErrorMessage(err) {
  const code = err?.code || "";
  const map = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-not-found": "No account found with this email.",
    "auth/invalid-email": "That doesn't look like a valid email address.",
    "auth/email-already-in-use": "An account with this email already exists — try logging in instead.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error — check your connection and try again.",
    "auth/user-disabled": "This account has been disabled.",
  };
  return map[code] || err?.message?.replace("Firebase: ", "").replace(/\s*\([^)]*\)\.?$/, "") || "Something went wrong. Please try again.";
}
