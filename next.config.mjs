/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita warning de CORS no dev ao acessar pelo IP da rede
  allowedDevOrigins: ["localhost:3000", "192.168.0.148:3000", "http://localhost:3000", "http://192.168.0.148:3000"]
};

export default nextConfig;
