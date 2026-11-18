import { ChakraProvider, type ToastProviderProps } from '@chakra-ui/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { AuthProvider } from './auth/AuthProvider.provider';
import { StatusToast } from './components/atoms/StatusToast/StatusToast';
import theme from './theme';

const toastOptions: ToastProviderProps = {
  defaultOptions: {
    duration: 4000,
    position: 'bottom',
    render: ({ id, status, title, description, icon }) => (
      <StatusToast
        id={id}
        status={status}
        title={title}
        description={description}
        icon={icon}
      />
    )
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider
      theme={theme}
      toastOptions={toastOptions}
    >
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  </React.StrictMode>
);
