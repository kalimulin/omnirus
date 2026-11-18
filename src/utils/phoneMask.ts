/**
 * Утилиты маски международного телефонного номера.
 * Соответствует международному стандарту ITU-T (E.123 / E.164).
 */

const TWO_DIGIT_COUNTRY_CODES = new Set([
  '20', '27', '30', '31', '32', '33', '34', '36', '39', '40',
  '41', '43', '44', '45', '46', '47', '48', '49', '51', '52',
  '53', '54', '55', '56', '57', '58', '60', '61', '62', '63',
  '64', '65', '66', '81', '82', '84', '86', '90', '91', '92',
  '93', '94', '95', '98'
]);

const THREE_DIGIT_CIS_CODES = new Set([
  '370', '371', '372', '373', '374', '375', '376', '377', '378',
  '380', '381', '382', '383', '385', '386', '387', '389',
  '971', '972', '992', '993', '994', '995', '996', '998'
]);

/**
 * Разбивает абонентский номер на блоки в зависимости от кода страны.
 */
function getSubscriberChunks(
  countryCode: string,
  subscriberDigits: string
): string[] {
  if (!subscriberDigits) return [];

  let pattern: number[];

  if (countryCode === '7') {
    // Россия, Казахстан: 3 - 3 - 2 - 2 (+7 999 123 45 67)
    pattern = [3, 3, 2, 2, 2, 2];
  } else if (countryCode === '1') {
    // США, Канада: 3 - 3 - 4 (+1 202 555 0123)
    pattern = [3, 3, 4, 2, 2];
  } else if (THREE_DIGIT_CIS_CODES.has(countryCode)) {
    // СНГ (3-значные): 2 - 3 - 2 - 2 (+375 29 123 45 67)
    pattern = [2, 3, 2, 2, 2];
  } else {
    // Общий международный формат: 3 - 3 - 2 - 2 (или 3 - 3 - 4)
    pattern = subscriberDigits.length === 10 ? [3, 3, 4] : [3, 3, 2, 2, 2, 2];
  }

  const chunks: string[] = [];
  let remaining = subscriberDigits;
  for (const size of pattern) {
    if (!remaining) break;
    chunks.push(remaining.slice(0, size));
    remaining = remaining.slice(size);
  }
  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

/**
 * Форматирует строку ввода в международный телефонный номер.
 * Примеры:
 * - "89991234567" -> "+7 999 123 45 67"
 * - "+79991234567" -> "+7 999 123 45 67"
 * - "+375291234567" -> "+375 29 123 45 67"
 * - "+12025550123" -> "+1 202 555 0123"
 */
export function formatInternationalPhone(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const hasPlus = raw.trimStart().startsWith('+');
  let digits = raw.replace(/\D/g, '');

  if (!digits) {
    return hasPlus ? '+' : '';
  }

  // Если номер начат с 8 без плюса (например "89..." или "8999..."), заменяем на международный код РФ 7
  if (!hasPlus && digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }

  // Максимум 15 цифр по стандарту E.164
  digits = digits.slice(0, 15);

  // Определение длины кода страны (1, 2 или 3 цифры)
  let countryCodeLen: number;
  if (digits[0] === '1' || digits[0] === '7') {
    countryCodeLen = 1;
  } else if (
    digits.length >= 2 &&
    TWO_DIGIT_COUNTRY_CODES.has(digits.slice(0, 2))
  ) {
    countryCodeLen = 2;
  } else if (digits.length >= 3) {
    countryCodeLen = 3;
  } else {
    countryCodeLen = digits.length;
  }

  const countryCode = digits.slice(0, countryCodeLen);
  const subscriber = digits.slice(countryCodeLen);

  if (!subscriber) {
    return raw.endsWith(' ') ? `+${countryCode} ` : `+${countryCode}`;
  }

  const chunks = getSubscriberChunks(countryCode, subscriber);
  const formatted = `+${countryCode} ${chunks.join(' ')}`;

  return raw.endsWith(' ') ? `${formatted} ` : formatted;
}

/**
 * Форматирует номер телефона с корректным сохранением позиции курсора.
 */
export function formatPhoneWithCursor(
  rawValue: string,
  cursorPos: number
): { formatted: string; cursor: number } {
  const formatted = formatInternationalPhone(rawValue);

  if (!formatted) {
    return { formatted: '', cursor: 0 };
  }

  const rawBefore = rawValue.slice(0, cursorPos);
  const hasPlus = rawValue.trimStart().startsWith('+');
  let rawBeforeDigits = rawBefore.replace(/\D/g, '');

  if (!hasPlus && rawBeforeDigits.startsWith('8')) {
    rawBeforeDigits = '7' + rawBeforeDigits.slice(1);
  }

  const digitsTarget = rawBeforeDigits.length;

  if (digitsTarget === 0) {
    const cursor = formatted.startsWith('+') ? 1 : 0;
    return { formatted, cursor };
  }

  let seenDigits = 0;
  let newCursor = formatted.length;

  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seenDigits++;
      if (seenDigits === digitsTarget) {
        newCursor = i + 1;
        if (
          newCursor < formatted.length &&
          formatted[newCursor] === ' ' &&
          rawValue[cursorPos - 1] === ' '
        ) {
          newCursor++;
        }
        break;
      }
    }
  }

  return { formatted, cursor: newCursor };
}
