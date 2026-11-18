import { Box, Button, Heading, Text } from '@chakra-ui/react';
import React from 'react';

import chartIcon from '@/assets/landing/chart_data.svg';
import linkIcon from '@/assets/landing/link.svg';
import personIcon from '@/assets/landing/person.svg';
import verifiedIcon from '@/assets/landing/verified_user.svg';

export interface LinksEmptyStateProps {
  onShortenClick: () => void;
  title?: React.ReactNode;
}

const features = [
  {
    icon: linkIcon,
    title: 'Короткие ссылки',
    desc: 'Легко делитесь ссылками в мессенджерах, соцсетях и письмах',
  },
  {
    icon: chartIcon,
    title: 'Аналитика переходов',
    desc: 'Смотрите, сколько людей переходят по ссылкам, и откуда',
  },
  {
    icon: personIcon,
    title: 'Удобное управление с регистрацией',
    desc: 'Редактируйте ссылки, добавляйте UTM-метки и сохраняйте их в личном кабинете',
  },
  {
    icon: verifiedIcon,
    title: 'Безопасность и надежность',
    desc: 'Проверяем ссылки на вирусы и фишинг',
  },
];

export function LinksEmptyState({ onShortenClick, title }: LinksEmptyStateProps) {
  return (
    <>
      {title !== null && title !== undefined && (
        typeof title === 'string' ? (
          <Heading className="links-registry__empty-page-title">
            {title}
          </Heading>
        ) : (
          title
        )
      )}

      <Box className="links-registry__empty-card">
        <Box className="links-registry__empty-icon">
          <img
            src={linkIcon}
            alt=""
            width="24"
            height="24"
          />
        </Box>
        <Text className="links-registry__empty-title">
          Здесь появится список ваших ссылок
        </Text>
        <Text className="links-registry__empty-desc">
          Нажмите кнопку ниже, чтобы сократить вашу первую ссылку
        </Text>
        <Button
          className="links-registry__empty-btn"
          onClick={onShortenClick}
        >
          Сократить ссылку
        </Button>
      </Box>

      <Box className="links-registry__features-card">
        <Heading className="links-registry__features-title">
          Больше возможностей <span>для вашего маркетинга</span>
        </Heading>
        <Text className="links-registry__features-subtitle">
          Храните все короткие ссылки в личном кабинете, редактируйте целевой URL и отслеживайте переход.
        </Text>

        <Box className="links-registry__features-grid">
          {features.map((item) => (
            <Box
              key={item.title}
              className="links-registry__feature-item"
            >
              <Box className="links-registry__feature-icon">
                <img
                  src={item.icon}
                  alt=""
                  width="24"
                  height="24"
                />
              </Box>
              <Box className="links-registry__feature-content">
                <Text className="links-registry__feature-title">
                  {item.title}
                </Text>
                <Text className="links-registry__feature-desc">
                  {item.desc}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}

export default LinksEmptyState;
