import api from "../api";

const subscriptionPath = "/api/customer-notifications/push-subscription";

export function supportsPackagePush() {
  return (
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function decodePublicKey(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

export async function enablePackagePush() {
  // Request permission directly from the customer's button tap.
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked. Allow them in your device settings, then try again."
        : "Permission was not granted. You can try again when you’re ready."
    );
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.active) {
    throw new Error("The portal is still getting ready. Reopen it and try again.");
  }

  const { data } = await api.get("/api/customer-notifications/push-public-key");
  const applicationServerKey = decodePublicKey(data.publicKey);
  const manager = registration.pushManager;
  const options = { userVisibleOnly: true, applicationServerKey };

  let subscription = await manager.getSubscription();

  if (subscription) {
    const previousKey = subscription.options.applicationServerKey;
    const bytes = previousKey && new Uint8Array(previousKey);
    const matches =
      bytes?.length === applicationServerKey.length &&
      bytes.every((value, index) => value === applicationServerKey[index]);

    if (!matches) {
      await subscription.unsubscribe();
      subscription = null;
    }
  }

  subscription = subscription || (await manager.subscribe(options));

  try {
    await api.put(subscriptionPath, subscription.toJSON());
  } catch (error) {
    if (error.response?.status !== 409) throw error;

    // A shared phone may still have a subscription from a previous account.
    await subscription.unsubscribe();
    subscription = await manager.subscribe(options);
    await api.put(subscriptionPath, subscription.toJSON());
  }
}

export async function disablePackagePush() {
  if (!supportsPackagePush()) return;

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  const removed = await subscription.unsubscribe();
  if (!removed && (await registration.pushManager.getSubscription())) {
    throw new Error("The phone could not turn off notifications. Please try again.");
  }

  // If the phone is offline, the browser subscription is already revoked.
  // The sender also removes expired endpoints when the push service rejects them.
  await api.delete(subscriptionPath, { data: { endpoint } });
}