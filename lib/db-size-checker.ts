/**
 * Script pour mesurer la taille de la base de données IndexedDB
 * et analyser les problèmes potentiels de performance
 */

import { db } from './db';

export interface DatabaseSizeInfo {
    totalSize: number; // en bytes
    totalSizeMB: number;
    totalSizeGB: number;
    tableSizes: {
        table: string;
        count: number;
        estimatedSizeBytes: number;
        estimatedSizeMB: number;
    }[];
    warnings: string[];
    recommendations: string[];
}

/**
 * Estime la taille d'un objet en bytes (approximation)
 */
function estimateObjectSize(obj: any): number {
    if (obj === null || obj === undefined) return 0;
    
    let size = 0;
    
    if (typeof obj === 'string') {
        size += obj.length * 2; // UTF-16 encoding
    } else if (typeof obj === 'number') {
        size += 8; // 64-bit float
    } else if (typeof obj === 'boolean') {
        size += 4;
    } else if (Array.isArray(obj)) {
        size += obj.reduce((sum, item) => sum + estimateObjectSize(item), 0);
    } else if (typeof obj === 'object') {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                size += key.length * 2; // Key size
                size += estimateObjectSize(obj[key]); // Value size
            }
        }
    }
    
    return size;
}

/**
 * Mesure la taille actuelle de la base de données
 */
export async function getDatabaseSize(): Promise<DatabaseSizeInfo> {
    const tableSizes: DatabaseSizeInfo['tableSizes'] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let totalSize = 0;

    // Mesurer chaque table
    const tables = [
        'invoices',
        'articles',
        'tiers',
        'recipes',
        'employees',
        'families',
        'subFamilies',
        'transactions',
        'salesData',
        'accounting_accounts',
        'settings',
        'partners',
        'cmi_entries'
    ];

    for (const tableName of tables) {
        try {
            const table = (db as any)[tableName];
            if (!table) continue;

            const allRecords = await table.toArray();
            const count = allRecords.length;
            
            // Estimer la taille totale
            let estimatedSize = 0;
            if (count > 0) {
                // Échantillonner quelques enregistrements pour estimer
                const sampleSize = Math.min(10, count);
                const sample = allRecords.slice(0, sampleSize);
                const avgSize = sample.reduce((sum: number, record: any) => 
                    sum + estimateObjectSize(record), 0) / sampleSize;
                estimatedSize = avgSize * count;
            }

            tableSizes.push({
                table: tableName,
                count,
                estimatedSizeBytes: estimatedSize,
                estimatedSizeMB: estimatedSize / (1024 * 1024)
            });

            totalSize += estimatedSize;

            // Avertissements pour les grandes tables
            if (count > 10000) {
                warnings.push(`${tableName}: ${count} enregistrements (risque de performance)`);
            }
            if (estimatedSize > 10 * 1024 * 1024) { // > 10 MB
                warnings.push(`${tableName}: ~${(estimatedSize / (1024 * 1024)).toFixed(2)} MB (considérer la pagination)`);
            }
        } catch (error) {
            console.warn(`Erreur lors de la mesure de ${tableName}:`, error);
        }
    }

    // Recommandations basées sur la taille
    if (totalSize > 50 * 1024 * 1024) { // > 50 MB
        recommendations.push('Base de données > 50 MB: Considérer la pagination pour les grandes tables');
    }
    if (totalSize > 100 * 1024 * 1024) { // > 100 MB
        recommendations.push('Base de données > 100 MB: Implémenter le lazy loading obligatoire');
    }
    if (totalSize > 500 * 1024 * 1024) { // > 500 MB
        recommendations.push('Base de données > 500 MB: IndexedDB peut ralentir, considérer l\'archivage');
    }

    // Vérifier les patterns problématiques
    const invoicesCount = tableSizes.find(t => t.table === 'invoices')?.count || 0;
    if (invoicesCount > 50000) {
        recommendations.push('Factures > 50k: Implémenter la pagination et le filtrage côté serveur');
    }

    return {
        totalSize,
        totalSizeMB: totalSize / (1024 * 1024),
        totalSizeGB: totalSize / (1024 * 1024 * 1024),
        tableSizes: tableSizes.sort((a, b) => b.estimatedSizeBytes - a.estimatedSizeBytes),
        warnings,
        recommendations
    };
}

/**
 * Affiche un rapport de taille dans la console
 */
export async function printDatabaseSizeReport() {
    const info = await getDatabaseSize();
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 RAPPORT DE TAILLE DE LA BASE DE DONNÉES');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n📦 Taille totale: ${info.totalSizeMB.toFixed(2)} MB (${info.totalSizeGB.toFixed(3)} GB)`);
    console.log('\n📋 Détail par table:');
    console.log('─'.repeat(60));
    console.log('Table'.padEnd(20) + 'Count'.padStart(10) + 'Taille (MB)'.padStart(15) + 'Taille (GB)'.padStart(15));
    console.log('─'.repeat(60));
    
    for (const table of info.tableSizes) {
        const countStr = table.count.toLocaleString().padStart(10);
        const mbStr = table.estimatedSizeMB.toFixed(2).padStart(15);
        const gbStr = (table.estimatedSizeMB / 1024).toFixed(4).padStart(15);
        console.log(`${table.table.padEnd(20)}${countStr}${mbStr}${gbStr}`);
    }
    
    if (info.warnings.length > 0) {
        console.log('\n⚠️  AVERTISSEMENTS:');
        info.warnings.forEach(w => console.log(`  - ${w}`));
    }
    
    if (info.recommendations.length > 0) {
        console.log('\n💡 RECOMMANDATIONS:');
        info.recommendations.forEach(r => console.log(`  - ${r}`));
    }
    
    console.log('\n═══════════════════════════════════════════════════════\n');
    
    return info;
}
