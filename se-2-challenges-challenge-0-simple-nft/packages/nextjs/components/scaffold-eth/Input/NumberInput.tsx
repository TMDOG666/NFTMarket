import { ChangeEvent, FocusEvent, ReactNode, useCallback, useEffect, useRef } from "react";
import { CommonInputProps } from "~~/components/scaffold-eth";

type InputBaseProps<T> = CommonInputProps<T> & {
  error?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  reFocus?: boolean;
  step?: number; // 新增步进值
};

export const NumberInput = <T extends { toString: () => string } | undefined = string>({
  name,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  prefix,
  suffix,
  reFocus,
  step = 1, // 默认步进为1
}: InputBaseProps<T>) => {
  const inputRef = useRef<HTMLInputElement>(null);

  let modifier = "";
  if (error) {
    modifier = "border-error";
  } else if (disabled) {
    modifier = "border-disabled bg-base-300";
  }

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const parsedValue = parseFloat(e.target.value);
      onChange((isNaN(parsedValue) ? "" : parsedValue) as unknown as T);
    },
    [onChange],
  );

  const onFocus = (e: FocusEvent<HTMLInputElement, Element>) => {
    if (reFocus) {
      e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length);
    }
  };

  useEffect(() => {
    if (reFocus) inputRef.current?.focus();
  }, [reFocus]);

  return (
    <div className={`flex border-2 border-base-300 bg-base-200 rounded-full text-accent ${modifier}`}>
      {prefix}
      <input
        type="number"
        step={step} // 支持上下键调整
        className="input input-ghost focus-within:border-transparent focus:outline-none focus:bg-transparent h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50"
        placeholder={placeholder}
        name={name}
        value={value?.toString()}
        onChange={handleChange}
        disabled={disabled}
        autoComplete="off"
        ref={inputRef}
        onFocus={onFocus}
      />
      {suffix}
    </div>
  );
};
