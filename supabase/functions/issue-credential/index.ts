import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { ethers } from "https://esm.sh/ethers@6.11.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimal ABI matching deployed StudentCredentialRegistry
const CONTRACT_ABI = [
  "function issueCredential(string calldata credentialId, bytes32 credentialHash) external",
  "function getCredential(string calldata credentialId) external view returns (bytes32 credentialHash, address issuer, uint256 issuedAt, bool revoked, bool exists)",
  "function verifyCredential(string calldata credentialId, bytes32 expectedHash) external view returns (bool isValid, bool isRevoked, uint256 issuedAt)",
  "function revokeCredential(string calldata credentialId) external",
  "function owner() external view returns (address)"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validate Environment Variables
    const privateKey = Deno.env.get("BLOCKCHAIN_PRIVATE_KEY");
    const rpcUrl = Deno.env.get("POLYGON_AMOY_RPC_URL") || "https://polygon-amoy.drpc.org";
    const contractAddress = Deno.env.get("CONTRACT_ADDRESS") || "0x9ee5cd0d9D08d07d5547b2402240aD11F9761cA0";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

    if (!privateKey) {
      return new Response(
        JSON.stringify({ error: "Missing BLOCKCHAIN_PRIVATE_KEY secret in Supabase Edge Function environment." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration environment variables." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Authorization Header check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client using caller's JWT to verify user role
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired access token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for DB updates
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user role in database (profiles.role must be 'admin')
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only administrators can anchor credentials to the blockchain." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Parse Request Payload
    const body = await req.json();
    const searchId = body.credential_id || body.id;

    if (!searchId || typeof searchId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'credential_id' or 'id' parameter." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Fetch Credential Record from Database (Support both UUID primary key and public credential_id string)
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(searchId);
    const query = isUuid
      ? adminClient.from("credentials").select("*").eq("id", searchId)
      : adminClient.from("credentials").select("*").eq("credential_id", searchId);

    const { data: credential, error: credError } = await query.single();

    if (credError || !credential) {
      return new Response(
        JSON.stringify({ error: `Credential with ID '${searchId}' not found.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Duplicate Protection Check
    if (credential.blockchain_status === "ANCHORED") {
      return new Response(
        JSON.stringify({
          error: "Credential already anchored on blockchain.",
          blockchain_tx_hash: credential.blockchain_tx_hash,
          blockchain_status: "ANCHORED",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify no other active credential exists for this student
    const { data: existingStudentCreds } = await adminClient
      .from("credentials")
      .select("id, credential_id, blockchain_status")
      .eq("student_id", credential.student_id)
      .neq("id", credential.id);

    if (existingStudentCreds && existingStudentCreds.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Duplicate issuance rejected: Student already has an issued credential.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Validate SHA-256 Hash Format
    let hashHex = credential.credential_hash.trim();
    if (!hashHex.startsWith("0x")) {
      hashHex = `0x${hashHex}`;
    }

    const bytes32Regex = /^0x[0-9a-fA-F]{64}$/;
    if (!bytes32Regex.test(hashHex)) {
      return new Response(
        JSON.stringify({ error: `Invalid SHA-256 hash format for bytes32: ${hashHex}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Connect to Polygon Amoy & Contract
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const wallet = new ethers.Wallet(formattedPrivateKey, provider);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);

    console.log(`Submitting issueCredential('${credential.credential_id}', '${hashHex}') to contract ${contractAddress}...`);

    let txHash = null;
    try {
      const tx = await contract.issueCredential(credential.credential_id, hashHex);
      txHash = tx.hash;
      console.log(`Transaction sent: ${txHash}. Waiting for confirmation...`);
      
      const receipt = await tx.wait(1);
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    } catch (txError: any) {
      console.error("Blockchain transaction failed:", txError);

      // Update Supabase status to FAILED
      await adminClient
        .from("credentials")
        .update({ blockchain_status: "FAILED" })
        .eq("id", credential.id);

      return new Response(
        JSON.stringify({
          error: `Blockchain transaction failed: ${txError.message || txError}`,
          blockchain_status: "FAILED",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Update Supabase Credential Record on Success
    const { error: updateError } = await adminClient
      .from("credentials")
      .update({
        blockchain_tx_hash: txHash,
        blockchain_status: "ANCHORED",
      })
      .eq("id", credential.id);

    if (updateError) {
      console.error("Failed to update Supabase record after blockchain success:", updateError);
      return new Response(
        JSON.stringify({
          warning: "Transaction succeeded on blockchain, but Supabase update failed.",
          blockchain_tx_hash: txHash,
          txHash: txHash,
          blockchain_status: "ANCHORED",
          db_error: updateError.message,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        credential_id: credential.credential_id,
        blockchain_tx_hash: txHash,
        txHash: txHash,
        blockchain_status: "ANCHORED",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Unexpected error in issue-credential function:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
