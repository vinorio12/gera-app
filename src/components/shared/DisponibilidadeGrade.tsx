export const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
export const TURNOS = ['Manhã', 'Tarde', 'Noite'];

/** Grade de dias × turnos ("Sábado · Manhã"), usada no cadastro e no perfil. */
export function DisponibilidadeGrade({ valor, onChange }: { valor: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="relative mt-2 overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="text-ink-muted">
            <th scope="col" className="p-2 text-left font-semibold">Dia</th>
            {TURNOS.map((t) => (
              <th key={t} scope="col" className="p-2 font-semibold">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DIAS.map((d) => (
            <tr key={d} className="border-t border-border">
              <th scope="row" className="p-2 text-left font-semibold text-ink">{d}</th>
              {TURNOS.map((t) => {
                const v = `${d} · ${t}`;
                return (
                  <td key={t} className="p-0 text-center">
                    <label className="flex h-11 cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        aria-label={v}
                        checked={valor.includes(v)}
                        onChange={(e) => onChange(e.target.checked ? [...valor, v] : valor.filter((x) => x !== v))}
                        className="h-5 w-5 accent-primary"
                      />
                    </label>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
