import { sendEmailJs } from './emailJs';

export type FeedbackCategory = 'question' | 'suggestion' | 'complaint';

export interface SendFeedbackPayload {
  category: FeedbackCategory;
  name?: string;
  email: string;
  subject?: string;
  message: string;
}

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  question: 'Вопрос',
  suggestion: 'Предложение',
  complaint: 'Жалоба'
};

export async function sendFeedback(payload: SendFeedbackPayload): Promise<void> {
  const categoryLabel = CATEGORY_LABELS[payload.category] || payload.category;
  const safeSubject = payload.subject?.trim() || `${categoryLabel} от пользователя`;

  const formattedMessage = [
    `Тип обращения: ${categoryLabel}`,
    `Имя: ${payload.name?.trim() || 'Не указано'}`,
    `Email: ${payload.email.trim()}`,
    `Тема: ${safeSubject}`,
    '',
    'Текст сообщения:',
    payload.message.trim()
  ].join('\n');

  await sendEmailJs({
    to_email: 'support@омни.рус',
    title: `[Обратная связь / ${categoryLabel}] ${safeSubject}`,
    message: formattedMessage,
    category: categoryLabel,
    name: payload.name?.trim(),
    sender_email: payload.email.trim(),
    from_name: payload.name?.trim() || payload.email.trim(),
    from_email: payload.email.trim(),
    reply_to: payload.email.trim(),
    subject: safeSubject
  });
}
