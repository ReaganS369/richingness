import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("=== Environment Verification ===");
console.log("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Present (Starts with " + supabaseAnonKey.substring(0, 10) + "...)" : "Missing");

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function runDiagnosis() {
  console.log("\n=== Auth Mode Diagnosis ===");

  const testEmail = `diag-${Date.now()}@example.com`;
  const testPassword = `SuperSecret123!`;

  // 1. Email Sign Up
  console.log("\n--- Testing Email Sign Up ---");
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });
  if (signUpError) {
    console.error("Sign Up Error:", signUpError.status, signUpError.name, signUpError.message);
  } else {
    console.log("Sign Up Success:", signUpData.user?.id);
  }

  // 2. Email Sign In (with non-existent email if signup failed)
  console.log("\n--- Testing Email Sign In ---");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'nonexistent-user-12345@example.com',
    password: 'wrongpassword',
  });
  if (signInError) {
    console.error("Sign In Error (Expected 400):", signInError.status, signInError.name, signInError.message);
  } else {
    console.log("Sign In Success (Unexpected):", signInData.user?.id);
  }

  // 3. Password Reset
  console.log("\n--- Testing Password Reset ---");
  const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail);
  if (resetError) {
    console.error("Reset Error:", resetError.status, resetError.name, resetError.message);
  } else {
    console.log("Reset Success");
  }
}

runDiagnosis();
