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
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  databaseURL: "https://your-app.firebaseio.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:12345:web:abcde"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function listenToOrders() {
  const ordersRef = db.ref('orders');
  ordersRef.on('value', (snapshot) => {
    const data = snapshot.val();
    const ordersArray = data ? Object.values(data) : [];
    renderOrders(ordersArray); // Call your UI render function here
  });
}

function updateOrderStatus(orderID, newStatus) {
  const now = new Date().toISOString();
  const updates = {
    "status": newStatus
  };

  if (newStatus === "Cooking") updates["cookingStartTime"] = now;
  if (newStatus === "Completed") updates["cookingEndTime"] = now;
  if (newStatus === "Picked Up") updates["pickedUpTime"] = now;

  return db.ref('orders/' + orderID).update(updates);
}

function addReCookReason(orderID, note) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("KDS Orders");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const statusCol = headers.indexOf("Status");
  const orderIdCol = headers.indexOf("Order ID");
  const recookCol = headers.indexOf("Re-Cook Reason");
  const cookingStartCol = headers.indexOf("Cooking Start Time");

  const now = new Date();

  for (let i = 1; i < data.length; i++) {
    if (data[i][orderIdCol] == orderID) {
      sheet.getRange(i + 1, statusCol + 1).setValue("Cooking");
      sheet.getRange(i + 1, recookCol + 1).setValue(note);
      sheet.getRange(i + 1, cookingStartCol + 1).setValue(now);
    }
  }
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
