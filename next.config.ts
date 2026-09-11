import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',      // generate folder /out berisi HTML/CSS/JS statis
  trailingSlash: true,   // Firebase Hosting butuh ini agar routing berfungsi
};

export default nextConfig;
