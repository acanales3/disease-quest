import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  app: {
    head: {
      title: "DiseaseQuest",
      link: [{ rel: "icon", type: "image/png", href: "/dq-favicon.png" }],
    },
  },
  css: ["./app/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  modules: ["shadcn-nuxt", "@nuxt/icon", "@nuxtjs/supabase"],
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * @default ".app/components/ui"
     */
    componentDir: "./components/ui",
  },
  supabase: {
    redirect: false,
  },
  /**
   * ✅ Server-side private key access
   * - SUPABASE_SERVICE_KEY stays server-only (never exposed to client)
   * - public.supabase.url is safe to expose
   */
  runtimeConfig: {
    supabase: {
      serviceKey: process.env.SUPABASE_SERVICE_KEY,
    },
    public: {
      supabase: {
        url: process.env.SUPABASE_URL,
      },
    },
  },
});
