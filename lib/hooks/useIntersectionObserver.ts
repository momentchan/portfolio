import { useRef, useEffect, useCallback, useState } from 'react';

interface UseIntersectionObserverOptions {
  rootMargin?: string;
  threshold?: number | number[];
  disabled?: boolean;
}

export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const { rootMargin = '50px', threshold = [0, 0.1, 0.5, 1], disabled = false } = options;
  
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const itemRefs = useRef<Record<string, T | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setItemRef = useCallback((slug: string) => (element: T | null) => {
    itemRefs.current[slug] = element;
  }, []);

  const setupObserver = useCallback(() => {
    if (disabled || observerRef.current) {
      return observerRef.current;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        setVisibleItems(prev => {
          const newVisibleItems = new Set(prev);
          
          entries.forEach((entry) => {
            const itemId = entry.target.getAttribute('data-project-slug') || entry.target.getAttribute('data-item-id');
            if (!itemId) return;

            if (entry.isIntersecting) {
              newVisibleItems.add(itemId);
            } else {
              newVisibleItems.delete(itemId);
            }
          });

          return newVisibleItems;
        });
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    return observerRef.current;
  }, [disabled, rootMargin, threshold]);

  const observeItems = useCallback((itemIds: string[]) => {
    const observer = setupObserver();
    if (!observer) return;

    // Disconnect existing observations
    observer.disconnect();

    // Observe new items
    itemIds.forEach(id => {
      const element = itemRefs.current[id];
      if (element) {
        // Don't override existing data attributes, just observe
        observer.observe(element);
      }
    });
  }, [setupObserver]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    visibleItems,
    setItemRef,
    observeItems,
    isItemVisible: useCallback((id: string) => visibleItems.has(id), [visibleItems]),
  };
}
