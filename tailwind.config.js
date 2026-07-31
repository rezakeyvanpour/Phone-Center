const colors = require('tailwindcss/colors');
module.exports = {
  content: [
    "./templates/**/*.{html,js}",
    "./js/**/*.js",
  ],
  theme: {
    colors :{
      'bg-body': '#0D1224',
      'body-text-color': '#ffffff',
      'body-text-color2': '#d2d2d2',
      'body-text-color3': 'b5b5b5',
      'primary': '#5427b0',
      'btn-bg-color': '#5427b0',
      'border': '#ffffff10',
      'box': '#192139',
      black : colors.black,
      white : colors.white,
      gray : colors.gray,
      emerlad : colors.emerlad,
      indigo : colors.indigo,
      yellow : colors.yellow,
    },
    extend: {},
  },
  plugins: [],
};