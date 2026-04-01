import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';

export function useOrderTracking(orderId: string) {
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    // 1. Initial Fetch
    const fetchOrder = async () => {
      const { data } = await supabase.from('orders').select('*, runner_id').eq('id', orderId).single();
      setOrder(data);
    };
    fetchOrder();

    // 2. Real-time Subscription
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders', 
          filter: `id=eq.${orderId}` 
      }, (payload) => {
        setOrder(payload.new);
        console.log("Order updated, Bes!", payload.new.status);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  return order;
}
