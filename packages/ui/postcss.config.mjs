// Tailwind v4 through PostCSS (Next.js). Shared with apps/web via the "./postcss.config"
// export; the plugin itself must also be a devDependency of each consuming app, because
// PostCSS resolves plugin names from the app's directory under pnpm's isolated node_modules.
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};

export default config;
