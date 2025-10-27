import tailwindcss from '@tailwindcss/vite'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui'],
  devtools: { enabled: true },
  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      script: [
        {
          innerHTML: `
            (function() {
              const updateFavicon = (isDark) => {
                const faviconUrl = isDark ? '/favicon-dark.svg' : '/favicon.svg';
                
                let link = document.querySelector('link[rel="icon"]');
                if (!link) {
                  link = document.createElement('link');
                  link.rel = 'icon';
                  link.type = 'image/svg+xml';
                  document.head.appendChild(link);
                }
                link.href = faviconUrl;
              };
              
              if (window.matchMedia) {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                updateFavicon(mediaQuery.matches);
                mediaQuery.addEventListener('change', e => updateFavicon(e.matches));
              }
            })();
          `,
        },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_SUPABASE_URL || '',
      supabaseProjectId: process.env.NUXT_SUPABASE_PROJECT_ID || '',
      supabaseAnonKey: process.env.NUXT_SUPABASE_ANON_KEY || '',
    },
  },
  compatibilityDate: '2025-07-15',
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})
