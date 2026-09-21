// Shared Frontend Checkout Flow
(function () {
  'use strict';

  const STORAGE_KEY = 'phoneCenterOrders';
  const MAX_STORED_ORDERS = 20;

  let checkoutOverlay = null;
  let checkoutState = null;

  function normalizeDigits(value) {
    return String(value ?? '')
      .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632));
  }

  function parsePrice(value) {
    const normalized = normalizeDigits(value)
      .replace(/,/g, '')
      .replace(/\s/g, '');

    const price = Number(normalized);

    return Number.isFinite(price) ? price : 0;
  }

  function formatPrice(value) {
    return parsePrice(value).toLocaleString('en-US');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function createOrderNumber() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const randomPart = Math.floor(1000 + Math.random() * 9000);

    return `PC-${year}${month}${day}-${randomPart}`;
  }

  function normalizeCartItems(items) {
    return items.map(item => ({
      id: item.id ?? item.productId ?? null,
      name: String(item.name ?? 'محصول'),
      spec: String(item.spec ?? ''),
      price: parsePrice(item.price),
      image: String(item.image ?? ''),
      quantity: Math.max(1, Number(item.quantity) || 1)
    }));
  }

  function calculateTotal(items) {
  return items.reduce(
    (total, item) => {
      const price = parsePrice(item.price);
      const quantity = Math.max(1, Number(item.quantity) || 1);

      return total + (price * quantity);
    },
    0
  );
}

  function createOverlay() {
    if (checkoutOverlay) {
      return;
    }

    checkoutOverlay = document.createElement('div');
    checkoutOverlay.id = 'pcCheckoutModal';
    checkoutOverlay.className = 'pc-checkout-overlay';

    document.body.appendChild(checkoutOverlay);

    checkoutOverlay.addEventListener('click', function (event) {
      if (event.target === checkoutOverlay) {
        closeCheckout();
        return;
      }

      const actionButton = event.target.closest('[data-checkout-action]');

      if (!actionButton) {
        return;
      }

      handleAction(actionButton.dataset.checkoutAction);
    });

    checkoutOverlay.addEventListener('submit', function (event) {
      if (event.target.id !== 'pcCheckoutForm') {
        return;
      }

      event.preventDefault();
      handleCustomerFormSubmit(event.target);
    });

    document.addEventListener('keydown', function (event) {
      if (
        event.key === 'Escape' &&
        checkoutOverlay &&
        checkoutOverlay.classList.contains('is-open')
      ) {
        closeCheckout();
      }
    });
  }

  function openCheckout({ items, onCompleted }) {
  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  createOverlay();

  const normalizedItems = normalizeCartItems(items);

  checkoutState = {
    step: 1,
    items: normalizedItems,
    total: calculateTotal(normalizedItems),
    customer: null,
    order: null,
    onCompleted:
      typeof onCompleted === 'function'
        ? onCompleted
        : function () {}
  };

  render();

  checkoutOverlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(function () {
    const firstInput = checkoutOverlay.querySelector(
      '#checkoutFullName'
    );

    if (firstInput) {
      firstInput.focus();
    }
  });
}

  function closeCheckout() {
    if (!checkoutOverlay) {
      return;
    }

    checkoutOverlay.classList.remove('is-open');
    document.body.style.overflow = 'auto';
    checkoutState = null;
  }

  function renderHeader(currentStep) {
    return `
      <div class="pc-checkout-header">
        <div class="pc-checkout-title">
          <svg class="pc-checkout-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M7 4h10l2 4v11H5V8l2-4Z"/>
            <path d="M8 8h8"/>
            <path d="M9 12h6"/>
          </svg>
          <span>تکمیل و ثبت سفارش</span>
        </div>

        <button
          type="button"
          class="pc-checkout-close"
          data-checkout-action="close"
          aria-label="بستن"
        >
          ×
        </button>
      </div>

      <div class="pc-checkout-steps">
        <div class="pc-checkout-step ${currentStep === 1 ? 'is-active' : ''}">
          <span class="pc-checkout-step-number">1</span>
          <span>اطلاعات ارسال</span>
        </div>

        <div class="pc-checkout-step-line"></div>

        <div class="pc-checkout-step ${currentStep === 2 ? 'is-active' : ''}">
          <span class="pc-checkout-step-number">2</span>
          <span>بررسی سفارش</span>
        </div>

        <div class="pc-checkout-step-line"></div>

        <div class="pc-checkout-step ${currentStep === 3 ? 'is-active' : ''}">
          <span class="pc-checkout-step-number">3</span>
          <span>نتیجه</span>
        </div>
      </div>
    `;
  }

  function renderOrderSummary() {
    const itemsHtml = checkoutState.items
      .map(item => `
        <div class="pc-checkout-product">
          <img
            src="${escapeHtml(item.image)}"
            alt="${escapeHtml(item.name)}"
            class="pc-checkout-product-image"
            onerror="this.style.opacity='0.35'"
          >

          <div>
            <div class="pc-checkout-product-name">
              ${escapeHtml(item.name)}
            </div>

            ${
              item.spec
                ? `
                  <div class="pc-checkout-product-spec">
                    ${escapeHtml(item.spec)}
                  </div>
                `
                : ''
            }

            <div class="pc-checkout-product-quantity">
              تعداد: ${item.quantity}
            </div>
          </div>

          <div class="pc-checkout-product-price">
            ${formatPrice(item.price * item.quantity)} تومان
          </div>
        </div>
      `)
      .join('');

    return `
      <div class="pc-checkout-panel">
        <div class="pc-checkout-panel-title">
          خلاصه سبد خرید
        </div>

        <div class="pc-checkout-summary-list">
          ${itemsHtml}
        </div>

        <div class="pc-checkout-total">
          <span class="pc-checkout-total-label">
            جمع کل سفارش
          </span>

          <span class="pc-checkout-total-value">
            ${formatPrice(checkoutState.total)} تومان
          </span>
        </div>
      </div>
    `;
  }

  function renderStepOne() {
    checkoutOverlay.innerHTML = `
      <div
        class="pc-checkout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pcCheckoutTitle"
      >
        ${renderHeader(1)}

        <div class="pc-checkout-content">
          <div class="pc-checkout-layout">

            <div class="pc-checkout-panel">
              <div class="pc-checkout-panel-title">
                اطلاعات تحویل سفارش
              </div>

              <form id="pcCheckoutForm" novalidate>
                <div class="pc-checkout-form-grid">

                  <div class="pc-checkout-field">
                    <label
                      class="pc-checkout-label"
                      for="checkoutFullName"
                    >
                      نام و نام خانوادگی
                    </label>

                    <input
                      id="checkoutFullName"
                      name="fullName"
                      type="text"
                      class="pc-checkout-input"
                      placeholder="نام و نام خانوادگی"
                      autocomplete="name"
                      maxlength="100"
                      required
                    >
                  </div>

                  <div class="pc-checkout-field">
                    <label
                      class="pc-checkout-label"
                      for="checkoutMobile"
                    >
                      شماره موبایل
                    </label>

                    <input
                      id="checkoutMobile"
                      name="mobile"
                      type="tel"
                      class="pc-checkout-input"
                      placeholder="09123456789"
                      inputmode="tel"
                      autocomplete="tel"
                      maxlength="11"
                      required
                    >
                  </div>

                  <div class="pc-checkout-field">
                    <label
                      class="pc-checkout-label"
                      for="checkoutProvince"
                    >
                      استان
                    </label>

                    <input
                      id="checkoutProvince"
                      name="province"
                      type="text"
                      class="pc-checkout-input"
                      placeholder="مثلاً تهران"
                      autocomplete="address-level1"
                      maxlength="50"
                      required
                    >
                  </div>

                  <div class="pc-checkout-field">
                    <label
                      class="pc-checkout-label"
                      for="checkoutCity"
                    >
                      شهر
                    </label>

                    <input
                      id="checkoutCity"
                      name="city"
                      type="text"
                      class="pc-checkout-input"
                      placeholder="مثلاً تهران"
                      autocomplete="address-level2"
                      maxlength="50"
                      required
                    >
                  </div>

                  <div class="pc-checkout-field pc-checkout-field-full">
                    <label
                      class="pc-checkout-label"
                      for="checkoutPostalCode"
                    >
                      کد پستی
                    </label>

                    <input
                      id="checkoutPostalCode"
                      name="postalCode"
                      type="text"
                      class="pc-checkout-input"
                      placeholder="کد پستی ۱۰ رقمی"
                      inputmode="numeric"
                      maxlength="10"
                      autocomplete="postal-code"
                      required
                    >
                  </div>

                  <div class="pc-checkout-field pc-checkout-field-full">
                    <label
                      class="pc-checkout-label"
                      for="checkoutAddress"
                    >
                      آدرس کامل
                    </label>

                    <textarea
                      id="checkoutAddress"
                      name="address"
                      class="pc-checkout-textarea"
                      placeholder="آدرس کامل محل تحویل را وارد کنید..."
                      autocomplete="street-address"
                      maxlength="500"
                      required
                    ></textarea>
                  </div>

                  <div class="pc-checkout-field pc-checkout-field-full">
                    <label
                      class="pc-checkout-label"
                      for="checkoutDescription"
                    >
                      توضیحات سفارش
                      <span style="opacity:.55;">(اختیاری)</span>
                    </label>

                    <textarea
                      id="checkoutDescription"
                      name="description"
                      class="pc-checkout-textarea"
                      placeholder="توضیحات اضافی برای سفارش..."
                      maxlength="500"
                    ></textarea>
                  </div>

                </div>
              </form>
            </div>

            ${renderOrderSummary()}

          </div>
        </div>

        <div class="pc-checkout-actions">
          <div class="pc-checkout-actions-left">
            <button
              type="button"
              class="pc-checkout-btn pc-checkout-btn-secondary"
              data-checkout-action="close"
            >
              انصراف
            </button>
          </div>

          <div class="pc-checkout-actions-right">
            <button
              type="submit"
              form="pcCheckoutForm"
              class="pc-checkout-btn pc-checkout-btn-primary"
            >
              ادامه و بررسی سفارش
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderReview() {
    const customer = checkoutState.customer;

    const itemsHtml = checkoutState.items
      .map(item => `
        <div class="pc-checkout-product">
          <img
            src="${escapeHtml(item.image)}"
            alt="${escapeHtml(item.name)}"
            class="pc-checkout-product-image"
            onerror="this.style.opacity='0.35'"
          >

          <div>
            <div class="pc-checkout-product-name">
              ${escapeHtml(item.name)}
            </div>

            ${
              item.spec
                ? `
                  <div class="pc-checkout-product-spec">
                    ${escapeHtml(item.spec)}
                  </div>
                `
                : ''
            }

            <div class="pc-checkout-product-quantity">
              تعداد: ${item.quantity}
            </div>
          </div>

          <div class="pc-checkout-product-price">
            ${formatPrice(item.price * item.quantity)} تومان
          </div>
        </div>
      `)
      .join('');

    checkoutOverlay.innerHTML = `
      <div
        class="pc-checkout-modal"
        role="dialog"
        aria-modal="true"
      >
        ${renderHeader(2)}

        <div class="pc-checkout-content">
          <div class="pc-checkout-layout">

            <div class="pc-checkout-panel">
              <div class="pc-checkout-panel-title">
                اطلاعات تحویل
              </div>

              <div class="pc-checkout-review-box">

                <div class="pc-checkout-review-row">
                  <span class="pc-checkout-review-label">
                    نام و نام خانوادگی
                  </span>

                  <span class="pc-checkout-review-value">
                    ${escapeHtml(customer.fullName)}
                  </span>
                </div>

                <div class="pc-checkout-review-row">
                  <span class="pc-checkout-review-label">
                    شماره موبایل
                  </span>

                  <span class="pc-checkout-review-value">
                    ${escapeHtml(customer.mobile)}
                  </span>
                </div>

                <div class="pc-checkout-review-row">
                  <span class="pc-checkout-review-label">
                    استان / شهر
                  </span>

                  <span class="pc-checkout-review-value">
                    ${escapeHtml(customer.province)}
                    /
                    ${escapeHtml(customer.city)}
                  </span>
                </div>

                <div class="pc-checkout-review-row">
                  <span class="pc-checkout-review-label">
                    کد پستی
                  </span>

                  <span class="pc-checkout-review-value">
                    ${escapeHtml(customer.postalCode)}
                  </span>
                </div>

                <div class="pc-checkout-review-row">
                  <span class="pc-checkout-review-label">
                    آدرس
                  </span>

                  <span class="pc-checkout-review-value">
                    ${escapeHtml(customer.address)}
                  </span>
                </div>

                ${
                  customer.description
                    ? `
                      <div class="pc-checkout-review-row">
                        <span class="pc-checkout-review-label">
                          توضیحات
                        </span>

                        <span class="pc-checkout-review-value">
                          ${escapeHtml(customer.description)}
                        </span>
                      </div>
                    `
                    : ''
                }

              </div>
            </div>

            <div class="pc-checkout-panel">
              <div class="pc-checkout-panel-title">
                محصولات سفارش
              </div>

              <div class="pc-checkout-summary-list">
                ${itemsHtml}
              </div>

              <div class="pc-checkout-total">
                <span class="pc-checkout-total-label">
                  مبلغ نهایی
                </span>

                <span class="pc-checkout-total-value">
                  ${formatPrice(checkoutState.total)} تومان
                </span>
              </div>
            </div>

          </div>
        </div>

        <div class="pc-checkout-actions">
          <div class="pc-checkout-actions-left">
            <button
              type="button"
              class="pc-checkout-btn pc-checkout-btn-secondary"
              data-checkout-action="back"
            >
              بازگشت
            </button>
          </div>

          <div class="pc-checkout-actions-right">
            <button
              type="button"
              class="pc-checkout-btn pc-checkout-btn-primary"
              data-checkout-action="confirm"
            >
              تأیید و ثبت سفارش
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderSuccess() {
    const order = checkoutState.order;

    checkoutOverlay.innerHTML = `
      <div
        class="pc-checkout-modal"
        role="dialog"
        aria-modal="true"
      >
        ${renderHeader(3)}

        <div class="pc-checkout-success">

          <div class="pc-checkout-success-icon">
            ✓
          </div>

          <h2 class="pc-checkout-success-title">
            سفارش شما آماده و ثبت شد
          </h2>

          <p class="pc-checkout-success-text">
            اطلاعات سفارش با موفقیت تکمیل و در مرورگر شما ذخیره شد.
            شماره سفارش خود را برای پیگیری نگه دارید.
          </p>

          <div class="pc-checkout-order-number">
            ${escapeHtml(order.orderNumber)}
          </div>

          <p class="pc-checkout-note">
            توجه: در وضعیت فعلی پروژه، API ثبت سفارش در Backend هنوز وجود ندارد.
            بنابراین این ثبت فعلاً در سمت Frontend و مرورگر انجام می‌شود.
            بعد از اضافه شدن Order API، همین مرحله مستقیماً به سرور متصل خواهد شد.
          </p>

        </div>

        <div class="pc-checkout-actions">
          <div class="pc-checkout-actions-left"></div>

          <div class="pc-checkout-actions-right">
            <button
              type="button"
              class="pc-checkout-btn pc-checkout-btn-primary"
              data-checkout-action="finish"
            >
              بازگشت به فروشگاه
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    if (!checkoutOverlay || !checkoutState) {
      return;
    }

    if (checkoutState.step === 1) {
      renderStepOne();
      return;
    }

    if (checkoutState.step === 2) {
      renderReview();
      return;
    }

    renderSuccess();
  }

  function setFieldError(field, message) {
    field.setCustomValidity(message);
    field.reportValidity();
    field.focus();
  }

  function clearFieldValidity(form) {
    form.querySelectorAll('input, textarea').forEach(field => {
      field.setCustomValidity('');
    });
  }

  function handleCustomerFormSubmit(form) {
    clearFieldValidity(form);

    const formData = new FormData(form);

    const customer = {
      fullName: String(formData.get('fullName') ?? '').trim(),
      mobile: normalizeDigits(formData.get('mobile'))
        .replace(/\s+/g, '')
        .trim(),
      province: String(formData.get('province') ?? '').trim(),
      city: String(formData.get('city') ?? '').trim(),
      postalCode: normalizeDigits(formData.get('postalCode'))
        .replace(/\s+/g, '')
        .trim(),
      address: String(formData.get('address') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim()
    };

    const fullNameField = form.elements.fullName;
    const mobileField = form.elements.mobile;
    const provinceField = form.elements.province;
    const cityField = form.elements.city;
    const postalCodeField = form.elements.postalCode;
    const addressField = form.elements.address;

    if (customer.fullName.length < 3) {
      setFieldError(
        fullNameField,
        'لطفاً نام و نام خانوادگی را کامل وارد کنید.'
      );
      return;
    }

    if (!/^09\d{9}$/.test(customer.mobile)) {
      setFieldError(
        mobileField,
        'شماره موبایل باید به‌صورت ۱۱ رقمی و با 09 شروع شود.'
      );
      return;
    }

    if (customer.province.length < 2) {
      setFieldError(
        provinceField,
        'استان را وارد کنید.'
      );
      return;
    }

    if (customer.city.length < 2) {
      setFieldError(
        cityField,
        'شهر را وارد کنید.'
      );
      return;
    }

    if (!/^\d{10}$/.test(customer.postalCode)) {
      setFieldError(
        postalCodeField,
        'کد پستی باید دقیقاً ۱۰ رقم باشد.'
      );
      return;
    }

    if (customer.address.length < 10) {
      setFieldError(
        addressField,
        'آدرس کامل‌تری وارد کنید.'
      );
      return;
    }

    checkoutState.customer = customer;
    checkoutState.step = 2;

    render();
  }

  function saveOrderLocally(order) {
    try {
      const currentOrders = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );

      const orders = Array.isArray(currentOrders)
        ? currentOrders
        : [];

      orders.push(order);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(orders.slice(-MAX_STORED_ORDERS))
      );

      return true;
    } catch (error) {
      console.error('Failed to save checkout locally:', error);
      return false;
    }
  }

  function confirmOrder() {
    if (!checkoutState || checkoutState.step !== 2) {
      return;
    }

    const order = {
      orderNumber: createOrderNumber(),
      createdAt: new Date().toISOString(),
      status: 'frontend-pending',
      customer: checkoutState.customer,
      items: checkoutState.items.map(item => ({
        id: item.id,
        name: item.name,
        spec: item.spec,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      total: checkoutState.total
    };

    const saved = saveOrderLocally(order);

    if (!saved) {
      alert(
        'ذخیره سفارش در مرورگر انجام نشد. لطفاً دوباره تلاش کنید.'
      );
      return;
    }

    checkoutState.order = order;
    checkoutState.step = 3;

    render();

    checkoutState.onCompleted(order);
  }

  function handleAction(action) {
    if (!checkoutState) {
      return;
    }

    switch (action) {
      case 'close':
        closeCheckout();
        break;

      case 'back':
        checkoutState.step = 1;
        render();
        break;

      case 'confirm':
        confirmOrder();
        break;

      case 'finish':
        closeCheckout();
        break;

      default:
        break;
    }
  }

  window.PhoneCenterCheckout = {
    open: openCheckout,
    close: closeCheckout
  };
})();
