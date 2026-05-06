// 1. STATE & GLOBAL VARIABLES
let currentView = 'active';
let allOrders = [];

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
    const ordersArray = Object.keys(data).map(key => ({ ...data[key], orderID: key }));
    const today = new Date().toDateString();
    allOrders = ordersArray.filter(order => {
      if (!order.orderReceived) return false;
      return new Date(order.orderReceived).toDateString() === today;
    });
    renderOrders(); 
  });
}

// 6. UI RENDERING LOGIC
function renderOrders() {
  const container = document.getElementById("ordersContainer");
  if (!container) return;
  container.innerHTML = "";

  const grouped = {};
  allOrders.forEach(order => {
    if (!grouped[order.orderID]) grouped[order.orderID] = [];
    grouped[order.orderID].push(order);
  });

  const columns = { New: [], Cooking: [], Completed: [], PickedUp: [] };

  Object.values(grouped).forEach(group => {
    const status = group[0].status;
    if (status === "Picked Up") {
      if (currentView === "pickedup") columns.PickedUp.push(group);
    } else if (currentView === "active") {
      if (columns[status]) columns[status].push(group);
    }
  });

  const statusList = currentView === "active" ? ["New", "Cooking", "Completed"] : ["Picked Up"];
  
  statusList.forEach(status => {
    const colDiv = document.createElement("div");
    colDiv.className = "column";
    colDiv.innerHTML = `<h2>${status}</h2>`;
    columns[status === "Picked Up" ? "PickedUp" : status].forEach(group => {
      colDiv.appendChild(buildCard(group));
    });
    container.appendChild(colDiv);
  });
}

function buildCard(group) {
  const order = group[0];
  const div = document.createElement("div");
  div.className = "order-card";
  
  const isRemake = order.reCookReason?.trim();
  if (isRemake) div.style.border = "3px solid gold";

  div.innerHTML = `
    <div style="font-weight: bold; font-size: 1.2em;">${order.firstName} ${order.lastName}</div>
    <ul>
      ${group.map(item => `<li>${item.filling} ${item.base}</li>`).join('')}
    </ul>
    <div id="saving-${order.orderID}" class="saving-note" style="display:none;">💾 Saving...</div>
    <div class="status-buttons">
      ${order.status === 'New' ? `<button onclick="updateStatus('${order.orderID}', 'Cooking', this)">🍳 Start</button>` : ''}
      ${order.status === 'Cooking' ? `<button onclick="updateStatus('${order.orderID}', 'Completed', this)">🥡 Done</button>` : ''}
      ${order.status === 'Completed' ? `<button onclick="updateStatus('${order.orderID}', 'Picked Up', this)">🛍️ Picked Up</button>` : ''}
    </div>
  `;
  return div;
}

// 7. ACTION FUNCTIONS
function updateStatus(orderID, newStatus, button) {
  if (button) button.disabled = true;
  const now = new Date().toISOString();
  return db.ref('orders/' + orderID).update({ "status": newStatus }).finally(() => {
    if (button) button.disabled = false;
  });
}

// 8. START
document.addEventListener("DOMContentLoaded", listenToOrders);
