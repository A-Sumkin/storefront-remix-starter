/**
 * Debug utility для проверки данных коллекций
 */
export function debugCollection(collection: any, label: string = 'Collection') {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG ${label}]`, {
      id: collection?.id,
      name: collection?.name,
      slug: collection?.slug,
      languageCode: collection?.languageCode,
      hasTranslations: !!collection?.translations,
      translationsCount: collection?.translations?.length ?? 0,
      translations: collection?.translations,
      fullCollection: collection,
    });
  }
}

