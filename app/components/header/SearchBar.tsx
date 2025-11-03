import { Form } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

export function SearchBar() {
  const { t, ready } = useTranslation();

  let initialQuery = '';
  if (typeof window === 'undefined') {
    // running in a server environment
  } else {
    // running in a browser environment
    initialQuery = new URL(window.location.href).searchParams.get('q') ?? '';
  }

  // Получаем placeholder безопасным способом для предотвращения hydration mismatch
  const getPlaceholder = () => {
    if (ready) {
      const translation = t('common.search', { defaultValue: 'Поиск' });
      return translation === 'common.search' ? 'Поиск' : translation;
    }
    return 'Поиск';
  };

  return (
    <Form method="get" action="/search" key={initialQuery}>
      <input
        type="search"
        name="q"
        defaultValue={initialQuery}
        placeholder={getPlaceholder()}
        suppressHydrationWarning
        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
      />
    </Form>
  );
}
