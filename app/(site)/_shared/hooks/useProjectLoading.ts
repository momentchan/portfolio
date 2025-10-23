import { useState, useEffect, useCallback } from 'react';

interface UseProjectLoadingOptions {
  maxInitialLoad?: number;
  staggerDelay?: number;
  maxStaggerDelay?: number;
  fallbackTimeout?: number;
}

export function useProjectLoading(options: UseProjectLoadingOptions = {}) {
  const {
    maxInitialLoad = 6,
    staggerDelay = 150,
    maxStaggerDelay = 2000,
    fallbackTimeout = 10000,
  } = options;

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoadingState = useCallback((projectSlug: string, isLoading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [projectSlug]: isLoading }));
  }, []);

  const isProjectLoading = useCallback((projectSlug: string) => {
    return loadingStates[projectSlug] !== false;
  }, [loadingStates]);

  const shouldLoadProject = useCallback((projectSlug: string) => {
    return loadingStates[projectSlug] !== undefined;
  }, [loadingStates]);

  const initializeLoading = useCallback((
    projects: Array<{ slug: string }>,
    visibleItems: Set<string>
  ) => {
    const timeouts: NodeJS.Timeout[] = [];

    projects.forEach((project, index) => {
      const isVisibleItem = visibleItems.has(project.slug);
      const isFirstFew = index < maxInitialLoad;

      if (isVisibleItem || isFirstFew) {
        // Load immediately - check if not already set
        setLoadingStates(prev => {
          if (prev[project.slug] === undefined) {
            return { ...prev, [project.slug]: true };
          }
          return prev;
        });
      } else {
        // Delay loading for non-visible items
        const delay = Math.min(maxStaggerDelay, (index - maxInitialLoad) * staggerDelay);
        const timeout = setTimeout(() => {
          setLoadingStates(prev => {
            if (prev[project.slug] === undefined) {
              return { ...prev, [project.slug]: true };
            }
            return prev;
          });
        }, delay);
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [maxInitialLoad, staggerDelay, maxStaggerDelay]);

  // Fallback timeout for stuck loading states
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    Object.keys(loadingStates).forEach(slug => {
      if (loadingStates[slug] === true) {
        const timeout = setTimeout(() => {
          setLoadingStates(prev => {
            if (prev[slug] === true) {
              return { ...prev, [slug]: false };
            }
            return prev;
          });
        }, fallbackTimeout);
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [loadingStates, fallbackTimeout]);

  return {
    loadingStates,
    setLoadingState,
    isProjectLoading,
    shouldLoadProject,
    initializeLoading,
  };
}
