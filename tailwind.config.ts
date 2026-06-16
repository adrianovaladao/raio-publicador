import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#212121",
          2: "#2B2B2B",
          soft: "#3D3D3D",
        },
        paper: "#FFFFFF",
        bg: "#F6F5F2",
        cream: "#F1F0EC",
        sand: "#CECECE",
        stone: {
          DEFAULT: "#848484",
          soft: "#B4B4B4",
        },
        coral: {
          DEFAULT: "#FAB500",
          soft: "#FFC93B",
          ink: "#8A6500",
        },
        success: {
          DEFAULT: "#2F8A5B",
          soft: "#E3F2E9",
        },
        info: {
          DEFAULT: "#2A6FDB",
          soft: "#E6EEFB",
        },
        amber: {
          soft: "#FCEFCB",
        },
        danger: {
          DEFAULT: "#C2452E",
          soft: "#F8E5E1",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-roboto-serif)", "Georgia", "serif"],
        mono: ["Switzer", "var(--font-dm-sans)", "sans-serif"],
      },
      borderRadius: {
        sm: "7px",
        DEFAULT: "11px",
        lg: "16px",
        xl: "26px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(33,33,33,0.06), 0 1px 1px rgba(33,33,33,0.04)",
        DEFAULT: "0 12px 28px -16px rgba(33,33,33,0.30)",
        lg: "0 30px 60px -30px rgba(33,33,33,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
