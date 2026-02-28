import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import {
    collection,
    query,
    onSnapshot,
    getDocs,
    orderBy,
    where,
    limit as firestoreLimit
} from 'firebase/firestore';

/**
 * Custom hook to fetch and manage Firestore collection data.
 * @param {string} collectionName - The name of the Firestore collection.
 * @param {Object} options - Options for the query (orderByField, limitCount, realTime, conditions).
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useFirestore = (collectionName, options = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const {
        orderByField = null,
        limitCount = null,
        realTime = true,
        conditions = [] // Array of [field, operator, value]
    } = options;

    useEffect(() => {
        if (!collectionName) return;

        setLoading(true);
        setError(null);

        let q = collection(db, collectionName);
        let queryConstraints = [];

        if (conditions && conditions.length > 0) {
            conditions.forEach(cond => {
                queryConstraints.push(where(cond[0], cond[1], cond[2]));
            });
        }

        if (orderByField) {
            queryConstraints.push(orderBy(orderByField, 'desc'));
        }

        if (limitCount) {
            queryConstraints.push(firestoreLimit(limitCount));
        }

        const finalQuery = query(q, ...queryConstraints);

        if (realTime) {
            const unsubscribe = onSnapshot(finalQuery, (querySnapshot) => {
                const results = [];
                querySnapshot.forEach((doc) => {
                    results.push({ id: doc.id, ...doc.data() });
                });
                setData(results);
                setLoading(false);
            }, (err) => {
                console.error(`Error in useFirestore (${collectionName}):`, err);
                setError(err.message || `Error loading ${collectionName} from Firestore`);
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
            const fetchData = async () => {
                try {
                    const querySnapshot = await getDocs(finalQuery);
                    const results = [];
                    querySnapshot.forEach((doc) => {
                        results.push({ id: doc.id, ...doc.data() });
                    });
                    setData(results);
                } catch (err) {
                    setError(err.message || `Error loading ${collectionName} from Firestore`);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [collectionName, JSON.stringify(conditions), orderByField, limitCount, realTime]);

    return { data, loading, error, refetch: () => setLoading(true) };
};
