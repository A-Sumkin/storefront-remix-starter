import { Link } from '@remix-run/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageCode } from '~/generated/graphql';
import { RootLoaderData } from '~/root';
import { useRootLoader } from '~/utils/use-root-loader';
import { useSafeTranslation } from '~/utils/use-safe-translation';

function getLocalizedCollectionName(
  collection: {
    name: string;
    translations?: Array<{ languageCode: LanguageCode; name: string }> | null;
    languageCode?: LanguageCode | null;
  },
  locale: string,
): string {
  const localeMap: Record<string, LanguageCode> = {
    en: LanguageCode.En,
    es: LanguageCode.Es,
    pt: LanguageCode.Pt,
    'pt-BR': LanguageCode.PtBr,
    ru: LanguageCode.Ru,
  };

  const targetLang = localeMap[locale] ?? LanguageCode.En;

  if (collection.languageCode === targetLang) {
    return collection.name;
  }

  if (collection.translations) {
    const translation = collection.translations.find(
      (t) => t.languageCode === targetLang,
    );
    if (translation) {
      return translation.name;
    }
  }

  return collection.name;
}

const navigation = {
  support: [
    { page: 'help', href: '#' },
    { page: 'trackOrder', href: '#' },
    { page: 'shipping', href: '#' },
    { page: 'returns', href: '#' },
  ],
  company: [
    { page: 'about', href: '#' },
    { page: 'blog', href: '#' },
    { page: 'responsibility', href: '#' },
    { page: 'press', href: '#' },
  ],
};

function getSupportFallback(page: string): string {
  switch (page) {
    case 'help':
      return 'Помощь';
    case 'trackOrder':
      return 'Отследить заказ';
    case 'shipping':
      return 'Доставка';
    case 'returns':
      return 'Возвраты';
    default:
      return page;
  }
}

function getCompanyFallback(page: string): string {
  switch (page) {
    case 'about':
      return 'О нас';
    case 'blog':
      return 'Блог';
    case 'responsibility':
      return 'Ответственность';
    case 'press':
      return 'Пресса';
    default:
      return page;
  }
}

export default function Footer({
  collections,
}: {
  collections: RootLoaderData['collections'];
}) {
  const { t, i18n, ready } = useTranslation();
  const { safeT } = useSafeTranslation();
  const rootData = useRootLoader();
  const locale = rootData.locale ?? 'en';

  // Отладочная информация в development - только после mount
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      const resourceBundle = i18n.getResourceBundle(locale, 'translation');
      const translation = t('footer.company', { defaultValue: 'MISSING' });
      if (translation === 'MISSING' || translation === 'footer.company') {
        console.warn('[Footer] Translation missing for footer.company', {
          locale,
          ready,
          i18nReady: i18n.isInitialized,
          hasResources: !!resourceBundle,
          footerKeys: resourceBundle?.footer
            ? Object.keys(resourceBundle.footer)
            : [],
          footerCompanyValue: resourceBundle?.footer?.company,
          language: i18n.language,
          languages: i18n.languages,
        });
      }
    }
  }, [locale, ready, i18n, t]);

  return (
    <footer
      className="mt-24 border-t bg-gray-50"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only" suppressHydrationWarning>
        {safeT('footer.title', 'Подвал')}
      </h2>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 ">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="grid grid-cols-2 gap-8 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3
                  className="text-sm font-semibold text-gray-500 tracking-wider uppercase"
                  suppressHydrationWarning
                >
                  {safeT('footer.shop', 'Магазин')}
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {collections
                    .filter((collection) => collection.slug)
                    .map((collection) => (
                      <li key={collection.id}>
                        <Link
                          className="text-base text-gray-500 hover:text-gray-600"
                          to={'/collections/' + collection.slug}
                          prefetch="intent"
                          key={collection.id}
                        >
                          {getLocalizedCollectionName(collection, locale)}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3
                  className="text-sm font-semibold text-gray-500 tracking-wider uppercase"
                  suppressHydrationWarning
                >
                  {safeT('footer.support', 'Поддержка')}
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.support.map(({ page, href }) => (
                    <li key={page}>
                      <a
                        href={href}
                        className="text-base text-gray-500 hover:text-gray-600"
                        suppressHydrationWarning
                      >
                        {safeT(
                          `navigation.support.${page}`,
                          getSupportFallback(page),
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3
                  className="text-sm font-semibold text-gray-500 tracking-wider uppercase"
                  suppressHydrationWarning
                >
                  {safeT('footer.company', 'Компания')}
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.company.map(({ page, href }) => (
                    <li key={page}>
                      <a
                        href={href}
                        className="text-base text-gray-500 hover:text-gray-600"
                        suppressHydrationWarning
                      >
                        {safeT(
                          `navigation.company.${page}`,
                          getCompanyFallback(page),
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 xl:mt-0">
            <h3
              className="text-sm font-semibold text-gray-500 tracking-wider uppercase"
              suppressHydrationWarning
            >
              {safeT('footer.subscribeHeader', 'Подписаться на нашу рассылку')}
            </h3>
            <p
              className="mt-4 text-base text-gray-500"
              suppressHydrationWarning
            >
              {safeT(
                'footer.subscribeIntro',
                'Будьте первыми, кто узнает об эксклюзивных предложениях и скидках.',
              )}
            </p>
            <form className="mt-4 sm:flex sm:max-w-md">
              <label
                htmlFor="email-address"
                className="sr-only"
                suppressHydrationWarning
              >
                {safeT('account.emailAddress', 'Адрес электронной почты')}
              </label>
              <input
                type="email"
                name="email-address"
                id="email-address"
                autoComplete="email"
                required
                className="appearance-none min-w-0 w-full bg-white border border-gray-300 rounded-md py-2 px-4 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white focus:border-white focus:placeholder-gray-400"
                placeholder={safeT(
                  'footer.emailPlaceholder',
                  'Введите ваш email',
                )}
                suppressHydrationWarning
              />
              <div className="mt-3 rounded-md sm:mt-0 sm:ml-3 sm:flex-shrink-0">
                <button
                  type="submit"
                  className="w-full bg-primary-500 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-base font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-500"
                  suppressHydrationWarning
                >
                  {safeT('footer.subscribe', 'Подписаться')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
}
