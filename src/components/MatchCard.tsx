"use client";

interface MatchCardProps {
  suggestion: {
    userId: string;
    yupId: string;
    cidade: string;
    give: string;
    want: string;
    avatar: string;
  };
  onTrocar: () => void;
  onPassar?: () => void;
}

export default function MatchCard({ suggestion, onTrocar, onPassar }: MatchCardProps) {
  return (
    <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 transition-transform hover:scale-[1.02]">
      {/* Header com avatar e informações */}
      <div className="bg-gradient-to-r from-brincadeira-viva/20 to-abraco-doce/20 p-5">
        <div className="flex items-center gap-4">
          <div className="text-6xl">{suggestion.avatar}</div>
          <div>
            <div className="font-bold text-xl dark:text-white">#{suggestion.yupId}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{suggestion.cidade}</div>
          </div>
        </div>
      </div>

      {/* Conteúdo da troca */}
      <div className="p-6 text-center">
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-4xl mb-2">🎁</div>
            <div className="font-bold text-brincadeira-viva text-2xl">{suggestion.give}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Você dá</div>
          </div>
          <div className="text-3xl text-gray-400 dark:text-gray-600">→</div>
          <div className="text-center">
            <div className="text-4xl mb-2">✨</div>
            <div className="font-bold text-brincadeira-viva text-2xl">{suggestion.want}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Você recebe</div>
          </div>
        </div>

        <div className="flex gap-3">
          {onPassar && (
            <button
              onClick={onPassar}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium active:scale-95 transition-transform"
            >
              ❌ Passar
            </button>
          )}
          <button
            onClick={onTrocar}
            className="flex-1 py-3 rounded-xl bg-brincadeira-viva text-white font-medium active:scale-95 transition-transform shadow-md hover:shadow-lg"
          >
            💚 Quero trocar!
          </button>
        </div>
      </div>
    </div>
  );
}