import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Camera, CameraOff, Flashlight } from 'lucide-react';
import { Button } from '@gera/design-system';
import { inputClass, labelClass } from '../ui/form';

interface ScannerControls {
  stop: () => void;
  switchTorch?: (on: boolean) => Promise<void>;
}

interface CodeReaderProps {
  /** Chamado com o texto do QR ou com o número digitado. */
  onCode: (code: string) => void;
  busy?: boolean;
  submitLabel: string;
  /** Rótulo do campo de digitar (padrão: número da carteirinha). */
  inputLabel?: string;
  placeholder?: string;
  /** Texto sobre a câmera fechada. */
  cameraHint?: string;
}

/**
 * Leitura da carteirinha: câmera (QR) com moldura e lanterna, e o número digitado como alternativa
 * sempre visível (sem câmera, com permissão negada ou na prévia publicada, que não libera a câmera).
 */
export function CodeReader({
  onCode,
  busy = false,
  submitLabel,
  inputLabel = 'Ou digite o número da carteirinha',
  placeholder = 'JS-2026-004812',
  cameraHint = 'Aponte a câmera para o QR da carteirinha.',
}: CodeReaderProps) {
  const inputId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const [camera, setCamera] = useState<'off' | 'starting' | 'on' | 'error'>('off');
  const [torch, setTorch] = useState(false);
  const [code, setCode] = useState('');

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setTorch(false);
  };

  useEffect(() => stop, []);

  const start = async () => {
    setCamera('starting');
    try {
      // Carregado só quando a câmera é aberta, para não pesar nas outras telas.
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result, _error, controls) => {
        if (!result) return;
        controls.stop();
        controlsRef.current = null;
        setCamera('off');
        onCodeRef.current(result.getText());
      });
      setCamera('on');
    } catch {
      stop();
      setCamera('error');
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim()) onCode(code.trim());
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-lg bg-brand-deep text-on-brand-deep">
        <video
          ref={videoRef}
          muted
          playsInline
          className={camera === 'on' ? 'block aspect-square w-full object-cover sm:aspect-video' : 'hidden'}
        />
        {camera === 'on' ? (
          <>
            {/* Moldura de leitura */}
            <div aria-hidden className="pointer-events-none absolute inset-[18%] rounded-lg border-4 border-highlight" />
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 p-3">
              {controlsRef.current?.switchTorch && (
                <Button
                  variant="secondary"
                  aria-pressed={torch}
                  onClick={() => {
                    const next = !torch;
                    void controlsRef.current?.switchTorch?.(next);
                    setTorch(next);
                  }}
                >
                  <Flashlight size={18} aria-hidden /> {torch ? 'Desligar lanterna' : 'Lanterna'}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  stop();
                  setCamera('off');
                }}
              >
                <CameraOff size={18} aria-hidden /> Fechar câmera
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <Camera size={40} aria-hidden />
            <p className="max-w-xs text-sm">
              {camera === 'error'
                ? 'Não deu para abrir a câmera (sem permissão ou sem câmera neste aparelho). Digite o código aqui embaixo.'
                : cameraHint}
            </p>
            <Button onClick={start} disabled={camera === 'starting' || busy}>
              <Camera size={18} aria-hidden /> {camera === 'starting' ? 'Abrindo câmera…' : 'Abrir câmera'}
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor={inputId} className={labelClass}>
          {inputLabel}
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id={inputId}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className={`${inputClass} min-w-0 flex-1 font-semibold tabular-nums`}
          />
          <Button type="submit" disabled={busy || !code.trim()}>
            {busy ? 'Conferindo…' : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
