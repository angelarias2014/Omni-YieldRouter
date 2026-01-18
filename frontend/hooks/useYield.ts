import useSWR from 'swr';
import { YieldData, DeployedAddresses } from '../types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useYieldData() {
  const { data, error, isLoading, mutate } = useSWR<YieldData>('/api/yield', fetcher, {
    refreshInterval: 30000, // Refrescar cada 30 segundos
    revalidateOnFocus: true,
  });

  return {
    yieldData: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useDeployedAddresses() {
  const { data, error, isLoading } = useSWR<DeployedAddresses>('/api/addresses', fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return {
    addresses: data,
    isLoading,
    isError: error,
  };
}
