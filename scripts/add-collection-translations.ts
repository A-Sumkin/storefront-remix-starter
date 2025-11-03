/**
 * Скрипт для добавления русских переводов к коллекциям через Vendure Admin API
 * 
 * Использование:
 * 1. Убедись, что Vendure запущен локально
 * 2. Обнови VENDURE_ADMIN_API_URL если нужно
 * 3. Запусти: npx tsx scripts/add-collection-translations.ts
 */

const VENDURE_ADMIN_API_URL = process.env.VENDURE_ADMIN_API_URL || 'http://localhost:3000/admin-api';

// Карта переводов: slug коллекции -> русское название
// Ключи могут быть на английском (оригинальный slug) или на русском (если slug уже переведен)
const TRANSLATIONS: Record<string, { name: string; slug: string }> = {
  // Английские ключи (оригинальные slug)
  computers: {
    name: 'Компьютеры',
    slug: 'kompyutery',
  },
  'camera-photo': {
    name: 'Фото',
    slug: 'foto',
  },
  electronics: {
    name: 'Электроника',
    slug: 'elektronika',
  },
  furniture: {
    name: 'Фурнитура',
    slug: 'furnitura',
  },
  plants: {
    name: 'Растения',
    slug: 'rasteniya',
  },
  'sports-outdoor': {
    name: 'Спорт и отдых',
    slug: 'sport-i-otdykh',
  },
  'home-garden': {
    name: 'Дом и сад',
    slug: 'dom-i-sad',
  },
  equipment: {
    name: 'Оборудование',
    slug: 'oborudovanie',
  },
  footwear: {
    name: 'Обувь',
    slug: 'obuv',
  },
  // Русские ключи (на случай если slug уже был переведен в предыдущем запуске)
  kompyutery: {
    name: 'Компьютеры',
    slug: 'kompyutery',
  },
  foto: {
    name: 'Фото',
    slug: 'foto',
  },
  elektronika: {
    name: 'Электроника',
    slug: 'elektronika',
  },
  furnitura: {
    name: 'Фурнитура',
    slug: 'furnitura',
  },
  rasteniya: {
    name: 'Растения',
    slug: 'rasteniya',
  },
  'sport-i-otdykh': {
    name: 'Спорт и отдых',
    slug: 'sport-i-otdykh',
  },
  'dom-i-sad': {
    name: 'Дом и сад',
    slug: 'dom-i-sad',
  },
  oborudovanie: {
    name: 'Оборудование',
    slug: 'oborudovanie',
  },
  obuv: {
    name: 'Обувь',
    slug: 'obuv',
  },
};

async function loginAsAdmin(): Promise<string> {
  // Vendure Admin API использует GraphQL мутацию для логина
  const mutation = `
    mutation Login($username: String!, $password: String!) {
      login(username: $username, password: $password) {
        ... on CurrentUser {
          id
        }
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `;

  const response = await fetch(`${VENDURE_ADMIN_API_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'include',
    body: JSON.stringify({
      query: mutation,
      variables: {
        username: 'superadmin',
        password: 'superadmin',
      },
    }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`Login failed: ${result.errors[0]?.message || 'Unknown error'}`);
  }

  if (result.data?.login?.errorCode) {
    throw new Error(`Login failed: ${result.data.login.message || 'Invalid credentials'}`);
  }

  // Проверяем, что логин успешен (есть CurrentUser)
  if (!result.data?.login?.id) {
    throw new Error('Login failed: No user ID returned');
  }

  // Vendure Admin API использует cookies для сессии
  // Извлекаем все cookies из response headers
  // В Node.js fetch нужно использовать другой способ
  const setCookieHeaders: string[] = [];
  
  // Получаем заголовок set-cookie
  const setCookieHeader = response.headers.get('set-cookie');
  
  if (setCookieHeader) {
    // Если это массив (может быть в некоторых реализациях)
    if (Array.isArray(setCookieHeader)) {
      for (const cookie of setCookieHeader) {
        const cookieValue = cookie.split(';')[0].trim();
        setCookieHeaders.push(cookieValue);
      }
    } else {
      // Если это строка (обычный случай)
      // Может быть несколько cookies, разделенных запятыми
      const cookies = setCookieHeader.split(',').map(c => c.trim());
      for (const cookie of cookies) {
        const cookieValue = cookie.split(';')[0].trim();
        setCookieHeaders.push(cookieValue);
      }
    }
  }
  
  // Альтернативный способ: проверяем все заголовки
  if (setCookieHeaders.length === 0) {
    const allHeaders: string[] = [];
    response.headers.forEach((value, key) => {
      allHeaders.push(`${key}: ${value}`);
      if (key.toLowerCase() === 'set-cookie') {
        const cookieValue = value.split(';')[0].trim();
        setCookieHeaders.push(cookieValue);
      }
    });
    
    if (setCookieHeaders.length === 0) {
      console.warn('⚠️  Warning: No cookies found in response headers');
      console.warn('   Available headers:', allHeaders.slice(0, 5).join(', '));
    }
  }

  // Объединяем все cookies в одну строку для передачи в заголовке
  const cookiesString = setCookieHeaders.join('; ');
  
  if (cookiesString) {
    console.log('✅ Extracted cookies:', cookiesString.substring(0, 100) + (cookiesString.length > 100 ? '...' : ''));
  } else {
    console.warn('⚠️  No cookies extracted - authorization may fail');
    console.warn('   Note: In Node.js, cookies might not work with fetch API');
    console.warn('   You may need to use a different HTTP client');
  }
  
  return cookiesString;
}

async function getCollections(cookies: string) {
  const query = `
    query {
      collections {
        items {
          id
          name
          slug
          languageCode
          translations {
            languageCode
            name
            slug
          }
          parent {
            name
          }
        }
      }
    }
  `;

  const response = await fetch(`${VENDURE_ADMIN_API_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies,
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'include',
    body: JSON.stringify({ query }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`Failed to fetch collections: ${result.errors[0]?.message || 'Unknown error'}`);
  }

  return result.data.collections.items;
}

async function updateCollectionTranslation(
  cookies: string,
  collectionId: string,
  translation: { name: string; slug: string },
) {
  const mutation = `
    mutation UpdateCollection($input: UpdateCollectionInput!) {
      updateCollection(input: $input) {
        id
        name
        slug
        translations {
          languageCode
          name
          slug
        }
      }
    }
  `;

  // Сначала получаем текущую коллекцию, чтобы не перезаписать существующие данные
  // Для обновления переводов нам нужны только базовые поля и переводы
  const getCollectionQuery = `
    query GetCollection($id: ID!) {
      collection(id: $id) {
        id
        name
        slug
        description
        featuredAsset {
          id
        }
        parent {
          id
        }
        translations {
          languageCode
          name
          slug
          description
        }
      }
    }
  `;

  const getResponse = await fetch(`${VENDURE_ADMIN_API_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies,
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'include',
    body: JSON.stringify({
      query: getCollectionQuery,
      variables: { id: collectionId },
    }),
  });

  const getResult = await getResponse.json();

  if (getResult.errors) {
    throw new Error(`Failed to fetch collection: ${getResult.errors[0]?.message || 'Unknown error'}`);
  }

  const collection = getResult.data?.collection;
  
  if (!collection) {
    throw new Error(`Collection not found: ${collectionId}`);
  }

  // Подготавливаем переводы: добавляем русский, сохраняя существующие
  const existingTranslations = collection.translations || [];
  const ruTranslationExists = existingTranslations.some(
    (t: any) => t.languageCode === 'ru',
  );

  const translations = [...existingTranslations];
  if (!ruTranslationExists) {
    translations.push({
      languageCode: 'ru',
      name: translation.name,
      slug: translation.slug,
      description: collection.description || '',
    });
  } else {
    // Обновляем существующий русский перевод
    const ruIndex = translations.findIndex((t: any) => t.languageCode === 'ru');
    translations[ruIndex] = {
      ...translations[ruIndex],
      name: translation.name,
      slug: translation.slug,
      description: translations[ruIndex].description || collection.description || '',
    };
  }

  // Подготавливаем input для мутации updateCollection
  // Для updateCollection нужно использовать только те поля, которые можно обновить
  const updateInput: any = {
    id: collectionId,
    translations,
  };

  // Добавляем featuredAssetId если есть
  if (collection.featuredAsset?.id) {
    updateInput.featuredAssetId = collection.featuredAsset.id;
  }

  // Добавляем parentId если есть
  if (collection.parent?.id) {
    updateInput.parentId = collection.parent.id;
  }

  const variables = {
    input: updateInput,
  };

  const response = await fetch(`${VENDURE_ADMIN_API_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies,
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'include',
    body: JSON.stringify({
      query: mutation,
      variables,
    }),
  });

  const result = await response.json();

  if (result.errors) {
    console.error('❌ Error updating collection:', result.errors);
    console.error('   Error details:', JSON.stringify(result.errors, null, 2));
    return null;
  }

  if (!result.data?.updateCollection) {
    console.error('❌ No data returned from updateCollection mutation');
    console.error('   Response:', JSON.stringify(result, null, 2));
    return null;
  }

  return result.data.updateCollection;
}

async function main() {
  console.log('🔐 Logging in to Vendure Admin API...');
  const cookies = await loginAsAdmin();
  console.log('✅ Logged in successfully\n');

  console.log('📦 Fetching collections...');
  const collections = await getCollections(cookies);
  console.log(`✅ Found ${collections.length} collections\n`);

  console.log('🌍 Adding Russian translations...\n');

  for (const collection of collections) {
    // Сначала ищем перевод в объекте TRANSLATIONS
    // Ищем по slug коллекции
    let translationKey = collection.slug;
    
    // Если текущий languageCode не английский, ищем английский slug в translations
    if (collection.languageCode !== 'en' && collection.translations) {
      const enTranslation = collection.translations.find((t: any) => t.languageCode === 'en');
      if (enTranslation && enTranslation.slug) {
        translationKey = enTranslation.slug;
      }
    }
    
    // Пробуем найти перевод по разным ключам
    let translation = TRANSLATIONS[translationKey];
    
    // Если не нашли, пробуем по текущему slug (может быть русский)
    if (!translation) {
      translation = TRANSLATIONS[collection.slug];
    }
    
    // Если не нашли и текущий язык английский, пробуем по названию
    if (!translation && collection.languageCode === 'en') {
      const nameKey = collection.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      translation = TRANSLATIONS[nameKey];
    }

    // Проверяем, есть ли уже русский перевод
    const hasRuTranslation = collection.translations?.some(
      (t: any) => t.languageCode === 'ru',
    );

    // Если перевод уже есть, пропускаем (не нужно добавлять заново)
    if (hasRuTranslation) {
      console.log(`ℹ️  "${collection.name}" already has Russian translation`);
      continue;
    }

    // Если не нашли перевод в объекте TRANSLATIONS, пропускаем
    if (!translation) {
      console.log(`⏭️  Skipping "${collection.name}" (slug: ${collection.slug}, lang: ${collection.languageCode}) - no translation defined`);
      const triedKeys = [
        translationKey,
        collection.slug,
        collection.languageCode === 'en' ? collection.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'N/A'
      ].filter(Boolean);
      console.log(`   Tried keys: ${triedKeys.join(', ')}`);
      continue;
    }

    console.log(`🔄 Adding Russian translation to "${collection.name}"...`);
    const updated = await updateCollectionTranslation(
      cookies,
      collection.id,
      translation,
    );

    if (updated) {
      console.log(`✅ Added translation: "${translation.name}"`);
    } else {
      console.log(`❌ Failed to add translation for "${collection.name}"`);
    }
    console.log('');
  }

  console.log('✨ Done!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

