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

      //  Cart - show count
  
  var cartBtn = document.getElementById('cartBtn');
  var cartBadge = document.getElementById('cartBadge');

  if (cartBtn && cartBadge) {
    cartBtn.addEventListener('click', function() {
      alert('سبد خرید شما در حال حاضر خالی است!');
    });

      // Function to update count from outside

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