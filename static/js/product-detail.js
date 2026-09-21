// Product details page

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get('id'));
  const container = document.getElementById('productDetail');

  let cart = [];
  const cartBtn = document.getElementById('cartBtn');
  const cartBadge = document.getElementById('cartBadge');
  const cartModal = document.getElementById('cartModal');
  const closeCartModal = document.getElementById('closeCartModal');
  const emptyCartMsg = document.getElementById('emptyCartMessage');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartTotalSpan = document.getElementById('cartTotal');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }


  function updateCartBadge() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = count;
    if (count > 0) { cartBadge.style.transform = 'scale(1.3)'; setTimeout(() => cartBadge.style.transform = 'scale(1)', 200); }
  }

  function calculateTotal() { return cart.reduce((sum, item) => sum + item.price * item.quantity, 0); }

  function renderCart() {
    if (cart.length === 0) {
      emptyCartMsg.classList.remove('hidden');
      cartItemsList.classList.add('hidden');
      cartTotalSpan.textContent = '۰';
      return;
    }
    emptyCartMsg.classList.add('hidden');
    cartItemsList.classList.remove('hidden');
    let html = '';
    cart.forEach((item, index) => {
      html += `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md border border-[var(--border)] flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="text-white font-semibold text-sm truncate">${item.name}</div>
            <div class="text-[var(--body-text-color3)] text-xs">${item.spec}</div>
            <div class="text-[var(--body-text-color2)] font-bold text-sm ltr">${formatPrice(item.price)} تومان</div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button class="cart-qty-btn cart-decrease" data-index="${index}">−</button>
            <span class="w-6 text-center font-bold text-white">${item.quantity}</span>
            <button class="cart-qty-btn cart-increase" data-index="${index}">+</button>
            <button class="cart-remove-btn" data-index="${index}"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
          </div>
        </div>
      `;
    });
    cartItemsList.innerHTML = html;
    const total = calculateTotal();
    cartTotalSpan.textContent = formatPrice(total);

    document.querySelectorAll('.cart-increase').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const idx = parseInt(this.dataset.index);
        cart[idx].quantity++;
        renderCart();
        updateCartBadge();
      });
    });
    document.querySelectorAll('.cart-decrease').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const idx = parseInt(this.dataset.index);
        if (cart[idx].quantity > 1) {
          cart[idx].quantity--;
          renderCart();
          updateCartBadge();
        }
      });
    });
    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const idx = parseInt(this.dataset.index);
        cart.splice(idx, 1);
        renderCart();
        updateCartBadge();
        if (cart.length === 0) closeCartModalFunc();
      });
    });
  }

  function openCartModal() {
    cartModal.style.display = 'flex';
    cartModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderCart();
  }

  function closeCartModalFunc() {
    cartModal.style.display = 'none';
    cartModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  if (cartBtn) cartBtn.addEventListener('click', openCartModal);
  if (closeCartModal) closeCartModal.addEventListener('click', closeCartModalFunc);
  if (cartModal) cartModal.addEventListener('click', function(e) { if (e.target === this) closeCartModalFunc(); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeCartModalFunc(); });

  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', function() {
      if (cart.length === 0) return;
      if (confirm('خالی کردن سبد؟')) { cart = []; renderCart(); updateCartBadge(); closeCartModalFunc(); }
    });
  }
  
  if (checkoutBtn) {
  checkoutBtn.addEventListener('click', function(e) {
    e.preventDefault();

    if (cart.length === 0) {
      alert('سبد خرید شما خالی است!');
      return;
    }

    if (
      !window.PhoneCenterCheckout ||
      typeof window.PhoneCenterCheckout.open !== 'function'
    ) {
      console.error('Checkout module is not available.');
      return;
    }

    closeCartModalFunc();

    window.PhoneCenterCheckout.open({
      items: cart,

      onCompleted: function() {
        cart = [];
        renderCart();
        updateCartBadge();
      }
    });
  });
}


  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function() { mobileMenu.classList.toggle('open'); });
  }


  if (!productId || isNaN(productId)) {
    container.innerHTML = `<div class="text-center text-[var(--body-text-color3)] py-12">محصولی یافت نشد.</div>`;
    return;
  }

  function renderDetail(product) {
  
    const regionDisplay = product.region ? `- ${product.region}` : '';
    
    const badgeHtml = product.badge ? `<span class="inline-block bg-[var(--primary)] text-white text-xs font-bold px-3 py-1 rounded-full">${product.badge}</span>` : '';
    
    let html = `
      <div class="detail-image">
        <img src="${product.image}" alt="${product.name}" onerror="this.src='/assets/images/placeholder.png'" />
      </div>
      <div class="detail-info">
        <h1>${product.name} ${badgeHtml}</h1>
        <div class="spec">${product.spec}</div>
        <div class="region">${regionDisplay}</div>
        <div class="price">${formatPrice(product.price)} تومان</div>
        <div class="detail-actions">
          <button class="btn-add-cart-detail" id="addToCartDetail">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            افزودن به سبد خرید
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    document.getElementById('addToCartDetail').addEventListener('click', function(e) {
      e.preventDefault();
      if (this.classList.contains('added')) return;

      const existing = cart.find(item => item.id === product.id);
      if (existing) existing.quantity++;
      else {
        cart.push({
          ...product,
          quantity: 1
        });
      }
      renderCart();
      updateCartBadge();
      this.classList.add('added');
      this.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> اضافه شد ✓`;
      setTimeout(() => {
        this.classList.remove('added');
        this.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> افزودن به سبد خرید`;
      }, 2000);
      setTimeout(() => openCartModal(), 400);
    });
  }

  document.querySelectorAll('.search-form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const input = this.querySelector('input[type="search"]');
      if (input && input.value.trim()) alert('جستجو برای: "' + input.value.trim() + '"');
    });
  });

  // Product details are loaded from the Go/MySQL API so this page uses the
  // same source of truth as the product listing.
  fetch(`/api/products/${productId}`)
    .then(async response => {
      if (!response.ok) {
        throw new Error((await response.json().catch(() => ({}))).error || 'product not found');
      }
      return response.json();
    })
    .then(product => renderDetail(product))
    .catch(error => {
      console.error('failed to load product', error);
      container.innerHTML = `<div class="text-center text-[var(--body-text-color3)] py-12">محصول مورد نظر وجود ندارد.</div>`;
    });

  console.log('✅ صفحه جزئیات محصول بارگذاری شد!');
});
