import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from './socket';
export function useQueueSocket(namespace = '/control', enabled = true) {
    const queryClient = useQueryClient();
    useEffect(() => {
        if (!enabled) {
            return undefined;
        }
        const socket = getSocket(namespace);
        const handleQueueUpdate = (payload) => {
            queryClient.setQueryData(['queue'], payload);
        };
        socket.on('queue:updated', handleQueueUpdate);
        socket.emit('queue:fetch');
        return () => {
            socket.off('queue:updated', handleQueueUpdate);
        };
    }, [namespace, enabled, queryClient]);
}
