
// DEBUG: Clear Future Data
const purgeFutureData = () => {
    if (!window.confirm("Attention: Cela va effacer toutes les données des mois FUTURS (après le mois actuel) pour tous les employés. Voulez-vous continuer ?")) return;

    const currentMonthIndex = MONTHS.indexOf(currentMonthStr);

    setStaffMembers(prev => prev.map(emp => {
        const newMonthlyData = { ...emp.monthlyData };

        Object.keys(newMonthlyData).forEach(key => {
            const [mStr, yStr] = key.split('-');
            const y = parseInt(yStr);
            const mIndex = MONTHS.indexOf(mStr);

            // If year is greater, OR year is same but month is greater
            if (y > currentYear || (y === currentYear && mIndex > currentMonthIndex)) {
                delete newMonthlyData[key];
            }
        });

        return {
            ...emp,
            monthlyData: newMonthlyData
        };
    }));
    alert("Données futures effacées !");
};
