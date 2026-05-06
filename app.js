function formatDate(value) {
  try {
    const date = new Date(value);
    return date.toLocaleString(undefined, {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      month: "short",
      day: "numeric"
    });
  } catch (e) {
    return value;
  }
}

// Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyC-5mPhJsV9-eYpzIoXlx1Snmv26-rC7lU",
  authDomain: "tot-kds.firebaseapp.com",
  databaseURL: "https://tot-kds-default-rtdb.firebaseio.com",
  projectId: "tot-kds",
  storageBucket: "tot-kds.firebasestorage.app",
  messagingSenderId: "593582447150",
  appId: "1:593582447150:web:e4a084f525c8c9234fddbf",
  measurementId: "G-SR8E9EEB7S"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function listenToOrders() {
  const ordersRef = db.ref('orders');
  
  ordersRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // Firebase returns an object of objects. We need an array for your KDS logic.
    const ordersArray = Object.keys(data).map(key => ({
      ...data[key],
      orderID: key // Using the Firebase unique key as the ID
    }));

    // Filter for today's orders only
    const today = new Date().toDateString();
    allOrders = ordersArray.filter(order => {
      const orderDate = new Date(order.orderReceived).toDateString();
      return orderDate === today;
    });

    renderOrders(); 
  });
}

function updateStatus(orderID, newStatus, button) {
  // Disable button to prevent double-clicks
  if (button) button.disabled = true;
  
  const savingIndicator = document.getElementById(`saving-${orderID}`);
  if (savingIndicator) savingIndicator.style.display = "block";

  const now = new Date().toISOString();
  const updates = { "status": newStatus };

  if (newStatus === "Cooking") updates["cookingStartTime"] = now;
  if (newStatus === "Completed") updates["cookingEndTime"] = now;
  if (newStatus === "Picked Up") updates["pickedUpTime"] = now;

  // Perform the update
  return db.ref('orders/' + orderID).update(updates)
    .then(() => {
      console.log(`Order ${orderID} updated to ${newStatus}`);
      // No need to manually reload orders! 
      // db.ref().on('value') will trigger automatically.
    })
    .catch((error) => {
      console.error("Update failed:", error);
      alert("Failed to update status. Check your internet connection.");
      if (button) button.disabled = false;
    })
    .finally(() => {
      if (savingIndicator) savingIndicator.style.display = "none";
    });
}

function addReCookReason(orderID, note) {
  const now = new Date().toISOString();
  const updates = {
    "status": "Cooking",
    "reCookReason": note,
    "cookingStartTime": now,
    "cookingEndTime": null, // Reset these so it appears active
    "pickedUpTime": null
  };

  return db.ref('orders/' + orderID).update(updates);
}

async function sendTextViaZapier(phone, name, message) {
  // This placeholder will be replaced by GitHub Actions during deployment
  const webhookUrl = 'ZAPIER_WEBHOOK_PLACEHOLDER';

  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify({ to: phone, name: name, message: message })
  });
  
  return response.ok ? "✅ Sent" : "❌ Error";
}

function formatPhoneNumber(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (raw.startsWith('+')) return raw;
  return `+${digits}`;
}
