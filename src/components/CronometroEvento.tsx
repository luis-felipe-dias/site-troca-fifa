"use client";

import { useEffect, useState } from "react";

interface CronometroEventoProps {
  dataEvento: string | Date;
}

export default function CronometroEvento({ dataEvento }: CronometroEventoProps) {
  const [tempoRestante, setTempoRestante] = useState({
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0
  });
  const [eventoPassado, setEventoPassado] = useState(false);

  useEffect(() => {
    const calcularTempo = () => {
      const agora = new Date().getTime();
      const evento = new Date(dataEvento).getTime();
      const diferenca = evento - agora;

      if (diferenca <= 0) {
        setEventoPassado(true);
        setTempoRestante({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
        return;
      }

      setEventoPassado(false);
      setTempoRestante({
        dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutos: Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60)),
        segundos: Math.floor((diferenca % (1000 * 60)) / 1000)
      });
    };

    calcularTempo();
    const intervalo = setInterval(calcularTempo, 1000);
    return () => clearInterval(intervalo);
  }, [dataEvento]);

  if (eventoPassado) {
    return (
      <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
        <p className="text-green-700 dark:text-green-400 font-semibold">🎉 Evento em andamento! 🎉</p>
        <p className="text-xs text-green-600 dark:text-green-500">Corra para a loja realizar suas trocas!</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-brincadeira-viva/20 to-abraco-doce/20 rounded-xl p-4 text-center">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Próximo evento começa em:</p>
      <div className="flex justify-center gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-brincadeira-viva">{tempoRestante.dias}</div>
          <div className="text-xs text-gray-500">dias</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-brincadeira-viva">{tempoRestante.horas}</div>
          <div className="text-xs text-gray-500">horas</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-brincadeira-viva">{tempoRestante.minutos}</div>
          <div className="text-xs text-gray-500">min</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-brincadeira-viva">{tempoRestante.segundos}</div>
          <div className="text-xs text-gray-500">seg</div>
        </div>
      </div>
    </div>
  );
}