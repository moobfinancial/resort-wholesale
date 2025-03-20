import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    define: {
      "import.meta.env.VITE_STRIPE_PUBLIC_KEY": JSON.stringify(
        env.STRIPE_PUBLISHABLE_KEY
      ),
      "import.meta.env.FRONTEND_URL": JSON.stringify(
        env.FRONTEND_URL || "http://localhost:5173"
      ),
      "import.meta.env.NODE_ENV": JSON.stringify(mode),
    },
    // server: {
    //   proxy: {
    //     "/api": {
    //       target: "http://localhost:5177",
    //       changeOrigin: true,
    //       secure: false,
    //       configure: (proxy, _options) => {
    //         proxy.on("error", (err, _req, _res) => {
    //           console.log("proxy error", err);
    //         });
    //         proxy.on("proxyReq", (proxyReq, req, _res) => {
    //           console.log(
    //             "Sending Request to the Target:",
    //             req.method,
    //             req.url
    //           );
    //         });
    //         proxy.on("proxyRes", (proxyRes, req, _res) => {
    //           console.log(
    //             "Received Response from the Target:",
    //             proxyRes.statusCode,
    //             req.url
    //           );
    //         });
    //       },
    //     },
    //     "/uploads": {
    //       target: "http://localhost:5177",
    //       changeOrigin: true,
    //       secure: false,
    //       // Add error handling for the uploads proxy
    //       configure: (proxy, _options) => {
    //         proxy.on("error", (err, req, res) => {
    //           console.log("uploads proxy error", err);

    //           // If proxy fails, redirect to placeholder image
    //           if (req.url?.startsWith("/uploads/products/")) {
    //             res.writeHead(302, {
    //               Location: "/images/products/placeholder.jpg",
    //             });
    //             res.end();
    //           }
    //         });
    //       },
    //     },
    //     "/images/products": {
    //       target: "http://localhost:5177",
    //       changeOrigin: true,
    //       secure: false,
    //       // Add error handling for the images proxy
    //       configure: (proxy, _options) => {
    //         proxy.on("error", (err, req, res) => {
    //           console.log("images proxy error", err);

    //           // If proxy fails, redirect to placeholder image
    //           res.writeHead(302, {
    //             Location: "/images/products/placeholder.jpg",
    //           });
    //           res.end();
    //         });
    //       },
    //     },
    //   },
    // },
  };
});
