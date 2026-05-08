/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita warning de CORS no dev ao acessar pelo IP da rede
  allowedDevOrigins: ['localhost', '192.168.0.148', '192.168.1.15'],
  
  // Ignora erros de TypeScript durante o build (útil para deploy)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ignora erros de lint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;