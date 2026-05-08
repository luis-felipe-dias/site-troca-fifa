"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, MapPin } from "@phosphor-icons/react";

const LOJA_URL = "https://maps.app.goo.gl/MrQeLQpw2kTwuokk6";

export default function BannerLoja() {
  const [imagemCarregou, setImagemCarregou] = useState(true);
  const [extensao, setExtensao] = useState<"jpg" | "png">("png");
  const [modalAberto, setModalAberto] = useState(false);

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
      <>
        <div 
          onClick={() => setModalAberto(true)}
          className="w-[300px] h-[250px] mx-auto my-4 cursor-pointer group"
        >
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-brincadeira-viva to-abraco-doce flex flex-col items-center justify-center text-center p-4 transition-transform group-hover:scale-105">
            <span className="text-6xl mb-2">🎁</span>
            <span className="text-white text-xl font-bold drop-shadow-lg">Loja Yup</span>
            <span className="text-white/80 text-sm mt-2">Figurinhas especiais</span>
            <div className="mt-3 flex items-center gap-1 text-white/90 text-xs">
              <MapPin size={14} />
              <span>Clique para ver localização</span>
            </div>
          </div>
        </div>

        {/* Modal de Localização */}
        {modalAberto && (
          <ModalLocalizacao onClose={() => setModalAberto(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div 
        onClick={() => setModalAberto(true)}
        className="w-[300px] h-[250px] mx-auto my-4 cursor-pointer group"
      >
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg transition-transform group-hover:scale-105">
          <Image
            src={`/banner-loja.${extensao}`}
            alt="Loja Yup"
            width={300}
            height={250}
            className="object-cover w-full h-full"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="bg-white/90 text-brincadeira-viva px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <MapPin size={12} />
              Ver localização
            </span>
          </div>
        </div>
      </div>

      {/* Modal de Localização */}
      {modalAberto && (
        <ModalLocalizacao onClose={() => setModalAberto(false)} />
      )}
    </>
  );
}

// Componente do Modal
function ModalLocalizacao({ onClose }: { onClose: () => void }) {
  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1a1a2e] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-brincadeira-viva" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Localização da Loja Yup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          {/* Informações da loja */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">
              📍 Av. Principal, 123 - Centro
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              📅 Funcionamento: Seg-Sex 9h às 18h | Sáb 9h às 13h
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              🎁 Traga suas figurinhas repetidas!
            </p>
          </div>

          {/* Botão do Google Maps */}
          <a
            href={LOJA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brincadeira-viva text-white font-semibold hover:bg-brincadeira-viva/80 transition-colors"
          >
            <MapPin size={18} />
            Abrir no Google Maps
          </a>

          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}