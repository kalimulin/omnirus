import { extendTheme } from '@chakra-ui/react';

import { chakraThemeColors } from '@/styles/colors';

const theme = extendTheme({
  breakpoints: {
    sm: '30em', // 480px
    md: '48em', // 768px
    lg: '62em', // 992px
    laptop: '64em', // 1024px
    xl: '80em', // 1280px
    xxl: '90em', // 1440px
    '2xl': '96em'
  },
  colors: chakraThemeColors,
  fonts: {
    heading: '"DM Sans", system-ui, sans-serif',
    body: '"DM Sans", system-ui, sans-serif'
  },
  styles: {
    global: {
      body: {
        bg: 'var(--bg)',
        color: 'brand.800'
      }
    }
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        minW: '10',
        minH: '10',
        borderRadius: 'xl',
        h: 'auto',
        maxH: 'unset',
        maxW: '360px',
        py: 2.5,
        px: 4,
        _disabled: { opacity: 0.5, pointerEvents: 'none' }
      },
      variants: {
        primary: {
          bg: 'brand.450',
          color: 'white',
          _hover: { bg: 'brand.460' }
        },
        secondary: {
          bg: 'white',
          color: 'brand.500',
          borderWidth: '1px',
          borderColor: 'brand.500',
          _hover: { bg: 'lavender.50' }
        },
        outline: {
          outline: '1px solid brand.450',
          color: 'brand.450',
          bg: 'transparent',
          _hover: { bg: 'brand.60' }
        },
        accent: {
          bg: 'accent.green',
          _hover: { bg: 'accent.greenHover' }
        }
      },
      sizes: {
        xl: { fontSize: 'xl', py: 3, px: 6 },
        lg: { fontSize: 'lg', px: 5 },
        md: { fontSize: 'md', px: 4, lineHeight: 5 }
      },
      defaultProps: {
        variant: 'primary',
        size: 'md',
        colorScheme: 'brand'
      }
    },
    Input: {
      variants: {
        custom: {
          field: {
            bg: 'gray.50',
            borderWidth: '1px',
            borderColor: 'gray.200',
            borderRadius: '10px',
            fontSize: 'md',
            h: '44px',
            _placeholder: { color: 'gray.400' }
          }
        }
      }
    },
    Textarea: {
      variants: {
        custom: {
          bg: 'gray.50',
          borderWidth: '1px',
          borderColor: 'gray.200',
          borderRadius: '10px',
          fontSize: 'md',
          py: 2.5,
          _placeholder: { color: 'gray.400' }
        }
      }
    },
    Modal: {
      baseStyle: {
        overlay: {
          bg: 'rgba(18, 35, 63, 0.3)',
          backdropFilter: 'none'
        },
        dialog: {
          bg: 'var(--white)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(18, 35, 63, 0.18)',
          fontFamily: 'var(--font-family)',
          color: 'var(--text)'
        },
        header: {
          fontSize: 'var(--font-size-lg)',
          fontWeight: '700',
          color: 'var(--text)',
          fontFamily: 'var(--font-family)',
          px: '32px',
          pt: '32px',
          pb: '16px',
          borderBottom: 'none'
        },
        closeButton: {
          top: '24px',
          right: '28px',
          color: 'var(--text)',
          _hover: {
            bg: 'var(--slate-100-alt2)',
            color: 'var(--text)'
          }
        },
        body: {
          px: '32px',
          py: 0,
          color: 'var(--text)'
        },
        footer: {
          px: '32px',
          pt: '24px',
          pb: '32px',
          borderTop: 'none',
          bg: 'transparent'
        }
      }
    },
    Alert: {
      baseStyle: {
        container: {
          fontFamily: 'var(--font-family)'
        },
        title: {
          fontSize: 'var(--font-size-md)',
          fontWeight: '500',
          lineHeight: '6'
        },
        description: {
          fontSize: 'var(--font-size-md)',
          fontWeight: '400',
          lineHeight: '6'
        }
      },
      variants: {
        toast: {
          container: {
            bg: 'var(--toast-info-bg)',
            '&[data-status="success"]': {
              bg: 'var(--toast-success-bg)'
            },
            '&[data-status="error"]': {
              bg: 'var(--toast-error-bg)'
            },
            '&[data-status="warning"]': {
              bg: 'var(--toast-warning-bg)'
            },
            '&[data-status="info"], &[data-status="loading"]': {
              bg: 'var(--toast-info-bg)'
            },
            color: 'var(--white)',
            fontFamily: 'var(--font-family)',
            borderRadius: '10px',
            boxShadow: 'lg',
            px: 5,
            py: 4,
            alignItems: 'flex-start',
            textAlign: 'start',
            maxW: '100%'
          },
          icon: {
            color: 'var(--white)',
            w: 5,
            h: 5,
            mt: '2px',
            marginEnd: 3.5,
            flexShrink: 0
          },
          spinner: {
            color: 'var(--white)',
            w: 5,
            h: 5,
            mt: '2px',
            marginEnd: 3.5,
            flexShrink: 0
          },
          title: {
            fontSize: 'var(--font-size-md)',
            fontWeight: '500',
            lineHeight: '6',
            marginEnd: 0
          },
          description: {
            display: 'block',
            fontSize: 'var(--font-size-md)',
            fontWeight: '400',
            lineHeight: '6'
          }
        }
      }
    }
  }
});

export default theme;
