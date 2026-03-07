export default {
  importOrder: [
    "^@/assets/(.*)$",
    "^@/components/(.*)$",
    "^@/layouts/(.*)$",
    "^@/utils/(.*)$",
    "^[./]",
  ],
  plugins: [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
};
