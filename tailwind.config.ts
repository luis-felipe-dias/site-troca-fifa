import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        yup: {
          primary: "#272D4F",
          bg: "#FEFDEB",
          softBlue: "#DDE3F1",
          pinkSoft: "#FFC6C5",
          pinkVibrant: "#EA70B0",
          green: "#ACBD6F",
          orange: "#F15040"
        }
      },
      boxShadow: {
        glass: "0 8px 30px rgba(39,45,79,0.12)",
        soft: "0 10px 25px rgba(39,45,79,0.10)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
} satisfies Config;

