import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScamReport {
  county_name: string;
  scam_type: string;
  scam_count: number;
  risk_level: string;
  data_source: string;
  details?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "get";

    if (action === "get") {
      // Aggregate scam data by county
      const { data: scamData, error } = await supabase
        .from("county_scams")
        .select("*")
        .order("scam_count", { ascending: false });

      if (error) throw error;

      // Aggregate by county
      const countyAggregates = new Map<string, {
        county_name: string;
        total_scams: number;
        scam_types: string[];
        risk_level: string;
        top_scam_type: string;
        data_sources: string[];
      }>();

      for (const scam of scamData || []) {
        const existing = countyAggregates.get(scam.county_name);
        if (existing) {
          existing.total_scams += scam.scam_count;
          if (!existing.scam_types.includes(scam.scam_type)) {
            existing.scam_types.push(scam.scam_type);
          }
          if (!existing.data_sources.includes(scam.data_source)) {
            existing.data_sources.push(scam.data_source);
          }
          // Update risk level if higher
          const riskOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          if (riskOrder[scam.risk_level as keyof typeof riskOrder] > riskOrder[existing.risk_level as keyof typeof riskOrder]) {
            existing.risk_level = scam.risk_level;
          }
        } else {
          countyAggregates.set(scam.county_name, {
            county_name: scam.county_name,
            total_scams: scam.scam_count,
            scam_types: [scam.scam_type],
            risk_level: scam.risk_level,
            top_scam_type: scam.scam_type,
            data_sources: [scam.data_source],
          });
        }
      }

      const aggregatedData = Array.from(countyAggregates.values())
        .sort((a, b) => b.total_scams - a.total_scams);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: aggregatedData,
          raw: scamData,
          lastUpdated: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update" && req.method === "POST") {
      // Admin only - update scam data
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Invalid authentication" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const { reports }: { reports: ScamReport[] } = body;

      if (!reports || !Array.isArray(reports)) {
        return new Response(
          JSON.stringify({ error: "Reports array required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upsert scam reports
      for (const report of reports) {
        const { error: upsertError } = await supabase
          .from("county_scams")
          .upsert(
            {
              county_name: report.county_name,
              scam_type: report.scam_type,
              scam_count: report.scam_count,
              risk_level: report.risk_level,
              data_source: report.data_source,
              details: report.details,
              last_reported_at: new Date().toISOString(),
            },
            { onConflict: "county_name,scam_type", ignoreDuplicates: false }
          );

        if (upsertError) {
          console.error("Upsert error:", upsertError);
        }
      }

      return new Response(
        JSON.stringify({ success: true, updated: reports.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scam data error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
