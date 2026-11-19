import { getApiBaseUrl } from './shortenerConfig';

export type FeedbackCategory = 'question' | 'suggestion' | 'complaint';

export interface SendFeedbackPayload {
  category: FeedbackCategory;
  name?: string;
  email: string;
  subject?: string;
  message: string;
  website?: string; // honeypot для защиты от спам-ботов
}

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  question: 'Вопрос',
  suggestion: 'Предложение',
  complaint: 'Жалоба'
};

export async function sendFeedback(payload: SendFeedbackPayload): Promise<{ ok: boolean; message: string }> {
  const baseUrl = getApiBaseUrl();

  const response = await fetch(`${baseUrl}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      category: payload.category,
      name: payload.name?.trim() || undefined,
      email: payload.email.trim(),
      subject: payload.subject?.trim() || undefined,
      message: payload.message.trim(),
      website: payload.website?.trim() || undefined
    })
  });

  const rawJson = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    let errorMsg: string | undefined;

    if (rawJson?.error && typeof rawJson.error === 'object') {
      const err = rawJson.error as Record<string, unknown>;
      if (typeof err.message === 'string' && err.message.trim()) {
        errorMsg = err.message.trim();
      }
    } else if (rawJson?.detail && typeof rawJson.detail === 'object') {
      const detail = rawJson.detail as Record<string, unknown>;
      if (typeof detail.message === 'string' && detail.message.trim()) {
        errorMsg = detail.message.trim();
      }
    } else if (typeof rawJson?.message === 'string' && rawJson.message.trim()) {
      errorMsg = rawJson.message.trim();
    }

    throw new Error(
      errorMsg || 'Не удалось отправить обращение. Попробуйте позже.'
    );
  }

  return {
    ok: true,
    message:
      typeof rawJson.message === 'string' && rawJson.message.trim()
        ? rawJson.message.trim()
        : 'Обращение успешно отправлено'
  };
}
