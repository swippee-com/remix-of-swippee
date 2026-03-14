const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const url = `https://www.nrb.org.np/api/forex/v1/rates?from=${today}&to=${today}&per_page=1&page=1`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`NRB API returned ${res.status}`);
    }

    const json = await res.json();
    const payload = json?.data?.payload?.[0];
    if (!payload) {
      throw new Error('No forex data available for today');
    }

    const usdRate = payload.rates?.find(
      (r: { currency: { iso3: string } }) => r.currency.iso3 === 'USD'
    );

    if (!usdRate) {
      throw new Error('USD rate not found');
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: payload.date,
        buy: parseFloat(usdRate.buy),
        sell: parseFloat(usdRate.sell),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Forex rate error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch forex rate';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
