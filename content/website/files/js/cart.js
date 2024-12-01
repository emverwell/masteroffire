// Generate a UUID for anonymous users or retrieve an existing one
function getUserIdentifier() {
  let userIdentifier = localStorage.getItem('userIdentifier');
  if (!userIdentifier) {
      userIdentifier = generateUUID();
      localStorage.setItem('userIdentifier', userIdentifier);
  }
  return userIdentifier;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
}

// Add item to cart and save to localStorage
function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingProduct = cart.find(item => item.id === product.id);

  if (existingProduct) {
      existingProduct.quantity += product.quantity;
  } else {
      cart.push(product);
  }

  localStorage.setItem('cart', JSON.stringify(cart));

  // Sync to backend with userIdentifier
  syncCartToBackend(cart);

  renderCart();
}

// Remove item from cart
function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

// Update cart totals
function updateCartTotals() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal; // Include taxes, shipping, etc., if needed

  document.getElementById('subtotal').innerHTML = `$${subtotal.toFixed(2)}`;
  document.getElementById('total').innerHTML = `$${total.toFixed(2)}`;
}

// Render the cart
function renderCart() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartBody = document.getElementById('cartBody');
  cartBody.innerHTML = '';

  cart.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
          <td><button class="remove-item" data-id="${item.id}">&times;</button></td>
          <td><img src="${item.image}" alt="${item.name}" width="50"></td>
          <td>${item.name}</td>
          <td>$${item.price.toFixed(2)}</td>
          <td><input type="number" class="quantity-input" data-id="${item.id}" value="${item.quantity}" min="1"></td>
          <td>$${(item.price * item.quantity).toFixed(2)}</td>
      `;
      cartBody.appendChild(row);
  });

  // Add event listeners for removing items and updating quantities
  document.querySelectorAll('.remove-item').forEach(button =>
      button.addEventListener('click', () => {
          removeFromCart(button.dataset.id);
      })
  );

  document.querySelectorAll('.quantity-input').forEach(input =>
      input.addEventListener('change', () => {
          const productId = input.dataset.id;
          const newQuantity = parseInt(input.value, 10);
          updateCartQuantity(productId, newQuantity);
      })
  );

  updateCartTotals();
}

// Update item quantity
function updateCartQuantity(productId, quantity) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const product = cart.find(item => item.id === productId);

  if (product) {
      product.quantity = quantity;
      localStorage.setItem('cart', JSON.stringify(cart));
      renderCart();
  }
}

// Sync cart to backend (for both anonymous and authenticated users)
function syncCartToBackend(cart) {
  const userIdentifier = getUserIdentifier();
  const userToken = localStorage.getItem('authToken'); // Assuming token for authenticated users

  fetch("https://app.themasteroffire.com/backend?destinationUrl=cart", {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          // 'Authorization': userToken ? `Bearer ${userToken}` : '', // Include if user is logged in
      },
      body: JSON.stringify({
          cart: cart
      })
  })
  .then(response => response.json())
  .then(data => {
      console.log('Cart synced successfully:', data);
  })
  .catch(error => {
      console.error('Error syncing cart:', error);
  });
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});