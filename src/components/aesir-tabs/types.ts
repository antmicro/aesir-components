export type TabValue = string | number;
export type TabItem = {
  value: TabValue;
  label: string;
  content?: string | number;
  disabled?: boolean;
};
