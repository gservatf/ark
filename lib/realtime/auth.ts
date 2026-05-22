"use client";

type RealtimeAuthClient = {
  auth: {
    getSession: () => Promise<{
      data: {
        session: {
          access_token?: string | null;
        } | null;
      };
    }>;
    onAuthStateChange: (
      callback: (
        event: string,
        session: {
          access_token?: string | null;
        } | null
      ) => void
    ) => {
      data: {
        subscription: {
          unsubscribe: () => void;
        };
      };
    };
  };
  realtime: {
    setAuth: (token: string) => void;
  };
};

export function bindRealtimeAuth(client: RealtimeAuthClient) {
  let isDisposed = false;

  const setToken = (token?: string | null) => {
    if (!isDisposed && token) {
      client.realtime.setAuth(token);
    }
  };

  void client.auth.getSession().then(({ data }) => {
    setToken(data.session?.access_token);
  });

  const {
    data: { subscription }
  } = client.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") {
      setToken(session?.access_token);
    }
  });

  return () => {
    isDisposed = true;
    subscription.unsubscribe();
  };
}
