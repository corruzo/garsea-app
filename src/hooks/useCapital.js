import { useState, useEffect, useCallback } from 'react';
import { capitalService } from '../services/capitalService';

export const useCapital = (organizacionId) => {
    const [saldo, setSaldo] = useState({ USD: 0, VES: 0 });
    const [loading, setLoading] = useState(true);

    const loadSaldo = useCallback(async () => {
        if (!organizacionId) return;
        try {
            const data = await capitalService.getSaldo(organizacionId);
            setSaldo(data);
        } catch (error) {
            console.error('Error loading capital saldo:', error);
        } finally {
            setLoading(false);
        }
    }, [organizacionId]);

    useEffect(() => {
        loadSaldo();
    }, [loadSaldo]);

    return { saldo, loading, refreshSaldo: loadSaldo };
};
