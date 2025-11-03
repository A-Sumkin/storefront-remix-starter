import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { HomeIcon, UserIcon } from '@heroicons/react/24/solid';
import { Link } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { SearchBar } from '~/components/header/SearchBar';
import { LanguageCode } from '~/generated/graphql';
import { classNames } from '~/utils/class-names';
import { useRootLoader } from '~/utils/use-root-loader';
import { useScrollingUp } from '~/utils/use-scrolling-up';

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

export function Header({
  onCartIconClick,
  cartQuantity,
}: {
  onCartIconClick: () => void;
  cartQuantity: number;
}) {
  const data = useRootLoader();
  const isSignedIn = !!data.activeCustomer.activeCustomer?.id;
  const isScrollingUp = useScrollingUp();
  const { t, ready } = useTranslation();
  const locale = data.locale ?? 'en';

  // Получаем aria-label безопасным способом для предотвращения hydration mismatch
  const getAccountAriaLabel = () => {
    if (ready) {
      const translation = isSignedIn
        ? t('account.myAccount', { defaultValue: 'Мой аккаунт' })
        : t('account.signIn', { defaultValue: 'Войти' });
      // Если вернулся ключ вместо перевода, используем fallback
      return translation.startsWith('account.')
        ? isSignedIn
          ? 'Мой аккаунт'
          : 'Войти'
        : translation;
    }
    // Если переводы не готовы, используем fallback
    return isSignedIn ? 'Мой аккаунт' : 'Войти';
  };

  return (
    <header
      className={classNames(
        isScrollingUp ? 'sticky top-0 z-10 animate-dropIn' : '',
        'bg-gradient-to-r from-zinc-700 to-gray-900 shadow-lg transform shadow-xl',
      )}
    >
      <div className="max-w-6xl mx-auto p-4 flex items-center space-x-4">
        <h1 className="text-white">
          <Link
            to="/"
            className="flex items-center justify-center w-10 h-10 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
            aria-label="Главная"
          >
            <HomeIcon className="w-6 h-6 text-white" />
          </Link>
        </h1>
        <div className="flex space-x-4 hidden sm:block">
          {data.collections
            .filter((collection) => collection.slug)
            .map((collection) => (
              <Link
                className="text-sm md:text-base text-gray-200 hover:text-white"
                to={'/collections/' + collection.slug}
                prefetch="intent"
                key={collection.id}
              >
                {getLocalizedCollectionName(collection, locale)}
              </Link>
            ))}
        </div>
        <div className="flex-1 md:pr-8">
          <SearchBar></SearchBar>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="relative w-9 h-9 bg-white bg-opacity-20 rounded text-white p-1"
            onClick={onCartIconClick}
            aria-label="Open cart tray"
          >
            <ShoppingBagIcon></ShoppingBagIcon>
            {cartQuantity ? (
              <div className="absolute rounded-full -top-2 -right-2 bg-primary-600 min-w-6 min-h-6 flex items-center justify-center text-xs p-1">
                {cartQuantity}
              </div>
            ) : (
              ''
            )}
          </button>
          <Link
            to={isSignedIn ? '/account' : '/sign-in'}
            className="flex items-center justify-center w-9 h-9 bg-white bg-opacity-20 rounded text-white hover:text-gray-200 hover:bg-opacity-30 transition-colors"
            aria-label={getAccountAriaLabel()}
            suppressHydrationWarning
          >
            <UserIcon className="w-5 h-5"></UserIcon>
          </Link>
        </div>
      </div>
    </header>
  );
}
