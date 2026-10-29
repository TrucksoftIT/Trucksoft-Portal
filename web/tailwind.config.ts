import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Quiet chrome: the chariot-mark logos carry the colour.
        concrete: "#EDEFF2", // page
        paper: "#FFFFFF", // icon chips, panels, inputs
        ink: "#14202E", // text, vendor chips
        muted: "#5B6675", // secondary text
        line: "#D6DAE0", // dividers, input borders
        brand: { DEFAULT: "#0070F3", deep: "#0058C2" }, // chariot blue: primary action + focus
        plate: "#FACC15", // chariot yellow: the demo "learner plate"
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
