import { useState, useEffect } from 'react';
import type { DataItem } from '../models/types';

/**
 * Custom hook for fetching JSON data from a public file
 * @param url - The URL to fetch data from
 * @returns Object containing data, loading state, and error
 */
export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch sample data from a JSON file
 */
export function useFetchData(url: string): FetchState<DataItem[]> {
  const [state, setState] = useState<FetchState<DataItem[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();
        
        // Handle both array and object responses
        // If the JSON is an object with nested arrays (like our sampleData.json),
        // we'll need to specify which dataset to use, or use the first array found
        let result: DataItem[];
        
        if (Array.isArray(jsonData)) {
          result = jsonData;
        } else if (typeof jsonData === 'object' && jsonData !== null) {
          // Find the first array property in the object
          const firstArrayKey = Object.keys(jsonData).find(
            key => Array.isArray(jsonData[key])
          );
          result = firstArrayKey ? jsonData[firstArrayKey] : [];
        } else {
          result = [];
        }

        setState({ data: result, loading: false, error: null });
      } catch (err) {
        setState({ data: null, loading: false, error: err as Error });
      }
    };

    fetchData();
  }, [url]);

  return state;
}

/**
 * Hook specifically for fetching sample data from /public/sampleData.json
 * Returns both sales and personnel datasets separately
 */
export interface SampleDatasets {
  sales: DataItem[];
  personnel: DataItem[];
}

export function useSampleData(): FetchState<SampleDatasets> {
  const [state, setState] = useState<FetchState<SampleDatasets>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/sampleData.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();
        
        setState({
          data: {
            sales: jsonData.sales || [],
            personnel: jsonData.personnel || [],
          },
          loading: false,
          error: null,
        });
      } catch (err) {
        setState({ data: null, loading: false, error: err as Error });
      }
    };

    fetchData();
  }, []);

  return state;
}
