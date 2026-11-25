export type SelectOption = {
  label: string;
  value: string;
};

export type SelectFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: readonly SelectOption[];
};
