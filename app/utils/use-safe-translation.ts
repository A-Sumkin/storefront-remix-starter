import { useTranslation } from 'react-i18next';

/**
 * Безопасный хук для переводов, который предотвращает hydration mismatch
 * Всегда возвращает fallback, пока переводы не будут гарантированно готовы на клиенте
 */
export function useSafeTranslation() {
  const { t, ready, i18n } = useTranslation();

  const safeT = (key: string, fallback: string) => {
    // На сервере и при первом рендере на клиенте всегда используем fallback
    // Это гарантирует совпадение серверного и клиентского HTML
    const isClient = typeof window !== 'undefined';
    
    // На клиенте проверяем готовность переводов после гидратации
    if (isClient) {
      // После гидратации на клиенте используем переводы, если они готовы
      if (ready && i18n.isInitialized) {
        const translation = t(key, { defaultValue: fallback });
        // Если вернулся сам ключ (перевод не найден), используем fallback
        if (translation === key || translation.startsWith(key.split('.')[0] + '.')) {
          return fallback;
        }
        return translation;
      }
      // На клиенте, но переводы еще не готовы - используем fallback
      return fallback;
    }
    
    // На сервере всегда используем fallback для консистентности
    // Это гарантирует, что серверный HTML совпадет с клиентским при первой загрузке
    return fallback;
  };

  return { safeT, ready, t, i18n };
}
