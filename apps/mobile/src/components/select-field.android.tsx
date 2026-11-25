import { Host } from "@expo/ui";
import { DropdownMenuItem, ExposedDropdownMenu, ExposedDropdownMenuBox, OutlinedTextField, Text, type TextFieldRef } from "@expo/ui/jetpack-compose";
import { fillMaxWidth, menuAnchor, onVisibilityChanged } from "@expo/ui/jetpack-compose/modifiers";
import { useEffect, useRef, useState } from "react";
import { colors } from "@/theme/colors";
import type { SelectFieldProps } from "./select-field.types";

export function SelectField({ value, onValueChange, placeholder, options }: SelectFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const textField = useRef<TextFieldRef>(null);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder;

  useEffect(() => {
    if (isVisible) void textField.current?.setText(selectedLabel);
  }, [isVisible, selectedLabel]);

  return (
    <Host matchContents={{ vertical: true }} style={{ width: "100%" }}>
      <ExposedDropdownMenuBox expanded={expanded} onExpandedChange={setExpanded} modifiers={[fillMaxWidth()]}>
        <OutlinedTextField
          ref={textField}
          readOnly
          singleLine
          textStyle={{ color: colors.ink, fontSize: 15 }}
          colors={{
            focusedTextColor: colors.ink,
            unfocusedTextColor: colors.ink,
            disabledTextColor: colors.muted,
            focusedContainerColor: "transparent",
            unfocusedContainerColor: "transparent",
            focusedIndicatorColor: "transparent",
            unfocusedIndicatorColor: "transparent",
          }}
          modifiers={[fillMaxWidth(), menuAnchor(), onVisibilityChanged(setIsVisible)]}>
          <OutlinedTextField.TrailingIcon>
            <Text color={colors.muted} style={{ fontSize: 18 }}>⌄</Text>
          </OutlinedTextField.TrailingIcon>
        </OutlinedTextField>
        <ExposedDropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)} containerColor={colors.surface}>
          {options.map((option) => (
            <DropdownMenuItem key={option.value} onClick={() => { onValueChange(option.value); setExpanded(false); }}>
              <DropdownMenuItem.Text><Text color={colors.ink}>{option.label}</Text></DropdownMenuItem.Text>
            </DropdownMenuItem>
          ))}
        </ExposedDropdownMenu>
      </ExposedDropdownMenuBox>
    </Host>
  );
}
