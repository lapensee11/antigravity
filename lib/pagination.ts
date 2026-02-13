/**
 * Utilitaires et types pour la pagination
 */

export interface PaginationParams {
    page: number; // Page actuelle (0-indexed)
    pageSize: number; // Nombre d'éléments par page
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

/**
 * Calcule les informations de pagination
 */
export function calculatePagination(
    page: number,
    pageSize: number,
    total: number
): PaginatedResult<any>['pagination'] {
    const totalPages = Math.ceil(total / pageSize);
    
    return {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages - 1,
        hasPrevious: page > 0
    };
}

/**
 * Valeurs par défaut pour la pagination
 */
export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

/**
 * Hook pour gérer l'état de pagination dans les composants
 */
export function usePaginationState(initialPageSize: number = DEFAULT_PAGE_SIZE) {
    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(initialPageSize);

    const reset = () => {
        setPage(0);
    };

    const goToPage = (newPage: number) => {
        setPage(Math.max(0, newPage));
    };

    const nextPage = () => {
        setPage(prev => prev + 1);
    };

    const previousPage = () => {
        setPage(prev => Math.max(0, prev - 1));
    };

    const changePageSize = (newPageSize: number) => {
        setPageSize(newPageSize);
        setPage(0); // Reset à la première page
    };

    return {
        page,
        pageSize,
        setPage: goToPage,
        nextPage,
        previousPage,
        changePageSize,
        reset
    };
}

// Note: React import sera ajouté dans le composant qui utilise ce hook
