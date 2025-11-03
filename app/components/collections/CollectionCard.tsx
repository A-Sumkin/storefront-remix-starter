import { Link } from '@remix-run/react';
import { CollectionsQuery, LanguageCode } from '~/generated/graphql';
import { useRootLoader } from '~/utils/use-root-loader';
import { debugCollection } from '~/utils/debug-collections';

/**
 * Получает локализованное название из translations или использует name
 */
function getLocalizedName(
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

  // Debug logging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('Collection localization:', {
      collectionName: collection.name,
      locale,
      targetLang,
      currentLanguageCode: collection.languageCode,
      translationsCount: collection.translations?.length ?? 0,
      translations: collection.translations?.map((t) => ({
        languageCode: t.languageCode,
        name: t.name,
      })),
    });
  }

  // Vendure может автоматически возвращать локализованный name через Accept-Language заголовок
  // Если currentLanguageCode совпадает с целевым языком, значит name уже локализован
  if (collection.languageCode === targetLang) {
    return collection.name;
  }

  // Если currentLanguageCode не совпадает, но мы запрашиваем другой язык,
  // возможно Vendure всё равно вернул локализованный name, просто с другим languageCode
  // Проверяем, есть ли в translations нужный язык
  if (collection.translations && collection.translations.length > 0) {
    const translation = collection.translations.find(
      (t) => t.languageCode === targetLang,
    );
    if (translation) {
      console.log('[Collection] Found translation:', translation.name, 'for', targetLang);
      return translation.name;
    } else {
      // Если перевода нет в translations, но мы запрашиваем другой язык,
      // возможно name уже локализован через Accept-Language
      // В этом случае возвращаем name, даже если languageCode не совпадает
      console.log('[Collection] No translation in array, using name:', collection.name);
      return collection.name;
    }
  }

  // Fallback: возвращаем name (может быть уже локализован через Accept-Language)
  return collection.name;
}

export function CollectionCard({
  collection,
}: {
  collection: CollectionsQuery['collections']['items'][number];
}) {
  const rootData = useRootLoader();
  const locale = rootData.locale ?? 'en';
  
  // Debug: проверяем что приходит от API
  debugCollection(collection, `CollectionCard-${collection.name}`);
  
  const localizedName = getLocalizedName(collection, locale);
  const slug = collection.slug;

  if (!slug) {
    return null;
  }

  return (
    <Link
      to={'/collections/' + slug}
      prefetch="intent"
      key={collection.id}
      className="max-w-[300px] relative rounded-lg overflow-hidden hover:opacity-75 xl:w-auto"
    >
      <span aria-hidden="true" className="">
        <div className="w-full h-full object-center object-cover">
          <img src={collection.featuredAsset?.preview + '?w=300&h=300'} />
        </div>
      </span>
      <span
        aria-hidden="true"
        className="absolute w-full bottom-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gray-800 opacity-50"
      />
      <span className="absolute w-full bottom-2 mt-auto text-center text-xl font-bold text-white">
        {localizedName}
      </span>
    </Link>
  );
}
