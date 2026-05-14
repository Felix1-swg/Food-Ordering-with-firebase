// JavaScript for Aremu Eatry
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getDatabase, ref, set, push } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

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

function isRestaurantOpen() {
    const hour = new Date().getHours();
    return hour >= 7 && hour < 20;
}

function checkOperatingHours() {
    if (!isRestaurantOpen()) {
        const orderSection = document.getElementById('order');
        const orderForm = document.getElementById('order-form');
        const addToCartBtns = document.querySelectorAll('.add-to-cart');
        const cartIcon = document.getElementById('cart-icon');

        const closedAlert = document.createElement('div');
        closedAlert.className = 'alert alert-warning alert-dismissible fade show';
        closedAlert.innerHTML = `
      <strong>Restaurant Closed!</strong> We are only open from 7:00 AM to 8:00 PM.
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
        orderSection.insertBefore(closedAlert, orderSection.firstChild);

        orderForm.style.pointerEvents = 'none';
        orderForm.style.opacity = '0.5';
        addToCartBtns.forEach(btn => (btn.disabled = true));
        cartIcon.style.pointerEvents = 'none';
        cartIcon.style.opacity = '0.5';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const cartItemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('total');
    const orderForm = document.getElementById('order-form');

    let cart = [];
    let total = 0;

    updateCart();

    // ── Mobile menu ──────────────────────────────────────────────────────────────
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileNav.style.display = mobileNav.style.display === 'none' ? 'block' : 'none';
        });
    }
    document.querySelectorAll('#mobile-nav a').forEach(link => {
        link.addEventListener('click', () => (mobileNav.style.display = 'none'));
    });

    checkOperatingHours();

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function () {
            const item = this.getAttribute('data-item');
            const price = parseFloat(this.getAttribute('data-price'));

            const qtyInput = this.parentElement.querySelector('input[type="number"]');
            const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

            const cardBody = this.closest('.card-body');
            const meatSel = cardBody.querySelector('.meat-select');
            const soupSel = cardBody.querySelector('.soup-select');

            let meat = '', soup = '';
            if (meatSel) {
                meat = meatSel.value || '';
                if (!meat) { alert(`Please select a meat option for ${item}.`); return; }
            }
            if (soupSel) {
                soup = soupSel.value || '';
                if (!soup) { alert(`Please select a soup option for ${item}.`); return; }
            }

            for (let i = 0; i < quantity; i++) cart.push({ item, price, meat, soup });

            updateCart();

            this.style.transform = 'scale(1.1)';
            setTimeout(() => (this.style.transform = 'scale(1)'), 200);
        });
    });

    function updateCart() {
        cartItemsEl.innerHTML = '';
        total = 0;

        const grouped = {};
        cart.forEach((item) => {
            const soup = item.soup || 'No Soup';
            const key = `${item.item}___${soup}`;
            if (!grouped[key]) grouped[key] = { item: item.item, soup, price: item.price, quantity: 0 };
            grouped[key].quantity++;
            total += item.price;
        });

        Object.entries(grouped).forEach(([key, group]) => {
            const li = document.createElement('li');
            li.className = 'list-group-item';

            let display = `<div class="cart-item-info"><strong>${group.quantity}x ${group.item}`;
            if (group.soup !== 'No Soup') display += ` + ${group.soup}`;
            display += `</strong><br>
        <small>₦${group.price.toFixed(2)} each × ${group.quantity} = ₦${(group.price * group.quantity).toFixed(2)}</small>
      </div>`;

            li.innerHTML = display + `<button class="btn btn-sm btn-danger remove-group" data-key="${key}">Remove</button>`;
            cartItemsEl.appendChild(li);
        });

        totalEl.textContent = `Total: ₦${total.toFixed(2)}`;

        ['cart-count', 'cart-count-mobile'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = cart.length;
            el.style.display = cart.length > 0 ? 'inline' : 'none';
        });

        document.querySelectorAll('.remove-group').forEach(btn => {
            btn.addEventListener('click', function () {
                const [itemName, soupName] = this.getAttribute('data-key').split('___');
                cart = cart.filter(i => !(i.item === itemName && (i.soup || 'No Soup') === soupName));
                updateCart();
            });
        });
    }

    orderForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!isRestaurantOpen()) {
            alert('Sorry, we are currently closed. We are open from 7:00 AM to 8:00 PM.');
            return;
        }
        if (cart.length === 0) {
            alert('Please add items to your cart before ordering.');
            return;
        }

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;

        const order = {
            id: Date.now(),
            timestamp: Date.now(),
            date: new Date().toLocaleString(),
            name,
            email,
            phone,
            address,
            items: [...cart],
            total
        };

        try {
            const orderRef = push(ref(db, 'orders'));
            await set(orderRef, order);

            alert(`Thank you, ${name}! Your order has been placed. Total: ₦${total.toFixed(2)}\n\nWe'll deliver to: ${address}\nContact: ${phone}`);

            const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
            if (modal) modal.hide();

            cart = [];
            updateCart();
            orderForm.reset();
        } catch (err) {
            console.error('Error:', err);
            alert('Failed to place order. Please check your connection and try again.');
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
