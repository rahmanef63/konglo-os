/** Tailwind v4 — registers the PostCSS plugin so @import "tailwindcss",
 *  @theme, and @utility in app/globals.css are compiled to real CSS.
 *  Without this file Next skips Tailwind entirely → unstyled UI. */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
