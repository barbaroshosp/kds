// 1. STATE & GLOBAL VARIABLES
let currentView = 'active';
let allOrders = [];
let lastOrderIDs = new Set();

// 2. CONFIGURATION (Placeholders for GitHub Injection)
const firebaseConfig = {
  apiKey: "FIREBASE_API_KEY_PLACEHOLDER",
  authDomain: "tot-kds.firebaseapp.com",
  databaseURL: "FIREBASE_DB_URL_PLACEHOLDER",
  projectId: "tot-kds",
  storageBucket: "tot-kds.firebasestorage.app",
  messagingSenderId: "593582447150",
  appId: "FIREBASE_APP_ID_PLACEHOLDER",
  measurementId: "G-SR8E9EEB7S"
};

// 3. INITIALIZATION
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 4. VIEW LOGIC
function setView(view) {
  currentView = view;
  renderOrders(); 
}

// 5. DATABASE LISTENER
function listenToOrders() {
  const ordersRef = db.ref('orders');
  
  ordersRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      allOrders = [];
      renderOrders();
      return;
    }

    // Convert object to array and include the ID
    const ordersArray = Object.keys(data).map(key => ({
      ...data[key],
      orderID: key 
    }));

    // Today's filter
    const today = new Date().toDateString();
    allOrders = ordersArray.filter(order => {
      if (!order.orderReceived) return false;
      const orderDate = new Date(order.orderReceived).toDateString();
      return orderDate === today;
    });

    renderOrders(); 
  });
}

// 6. ACTION FUNCTIONS
function updateStatus(orderID, newStatus, button) {
  if (button) button.disabled = true;
  const savingIndicator = document.getElementById(`saving-${orderID}`);
  if (savingIndicator) savingIndicator.style.display = "block";

  const now = new Date().toISOString();
  const updates = { "status": newStatus };

  if (newStatus === "Cooking") updates["cookingStartTime"] = now;
  if (newStatus === "Completed") updates["cookingEndTime"] = now;
  if (newStatus === "Picked Up") updates["pickedUpTime"] = now;

  return db.ref('orders/' + orderID).update(updates)
    .catch(err => alert("Update failed: " + err.message))
    .finally(() => {
      if (savingIndicator) savingIndicator.style.display = "none";
      if (button) button.disabled = false;
    });
}

function addReCookReason(orderID, note) {
  const now = new Date().toISOString();
  return db.ref('orders/' + orderID).update({
    "status": "Cooking",
    "reCookReason": note,
    "cookingStartTime": now,
    "cookingEndTime": null,
    "pickedUpTime": null
  });
}

async function sendTextViaZapier(phone, name, message) {
  const webhookUrl = 'ZAPIER_WEBHOOK_PLACEHOLDER';
  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify({ to: formatPhoneNumber(phone), name: name, message: message })
  });
  return response.ok ? "✅ Sent" : "❌ Error";
}

// 7. FORMATTERS
function formatDate(value) {
  try {
    const date = new Date(value);
    return date.toLocaleString(undefined, {
      hour: "numeric", minute: "numeric", hour12: true,
      month: "short", day: "numeric"
    });
  } catch (e) { return value; }
}

function formatPhoneNumber(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

// 8. START THE APP
document.addEventListener("DOMContentLoaded", () => {
  listenToOrders();
});
