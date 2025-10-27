// ✅ Initialize AOS (Animate On Scroll)
AOS.init({
  duration: 1000,
  once: true
});

// ✅ Smooth scroll for navbar links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth"
    });
  });
});

// ✅ Smooth scroll for category images
document.querySelectorAll('.category-slide-img').forEach(img => {
  img.addEventListener('click', () => {
    const target = document.querySelector(img.dataset.scroll);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ✅ Home Button Scroll
function scrollToHome() {
  document.querySelector('#miamore-landing').scrollIntoView({ behavior: 'smooth' });
}

// ✅ Show/hide home button while scrolling
window.addEventListener('scroll', () => {
  const btn = document.getElementById('home-btn');
  if (!btn) return;
  btn.style.opacity = window.scrollY > 400 ? '1' : '0';
  btn.style.pointerEvents = window.scrollY > 400 ? 'auto' : 'none';
});

// ✅ CART SYSTEM
let cart = [];

// Get all necessary elements safely after DOM load
document.addEventListener("DOMContentLoaded", () => {
  const cartModal = document.getElementById('cartModal');
  const cartItemsList = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  const closeCart = document.getElementById('close-cart');
  const cartIcon = document.querySelector('.icon-cart img');

  // 🛒 Function to add coffee item
  window.selectCoffee = function (button) {
    const card = button.closest('.card');
    const itemName = card.querySelector('.card-title').innerText;
    const itemPrice = parseFloat(card.querySelector('h6').innerText.replace('₱', ''));

    // Add item to cart
    cart.push({ name: itemName, price: itemPrice });
    updateCartDisplay();

    // Animate button
    button.innerText = "Added!";
    button.style.backgroundColor = "#b88856";
    card.style.transform = "scale(1.05)";
    setTimeout(() => {
      card.style.transform = "scale(1)";
      button.innerText = "Add to Cart";
      button.style.backgroundColor = "#6b3e1d";
    }, 800);
  };

  // 🧾 Update cart list and total
  function updateCartDisplay() {
    cartItemsList.innerHTML = "";
    let total = 0;
    cart.forEach(item => {
      const li = document.createElement('li');
      li.innerText = `${item.name} - ₱${item.price}`;
      cartItemsList.appendChild(li);
      total += item.price;
    });
    cartTotal.innerText = `Total: ₱${total}`;
  }

  // 🛍️ Open cart
  cartIcon.addEventListener('click', () => {
    cartModal.style.display = 'flex';
  });

  // ❌ Close cart
  closeCart.addEventListener('click', () => {
    cartModal.style.display = 'none';
  });

  // 💳 Proceed to Checkout
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    cartModal.style.display = 'none';
    alert("Proceeding to checkout... (Tuy, Batangas area only)");
    // Later: redirect to checkout form page or show modal
  });
});
