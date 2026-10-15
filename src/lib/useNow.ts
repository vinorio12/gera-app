import { useEffect, useState } from 'react';

/** O horário atual, atualizado a cada `intervalMs` (para o QR que se renova e contagens). */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
