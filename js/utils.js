//Utility functions for use across the project

var utils = (function() {

 // Format number with commas
  function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Debounce for search
  function debounce(func, delay) {
    if (delay === undefined) delay = 300;
    var timer;
    return function() {
      var args = arguments;
      var context = this;
      clearTimeout(timer);
      timer = setTimeout(function() {
        func.apply(context, args);
      }, delay);
    };
  }

  //  Get parameter from URL
  function getParam(param) {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Check if object is empty
  function isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }

  // Return functions
  return {
    formatPrice: formatPrice,
    debounce: debounce,
    getParam: getParam,
    isEmpty: isEmpty
  };
})();

// Make available globally
window.utils = utils;