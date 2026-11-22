import type { ReactNode } from 'react';

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  hint?: string;
}

export function SliderRow({ label, value, min, max, step = 1, unit, onChange, hint }: SliderRowProps) {
  return (
    <label className="ctrl-row">
      <span className="ctrl-label" title={hint}>
        {label}
        {hint ? <em className="ctrl-hint">?</em> : null}
      </span>
      <span className="ctrl-body">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          className="ctrl-num"
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {unit ? <i className="ctrl-unit">{unit}</i> : null}
      </span>
    </label>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="ctrl-row">
      <span className="ctrl-label">{label}</span>
      <span className="ctrl-body">{children}</span>
    </label>
  );
}

export function SectionTitle({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="section-title">
      <h3>{children}</h3>
      {extra}
    </div>
  );
}
