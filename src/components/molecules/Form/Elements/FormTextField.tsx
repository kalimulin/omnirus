import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Text
} from '@chakra-ui/react';
import { memo, type ReactNode } from 'react';

import CustomInput from '@/components/atoms/Input/CustomInput';
import {
  countMeaningfulLength,
  truncateByMeaningfulLength
} from '@/utils/meaningfulLength';
import {
  formatInternationalPhone,
  formatPhoneWithCursor
} from '@/utils/phoneMask';

import { FormTextFieldProps } from '../../types/form';
import { useFormField } from '../hooks/useFormField';
import { maxLength as maxLengthValidator } from '../validators/validators';

type FormTextFieldWithRightElementProps = FormTextFieldProps & {
  rightElement?: ReactNode;
};

function FormTextFieldBase({
  name,
  label,
  labelFontSize = '18px',
  initialValue,
  validators,
  subTitlte,
  maxLength,
  softMaxLength = false,
  maxLengthMessage = 'Превышено количество знаков. Уберите лишние, чтобы отправить.',
  rightElement,
  mask,
  ...rest
}: FormTextFieldWithRightElementProps) {
  const isPhoneMask = mask === 'phone' || rest.type === 'tel';
  const allValidators =
    maxLength && !softMaxLength
      ? [...(validators ?? []), maxLengthValidator(maxLength)]
      : validators;

  const { value, error, onChange, onBlur } = useFormField<string>(name, {
    initialValue,
    validators: allValidators
  });
  const lengthError =
    softMaxLength &&
    maxLength !== undefined &&
    countMeaningfulLength(value) > maxLength
      ? maxLengthMessage
      : undefined;
  const displayedError = error ?? lengthError;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    if (isPhoneMask) {
      const selectionStart = input.selectionStart ?? input.value.length;
      const { formatted, cursor } = formatPhoneWithCursor(
        input.value,
        selectionStart
      );
      input.value = formatted;
      onChange(formatted);
      requestAnimationFrame(() => {
        if (input && document.activeElement === input) {
          input.setSelectionRange(cursor, cursor);
        }
      });
      return;
    }

    if (maxLength !== undefined && !softMaxLength) {
      const truncated = truncateByMeaningfulLength(input.value, maxLength);
      if (truncated !== input.value) {
        input.value = truncated;
      }
    }
    onChange(e);
  };

  const hasCounter =
    rest.showCounter !== false && typeof maxLength === 'number';
  const displayValue =
    isPhoneMask && typeof value === 'string'
      ? formatInternationalPhone(value)
      : value;

  const input = (
    <CustomInput
      borderColor={displayedError ? 'red.500' : 'inherit'}
      _hover={{ borderColor: displayedError ? 'red.500' : 'var(--blue-500)' }}
      _focusVisible={{
        borderColor: displayedError ? 'red.500' : 'var(--blue-500)'
      }}
      {...rest}
      pr={rightElement ? (hasCounter ? '120px' : '48px') : rest.pr}
      value={displayValue}
      onChange={handleChange}
      onBlur={onBlur}
      maxLength={maxLength}
      softMaxLength={softMaxLength}
    />
  );

  return (
    <FormControl isInvalid={Boolean(displayedError)}>
      {label && (
        <FormLabel
          fontSize={labelFontSize}
          width={'fit-content'}
        >
          {label}
        </FormLabel>
      )}
      {rightElement ? (
        <Box position="relative">
          {input}
          <Box
            position="absolute"
            top={0}
            right={hasCounter ? '72px' : 0}
            zIndex={1}
            h="44px"
            w="48px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {rightElement}
          </Box>
        </Box>
      ) : (
        input
      )}
      {!displayedError && subTitlte && (
        <Text
          mt={2}
          color="gray.600"
          fontSize="xs"
        >
          {subTitlte}
        </Text>
      )}
      {displayedError && (
        <FormErrorMessage
          mt={2}
          color="red.500"
          fontSize="xs"
        >
          {displayedError}
        </FormErrorMessage>
      )}
    </FormControl>
  );
}

export const FormTextField = memo(FormTextFieldBase);
