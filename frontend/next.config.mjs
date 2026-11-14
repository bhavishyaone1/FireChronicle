/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const defaultBackend = isProd
  ? "https://firechronicle.onrender.com/api/:path*"
  : "http://127.0.0.1:8002/api/:path*";

const backendDestination = process.env.BACKEND_API_URL || defaultBackend;

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: backendDestination.includes(":path*")
          ? backendDestination
          : `${backendDestination.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
