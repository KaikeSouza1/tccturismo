import { useId, type InputHTMLAttributes } from "react";
import "./TextField.css";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({ label, error, id, className, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={["field", error ? "field--error" : "", className].filter(Boolean).join(" ")}>
      <label htmlFor={inputId} className="field__label">
        {label}
      </label>
      <input id={inputId} className="field__input" {...rest} />
      {error ? <span className="field__error">{error}</span> : null}
    </div>
  );
}
