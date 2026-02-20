import { useState, useEffect, useCallback } from 'react';
import { loanService } from '../services/loanService';
import { toast } from 'react-hot-toast';

export const useLoans = (organizacionId) => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadLoans = useCallback(async () => {
        if (!organizacionId) return;

        try {
            setLoading(true);
            const data = await loanService.getAll(organizacionId);
            setLoans(data);
            setError(null);
        } catch (err) {
            console.error('Error loading loans:', err);
            const msg = 'No se pudieron cargar los préstamos';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [organizacionId]);

    useEffect(() => {
        loadLoans();
    }, [loadLoans]);

    const createLoan = async (loanData) => {
        if (!organizacionId) return null;

        try {
            setLoading(true);
            const newLoan = await loanService.create({
                ...loanData,
                organizacion_id: organizacionId
            });
            toast.success('Préstamo creado con éxito');
            await loadLoans(); // Refresh list
            return newLoan;
        } catch (err) {
            console.error('Error creating loan:', err);
            toast.error('Error al crear el préstamo');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loans,
        loading,
        error,
        createLoan,
        refreshLoans: loadLoans
    };
};
