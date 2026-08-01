import { dirname } from "path";
import { fileURLToPath } from "url";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwindcss from "@tailwindcss/vite";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
const config: StorybookConfig = {
  stories: [
    "../../../packages/ui/src/**/*.mdx",
    "../../../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-mcp"),
  ],
  framework: getAbsolutePath("@storybook/nextjs-vite"),
  // No anonymous usage telemetry (private / compliance-bound product).
  core: { disableTelemetry: true },
  // Tailwind v4 must run through its Vite plugin so @import/@theme/@utility/@source
  // are compiled before minify — otherwise components render unstyled and
  // LightningCSS warns on the raw at-rules.
  viteFinal: async (viteConfig) => {
    const { mergeConfig } = await import("vite");
    return mergeConfig(viteConfig, { plugins: [tailwindcss()] });
  },
};
export default config;
