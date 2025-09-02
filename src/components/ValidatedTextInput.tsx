import { GlobalStyles as Styles } from '@/src/themes/styles';
import {
  formatNumericInput,
  formatPhoneNumber,
  formatText,
  isValidNumericFormat,
  isValidPhoneNumber,
  isValidTextFormat,
  numericErrorMessage,
  telephoneErrorMessage,
  textErrorMessage,
} from '@/src/utils/inputValidator';
import React, { useState } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { TextInput, TextInputProps } from 'react-native-paper';

const INPUT_TYPES = {
  TEXT: 'text',
  NUMERIC: 'numeric', 
  PHONE: 'phone'
};

type InputType = typeof INPUT_TYPES[keyof typeof INPUT_TYPES];

interface ValidatedInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'error'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  isRequired?: boolean;
  inputType?: InputType;
  customValidator?: ((input: string) => boolean) | null;
  customErrorMessage?: string;
  minValue?: number | null;
  maxValue?: number | null;
  showErrorOnTyping?: boolean;
}

const ValidatedTextInput: React.FC<ValidatedInputProps> = ({ 
  label, 
  value, 
  onChangeText, 
  isRequired = false,
  inputType = INPUT_TYPES.TEXT,
  customValidator = null,
  customErrorMessage = '',
  minValue = null,
  maxValue = null,
  showErrorOnTyping = false,
  style,
  ...props 
}) => {
  const [hasBlurred, setHasBlurred] = useState(false);

  // Get the appropriate validator and formatter based on input type
  const getValidatorAndFormatter = () => {
    if (customValidator) {
      return {
        validator: customValidator,
        formatter: (val: string) => val.trim(),
        errorMessage: customErrorMessage || 'Invalid input'
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
      default:
        return {
          validator: isValidTextFormat,
          formatter: formatText,
          errorMessage: textErrorMessage
        };
    }
  };

  const { validator, formatter, errorMessage } = getValidatorAndFormatter();
  
  const isValid = validator(value);
  // const shouldShowError = hasBlurred && !isValid && (isRequired || value.length > 0);

  // Flexible error display logic
  const shouldShowError = (() => {
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

  const handleBlur = () => {
    setHasBlurred(true);
    if (onChangeText && value) {
      onChangeText(formatter(value));
    }
  };

  const handleChange = (text: string) => {
    if (onChangeText) {
      // For numeric inputs, filter input in real-time
      if (inputType === INPUT_TYPES.NUMERIC) {
        const numericText = text.replace(/[^0-9.-]/g, '');
        onChangeText(numericText);
      } else {
        onChangeText(text);
      }
    }
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
    </View>
  );
};


export default ValidatedTextInput;
export { INPUT_TYPES };
