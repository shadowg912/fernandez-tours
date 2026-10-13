"use client";

import { useState, useCallback } from "react";

interface UseMoneyInputOptions {
  initialValue?: string;
  onValueChange?: (value: string) => void;
}

interface UseMoneyInputReturn {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  setValue: (value: string) => void;
}

/**
 * Hook para inputs de dinero que auto-formatea 2 dígitos agregando 3 ceros (×1000)
 * Ej: "12" → "12000", "22" → "22000", "30" → "30000"
 * Solo se aplica en onBlur para no interferir mientras el usuario escribe.
 */
export function useMoneyInput({ initialValue = "", onValueChange }: UseMoneyInputOptions = {}): UseMoneyInputReturn {
  const [value, setValue] = useState(initialValue);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onValueChange?.(newValue);
  }, [onValueChange]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const num = Number(e.target.value);
    // Si es un número de 2 dígitos (10-99), multiplicar por 1000
    if (!isNaN(num) && num >= 10 && num <= 99) {
      const formatted = String(num * 1000);
      e.target.value = formatted;
      setValue(formatted);
      onValueChange?.(formatted);
    }
  }, [onValueChange]);

  return { value, onChange: handleChange, onBlur: handleBlur, setValue };
}