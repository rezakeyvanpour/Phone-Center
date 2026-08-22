// products.js

document.addEventListener('DOMContentLoaded', function() {
  const grid = document.getElementById('productsGrid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const navFilterLinks = document.querySelectorAll('.nav-list a, .dropdown-menu a, .mobile-menu a[data-filter]');
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

  let cart = [];
  let currentFilter = 'all';
  let products = [];

  function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function renderProducts(filter = 'all') {
    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center text-[var(--body-text-color3)] py-12">محصولی یافت نشد.</div>`;
      return;
    }
    let html = '';
    filtered.forEach(p => {
      const badgeHtml = p.badge ? `<span class="absolute top-3 right-3 bg-[var(--primary)] text-white text-xs font-bold px-3 py-1 rounded-full z-10">${p.badge}</span>` : '';
    

      const detailLink = `/templates/products/product-detail.html?id=${p.id}`;
      html += `
        <div class="product-card" data-id="${p.id}" data-category="${p.category}">
          <div class="relative overflow-hidden aspect-square bg-[#0a0f1f] cursor-pointer" onclick="location.href='${detailLink}'">
            <img src="${p.image}" alt="${p.name}" class="product-image w-full h-full object-cover transition-transform duration-500" loading="lazy" onerror="this.src='/assets/images/placeholder.png'">
            ${badgeHtml}
          </div>
          <div class="p-4 flex flex-col gap-2">
            <h3 class="product-name text-[0.95rem] font-semibold text-white leading-5 cursor-pointer" onclick="location.href='${detailLink}'">${p.name}</h3>
            <div class="text-[0.75rem] text-[var(--body-text-color3)] font-medium">${p.spec}</div>
            <div class="flex items-center gap-1.5">
              <span class="text-amber-400 text-sm tracking-[2px]">★★★★★</span>
              <span class="text-[var(--body-text-color3)] text-xs">(${Math.floor(Math.random()*100)+20})</span>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap mt-1">
              <span class="text-[1.1rem] font-bold text-white ltr">${formatPrice(p.price)}</span>
              <span class="text-[0.7rem] text-[var(--body-text-color3)]">تومان</span>
            </div>
            <div class="mt-2.5">
              <button class="btn-add-to-cart" data-id="${p.id}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                افزودن به سبد
              </button>
            </div>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
  }

  function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
    renderProducts(filter);
    document.querySelector('.main-content').style.minHeight = 'auto';
  }

  filterBtns.forEach(btn => btn.addEventListener('click', function(e) { e.preventDefault(); setFilter(this.dataset.filter); }));
  navFilterLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const filter = this.dataset.filter;
      if (filter) { setFilter(filter); if (mobileMenu) mobileMenu.classList.remove('open'); }
    });
  });

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function() { mobileMenu.classList.toggle('open'); });
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

  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-add-to-cart');
    if (!btn) return;
    e.preventDefault();
    if (btn.classList.contains('added')) return;

    const card = btn.closest('.product-card');
    if (!card) return;
    const id = parseInt(btn.dataset.id);
    const product = products.find(p => p.id === id);
    if (!product) return;

    const existing = cart.find(item => item.id === id);
    if (existing) existing.quantity++;
    else cart.push({ ...product, quantity: 1 });
    renderCart();
    updateCartBadge();
    btn.classList.add('added');
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> اضافه شد ✓`;
    setTimeout(() => {
      btn.classList.remove('added');
      btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> افزودن به سبد`;
    }, 2000);
    setTimeout(() => openCartModal(), 400);
  });

  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', function() {
      if (cart.length === 0) return;
      if (confirm('خالی کردن سبد؟')) { cart = []; renderCart(); updateCartBadge(); closeCartModalFunc(); }
    });
  }
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
      if (cart.length === 0) { alert('سبد خالی است!'); return; }
      const total = calculateTotal();
      const items = cart.map(i => `${i.name} × ${i.quantity}`).join('\n');
      alert(`✅ سفارش ثبت شد!\n\n${items}\n\nجمع کل: ${formatPrice(total)} تومان`);
      cart = []; renderCart(); updateCartBadge(); closeCartModalFunc();
    });
  }

  document.querySelectorAll('.search-form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const input = this.querySelector('input[type="search"]');
      if (input && input.value.trim()) alert('جستجو برای: "' + input.value.trim() + '"');
    });
  });

  // load products from backend
  fetch('/api/products')
    .then(res => res.json())
    .then(data => {
      products = data;
      renderProducts('all');
      updateCartBadge();
    })
    .catch(err => {
      console.error('failed to load products', err);
      renderProducts('all');
      updateCartBadge();
    });
  console.log('✅ صفحه محصولات راه‌اندازی شد!');
});
