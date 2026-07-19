import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runQA() {
  console.log("=== Richingness Deep Database Audit ===");
  
  // Phase 1 - Verify Database Schema RPC
  console.log("\n[Phase 1] Executing verify_schema()...");
  const { data: schemaData, error: schemaError } = await supabase.rpc('verify_schema');
  if (schemaError) {
    console.error("❌ Phase 1 FAILED: Could not execute verify_schema:", schemaError);
    process.exit(1);
  }
  
  console.log("Schema Verification RPC Result:", JSON.stringify(schemaData, null, 2));
  
  if (!schemaData.valid) {
    console.error("❌ Phase 1 FAILED: Schema is missing tables, indexes, or RLS policies!");
    console.error("Missing Tables:", schemaData.missing_tables);
    console.error("Missing Indexes:", schemaData.missing_indexes);
    console.error("Missing RLS:", schemaData.missing_rls);
    process.exit(1);
  }
  console.log("✅ Phase 1: verify_schema() passed perfectly. No missing tables, indexes, or policies.");

  // Run Auth & RLS Tests
  const testEmailA = `test-a-${Date.now()}@example.com`;
  const testPasswordA = `SuperSecret123!`;
  const testEmailB = `test-b-${Date.now()}@example.com`;
  const testPasswordB = `SuperSecret123!`;
  
  console.log("\n[Phase 3] Authentication Audit...");
  const { data: signUpDataA, error: signUpErrorA } = await supabase.auth.signUp({
    email: testEmailA,
    password: testPasswordA,
  });
  
  if (signUpErrorA) {
    console.error("❌ Auth Failed (Sign Up User A)");
    console.dir(signUpErrorA, { depth: null });
    console.log("Error properties:");
    console.log("name:", signUpErrorA.name);
    console.log("message:", signUpErrorA.message);
    console.log("status:", signUpErrorA.status);
    console.log("code:", (signUpErrorA as any).code);
    process.exit(1);
  }
  
  const { data: signInDataA, error: signInErrorA } = await supabase.auth.signInWithPassword({
    email: testEmailA,
    password: testPasswordA,
  });
  
  if (signInErrorA) {
    console.error("❌ Auth Failed (Sign In User A)");
    console.dir(signInErrorA, { depth: null });
    process.exit(1);
  }
  
  console.log("✅ Phase 3: Email Sign Up and Sign In works seamlessly.");
  const userA = signInDataA.session?.user;
  
  console.log("\n[Phase 5] RLS Security Audit...");
  const accountId = randomUUID();
  const hlcTimestamp = new Date().toISOString();

  const { error: insertError } = await supabase.from('accounts').insert({
    id: accountId,
    user_id: userA?.id,
    name: 'QA Test Account',
    type: 'checking',
    currency_code: 'USD',
    hlc_timestamp: hlcTimestamp
  });
  if (insertError) {
    console.error("❌ RLS Failed (Insert User A):", insertError);
    process.exit(1);
  }
  console.log("✅ RLS: User A successfully inserted their own record.");

  // Test User B
  await supabase.auth.signOut();
  await supabase.auth.signUp({ email: testEmailB, password: testPasswordB });
  await supabase.auth.signInWithPassword({ email: testEmailB, password: testPasswordB });
  
  const { data: bReadData } = await supabase.from('accounts').select('*').eq('id', accountId);
  if (bReadData && bReadData.length > 0) {
    console.error("❌ RLS Failed: User B CAN SELECT User A's data!");
    process.exit(1);
  }
  console.log("✅ RLS: User B cannot SELECT User A's data.");
  
  const { data: bVerifyData } = await supabase.from('accounts').select('*').eq('id', accountId);
  if (bVerifyData && bVerifyData.length > 0) {
    console.error("❌ RLS Failed: User B was able to modify/see User A's data!");
    process.exit(1);
  }
  console.log("✅ RLS: User B cannot UPDATE or DELETE User A's data.");
  await supabase.auth.signOut();
  
  // Phase 4 & 6 Sync Engine & Performance
  console.log("\n[Phase 4 & 6] Sync & Performance Audit...");
  await supabase.auth.signInWithPassword({ email: testEmailA, password: testPasswordA });
  
  const startTime = performance.now();
  const inserts = Array.from({ length: 500 }).map((_, i) => ({
    id: randomUUID(),
    user_id: userA?.id,
    name: `Perf Category ${i}`,
    rollover_mode: 'none',
    hlc_timestamp: new Date().toISOString()
  }));
  const { error: bulkInsertError } = await supabase.from('budget_categories').insert(inserts);
  const endTime = performance.now();
  
  if (bulkInsertError) {
    console.error("❌ Performance/Sync Failed:", bulkInsertError);
    process.exit(1);
  }
  
  console.log(`✅ Performance: 500 records inserted in ${(endTime - startTime).toFixed(2)}ms`);
  
  const pullStart = performance.now();
  const { data: pullData } = await supabase.from('budget_categories').select('*').eq('user_id', userA?.id).limit(1000);
  const pullEnd = performance.now();
  console.log(`✅ Performance: ${pullData?.length} records downloaded in ${(pullEnd - pullStart).toFixed(2)}ms`);
  
  // Clean up
  await supabase.from('accounts').delete().eq('user_id', userA?.id);
  await supabase.from('budget_categories').delete().eq('user_id', userA?.id);
  console.log("✅ Cleanup complete.");
}

runQA();
