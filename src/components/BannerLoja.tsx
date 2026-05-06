"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function BannerLoja() {
  const [imagemCarregou, setImagemCarregou] = useState(true);
  const [extensao, setExtensao] = useState<"jpg" | "png">("png");

  useEffect(() => {
    // Tenta carregar PNG primeiro, se falhar tenta JPG
    const img = new window.Image();
    img.src = "/banner-loja.png";
    img.onload = () => setExtensao("png");
    img.onerror = () => {
      const img2 = new window.Image();
      img2.src = "/banner-loja.jpg";
      img2.onload = () => setExtensao("jpg");
      img2.onerror = () => setImagemCarregou(false);
    };
  }, []);

  if (!imagemCarregou) {
    return (
      <div className="w-[300px] h-[250px] mx-auto my-4">
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-brincadeira-viva to-abraco-doce flex flex-col items-center justify-center text-center p-4">
          <span className="text-6xl mb-2">🎁</span>
          <span className="text-white text-xl font-bold drop-shadow-lg">Loja Yup</span>
          <span className="text-white/80 text-sm mt-2">Figurinhas especiais</span>
          <button className="mt-3 bg-white text-brincadeira-viva px-4 py-2 rounded-full text-sm font-semibold">
            Em breve
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[300px] h-[250px] mx-auto my-4">
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
        <Image
          src={`/banner-loja.${extensao}`}
          alt="Loja Yup"
          width={300}
          height={250}
          className="object-cover w-full h-full"
          priority
        />
      </div>
    </div>
  );
}