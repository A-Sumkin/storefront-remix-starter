import { DocumentNode, print } from 'graphql';
import { API_URL } from './constants';
import { getSdk } from './generated/graphql';
import { getSessionStorage } from './sessions';
import { getI18NextServer } from './i18next.server';

export interface QueryOptions {
  request: Request;
  locale?: string;
}

export interface GraphqlResponse<Response> {
  errors: any[];
  data: Response;
}

export type WithHeaders<T> = T & { _headers: Headers };

const AUTH_TOKEN_SESSION_KEY = 'authToken';

/**
 * Маппинг локали приложения в код языка для Vendure API
 */
function mapLocaleToLanguageCode(locale: string | undefined): string {
  // Маппинг локалей приложения в Vendure LanguageCode
  const localeMap: Record<string, string> = {
    en: 'en',
    es: 'es',
    pt: 'pt',
    'pt-BR': 'pt_BR',
    ru: 'ru',
  };

  if (!locale) {
    return 'en'; // Fallback на английский
  }

  // Проверяем точное совпадение
  if (localeMap[locale]) {
    return localeMap[locale];
  }

  // Проверяем базовую локаль (например, 'ru-RU' -> 'ru')
  const baseLocale = locale.split('-')[0];
  if (localeMap[baseLocale]) {
    return localeMap[baseLocale];
  }

  return 'en'; // Fallback
}

async function sendQuery<Response, Variables = {}>(options: {
  query: string;
  variables?: Variables;
  headers?: Headers;
  request?: Request;
  locale?: string;
}): Promise<GraphqlResponse<Response> & { headers: Headers }> {
  const headers = new Headers(options.headers);
  const req = options.request;
  headers.append('Content-Type', 'application/json');
  
  // Определяем локаль, если она не передана
  let locale = options.locale;
  if (!locale && req) {
    locale = await getI18NextServer().then((i18next) =>
      i18next.getLocale(req),
    );
  }
  
  // Добавляем заголовок Accept-Language для локализации в Vendure
  // Vendure использует формат LanguageCode enum (например, ru, en, es)
  // Согласно документации Vendure, заголовок должен быть в формате ISO 639-1
  if (locale) {
    const languageCode = mapLocaleToLanguageCode(locale);
    // Для Vendure достаточно просто кода языка без региона
    headers.append('Accept-Language', languageCode);
    
    // Debug logging
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[GraphQL] Setting Accept-Language:', languageCode, 'for locale:', locale);
      console.log('[GraphQL] Request URL:', API_URL);
    }
  }

  const session = await getSessionStorage().then((sessionStorage) =>
    sessionStorage.getSession(options.request?.headers.get('Cookie')),
  );
  if (session) {
    // If we have a vendure auth token stored in the Remix session, then we
    // add it as a bearer token to the API request being sent to Vendure.
    const token = session.get(AUTH_TOKEN_SESSION_KEY);
    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    }
  }

  return fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(options),
    headers,
  }).then(async (res) => {
    const response = await res.json();
    
    // Debug logging для проверки ответа API
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      if (response.data?.collections?.items?.[0]) {
        const firstCollection = response.data.collections.items[0];
        console.log('[GraphQL Response] Collections sample:', {
          name: firstCollection.name,
          languageCode: firstCollection.languageCode,
          translations: firstCollection.translations?.map((t: any) => ({
            languageCode: t.languageCode,
            name: t.name,
          })),
          allTranslationsCount: firstCollection.translations?.length ?? 0,
        });
      }
      // Логируем заголовки запроса
      console.log('[GraphQL Request] Headers:', {
        'Accept-Language': headers.get('Accept-Language'),
        'Content-Type': headers.get('Content-Type'),
      });
    }
    
    return {
      ...response,
      headers: res.headers,
    };
  });
}

const baseSdk = getSdk<QueryOptions, unknown>(requester);

type Sdk = typeof baseSdk;
type SdkWithHeaders = {
  [k in keyof Sdk]: (
    ...args: Parameters<Sdk[k]>
  ) => Promise<Awaited<ReturnType<Sdk[k]>> & { _headers: Headers }>;
};

export const sdk: SdkWithHeaders = baseSdk as any;

function requester<R, V>(
  doc: DocumentNode,
  vars?: V,
  options?: { headers?: Headers; request?: Request; locale?: string },
): Promise<R & { _headers: Headers }> {
  return sendQuery<R, V>({
    query: print(doc),
    variables: vars,
    ...options,
  }).then(async (response) => {
    const token = response.headers.get('vendure-auth-token');
    const headers: Record<string, string> = {};
    if (token) {
      // If Vendure responded with an auth token, it means a new Vendure session
      // has started. In this case, we will store that auth token in the Remix session
      // so that we can attach it as an Authorization header in all subsequent requests.
      const sessionStorage = await getSessionStorage();
      const session = await sessionStorage.getSession(
        options?.request?.headers.get('Cookie'),
      );
      if (session) {
        session.set(AUTH_TOKEN_SESSION_KEY, token);
        headers['Set-Cookie'] = await sessionStorage.commitSession(session);
      }
    }
    headers['x-vendure-api-url'] = API_URL;
    if (response.errors) {
      console.log(
        response.errors[0].extensions?.exception?.stacktrace.join('\n') ??
          response.errors,
      );
      throw new Error(JSON.stringify(response.errors[0]));
    }
    return { ...response.data, _headers: new Headers(headers) };
  });
}
