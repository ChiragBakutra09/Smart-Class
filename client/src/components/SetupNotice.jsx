import { isFirebaseConfigured } from "../firebase/firebaseConfig";

export default function SetupNotice() {
  if (isFirebaseConfigured) return null;

  return (
    <div style={{
      background: "#FFF4E5", border: "1px solid #FFD9A8", borderRadius: 12,
      padding: "14px 16px", marginBottom: 18, fontSize: 12.5, color: "#8A5A00", lineHeight: 1.5,
    }}>
      <strong>Firebase isn't configured yet.</strong> Copy <code>client/.env.example</code> to{" "}
      <code>client/.env</code>, fill in your Firebase project's web config, then restart{" "}
      <code>npm run dev</code>. See the README for step-by-step instructions.
    </div>
  );
}
