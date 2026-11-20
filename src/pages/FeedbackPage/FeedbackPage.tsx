import { Checkbox, useToast } from '@chakra-ui/react';
import { type FormEvent, useEffect, useState } from 'react';
import {
  LuCircleCheck,
  LuCircleHelp,
  LuClock,
  LuLightbulb,
  LuMail,
  LuRefreshCw,
  LuSend,
  LuShieldCheck,
  LuSparkles,
  LuTriangleAlert
} from 'react-icons/lu';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';
import CustomButton from '@/components/atoms/Button/CustomButton';
import CustomInput from '@/components/atoms/Input/CustomInput';
import CustomTextarea from '@/components/atoms/TextArea/CustomTextArea';
import LandingFooter from '@/components/shortener/landing/LandingFooter/LandingFooter';
import LandingHeader from '@/components/shortener/landing/LandingHeader/LandingHeader';
import {
  CATEGORY_LABELS,
  type FeedbackCategory,
  sendFeedback
} from '@/api/feedback';
import { ROUTES } from '@/routing/routes';

import './FeedbackPage.scss';

interface FormErrors {
  email?: string;
  message?: string;
  terms?: string;
}

const CATEGORY_HINTS: Record<FeedbackCategory, string> = {
  question:
    'Задайте вопрос по возможностям сервиса коротких ссылок, настройке редиректов, QR-кодам или статистике.',
  suggestion:
    'Поделитесь идеей или пожеланием, какую функцию, интеграцию или улучшение интерфейса вам хотелось бы видеть.',
  complaint:
    'Опишите возникшую проблему, сбой или некорректную работу ссылки. Если возможно, укажите адрес ссылки.'
};

export default function FeedbackPage() {
  const toast = useToast();
  const { authState } = useAuth();
  const [searchParams] = useSearchParams();

  const [category, setCategory] = useState<FeedbackCategory>('question');
  const [name, setName] = useState(
    [authState?.firstName, authState?.lastName].filter(Boolean).join(' ') || ''
  );
  const [email, setEmail] = useState(
    authState?.login && authState.login.includes('@') ? authState.login : ''
  );
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [website, setWebsite] = useState('');

  useEffect(() => {
    const catParam = searchParams.get('category');
    if (
      catParam &&
      ['question', 'suggestion', 'complaint'].includes(catParam)
    ) {
      setCategory(catParam as FeedbackCategory);
    }
    const subjParam = searchParams.get('subject');
    if (subjParam) {
      setSubject(subjParam);
    }
    const msgParam = searchParams.get('message');
    if (msgParam) {
      setMessage(msgParam);
    }
  }, [searchParams]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    category: FeedbackCategory;
    email: string;
    subject: string;
  } | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'Пожалуйста, укажите email для ответа';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Пожалуйста, введите корректный адрес электронной почты';
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      newErrors.message = 'Пожалуйста, напишите текст обращения';
    } else if (trimmedMessage.length < 10) {
      newErrors.message =
        'Текст обращения должен содержать не менее 10 символов';
    }

    if (!agreeTerms) {
      newErrors.terms =
        'Необходимо дать согласие на обработку персональных данных';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await sendFeedback({
        category,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        website: website.trim() || undefined
      });

      setSubmittedData({
        category,
        email: email.trim(),
        subject: subject.trim() || 'Без темы'
      });
      setIsSubmitted(true);

      toast({
        title: 'Обращение успешно отправлено',
        description:
          res.message ||
          'Спасибо за отклик! Мы свяжемся с вами в ближайшее время.',
        status: 'success',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      console.error('Ошибка отправки обращения:', error);
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : 'Пожалуйста, попробуйте позже или напишите нам напрямую на support@омни.рус';
      toast({
        title: 'Не удалось отправить обращение',
        description: errorMessage,
        status: 'error',
        duration: 6000,
        isClosable: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setMessage('');
    setSubject('');
    setCategory('question');
    setWebsite('');
    setErrors({});
    setIsSubmitted(false);
    setSubmittedData(null);
  };

  return (
    <div className="feedback-page">
      <LandingHeader />

      <main className="feedback-page__main">
        <div className="feedback-page__container">
          {/* Блок с сообщением о постоянном улучшении сервиса */}
          <section className="feedback-page__team-card">
            <span className="feedback-page__badge">
              <LuSparkles size={14} />
              Служба заботы о пользователях
            </span>
            <h1 className="feedback-page__title">Обратная связь и поддержка</h1>
            <p className="feedback-page__lead">
              <strong>
                Команда ОМНИ.РУС постоянно работает над улучшением сервиса.
              </strong>{' '}
              Мы внимательно изучаем каждый отзыв, вопрос и предложение, чтобы
              сделать работу с короткими ссылками ещё удобнее, быстрее и
              безопаснее.
            </p>
            <p className="feedback-page__subtext">
              Если у вас возник вопрос по работе сервиса, появилось предложение
              по развитию или вы столкнулись с проблемой — напишите нам через
              форму ниже. Ваше мнение напрямую помогает формировать новые
              возможности сервиса.
            </p>

            <div className="feedback-page__features">
              <div className="feedback-page__feature-item">
                <div className="feedback-page__feature-header">
                  <div className="feedback-page__feature-icon feedback-page__feature-icon--question">
                    <LuCircleHelp size={18} />
                  </div>
                  <span>Вопросы</span>
                </div>
                <p className="feedback-page__feature-desc">
                  Ответим на любые вопросы по созданию ссылок, QR-кодам, UTM-меткам,
                  аналитике переходов и безопасности.
                </p>
              </div>

              <div className="feedback-page__feature-item">
                <div className="feedback-page__feature-header">
                  <div className="feedback-page__feature-icon feedback-page__feature-icon--suggestion">
                    <LuLightbulb size={18} />
                  </div>
                  <span>Предложения</span>
                </div>
                <p className="feedback-page__feature-desc">
                  Рассматриваем идеи пользователей по добавлению новых функций,
                  улучшению интерфейса и интеграциям.
                </p>
              </div>

              <div className="feedback-page__feature-item">
                <div className="feedback-page__feature-header">
                  <div className="feedback-page__feature-icon feedback-page__feature-icon--complaint">
                    <LuTriangleAlert size={18} />
                  </div>
                  <span>Жалобы и ошибки</span>
                </div>
                <p className="feedback-page__feature-desc">
                  Быстро реагируем на технические неполадки, сбои или сообщения о
                  вредоносных и спам-ссылках.
                </p>
              </div>
            </div>
          </section>

          {/* Форма обратной связи или экран успешной отправки */}
          <section className="feedback-page__form-card">
            {isSubmitted && submittedData ? (
              <div className="feedback-page__success-card">
                <div className="feedback-page__success-icon-wrapper">
                  <LuCircleCheck size={36} />
                </div>
                <h2 className="feedback-page__success-title">
                  Спасибо! Обращение успешно отправлено
                </h2>
                <p className="feedback-page__success-desc">
                  Команда сервиса получила ваше сообщение. Мы ценим ваш отклик и
                  внимательно рассмотрим обращение. При необходимости мы
                  свяжемся с вами по указанному адресу электронной почты.
                </p>

                <div className="feedback-page__success-summary">
                  <div className="feedback-page__summary-row">
                    <span>Тип обращения:</span>
                    <span>{CATEGORY_LABELS[submittedData.category]}</span>
                  </div>
                  <div className="feedback-page__summary-row">
                    <span>Email для ответа:</span>
                    <span>{submittedData.email}</span>
                  </div>
                  <div className="feedback-page__summary-row">
                    <span>Тема:</span>
                    <span>{submittedData.subject}</span>
                  </div>
                </div>

                <div className="feedback-page__success-actions">
                  <CustomButton
                    variant="outline"
                    onClick={handleReset}
                    leftIcon={<LuRefreshCw size={16} />}
                  >
                    Отправить ещё одно обращение
                  </CustomButton>
                  <Link to={ROUTES.home}>
                    <CustomButton variant="primary">
                      Вернуться на главную
                    </CustomButton>
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <header className="feedback-page__form-header">
                  <h2 className="feedback-page__form-title">
                    Форма обратной связи
                  </h2>
                  <p className="feedback-page__form-subtitle">
                    Заполните данные ниже, и мы ответим вам в ближайшее время
                  </p>
                </header>

                <form
                  className="feedback-page__form"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  {/* Скрытое поле-ловушка для спам-ботов (honeypot) */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={{
                      display: 'none',
                      position: 'absolute',
                      opacity: 0,
                      pointerEvents: 'none'
                    }}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />

                  {/* Выбор типа обращения: вопрос, предложение, жалоба */}
                  <div className="feedback-page__category-section">
                    <label className="feedback-page__section-label">
                      Тип обращения <span className="feedback-page__required">*</span>
                    </label>
                    <div
                      className="feedback-page__categories"
                      role="radiogroup"
                      aria-label="Тип обращения"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={category === 'question'}
                        className={`feedback-page__category-btn ${
                          category === 'question'
                            ? 'feedback-page__category-btn--active'
                            : ''
                        }`}
                        onClick={() => {
                          setCategory('question');
                          setErrors((prev) => ({ ...prev, message: undefined }));
                        }}
                      >
                        <div className="feedback-page__category-top">
                          <div className="feedback-page__category-icon-wrapper">
                            <LuCircleHelp size={16} />
                          </div>
                          <span className="feedback-page__category-indicator" />
                        </div>
                        <span className="feedback-page__category-title">
                          Вопрос
                        </span>
                        <span className="feedback-page__category-caption">
                          Помощь и консультация
                        </span>
                      </button>

                      <button
                        type="button"
                        role="radio"
                        aria-checked={category === 'suggestion'}
                        className={`feedback-page__category-btn ${
                          category === 'suggestion'
                            ? 'feedback-page__category-btn--active'
                            : ''
                        }`}
                        onClick={() => {
                          setCategory('suggestion');
                          setErrors((prev) => ({ ...prev, message: undefined }));
                        }}
                      >
                        <div className="feedback-page__category-top">
                          <div className="feedback-page__category-icon-wrapper">
                            <LuLightbulb size={16} />
                          </div>
                          <span className="feedback-page__category-indicator" />
                        </div>
                        <span className="feedback-page__category-title">
                          Предложение
                        </span>
                        <span className="feedback-page__category-caption">
                          Идеи и развитие
                        </span>
                      </button>

                      <button
                        type="button"
                        role="radio"
                        aria-checked={category === 'complaint'}
                        className={`feedback-page__category-btn ${
                          category === 'complaint'
                            ? 'feedback-page__category-btn--active'
                            : ''
                        }`}
                        onClick={() => {
                          setCategory('complaint');
                          setErrors((prev) => ({ ...prev, message: undefined }));
                        }}
                      >
                        <div className="feedback-page__category-top">
                          <div className="feedback-page__category-icon-wrapper">
                            <LuTriangleAlert size={16} />
                          </div>
                          <span className="feedback-page__category-indicator" />
                        </div>
                        <span className="feedback-page__category-title">
                          Жалоба
                        </span>
                        <span className="feedback-page__category-caption">
                          Ошибки и проблемы
                        </span>
                      </button>
                    </div>

                    <div className="feedback-page__category-hint">
                      {CATEGORY_HINTS[category]}
                    </div>
                  </div>

                  {/* Поля Имя и Email */}
                  <div className="feedback-page__field-row">
                    <div className="feedback-page__field-group">
                      <label
                        htmlFor="feedback-name"
                        className="feedback-page__field-label"
                      >
                        Ваше имя{' '}
                        <span className="feedback-page__field-optional">
                          (необязательно)
                        </span>
                      </label>
                      <CustomInput
                        id="feedback-name"
                        placeholder="Например, Алексей"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={70}
                      />
                    </div>

                    <div className="feedback-page__field-group">
                      <label
                        htmlFor="feedback-email"
                        className="feedback-page__field-label"
                      >
                        Email для ответа{' '}
                        <span className="feedback-page__required">*</span>
                      </label>
                      <CustomInput
                        id="feedback-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) {
                            setErrors((prev) => ({ ...prev, email: undefined }));
                          }
                        }}
                        maxLength={100}
                        isInvalid={Boolean(errors.email)}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={
                          errors.email ? 'feedback-email-error' : undefined
                        }
                      />
                      {errors.email && (
                        <p
                          id="feedback-email-error"
                          className="feedback-page__field-error"
                        >
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Тема обращения */}
                  <div className="feedback-page__field-group">
                    <label
                      htmlFor="feedback-subject"
                      className="feedback-page__field-label"
                    >
                      Тема обращения{' '}
                      <span className="feedback-page__field-optional">
                        (необязательно)
                      </span>
                    </label>
                    <CustomInput
                      id="feedback-subject"
                      placeholder="Кратко укажите суть обращения"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={120}
                    />
                  </div>

                  {/* Текст обращения */}
                  <div className="feedback-page__field-group">
                    <label
                      htmlFor="feedback-message"
                      className="feedback-page__field-label"
                    >
                      Текст сообщения{' '}
                      <span className="feedback-page__required">*</span>
                    </label>
                    <CustomTextarea
                      id="feedback-message"
                      minH="140px"
                      placeholder={
                        category === 'question'
                          ? 'Подробно опишите ваш вопрос...'
                          : category === 'suggestion'
                            ? 'Опишите вашу идею или предложение по улучшению сервиса...'
                            : 'Опишите возникшую проблему или сбой в работе...'
                      }
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (errors.message) {
                          setErrors((prev) => ({
                            ...prev,
                            message: undefined
                          }));
                        }
                      }}
                      maxLength={2000}
                      isInvalid={Boolean(errors.message)}
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={
                        errors.message ? 'feedback-message-error' : undefined
                      }
                    />
                    {errors.message && (
                      <p
                        id="feedback-message-error"
                        className="feedback-page__field-error"
                      >
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Согласие на обработку данных и кнопка отправки */}
                  <div className="feedback-page__form-actions">
                    <div className="feedback-page__field-group">
                      <Checkbox
                        isChecked={agreeTerms}
                        onChange={(e) => {
                          setAgreeTerms(e.target.checked);
                          if (errors.terms) {
                            setErrors((prev) => ({
                              ...prev,
                              terms: undefined
                            }));
                          }
                        }}
                        alignItems="flex-start"
                        size="md"
                        colorScheme="blue"
                      >
                        <span className="feedback-page__consent-text">
                          Я даю согласие на обработку персональных данных в
                          соответствии с{' '}
                          <Link to={ROUTES.privacy}>
                            Политикой конфиденциальности
                          </Link>
                        </span>
                      </Checkbox>
                      {errors.terms && (
                        <p className="feedback-page__field-error">
                          {errors.terms}
                        </p>
                      )}
                    </div>

                    <div className="feedback-page__submit-btn-row">
                      <CustomButton
                        type="submit"
                        variant="primary"
                        size="lg"
                        isLoading={isSubmitting}
                        leftIcon={<LuSend size={18} />}
                      >
                        Отправить обращение
                      </CustomButton>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </section>

          {/* Карточка прямых контактов и регламента */}
          <section className="feedback-page__contacts-card">
            <h3 className="feedback-page__contacts-title">
              Прямые контакты и регламент обработки
            </h3>

            <div className="feedback-page__contacts-grid">
              <div className="feedback-page__contact-item">
                <div className="feedback-page__contact-icon">
                  <LuMail size={18} />
                </div>
                <div className="feedback-page__contact-info">
                  <span className="feedback-page__contact-label">
                    Служба поддержки
                  </span>
                  <a
                    href="mailto:support@омни.рус"
                    className="feedback-page__contact-value"
                  >
                    support@омни.рус
                  </a>
                </div>
              </div>

              <div className="feedback-page__contact-item">
                <div className="feedback-page__contact-icon">
                  <LuShieldCheck size={18} />
                </div>
                <div className="feedback-page__contact-info">
                  <span className="feedback-page__contact-label">
                    Жалобы и нарушения (Abuse)
                  </span>
                  <a
                    href="mailto:abuse@омни.рус"
                    className="feedback-page__contact-value"
                  >
                    abuse@омни.рус
                  </a>
                </div>
              </div>

              <div className="feedback-page__contact-item">
                <div className="feedback-page__contact-icon">
                  <LuClock size={18} />
                </div>
                <div className="feedback-page__contact-info">
                  <span className="feedback-page__contact-label">
                    Срок рассмотрения
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text)'
                    }}
                  >
                    Обычно в течение 24 часов
                  </span>
                </div>
              </div>
            </div>

            <p className="feedback-page__contacts-meta">
              Все обращения фиксируются и рассматриваются дежурными специалистами.
              Условия использования сервиса регулируются{' '}
              <Link
                to={ROUTES.terms}
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'underline'
                }}
              >
                Пользовательским соглашением
              </Link>
              , а порядок обработки данных —{' '}
              <Link
                to={ROUTES.privacy}
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'underline'
                }}
              >
                Политикой конфиденциальности
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
