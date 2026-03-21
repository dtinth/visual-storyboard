import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "tsc && vp build",
        dependsOn: ["visual-storyboard#build"],
      },
    },
  },
});
