export const SUPABASE_NETWORK_ERROR_MESSAGE =
  "Supabase 서버에 연결할 수 없습니다. 프로젝트 URL과 네트워크 상태를 확인해 주세요.";

type Fetcher = typeof fetch;

export function createSupabaseFetch(fetcher: Fetcher = fetch): Fetcher {
  return async (input, init) => {
    try {
      return await fetcher(input, init);
    } catch {
      return new Response(
        JSON.stringify({
          code: "SUPABASE_NETWORK_ERROR",
          details: "",
          error: "SUPABASE_NETWORK_ERROR",
          error_description: SUPABASE_NETWORK_ERROR_MESSAGE,
          hint: "",
          message: SUPABASE_NETWORK_ERROR_MESSAGE,
          msg: SUPABASE_NETWORK_ERROR_MESSAGE,
        }),
        {
          status: 500,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }
  };
}
