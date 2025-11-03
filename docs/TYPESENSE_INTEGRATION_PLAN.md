# План интеграции Typesense в Remix Storefront

## Обзор
Интеграция Typesense заменит текущий поиск через Vendure GraphQL API на полнотекстовый поиск с улучшенными возможностями.

**Архитектура:**
- Typesense работает как отдельный сервис в Docker
- Vendure синхронизирует данные с Typesense (через plugin или webhook)
- Remix приложение делает запросы в Typesense через SearchBar компонент

## Текущая архитектура поиска
- **Route**: `/search` (`app/routes/search.tsx`)
- **Loader**: `filteredSearchLoaderFromPagination` (`app/utils/filtered-search-loader.ts`)
- **Provider**: `search()` из `app/providers/products/products.ts`
- **API**: Vendure GraphQL `search` query
- **Функции**: Поиск по тексту, фильтры по facet values, пагинация

## Этапы интеграции

### Этап 0: Настройка Typesense в Docker
**Цель**: Развернуть Typesense как отдельный сервис

1. **Создание docker-compose.yml или добавление в существующий**
   ```yaml
   services:
     typesense:
       image: typesense/typesense:0.25.2
       ports:
         - "8108:8108"
       volumes:
         - typesense-data:/data
       command: '--data-dir /data --api-key=${TYPESENSE_API_KEY} --enable-cors'
       environment:
         - TYPESENSE_API_KEY=${TYPESENSE_API_KEY}
   ```

2. **Настройка переменных окружения**
   - Добавить в `.env`:
     ```
     TYPESENSE_HOST=localhost
     TYPESENSE_PORT=8108
     TYPESENSE_PROTOCOL=http
     TYPESENSE_API_KEY=xyz  # сгенерировать безопасный ключ
     TYPESENSE_ENABLED=true
     ```

3. **Запуск Typesense**
   ```bash
   docker-compose up -d typesense
   ```

### Этап 1: Установка клиента в Remix
**Цель**: Подключение Remix приложения к Typesense

4. **Установка зависимостей**
   ```bash
   yarn add typesense
   ```

5. **Создание конфигурации**
   - `app/utils/typesense-config.ts` - конфигурация клиента Typesense
   - `app/constants.ts` - добавить константы для Typesense

### Этап 2: Создание Typesense коллекции (схема)
**Цель**: Определить структуру индексируемых данных

4. **Определение схемы коллекции**
   - Создать `app/utils/typesense-schema.ts`
   - Поля для индексации:
     - `id` (string, facet: false)
     - `name` (string, facet: false, sort: true)
     - `slug` (string, facet: false)
     - `description` (string, facet: false)
     - `priceWithTax` (float32, facet: true, sort: true)
     - `currencyCode` (string, facet: true)
     - `collectionId` (string[], facet: true)
     - `collectionSlug` (string[], facet: true)
     - `facetValues` (object[], facet: true) - для фильтрации
     - `productAsset` (object, facet: false)
     - `stockLevel` (string, facet: true)
     - `languageCode` (string, facet: true) - для локализации

5. **Создание коллекции**
   - Функция для инициализации коллекции
   - Проверка существования коллекции
   - Создание при отсутствии

### Этап 3: Интеграция Vendure с Typesense (синхронизация)
**Цель**: Настроить синхронизацию данных Vendure → Typesense

6. **Варианты интеграции с Vendure:**

   **Вариант A: Vendure Plugin (рекомендуется)**
   - Создать кастомный Vendure plugin
   - Хук на события изменения продуктов (ProductEvent)
   - Автоматическая синхронизация при создании/обновлении/удалении
   - Локация: `vendure-example/src/plugins/typesense-plugin.ts`

   **Вариант B: Отдельный сервис синхронизации**
   - Отдельный Node.js сервис, слушает Vendure webhooks
   - Или периодически опрашивает Vendure API
   - Локация: `services/typesense-sync/`

   **Вариант C: Скрипт в Remix (для начала)**
   - `scripts/sync-vendure-to-typesense.ts`
   - Ручной запуск для первичной синхронизации
   - Можно запускать периодически через cron

7. **Реализация синхронизации (начнем с варианта C)**
   - Функции:
     - `fetchAllProductsFromVendure()` - загрузка через GraphQL
     - `transformProductForTypesense(product)` - преобразование формата
     - `indexProductInTypesense(document)` - индексация
     - `syncAllProducts()` - полная синхронизация
     - `updateProduct(product)` - обновление
     - `deleteProduct(productId)` - удаление

8. **Обработка локализации**
   - Индексировать продукты на всех доступных языках
   - Добавлять `languageCode` в документы
   - При поиске фильтровать по текущей локали
   - Использовать `Accept-Language` header как в текущей реализации

### Этап 4: Создание Typesense search service
**Цель**: Абстракция для поиска через Typesense

9. **Создание сервиса поиска**
   - `app/utils/typesense-search.ts` или `app/services/typesense-search.ts`
   - Функции:
     - `searchProducts(params)` - основной поиск
     - `searchFacets(params)` - поиск с фильтрами
     - Преобразование параметров поиска Vendure → Typesense
     - Преобразование результатов Typesense → формат Vendure

10. **Поддержка фильтров и пагинации**
    - Facet filters (facetValues)
    - Collection filters
    - Price range
    - Sorting
    - Pagination (offset/limit)

### Этап 5: Интеграция SearchBar с Typesense
**Цель**: Подключить SearchBar к Typesense для поиска в реальном времени

11. **Создание API route для поиска**
    - `app/routes/api.typesense-search.tsx` - API endpoint для поиска
    - Принимает запрос из SearchBar
    - Выполняет поиск в Typesense
    - Возвращает результаты в формате, совместимом с текущим

12. **Обновление SearchBar компонента**
    - Добавить обработку поиска через Typesense
    - Вариант A: Поиск при отправке формы (текущее поведение)
    - Вариант B: Live search (поиск при вводе, опционально)
    - Сохранить совместимость с существующим `/search` route

13. **Обновление search route (опционально)**
    - Если используется Typesense, переключить `filtered-search-loader` на Typesense
    - Или оставить текущую реализацию как fallback
    - Feature toggle для переключения

14. **Маппинг результатов**
    - Преобразовать результаты Typesense в формат `SearchResult`
    - Обеспечить совместимость с `FilterableProductGrid`
    - Обработать facet values для фильтров

### Этап 6: Дополнительные возможности (опционально)
**Цель**: Улучшить UX поиска

14. **Автодополнение (Typeahead)**
    - API endpoint `/api/search/suggestions`
    - Компонент `SearchSuggestions.tsx`
    - Интеграция в `SearchBar.tsx`

15. **Поисковые подсказки**
    - Популярные запросы
    - "Did you mean..." для опечаток
    - Релевантность результатов

16. **Аналитика**
    - Логирование популярных запросов
    - Статистика поиска
    - Оптимизация на основе данных

## Структура файлов после интеграции

```
app/
├── services/
│   ├── typesense-client.ts       # Typesense клиент
│   ├── typesense-schema.ts       # Схема коллекции
│   ├── typesense-sync.ts          # Синхронизация данных
│   └── typesense-search.ts       # Сервис поиска
├── utils/
│   └── typesense-config.ts       # Конфигурация
├── routes/
│   └── api.search-suggestions.tsx # API для автодополнения (опционально)
└── scripts/
    └── sync-typesense.ts          # Скрипт синхронизации
```

## Проверка и тестирование

17. **Unit тесты**
    - Тесты сервиса синхронизации
    - Тесты сервиса поиска
    - Тесты маппинга данных

18. **Интеграционные тесты**
    - Проверка работы поиска end-to-end
    - Проверка фильтров
    - Проверка пагинации

19. **Производительность**
    - Бенчмарки поиска
    - Сравнение с Vendure search
    - Оптимизация индексов

## Миграция и развертывание

20. **Стратегия миграции**
    - Флаг feature toggle для постепенного включения
    - Возможность переключения обратно на Vendure search
    - Мониторинг ошибок

21. **Документация**
    - Обновить README.md
    - Документация API поиска
    - Инструкции по синхронизации

## Риски и решения

**Риск 1**: Расхождение данных между Vendure и Typesense
- **Решение**: Регулярная синхронизация, обработка изменений в реальном времени

**Риск 2**: Производительность при большом объеме данных
- **Решение**: Индексация в фоне, оптимизация схемы

**Риск 3**: Локализация
- **Решение**: Индексировать все языки, фильтровать по текущей локали

**Риск 4**: Сложность поддержки двух систем поиска
- **Решение**: Абстракция через единый интерфейс, feature toggle

## Приоритеты реализации

**Высокий приоритет** (MVP):
- Этап 1: Установка и настройка
- Этап 2: Схема коллекции
- Этап 3: Базовая синхронизация
- Этап 4: Сервис поиска
- Этап 5: Интеграция в search loader

**Средний приоритет**:
- Этап 6.1: Автодополнение
- Улучшение синхронизации

**Низкий приоритет**:
- Аналитика
- Расширенные возможности поиска

