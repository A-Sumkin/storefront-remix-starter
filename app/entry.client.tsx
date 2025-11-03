import { hydrateRoot } from 'react-dom/client';
import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import i18n from './i18n';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getInitialNamespaces } from 'remix-i18next';
import HttpBackend from 'i18next-http-backend';

async function hydrate() {
  await i18next
    .use(initReactI18next) // Tell i18next to use the react-i18next plugin
    .use(LanguageDetector) // Setup a client-side language detector
    .use(HttpBackend) // Setup your backend
    .init({
      ...i18n, // spread the configuration
      // This function detects the namespaces your routes rendered while SSR use
      // Если namespaces пустой, используем 'translation' по умолчанию
      ns: getInitialNamespaces().length > 0 ? getInitialNamespaces() : ['translation'],
      defaultNS: 'translation',
      backend: { 
        loadPath: '/locales/{{lng}}.json',
        // Отключаем кэширование только в development
        ...(process.env.NODE_ENV === 'development' 
          ? { reloadInterval: false }
          : {}),
      },
      detection: {
        // Here only enable htmlTag detection, we'll detect the language only
        // server-side with remix-i18next, by using the `<html lang>` attribute
        // we can communicate to the client the language detected server-side
        order: ['htmlTag'],
        // Because we only use htmlTag, there's no reason to cache the language
        // on the browser, so we disable it
        caches: [],
      },
      // Убеждаемся, что переводы загружаются перед рендерингом
      load: 'languageOnly',
    });
  
  // Ждем загрузки переводов
  // Используем 'translation' как дефолтный namespace
  const namespaces = getInitialNamespaces().length > 0 ? getInitialNamespaces() : ['translation'];
  
  // Загружаем namespaces и ждем завершения
  await i18next.loadNamespaces(namespaces);
  
  // Дополнительная проверка - убеждаемся, что ресурсы действительно загружены
  const detectedLanguage = i18next.language || i18next.options.lng || 'en';
  const defaultNamespace = namespaces[0] || 'translation';
  const resourceBundle = i18next.getResourceBundle(detectedLanguage, defaultNamespace);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[i18n] Loading translations for:', {
      detectedLanguage,
      namespaces,
      defaultNamespace,
      hasResources: !!resourceBundle,
      resourceKeys: resourceBundle ? Object.keys(resourceBundle) : [],
      footerKeys: resourceBundle?.footer ? Object.keys(resourceBundle.footer) : [],
    });
  }

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <RemixBrowser />
        </StrictMode>
      </I18nextProvider>,
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  window.setTimeout(hydrate, 1);
}
