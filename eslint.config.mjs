import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

export default createConfigForNuxt({
  features: {
    stylistic: false,
  },
}).append({
  rules: {
    "vue/html-self-closing": "off",
  },
});
