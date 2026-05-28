/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        picollo: {
          yellow: '#FFD700', // Kuning cerah khas Picollo
          black: '#121212',  // Hitam elegan (bukan hitam pekat)
          red: '#E63946',    // Merah tegas untuk aksen/error
          white: '#FFFFFF',  // Putih bersih
          zinc: '#1E1E1E',   // Warna abu-abu gelap untuk variasi sidebar
        },
      },
      fontFamily: {
        // Karena lo pakai logo yang "bold", font Syne atau Inter sangat cocok
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}