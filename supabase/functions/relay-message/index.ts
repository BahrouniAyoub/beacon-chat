/**
 * Message Relay Edge Function
 * Handles store-and-forward message relay for offline users
 * 
 * STATUS: ✅ IMPLEMENTED
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...data } = await req.json();

    switch (action) {
      case "send": {
        // Store message for relay
        const { senderPublicKey, recipientPublicKey, encryptedContent, iv, signature } = data;
        
        if (!senderPublicKey || !recipientPublicKey || !encryptedContent || !iv) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: message, error } = await supabase
          .from("pending_messages")
          .insert({
            sender_public_key: senderPublicKey,
            recipient_public_key: recipientPublicKey,
            encrypted_content: encryptedContent,
            iv,
            signature,
          })
          .select()
          .single();

        if (error) {
          console.error("Error storing message:", error);
          return new Response(
            JSON.stringify({ error: "Failed to store message" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, messageId: message.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "fetch": {
        // Fetch pending messages for a recipient
        const { recipientPublicKey } = data;
        
        if (!recipientPublicKey) {
          return new Response(
            JSON.stringify({ error: "Missing recipientPublicKey" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: messages, error } = await supabase
          .from("pending_messages")
          .select("*")
          .eq("recipient_public_key", recipientPublicKey)
          .is("delivered_at", null)
          .lt("expires_at", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch messages" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ messages: messages || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "acknowledge": {
        // Mark message as delivered
        const { messageId } = data;
        
        if (!messageId) {
          return new Response(
            JSON.stringify({ error: "Missing messageId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("pending_messages")
          .update({ 
            delivered_at: new Date().toISOString(),
            delivery_attempts: 1 
          })
          .eq("id", messageId);

        if (error) {
          console.error("Error acknowledging message:", error);
          return new Response(
            JSON.stringify({ error: "Failed to acknowledge message" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Relay error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
