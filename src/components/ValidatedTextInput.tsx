import { GlobalStyles as Styles } from '@/src/themes/styles';
import {
  formatNumericInput,
  formatPhoneNumber,
  formatText,
  isValidNumericFormat,
  isValidPassword,
  isValidPhoneNumber,
  isValidTextFormat,
  numericErrorMessage,
  passwordErrorMessage,
  telephoneErrorMessage,
  textErrorMessage,
} from '@/src/utils/inputValidator';
import React, { useState, useRef } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { TextInput, TextInputProps } from 'react-native-paper';

const INPUT_TYPES = {
  TEXT: 'text',
  NUMERIC: 'numeric', 
  PHONE: 'phone',
  PASSWORD: 'password'
};

type InputType = typeof INPUT_TYPES[keyof typeof INPUT_TYPES];
// How long the user must pause before the text is saved to the patient context after each keystroke
const SAVE_DELAY_MS = 300;

interface ValidatedInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'error' | 'onBlur'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  isRequired?: boolean;
  inputType?: InputType;
  customValidator?: ((input: string) => boolean) | null;
  customErrorMessage?: string;
  customWarningMessage?: string;
  minValue?: number | null;
  maxValue?: number | null;
  showErrorOnTyping?: boolean;
  onBlurExternal?: (value: string) => void;
}

const ValidatedTextInput: React.FC<ValidatedInputProps> = ({ 
  label, 
  value: savedValue, 
  onChangeText, 
  isRequired = false,
  inputType = INPUT_TYPES.TEXT,
  customValidator = null,
  customErrorMessage = '',
  customWarningMessage = '',
  minValue = null,
  maxValue = null,
  showErrorOnTyping = false,
  style,
  onBlurExternal,
  ...props 
}) => {
  const [hasBlurred, setHasBlurred] = useState(false);

// draft holds the text while the user is editing; null means "not editing"
const [draft, setDraft] = useState<string | null>(null);
const value = draft ?? savedValue ?? ''; // refer to the most recent draft change over the savedValue to avoid lagging issues

const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined); //pause before saving to patient context to prevent lags in typing

// Call the newest onChangeText function with the most recent typed value (saved as a local copy in 'draft')
const latestOnChange = useRef(onChangeText);
latestOnChange.current = onChangeText;

  // Get the appropriate validator and formatter based on input type
  const getValidatorAndFormatter = () => {
    if (customValidator) {
      return {
        validator: customValidator,
        formatter: (val: string) => val.trim(),
        errorMessage: customErrorMessage || undefined, //'Invalid input'
        warningMessage: customWarningMessage
      };
    }

    switch (inputType) {
      case INPUT_TYPES.NUMERIC:
        return {
          validator: (val: string) => isValidNumericFormat(val, minValue, maxValue),
          formatter: (val: string) => formatNumericInput(val),
          errorMessage: numericErrorMessage
        };
      case INPUT_TYPES.PHONE:
        return {
          validator: (val: string) => isValidPhoneNumber(val),
          formatter: (val: string) => formatPhoneNumber(val),
          errorMessage: telephoneErrorMessage
        };
      case INPUT_TYPES.TEXT:
        return {
          validator: isValidTextFormat,
          formatter: formatText,
          errorMessage: textErrorMessage
        };
       case INPUT_TYPES.PASSWORD:
        return {
          validator: isValidPassword,
          formatter: (val: string) => val.trim(),
          errorMessage: passwordErrorMessage
        };
      default:
        return {
          validator: isValidTextFormat,
          formatter: formatText,
          errorMessage: textErrorMessage
        };
    }
  };

  const { validator, formatter, errorMessage, warningMessage } = getValidatorAndFormatter();

  const isValid = validator(value);

  // Flexible error display logic
  const shouldShowError = (() => {
    if (!errorMessage) {
      return false;
    }

    // Never show error for empty optional fields
    if (!isRequired && !value.length) {
      return false;
    }
    
    // For required fields, only show error after blur or if there's invalid content
    if (isRequired) {
      return (hasBlurred && !isValid) || (value.length > 0 && !isValid && showErrorOnTyping);
    }
    
    // For optional fields with content, show error based on showErrorOnTyping setting
    if (value.length > 0) {
      return showErrorOnTyping ? !isValid : (hasBlurred && !isValid);
    }
    
    return false;
  })();

    // Flexible error display logic
  const shouldShowWarning = (() => {
    if (!warningMessage) {
      return false;
    }
    
    // Never show warning for empty optional fields
    if (!isRequired && !value.length) {
      return false;
    }
    
    // For required fields, only show warning after blur or if there's invalid content
    if (isRequired) {
      return (hasBlurred && !isValid) || (value.length > 0 && !isValid && showErrorOnTyping);
    }
    
    // For optional fields with content, show warning based on showErrorOnTyping setting
    if (value.length > 0) {
      return showErrorOnTyping ? !isValid : (hasBlurred && !isValid);
    }
    
    return false;
  })();

  const handleBlur = () => {
    setHasBlurred(true);
    clearTimeout(timer.current); // cancel the delayed save

    // Save immediately, then pass this new value into onBlur to save to patient context
    const finalValue = value ? formatter(value) : value;
    if (draft !== null || finalValue !== value) {
      latestOnChange.current(finalValue);
    }
    setDraft(null);

    onBlurExternal?.(finalValue); // save the final value to the patient context 
  };

  const handleChange = (text: string) => {
     // For numeric inputs, filter input in real-time
    const nextValue = inputType === INPUT_TYPES.NUMERIC
      ? text.replace(/[^0-9.-]/g, '')
      : text;

    setDraft(nextValue); // updates the value right away

    // Restart the countdown on every keystroke
    clearTimeout(timer.current);
    timer.current = setTimeout(() => latestOnChange.current(nextValue), SAVE_DELAY_MS);
  };

  // Get appropriate keyboard type
  const getKeyboardType = () => {
    switch (inputType) {
      case INPUT_TYPES.NUMERIC:
        return 'numeric';
      case INPUT_TYPES.PHONE:
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  return (
    <View style={style as StyleProp<ViewStyle>}>
      <TextInput
        label={label}
        mode="flat"
        style={Styles.textInput}
        value={value}
        onChangeText={handleChange}
        onBlur={handleBlur}
        error={shouldShowError}
        keyboardType={getKeyboardType()}
        {...props}
      />
      {shouldShowError && (
        <Text style={Styles.errorText}>{errorMessage}</Text>
      )}

      {shouldShowWarning&& (
        <Text style={Styles.warningText}>{warningMessage}</Text>
      )}
    </View>
  );
};


export default ValidatedTextInput;
export { INPUT_TYPES };
