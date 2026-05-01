import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getSocket } from './socket';
import type { QueueResponse } from '../api/queue';
import type { StateSnapshot } from '@waifu-panel/shared';

export function useQueueSocket(namespace: '/control' | '/display' = '/control', enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const socket = getSocket(namespace);

    const handleQueueUpdate = (payload: QueueResponse) => {
      queryClient.setQueryData(['queue'], payload);
    };

    const handleStateInit = (payload: StateSnapshot) => {
      queryClient.setQueryData(['queue'], { queue: payload.queue });
    };

    socket.on('queue:updated', handleQueueUpdate);
    socket.on('state:init', handleStateInit);
    socket.emit('queue:fetch');
    socket.emit('state:request');

    return () => {
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('state:init', handleStateInit);
    };
  }, [namespace, enabled, queryClient]);
}
