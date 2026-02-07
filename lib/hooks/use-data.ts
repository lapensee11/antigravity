import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getArticles, saveArticle, deleteArticle,
    getInvoices, saveInvoice, deleteInvoice,
    getEmployees, saveEmployee, deleteEmployee,
    getFamilies, getSubFamilies,
    getAccountingAccounts,
    getTiers,
    getSettings, saveSetting,
    getPartners, savePartner
} from "@/lib/data-service";
import { Article, Invoice, StaffMember } from "@/lib/types";

// --- ARTICLES ---
export function useArticles() {
    return useQuery({
        queryKey: ["articles"],
        queryFn: getArticles,
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
        staleTime: Infinity, // Static data, rarely changes
    });
}

export function useSubFamilies() {
    return useQuery({
        queryKey: ["subFamilies"],
        queryFn: getSubFamilies,
        staleTime: Infinity,
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
        staleTime: Infinity,
    });
}

// --- INVOICES ---
export function useInvoices() {
    return useQuery({
        queryKey: ["invoices"],
        queryFn: getInvoices,
    });
}

export function useInvoiceMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: saveInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        },
    });
}

export function useInvoiceDeletion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
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
