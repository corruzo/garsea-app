import { useState, useEffect, useMemo } from 'react';
import { loanService } from '../services/loanService';
import { cobranzaService } from '../services/cobranzaService';

export const useCobranza = (organizacionId) => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterState, setFilterState] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (organizacionId) {
            loadData();
        }
    }, [organizacionId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await loanService.getAll(organizacionId);
            // Filtrar préstamos pagados y calcular estado
            const activeLoans = data
                .filter(l => l.estado !== 'pagado' && l.saldo_pendiente > 0)
                .map(loan => ({
                    ...loan,
                    cobranza: cobranzaService.getEstadoCobranza(loan)
                }));

            setLoans(activeLoans);
        } catch (error) {
            console.error('Error loading cobranza:', error);
        } finally {
            setLoading(false);
        }
    };

    // Derived state (memoized)
    const alertas = useMemo(() => cobranzaService.generarAlertas(loans), [loans]);
    const metricas = useMemo(() => cobranzaService.calcularMetricas(loans), [loans]);

    const filteredLoans = useMemo(() => {
        let result = [...loans];

        if (filterState !== 'todos') {
            result = result.filter(p => p.cobranza.estado === filterState);
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.clientes?.nombre?.toLowerCase().includes(lower) ||
                p.clientes?.cedula?.toLowerCase().includes(lower)
            );
        }

        // Sort by priority
        return result.sort((a, b) => b.cobranza.prioridad - a.cobranza.prioridad);
    }, [loans, filterState, searchTerm]);

    return {
        loans: filteredLoans, // Return the filtered list directly
        allLoans: loans,      // Return raw list if needed
        loading,
        alertas,
        metricas,
        filterState,
        setFilterState,
        searchTerm,
        setSearchTerm,
        refresh: loadData
    };
};
