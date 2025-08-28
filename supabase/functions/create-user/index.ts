// Deno deploy function: POST /functions/v1/create-user
// Requires secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Caller must be authenticated AND have user_profiles.is_admin = true

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Body = {
  email: string;
  password: string;
  displayName?: string;
  role: "admin" | "client" | "worker";
  clientId?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: authHeader } },
    });

    // 1) Authenticate caller
    const { data: me } = await supa.auth.getUser();
    if (!me?.user) {
      return new Response("Unauthorized", { 
        status: 401,
        headers: corsHeaders,
      });
    }

    // 2) Verify caller is admin
    const { data: adminRow, error: adminErr } = await supa
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", me.user.id)
      .single();

    if (adminErr) {
      return new Response(adminErr.message, { 
        status: 400,
        headers: corsHeaders,
      });
    }
    if (!adminRow?.is_admin) {
      return new Response("Forbidden", { 
        status: 403,
        headers: corsHeaders,
      });
    }

    // 3) Read payload
    const body = (await req.json()) as Body;

    // 4) Create auth user
    const { data: created, error: createErr } = await supa.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { display_name: body.displayName ?? null },
    });
    
    if (createErr || !created?.user) {
      return new Response(JSON.stringify(createErr ?? { message: "createUser failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = created.user.id;

    // 5) Upsert profile & role
    const { error: up1 } = await supa.from("user_profiles").upsert({
      user_id: newUserId,
      display_name: body.displayName ?? null,
      email: body.email,
      is_admin: body.role === "admin",
    });

    const { error: up2 } = await supa.from("app_roles").upsert({
      user_id: newUserId,
      role: body.role,
      client_id: body.clientId ?? null,
    });

    if (up1 || up2) {
      return new Response(JSON.stringify(up1 ?? up2), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ user_id: newUserId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Error in create-user function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});