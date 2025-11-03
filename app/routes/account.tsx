import {
  HashtagIcon,
  MapPinIcon,
  ShoppingBagIcon,
  UserCircleIcon,
} from '@heroicons/react/24/solid';
import { Form, Outlet, useLoaderData, useMatches } from '@remix-run/react';
import { DataFunctionArgs, json, redirect } from '@remix-run/server-runtime';
import { TabProps } from '~/components/tabs/Tab';
import { TabsContainer } from '~/components/tabs/TabsContainer';
import { getActiveCustomerDetails } from '~/providers/customer/customer';
import { useTranslation } from 'react-i18next';

export async function loader({ request }: DataFunctionArgs) {
  const { activeCustomer } = await getActiveCustomerDetails({ request });
  if (!activeCustomer) {
    return redirect('/sign-in');
  }
  return json({ activeCustomer });
}

export default function AccountDashboard() {
  const { activeCustomer } = useLoaderData<typeof loader>();
  const { firstName, lastName } = activeCustomer!;
  const { t, ready } = useTranslation();

  // Получаем переводы безопасным способом для предотвращения hydration mismatch
  const getMyAccountText = () => {
    if (ready) {
      const translation = t('account.myAccount', { defaultValue: 'Мой аккаунт' });
      return translation === 'account.myAccount' ? 'Мой аккаунт' : translation;
    }
    return 'Мой аккаунт';
  };

  const getWelcomeBackText = () => {
    if (ready) {
      const translation = t('account.welcomeBack', { defaultValue: 'С возвращением' });
      return translation === 'account.welcomeBack' ? 'С возвращением' : translation;
    }
    return 'С возвращением';
  };

  const getSignOutText = () => {
    if (ready) {
      const translation = t('account.signOut', { defaultValue: 'Выйти' });
      return translation === 'account.signOut' ? 'Выйти' : translation;
    }
    return 'Выйти';
  };

  // Функции для безопасного получения переводов для вкладок
  const getTabText = (key: string, fallback: string) => {
    if (ready) {
      const translation = t(key, { defaultValue: fallback });
      return translation.startsWith('account.') ? fallback : translation;
    }
    return fallback;
  };

  const tabs: TabProps[] = [
    {
      Icon: UserCircleIcon,
      text: getTabText('account.details', 'Данные аккаунта'),
      to: './',
    },
    {
      Icon: ShoppingBagIcon,
      text: getTabText('account.purchaseHistory', 'История покупок'),
      to: './history',
    },
    {
      Icon: MapPinIcon,
      text: getTabText('account.addresses', 'Адреса'),
      to: './addresses',
    },
    {
      Icon: HashtagIcon,
      text: getTabText('account.password', 'Пароль'),
      to: './password',
    },
  ];

  return (
    <div className="max-w-6xl xl:mx-auto px-4">
      <h2 
        className="text-3xl sm:text-5xl font-light text-gray-900 my-8"
        suppressHydrationWarning
      >
        {getMyAccountText()}
      </h2>
      <p 
        className="text-gray-700 text-lg -mt-4"
        suppressHydrationWarning
      >
        {getWelcomeBackText()}, {firstName} {lastName}
      </p>
      <Form method="post" action="/api/logout">
        <button
          type="submit"
          className="underline text-primary-600 hover:text-primary-800"
          suppressHydrationWarning
        >
          {getSignOutText()}
        </button>
      </Form>
      <TabsContainer tabs={tabs}>
        <Outlet></Outlet>
      </TabsContainer>
    </div>
  );
}
