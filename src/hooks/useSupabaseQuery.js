import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

const operators = {
    '==': 'eq',
    '!=': 'neq',
    '>': 'gt',
    '>=': 'gte',
    '<': 'lt',
    '<=': 'lte',
    'in': 'in'
};

/**
 * Custom hook to fetch and manage data from a Supabase table.
 * @param {string} tableName - The name of the table.
 * @param {Object} options - Options for the query (orderByField, limitCount, realTime, conditions).
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useSupabaseQuery = (tableName, options = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const {
        orderByField = null,
        limitCount = null,
        realTime = true,
        conditions = [] // Array of [column, operator, value]
    } = options;

    const conditionsKey = JSON.stringify(conditions);

    const fetchData = useCallback(async () => {
        const parsedConditions = JSON.parse(conditionsKey);

        // Wait until every condition has a value (e.g. the user id after login)
        if (parsedConditions.some(cond => cond[2] === undefined || cond[2] === null)) return;

        let query = supabase.from(tableName).select('*');

        parsedConditions.forEach(([column, operator, value]) => {
            const method = operators[operator];
            if (!method) throw new Error(`Unsupported operator "${operator}"`);
            query = query[method](column, value);
        });

        if (orderByField) {
            query = query.order(orderByField, { ascending: false });
        }

        if (limitCount) {
            query = query.limit(limitCount);
        }

        const { data: rows, error: queryError } = await query;

        if (queryError) {
            console.error(`Error in useSupabaseQuery (${tableName}):`, queryError);
            setError(queryError.message || `Error loading ${tableName} from Supabase`);
        } else {
            setData(rows);
            setError(null);
        }
        setLoading(false);
    }, [tableName, conditionsKey, orderByField, limitCount]);

    useEffect(() => {
        if (!tableName) return;

        fetchData();

        if (!realTime) return;

        // Refetch on any change; RLS makes sure we only receive our own rows
        const channel = supabase
            .channel(`${tableName}-${crypto.randomUUID()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tableName, fetchData, realTime]);

    return { data, loading, error, refetch: fetchData };
};
