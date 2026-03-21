import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  test: {
    exclude: ["**/node_modules/**", "apps/*/e2e/**"],
  },
  run: {
    tasks: {
      check: {
        command: "vp check",
        dependsOn: ["visual-storyboard#build"],
      },
      test: {
        command: "vp test",
        dependsOn: ["visual-storyboard#build"],
      },
      e2e: {
        command: "vp exec playwright test",
        dependsOn: ["visual-storyboard#build"],
      },
    },
  },
});
