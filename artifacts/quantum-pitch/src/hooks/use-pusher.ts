import { useEffect } from "react";
import Pusher from "pusher-js";
import { useQueryClient } from "@tanstack/react-query";
import { 
  getGetDashboardQueryKey, 
  getListDeliveriesQueryKey, 
  getListWicketsQueryKey 
} from "@workspace/api-client-react";

const PUSHER_KEY = "7551dc90d2d1a24b4eee";
const PUSHER_CLUSTER = "ap2";
const PUSHER_CHANNEL = "live-session-0338";

export function usePusher(sessionId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe(PUSHER_CHANNEL);

    channel.bind("new-ball", () => {
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: getListDeliveriesQueryKey({ sessionId, limit: 50 }) });
      }
    });

    channel.bind("wicket-alert", () => {
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: getListWicketsQueryKey({ sessionId }) });
      }
    });

    channel.bind("session-started", () => {
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    });

    channel.bind("session-closed", () => {
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [queryClient, sessionId]);
}
