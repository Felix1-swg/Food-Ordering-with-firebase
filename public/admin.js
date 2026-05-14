import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAR3hvTK8swIuMzrsE16I3nA-8QX8d0GhA",
    authDomain: "aremufoods.firebaseapp.com",
    projectId: "aremufoods",
    storageBucket: "aremufoods.firebasestorage.app",
    messagingSenderId: "296318152884",
    appId: "1:296318152884:web:629d69290ba1d4ffede7e1",
    measurementId: "G-9GPJFJB83E",
    databaseURL: "https://aremufoods-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const ordersRef = ref(db, 'orders');

function formatCurrency(amount) {
    return `₦${Number(amount).toFixed(2)}`;
}

function renderOrders(orders) {
    const ordersContainer = document.getElementById('orders-container');

    if (!orders || orders.length === 0) {
        ordersContainer.innerHTML = '<p class="text-center text-muted">No orders yet. Orders will appear here when customers place them.</p>';
        return;
    }

    ordersContainer.innerHTML = '';
    orders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'card mb-4';
        orderDiv.innerHTML = `
            <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                <div class="mb-2 mb-md-0">
                    <h5>Order #${order.displayId}</h5>
                    <small class="text-muted">${order.date}</small>
                </div>
                <button class="btn btn-sm btn-danger" onclick="deleteOrder('${order.key}')">Delete Order</button>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-12 col-md-6">
                        <h6>Customer Details:</h6>
                        <p><strong>Name:</strong> ${order.name}</p>
                        <p><strong>Email:</strong> ${order.email}</p>
                        <p><strong>Phone:</strong> ${order.phone}</p>
                        <p><strong>Address:</strong> ${order.address}</p>
                    </div>
                    <div class="col-12 col-md-6">
                        <h6>Order Items:</h6>
                        <ul class="list-group">
                            ${order.items.map(item => {
                                let itemText = `${item.item} - ${formatCurrency(item.price)}`;
                                if (item.meat || item.soup) {
                                    itemText += `<br><small>(${item.meat || 'No meat'} + ${item.soup || 'No soup'})</small>`;
                                }
                                return `<li class="list-group-item">${itemText}</li>`;
                            }).join('')}
                        </ul>
                        <p class="mt-2"><strong>Total: ${formatCurrency(order.total)}</strong></p>
                    </div>
                </div>
            </div>
        `;
        ordersContainer.appendChild(orderDiv);
    });
}

window.deleteOrder = async function(orderKey) {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
        await remove(ref(db, `orders/${orderKey}`));
    } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
    }
};

function parseOrders(snapshotValue) {
    if (!snapshotValue) return [];
    return Object.entries(snapshotValue)
        .map(([key, order]) => ({
            key,
            displayId: order.id || key,
            date: order.date || (order.timestamp ? new Date(order.timestamp).toLocaleString() : 'Unknown date'),
            ...order
        }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

document.addEventListener('DOMContentLoaded', () => {
    const ordersContainer = document.getElementById('orders-container');

    onValue(ordersRef, (snapshot) => {
        const orders = parseOrders(snapshot.val());
        renderOrders(orders);
    }, (error) => {
        console.error('Error loading orders:', error);
        ordersContainer.innerHTML = '<p class="text-center text-danger">Failed to load orders. Please check your connection.</p>';
    });
});
