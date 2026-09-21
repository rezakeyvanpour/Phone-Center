/*Main interactions management*/

document.addEventListener('DOMContentLoaded', function() {
  //  Hamburger menu (mobile)

  var menuToggle = document.getElementById('menuToggle');
  var mobileMenu = document.getElementById('mobileMenu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function() {
      mobileMenu.classList.toggle('open');
    });
  }

  //  Search - show message

  var searchForms = document.querySelectorAll('.search-form');
  searchForms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var input = this.querySelector('input[type="search"]');
      if (input && input.value.trim()) {
        alert('جستجو برای: "' + input.value.trim() + '"');
      //  Connect to API in future
      }
    });
  });
  
  var cartBtn = document.getElementById('cartBtn');
  var cartBadge = document.getElementById('cartBadge');

  if (cartBtn && cartBadge) {
    cartBtn.addEventListener('click', function() {
    });

    window.updateCartBadge = function(count) {
      cartBadge.textContent = count;
    };
  }

      // Close mobile menu on link click

  var mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
  mobileLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      if (mobileMenu) {
        mobileMenu.classList.remove('open');
      }
    });
  });
});

// Featured Products - Interactions

document.addEventListener('DOMContentLoaded', function() {

  // Add to cart button click
  const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');

  addToCartButtons.forEach(function(button) {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Get product info from parent card
      const card = this.closest('.product-card');
      if (!card) return;

      const productName = card.dataset.productName || 'محصول';
      const productPrice = card.dataset.productPrice || '۰';
      const productSpec = card.dataset.productSpec || '';

      showToast(`✅ ${productName} به سبد خرید اضافه شد!`, 'success');

      console.log(`🛒 افزودن به سبد: ${productName} - ${productPrice} تومان - ${productSpec}`);
    });
  });

  // Product card click
  const productCards = document.querySelectorAll('.product-card');

  productCards.forEach(function(card) {
    card.addEventListener('click', function(e) {
      if (e.target.closest('.btn-add-to-cart')) {
        return;
      }

      const productName = this.dataset.productName || 'محصول';
      const productSpec = this.dataset.productSpec || 'مشخصات موجود نیست';
      const productPrice = this.dataset.productPrice || '۰';

      showToast(
        `📱 ${productName}\n📋 مشخصات: ${productSpec}\n💰 قیمت: ${productPrice} تومان`,
        'info'
      );
    });
  });

  // Toast message function
  function showToast(message, type) {
    // Remove previous toast if exists
    const oldToast = document.querySelector('.custom-toast');
    if (oldToast) {
      oldToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      max-width: 400px;
      padding: 16px 24px;
      background-color: var(--box);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--body-text-color);
      font-size: 0.9rem;
      font-weight: 500;
      z-index: 9999;
      box-shadow: var(--shadow-hover);
      direction: rtl;
      text-align: right;
      white-space: pre-line;
      animation: slideUp 0.4s ease;
      border-right: 4px solid ${type === 'success' ? '#22c55e' : 'var(--primary)'};
    `;

    toast.textContent = message;
    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(function() {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(function() {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }
    }, 3000);
  }

  // toast animation dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;
  document.head.appendChild(style);

  console.log('✅ بخش محصولات ویژه با موفقیت راه‌اندازی شد!');
  console.log(`📦 تعداد محصولات: ${productCards.length}`);
});

// Complete shopping cart - manage products and interactions
document.addEventListener('DOMContentLoaded', function() {
  // Shopping cart data
  let cart = [];
  let cartTotal = 0;

  const cartModal = document.getElementById('cartModal');
  const closeCartModal = document.getElementById('closeCartModal');
  const cartBtn = document.getElementById('cartBtn');
  const cartBadge = document.getElementById('cartBadge');
  const cartItemsList = document.getElementById('cartItemsList');
  const emptyCartMessage = document.getElementById('emptyCartMessage');
  const cartTotalElement = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const clearCartBtn = document.getElementById('clearCartBtn');

  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function() {
      mobileMenu.classList.toggle('open');
    });
  }

  const searchForms = document.querySelectorAll('.search-form');
  searchForms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const input = this.querySelector('input[type="search"]');
      if (input && input.value.trim()) {
        alert('جستجو برای: "' + input.value.trim() + '"');
      }
    });
  });

  // Close the mobile menu on the links
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
  mobileLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      if (mobileMenu) {
        mobileMenu.classList.remove('open');
      }
    });
  });

  // Shopping cart functions

  function updateCartBadge() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    if (cartBadge) {
      cartBadge.textContent = count;
      if (count > 0) {
        cartBadge.style.transform = 'scale(1.3)';
        setTimeout(() => {
          cartBadge.style.transform = 'scale(1)';
        }, 200);
      }
    }
  }

  function calculateTotal() {
    cartTotal = cart.reduce((total, item) => {
      const price = parseInt(item.price.replace(/,/g, ''));
      return total + (price * item.quantity);
    }, 0);
    return cartTotal;
  }

  function renderCart() {
    if (cart.length === 0) {
      emptyCartMessage.classList.remove('hidden');
      cartItemsList.classList.add('hidden');
      cartTotalElement.textContent = '0'; 
      return;
    }

    emptyCartMessage.classList.add('hidden');
    cartItemsList.classList.remove('hidden');

    let html = '';
    cart.forEach((item, index) => {
      html += `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-spec">${item.spec || ''}</div>
            <div class="cart-item-price">${item.price} تومان</div>
          </div>
          <div class="cart-item-controls">
            <button class="cart-qty-btn cart-decrease" data-index="${index}">−</button>
            <span class="cart-qty-number">${item.quantity}</span>
            <button class="cart-qty-btn cart-increase" data-index="${index}">+</button>
            <button class="cart-remove-btn" data-index="${index}" aria-label="حذف محصول">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    });

    cartItemsList.innerHTML = html;
    const total = calculateTotal();
    cartTotalElement.textContent = total.toLocaleString('en-US');

    document.querySelectorAll('.cart-increase').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const index = parseInt(this.dataset.index);
        cart[index].quantity++;
        renderCart();
        updateCartBadge();
      });
    });

    document.querySelectorAll('.cart-decrease').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const index = parseInt(this.dataset.index);
        if (cart[index].quantity > 1) {
          cart[index].quantity--;
          renderCart();
          updateCartBadge();
        }
      });
    });

    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const index = parseInt(this.dataset.index);
        cart.splice(index, 1);
        renderCart();
        updateCartBadge();
        if (cart.length === 0) {
          closeCartModalFunc();
        }
      });
    });
  }

  function openCartModal() {
    if (!cartModal) return;
    cartModal.style.display = 'flex';
    cartModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderCart();
  }

  function closeCartModalFunc() {
    if (!cartModal) return;
    cartModal.style.display = 'none';
    cartModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  if (cartBtn) {
    cartBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openCartModal();
    });
  }

  document.querySelectorAll('.btn-add-to-cart').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      if (this.classList.contains('added')) return;

      const card = this.closest('.product-card');
      if (!card) return;

      const name = card.dataset.productName;
      const price = card.dataset.productPrice;
      const spec = card.dataset.productSpec;
      const image = card.querySelector('img')?.src || '';

      if (!name || !price) return;

      const existingItem = cart.find(item => item.name === name);
      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.push({ name, price, spec: spec || '', image, quantity: 1 });
      }

      renderCart();
      updateCartBadge();

      this.classList.add('added');
      const originalText = this.innerHTML;
      this.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        اضافه شد ✓
      `;

      setTimeout(() => {
        this.classList.remove('added');
        this.innerHTML = originalText;
      }, 2000);

      setTimeout(() => {
        openCartModal();
      }, 400);
    });
  });

  if (closeCartModal) {
    closeCartModal.addEventListener('click', function(e) {
      e.preventDefault();
      closeCartModalFunc();
    });
  }

  if (cartModal) {
    cartModal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeCartModalFunc();
      }
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && cartModal && cartModal.style.display === 'flex') {
      closeCartModalFunc();
    }
  });

  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (cart.length === 0) return;
      if (confirm('آیا از خالی کردن سبد خرید مطمئن هستید؟')) {
        cart = [];
        renderCart();
        updateCartBadge();
        closeCartModalFunc();
      }
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
  
  updateCartBadge();
  console.log('✅ سبد خرید با موفقیت راه‌اندازی شد!');
  console.log('📌 دکمه سبد خرید در هدر فعال شد');
});


