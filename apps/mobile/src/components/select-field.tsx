import { Host, Picker } from "@expo/ui";
import type { SelectFieldProps } from "./select-field.types";

export function SelectField({ value, onValueChange, placeholder, options }: SelectFieldProps) {
  return (
    <Host matchContents={{ vertical: true }} style={{ width: "100%" }}>
      <Picker selectedValue={value} onValueChange={onValueChange}>
        <Picker.Item label={placeholder} value="" />
        {options.map((option) => <Picker.Item key={option.value} label={option.label} value={option.value} />)}
      </Picker>
    </Host>
  );
}
