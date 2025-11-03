/**
 * Временный компонент для отладки - показывает что приходит от API
 * Использовать в development режиме
 */
import { useRootLoader } from '~/utils/use-root-loader';

export function CollectionsDebugInfo() {
  const rootData = useRootLoader();
  
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        fontSize: '12px',
        maxWidth: '300px',
        zIndex: 9999,
      }}
    >
      <strong>Debug Info:</strong>
      <div>Locale: {rootData.locale}</div>
      <div>Collections count: {rootData.collections?.length ?? 0}</div>
      <details>
        <summary>Collections data</summary>
        <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '200px' }}>
          {JSON.stringify(
            rootData.collections?.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              languageCode: c.languageCode,
              hasTranslations: !!c.translations,
              translationsCount: c.translations?.length ?? 0,
            })),
            null,
            2,
          )}
        </pre>
      </details>
    </div>
  );
}

