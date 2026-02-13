import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getArticles, saveArticle, deleteArticle,
    getInvoices, saveInvoice, deleteInvoice,
    getInvoicesPaginated, getArticlesPaginated,
    getEmployees, saveEmployee, deleteEmployee,
    getFamilies, saveFamily, deleteFamily,
    getSubFamilies, saveSubFamily, deleteSubFamily,
    getAccountingAccounts, saveAccountingAccount, deleteAccountingAccount,
    getTiers,
    getSettings, saveSetting,
    getPartners, savePartner, deletePartner,
    getRecipes, saveRecipe, deleteRecipe,
    invalidateRecipeCache
} from "@/lib/data-service";
import { InvoiceStatus } from "@/lib/types";
import { keepPreviousData } from "@tanstack/react-query";
import { Article, Invoice, StaffMember, Family, SubFamily, Recipe } from "@/lib/types";

// --- ARTICLES ---
export function useArticles() {
    return useQuery({
        queryKey: ["articles"],
        queryFn: getArticles,
    });
}

export interface UseArticlesPaginatedParams {
    page: number;
    pageSize?: number;
    filters?: {
        subFamilyId?: string;
        familyId?: string;
        typeId?: string;
        searchQuery?: string;
    };
}

export function useArticlesPaginated(params: UseArticlesPaginatedParams) {
    const { page, pageSize = 50, filters } = params;
    
    return useQuery({
        queryKey: ["articles", "paginated", page, pageSize, filters],
        queryFn: () => getArticlesPaginated(page, pageSize, filters),
        keepPreviousData: true,
        staleTime: 30 * 1000,
    });
}

export function useArticleMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: saveArticle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["articles"] });
        },
    });
}

export function useArticleDeletion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteArticle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["articles"] });
        },
    });
}

// --- FAMILIES & STRUCTURE ---
export function useFamilies() {
    return useQuery({
        queryKey: ["families"],
        queryFn: getFamilies,
        retry: 2, // Retry on failure
        retryDelay: 1000, // Wait 1s between retries
    });
}

export function useFamilyMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: saveFamily,
        onMutate: async (newFamily) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["families"] });
            
            // Snapshot previous value
            const previousFamilies = queryClient.getQueryData<Family[]>(["families"]) || [];
            
            // Optimistically update
            queryClient.setQueryData<Family[]>(["families"], (old = []) => {
                const existingIndex = old.findIndex(f => f.id === newFamily.id);
                if (existingIndex >= 0) {
                    // Update existing
                    const updated = [...old];
                    updated[existingIndex] = newFamily;
                    return updated;
                } else {
                    // Add new
                    return [...old, newFamily];
                }
            });
            
            return { previousFamilies };
        },
        onError: (err, newFamily, context) => {
            // Rollback on error
            if (context?.previousFamilies) {
                queryClient.setQueryData(["families"], context.previousFamilies);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["families"] });
        },
    });
}

export function useFamilyDeletion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteFamily,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["families"] });
            await queryClient.cancelQueries({ queryKey: ["subFamilies"] });
            
            const previousFamilies = queryClient.getQueryData<Family[]>(["families"]) || [];
            const previousSubFamilies = queryClient.getQueryData<SubFamily[]>(["subFamilies"]) || [];
            
            // Optimistically remove
            queryClient.setQueryData<Family[]>(["families"], (old = []) => 
                old.filter(f => f.id !== id)
            );
            
            // Also remove sub-families that belong to this family
            queryClient.setQueryData<SubFamily[]>(["subFamilies"], (old = []) => 
                old.filter(s => {
                    const family = previousFamilies.find(f => f.id === id);
                    return !family || s.familyId !== id;
                })
            );
            
            return { previousFamilies, previousSubFamilies };
        },
        onError: (err, id, context) => {
            if (context?.previousFamilies) {
                queryClient.setQueryData(["families"], context.previousFamilies);
            }
            if (context?.previousSubFamilies) {
                queryClient.setQueryData(["subFamilies"], context.previousSubFamilies);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["families"] });
            queryClient.invalidateQueries({ queryKey: ["subFamilies"] });
        },
    });
}

export function useSubFamilies() {
    return useQuery({
        queryKey: ["subFamilies"],
        queryFn: getSubFamilies,
        retry: 2,
        retryDelay: 1000,
    });
}

/**
 * Optimized hook to load sub-families for a specific family
 * Only loads when needed (lazy loading)
 */
export function useSubFamiliesByFamily(familyId: string | null) {
    return useQuery({
        queryKey: ["subFamilies", familyId],
        queryFn: async () => {
            if (!familyId) return [];
            const { db } = await import("@/lib/db");
            return await db.subFamilies.where('familyId').equals(familyId).toArray();
        },
        enabled: !!familyId, // Only fetch when familyId is provided
    });
}

export function useSubFamilyMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: saveSubFamily,
        onMutate: async (newSubFamily) => {
            await queryClient.cancelQueries({ queryKey: ["subFamilies"] });
            const previousSubFamilies = queryClient.getQueryData<SubFamily[]>(["subFamilies"]) || [];
            
            queryClient.setQueryData<SubFamily[]>(["subFamilies"], (old = []) => {
                const existingIndex = old.findIndex(s => s.id === newSubFamily.id);
                if (existingIndex >= 0) {
                    const updated = [...old];
                    updated[existingIndex] = newSubFamily;
                    return updated;
                } else {
                    return [...old, newSubFamily];
                }
            });
            
            return { previousSubFamilies };
        },
        onError: (err, newSubFamily, context) => {
            if (context?.previousSubFamilies) {
                queryClient.setQueryData(["subFamilies"], context.previousSubFamilies);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subFamilies"] });
        },
    });
}

export function useSubFamilyDeletion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSubFamily,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["subFamilies"] });
            await queryClient.cancelQueries({ queryKey: ["articles"] });
            
            const previousSubFamilies = queryClient.getQueryData<SubFamily[]>(["subFamilies"]) || [];
            
            queryClient.setQueryData<SubFamily[]>(["subFamilies"], (old = []) => 
                old.filter(s => s.id !== id)
            );
            
            return { previousSubFamilies };
        },
        onError: (err, id, context) => {
            if (context?.previousSubFamilies) {
                queryClient.setQueryData(["subFamilies"], context.previousSubFamilies);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subFamilies"] });
            queryClient.invalidateQueries({ queryKey: ["articles"] });
        },
    });
}

// --- TIERS ---
export function useTiers() {
    return useQuery({
        queryKey: ["tiers"],
        queryFn: getTiers,
    });
}

// --- ACCOUNTING ---
export function useAccountingAccounts() {
    return useQuery({
        queryKey: ["accountingAccounts"],
        queryFn: getAccountingAccounts,
    });
}

export function useAccountingAccountMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: saveAccountingAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accountingAccounts"] });
        },
    });
}

export function useAccountingAccountDeletion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAccountingAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accountingAccounts"] });
        },
    });
}

// --- INVOICES ---
export function useInvoices() {
    return useQuery({
        queryKey: ["invoices"],
        queryFn: getInvoices,
    });
}

export interface UseInvoicesPaginatedParams {
    page: number;
    pageSize?: number;
    filters?: {
        status?: InvoiceStatus;
        dateFrom?: string;
        dateTo?: string;
        supplierId?: string;
        searchQuery?: string;
    };
}

export function useInvoicesPaginated(params: UseInvoicesPaginatedParams) {
    const { page, pageSize = 50, filters } = params;
    
    return useQuery({
        queryKey: ["invoices", "paginated", page, pageSize, filters],
        queryFn: () => getInvoicesPaginated(page, pageSize, filters),
        placeholderData: (previousData) => previousData, // Garde les données précédentes pendant le chargement
        staleTime: 30 * 1000, // Considère les données fraîches pendant 30 secondes
    });
}

export function useInvoiceMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: saveInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            // Also invalidate articles because invoice prices affect recipe costs
            queryClient.invalidateQueries({ queryKey: ["articles"] });
        },
    });
}

export function useInvoiceDeletion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            // Also invalidate articles because invoice prices affect recipe costs
            queryClient.invalidateQueries({ queryKey: ["articles"] });
        },
    });
}

// --- EMPLOYEES ---
export function useEmployees() {
    return useQuery({
        queryKey: ["employees"],
        queryFn: getEmployees,
    });
}

export function useEmployeeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: saveEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
        },
    });
}

export function useEmployeeDeletion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
        },
    });
}

// --- SETTINGS ---
export function useSettings() {
    return useQuery({
        queryKey: ["settings"],
        queryFn: getSettings,
    });
}

export function useSettingsMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ key, value }: { key: string, value: string }) => saveSetting(key, value),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
        },
    });
}

// --- PARTNERS ---
export function usePartners() {
    return useQuery({
        queryKey: ["partners"],
        queryFn: getPartners,
    });
}

export function usePartnerMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: savePartner,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["partners"] });
        },
    });
}

export function usePartnerDeletion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deletePartner,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["partners"] });
        },
    });
}

// --- RECIPES ---
export function useRecipes() {
    return useQuery({
        queryKey: ["recipes"],
        queryFn: getRecipes,
    });
}

export function useRecipeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: saveRecipe,
        onSuccess: () => {
            // Invalidate internal cache immediately
            invalidateRecipeCache();
            
            // Invalidate React Query cache and force immediate refetch
            queryClient.invalidateQueries({ queryKey: ["recipes"] });
            queryClient.invalidateQueries({ queryKey: ["articles"] }); // Articles include recipes
            queryClient.refetchQueries({ queryKey: ["articles"] }); // Force immediate refetch
        },
    });
}

export function useRecipeDeletion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteRecipe,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recipes"] });
            queryClient.invalidateQueries({ queryKey: ["articles"] }); // Articles include recipes
        },
    });
}
