import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ORDEM: da esquerda (fundo/menos contraste) para direita (destaque/mais contraste)
        'noite-serena': '#a6bbee',     // 1º - Fundo escuro / textos
        'bruma-suave': '#a6bbee',      // 2º - Cards / áreas secundárias
        'toque-afeto': '#ff0000',      // 3º - Fundo claro principal
        'abraco-doce': '#ffc6c5',      // 4º - Hovers / ações secundárias
        'brincadeira-viva': '#ffc6c5', // 5º - Botões principais / CTAs
        
        // Mantém compatibilidade com código existente
        yup: {
          bg: '#ff0000',        // toque-afeto
          primary: '#272D4F',   // noite-serena
          softBlue: '#DDE3F1',  // bruma-suave
          green: '#EA70B0',     // brincadeira-viva
          pinkVibrant: '#FFC6C5', // abraco-doce
        },
      },
    },
  },
  plugins: [],
}
export default config