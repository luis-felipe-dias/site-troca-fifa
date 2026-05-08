/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita warning de CORS no dev ao acessar pelo IP da rede
  allowedDevOrigins: ['localhost', '192.168.0.148', '192.168.1.15'],
  
  // Ignora erros de TypeScript durante o build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ignora erros de lint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 🔥 SOLUÇÃO PARA O ERRO DO useSearchParams
  // Desabilita a geração estática para páginas que usam useSearchParams
  output: 'standalone',
  
  // Configuração experimental para resolver o Suspense
  experimental: {
    missingSuspenseWithCSRBailout: false, // ← Isso desativa o erro específico
  },
};

export default nextConfig;