import { PintCell } from "./PintCell";

interface PintMatrixProps {
  members: string[];
  pints: Record<string, number>;
  onAddPint: (from: string, to: string) => void;
  onClearPint: (from: string, to: string) => void;
}

export function PintMatrix({ members, pints, onAddPint, onClearPint }: PintMatrixProps) {
  const getPintKey = (from: string, to: string) => `${from}->${to}`;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* Header row with member names */}
        <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `120px repeat(${members.length}, minmax(140px, 1fr))` }}>
          <div className="p-3"></div>
          {members.map((member) => (
            <div
              key={member}
              className="p-3 text-center font-semibold text-sm bg-secondary rounded-lg"
            >
              {member}
            </div>
          ))}
        </div>

        {/* Matrix grid */}
        {members.map((fromMember) => (
          <div
            key={fromMember}
            className="grid gap-2 mb-2"
            style={{ gridTemplateColumns: `120px repeat(${members.length}, minmax(140px, 1fr))` }}
          >
            {/* Row label */}
            <div className="p-3 flex items-center justify-center font-semibold text-sm bg-secondary rounded-lg">
              {fromMember}
            </div>

            {/* Cells */}
            {members.map((toMember) => {
              const key = getPintKey(fromMember, toMember);
              const count = pints[key] || 0;

              return (
                <PintCell
                  key={key}
                  fromMember={fromMember}
                  toMember={toMember}
                  count={count}
                  onAddPint={onAddPint}
                  onClearPint={onClearPint}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
