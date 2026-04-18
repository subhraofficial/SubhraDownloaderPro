module.exports = {
  content: ['./renderer/index.html', './renderer/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        olive: '#2F4A32',
        gold: '#FFCC28',
        panel: 'rgba(47, 74, 50, 0.8)'
      },
      fontFamily: {
        sans: ['Noto Sans Bengali', 'Noto Sans', 'Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
