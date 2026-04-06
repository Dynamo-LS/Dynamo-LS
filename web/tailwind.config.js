/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        skybg: "#e6f4ff",
        ink: "#12263a",
        accent: "#ff6b35",
        mint: "#3bb273"
      },
      fontFamily: {
        heading: ["Space Grotesk", "ui-sans-serif", "sans-serif"],
        body: ["DM Sans", "ui-sans-serif", "sans-serif"]
      }
    },
  },
  plugins: [],
};
