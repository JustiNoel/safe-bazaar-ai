import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExecInviteRequest {
  email: string;
  role: string;
  permissions: {
    can_view_users: boolean;
    can_issue_tokens: boolean;
    can_ban_users?: boolean;
  };
  inviterEmail?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Verify admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, role, permissions, inviterEmail }: ExecInviteRequest = await req.json();

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "Email and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build permissions list for email
    const permissionsList: string[] = [];
    if (permissions.can_view_users) permissionsList.push("View all users");
    if (permissions.can_issue_tokens) permissionsList.push("Issue scan tokens");
    if (permissions.can_ban_users) permissionsList.push("Ban/unban users");

    const permissionsHtml = permissionsList.length > 0
      ? `<ul style="margin: 10px 0; padding-left: 20px;">${permissionsList.map(p => `<li style="margin: 5px 0;">${p}</li>`).join("")}</ul>`
      : "<p>No special permissions assigned.</p>";

    const emailResponse = await resend.emails.send({
      from: "Safe Bazaar AI <noreply@resend.dev>",
      to: [email],
      subject: `🛡️ You've been invited to join Safe Bazaar AI as ${role}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
              <div style="width: 64px; height: 64px; background: white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">🛡️</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Safe Bazaar AI</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Executive Team Invitation</p>
            </div>
            
            <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 20px;">Karibu! You're Invited 🎉</h2>
              
              <p style="color: #52525b; line-height: 1.6; margin: 0 0 16px;">
                You have been invited to join the <strong>Safe Bazaar AI</strong> executive team as a <strong style="color: #10b981;">${role.charAt(0).toUpperCase() + role.slice(1)}</strong>.
              </p>
              
              ${inviterEmail ? `<p style="color: #71717a; font-size: 14px; margin: 0 0 16px;">Invited by: ${inviterEmail}</p>` : ""}
              
              <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #18181b; font-weight: 600; margin: 0 0 8px;">Your Permissions:</p>
                ${permissionsHtml}
              </div>
              
              <div style="margin: 24px 0;">
                <a href="https://safe-bazaar-ai.lovable.app/auth" 
                   style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Sign In to Get Started
                </a>
              </div>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
                Once you sign in with this email address, you'll automatically have access to the admin panel features assigned to you.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
              
              <p style="color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;">
                Safe Bazaar AI - Protecting Kenyan shoppers from online scams<br>
                <a href="https://safe-bazaar-ai.lovable.app" style="color: #10b981;">safe-bazaar-ai.lovable.app</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Exec invite email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Invitation email sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error sending exec invite:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send invitation" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
