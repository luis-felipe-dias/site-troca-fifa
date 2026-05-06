/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita warning de CORS no dev ao acessar pelo IP da rede
  allowedDevOrigins: ['localhost', '192.168.0.148', '192.168.1.15'],
};

export default nextConfig;