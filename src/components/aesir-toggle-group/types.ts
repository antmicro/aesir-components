import type { ToggleSize, ToggleVariant } from '../aesir-toggle/types.js';

export type ToggleGroupValue = string | number;
export type ToggleGroupType = 'single' | 'multiple';
export type ToggleGroupOrientation = 'horizontal' | 'vertical';

export type ToggleGroupContext = {
  readonly value: ToggleGroupValue | ToggleGroupValue[] | undefined;
  readonly variant: ToggleVariant;
  readonly size: ToggleSize;
  readonly disabled: boolean;
  readonly tabStop: HTMLButtonElement | undefined;
  isPressed: (value: ToggleGroupValue) => boolean;
  updateValue: (value: ToggleGroupValue) => void;
  registerItem: (element: HTMLButtonElement, value: ToggleGroupValue) => () => void;
  focusItem: (element: HTMLButtonElement) => void;
};
