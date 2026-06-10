import express from "express";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

dotenv.config();

// WebAuthn Config
const rpName = 'Confecção Pro';
const appUrl = process.env.APP_URL || 'http://localhost:3000';
const rpID = new URL(appUrl).hostname;
const origin = appUrl;

// Helpers for base64url
const toBase64URL = (buffer: any) => {
  if (!buffer) return '';
  try {
    return Buffer.from(buffer).toString('base64url');
  } catch (err) {
    console.error("toBase64URL error:", err, "Input:", buffer);
    return '';
  }
};
const fromBase64URL = (str: any) => {
  if (typeof str !== 'string') {
    console.error("fromBase64URL error: expected string, got", typeof str, str);
    // If it's already a buffer/Uint8Array, just return it as Uint8Array
    if (str instanceof Uint8Array) return str;
    if (Buffer.isBuffer(str)) return new Uint8Array(str);
    return new Uint8Array();
  }
  try {
    return new Uint8Array(Buffer.from(str, 'base64url'));
  } catch (err) {
    console.error("fromBase64URL error:", err, "Input:", str);
    return new Uint8Array();
  }
};

// In-memory challenge store (for demo)
const challenges = new Map<string, string>();

let supabase: any = null;

const getSupabase = () => {
  if (supabase) return supabase;
  
  let rawUrl = (process.env.VITE_SUPABASE_URL || "").trim();
  const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  
  if (!rawUrl || !supabaseServiceKey) {
    console.warn("AVISO: Supabase não configurado (URL ou Chave ausente).");
    return null;
  }

  if (!rawUrl.includes(".")) {
    rawUrl = `${rawUrl}.supabase.co`;
  }

  if (!rawUrl.startsWith("http")) {
    rawUrl = `https://${rawUrl}`;
  }

  try {
    const parsedUrl = new URL(rawUrl);
    parsedUrl.pathname = "";
    parsedUrl.search = "";
    parsedUrl.hash = "";
    let supabaseUrl = parsedUrl.toString();

    if (supabaseUrl.endsWith("/")) {
      supabaseUrl = supabaseUrl.slice(0, -1);
    }

    if (supabaseUrl.includes("seu-projeto.supabase.co") || supabaseUrl.includes("TODO_URL")) {
      console.warn("AVISO: URL do Supabase parece ser um placeholder:", supabaseUrl);
      return null;
    }
    
    console.log("Initializing Supabase client with sanitized URL:", supabaseUrl);
    console.log("Parsed URL pathname:", parsedUrl.pathname || '/');
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase client initialized successfully.");
    return supabase;
  } catch (err) {
    console.error("Erro ao inicializar cliente Supabase:", err);
    return null;
  }
};

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Middleware to check Supabase config
app.use((req, res, next) => {
  const client = getSupabase();
  if (!client && req.path.startsWith("/api/") && req.path !== "/api/login" && req.path !== "/api/health") {
    return res.status(500).json({ 
      error: "Supabase não configurado. Por favor, adicione VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY aos segredos (Secrets) do AI Studio. Verifique também se as tabelas foram criadas usando o script SQL fornecido." 
    });
  }
  next();
});

// API routes FIRST
app.get("/api/health", async (req, res) => {
  const client = getSupabase();
  let supabaseStatus = "not_configured";
  let supabaseError = null;
  let sanitizedUrl = (process.env.VITE_SUPABASE_URL || "").trim();
  
  if (sanitizedUrl) {
    if (!sanitizedUrl.includes(".")) sanitizedUrl = `${sanitizedUrl}.supabase.co`;
    if (!sanitizedUrl.startsWith("http")) sanitizedUrl = `https://${sanitizedUrl}`;
    if (sanitizedUrl.endsWith("/")) sanitizedUrl = sanitizedUrl.slice(0, -1);
    // Obfuscate for security
    sanitizedUrl = sanitizedUrl.substring(0, 15) + "..." + sanitizedUrl.substring(sanitizedUrl.length - 5);
  }

  if (client) {
    try {
      const { data: users, error } = await client.from('users').select('id').limit(1);
      if (error) {
        supabaseStatus = "error";
        supabaseError = error.message;
      } else {
        supabaseStatus = "connected";
        
        // Ensure default users exist without overwriting existing profiles
        const defaultUsers = [
          { username: "admin", password: "admin", role: "admin" },
          { username: "fasbbrazil@gmail.com", password: "admin", role: "admin" },
          { username: "francielebrazil@gmail.com", password: "admin", role: "admin" }
        ];
        
        console.log("Ensuring default users exist...");
        const { data: existingUsers, error: selectError } = await client.from("users").select("username");
        if (selectError) {
          console.error("Error fetching existing users for check:", selectError);
        } else {
          const existingUsernames = new Set((existingUsers || []).map(u => String(u.username).toLowerCase().trim()));
          const missingUsers = defaultUsers.filter(u => !existingUsernames.has(u.username.toLowerCase().trim()));
          
          if (missingUsers.length > 0) {
            console.log(`Inserting ${missingUsers.length} missing default users...`);
            const { error: insertError } = await client.from("users").insert(missingUsers);
            if (insertError) {
              console.error("Error inserting missing default users:", insertError);
            } else {
              console.log("Missing default users inserted successfully.");
            }
          } else {
            console.log("All default users already exist in the database. No action taken.");
          }
        }
      }
    } catch (err: any) {
      let sanitizedUrl = (process.env.VITE_SUPABASE_URL || "").trim();
      if (sanitizedUrl) {
        if (!sanitizedUrl.includes(".")) sanitizedUrl = `${sanitizedUrl}.supabase.co`;
        if (!sanitizedUrl.startsWith("http")) sanitizedUrl = `https://${sanitizedUrl}`;
        if (sanitizedUrl.endsWith("/")) sanitizedUrl = sanitizedUrl.slice(0, -1);
      }
      
      const isDnsError = err.message?.includes('ENOTFOUND') || err.cause?.message?.includes('ENOTFOUND') || err.code === 'ENOTFOUND';
      
      if (isDnsError) {
        supabaseStatus = "dns_error";
        const projectId = sanitizedUrl.split('.')[0].replace('https://', '');
        const dashboardUrl = `https://supabase.com/dashboard/project/${projectId}`;
        supabaseError = `O endereço do Supabase não foi encontrado (DNS). Verifique se o projeto não está pausado em: ${dashboardUrl}`;
      } else {
        supabaseStatus = "fetch_failed";
        supabaseError = err.message;
      }
      console.error("Health check Supabase fetch failed:", err);
    }
  }

  res.json({ 
    status: "ok", 
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    supabaseConfigured: !!process.env.VITE_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: sanitizedUrl,
    supabaseStatus,
    supabaseError
  });
});

app.get("/manifest.json", async (req, res) => {
  const client = getSupabase();
  let logoUrl = "/icone.png";
  let companyName = "Confecção Pro";

  if (client) {
    const { data } = await client.from('company_settings').select('*').maybeSingle();
    if (data) {
      if (data.logo_url) logoUrl = data.logo_url;
      if (data.name) companyName = data.name;
    }
  }

  res.json({
    "name": companyName,
    "short_name": String(companyName || "Confecção Pro").replace(/\s+/g, ''),
    "description": "Gestão Inteligente para seu Ateliê",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#10b981",
    "icons": [
      {
        "src": logoUrl,
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any maskable"
      },
      {
        "src": logoUrl,
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ]
  });
});

// Simple Auth Middleware (Mock for demo, but functional)
app.post("/api/login", async (req, res) => {
  console.log("Login attempt received for user:", req.body.username);
  try {
    const client = getSupabase();
    if (!client) {
      console.error("Login failed: Supabase client not available.");
      return res.status(500).json({ 
        success: false, 
        message: "Supabase não configurado. Adicione as chaves VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nos segredos do projeto." 
      });
    }

    const { username, password } = req.body;
    const sanitizedUsername = String(username || "admin").trim().toLowerCase();
    const sanitizedPassword = String(password || "").trim();
    
    console.log("Login credentials received for:", sanitizedUsername);
    
    const { data, error } = await client
      .from("users")
      .select("*")
      .eq("username", sanitizedUsername)
      .maybeSingle();

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    if (!data) {
      console.warn("Login failed: User not found:", sanitizedUsername);
      return res.status(401).json({ success: false, message: "Usuário não encontrado" });
    }

    if (data.password !== sanitizedPassword) {
      // If the database password has been reset to 'admin' (seeded default),
      // but the user is logging in using their custom password (which they set previously),
      // we auto-heal their password by saving the one they entered and letting them log in.
      if (data.password === "admin" && (sanitizedUsername === "francielebrazil@gmail.com" || sanitizedUsername === "fasbbrazil@gmail.com")) {
        console.log(`Auto-healing password for default user ${sanitizedUsername}. Updating to user's specified custom password.`);
        const { error: updateError } = await client
          .from("users")
          .update({ password: sanitizedPassword })
          .eq("id", data.id);
        
        if (updateError) {
          console.error(`Failed to auto-heal password in DB for ${sanitizedUsername}:`, updateError);
        } else {
          console.log(`Password auto-healed successfully for ${sanitizedUsername}.`);
        }
      } else {
        console.warn("Login failed: Password mismatch for:", sanitizedUsername);
        return res.status(401).json({ success: false, message: "Senha incorreta" });
      }
    }

    console.log("Login successful for:", sanitizedUsername);
    res.json({ 
      success: true, 
      user: { 
        id: data.id, 
        username: data.username,
        role: data.role,
        hasBiometrics: !!data.biometric_credential
      } 
    });
  } catch (err: any) {
    console.error("Critical login error:", err);
    if (err.stack) console.error("Error stack:", err.stack);
    if (err.cause) console.error("Error cause:", err.cause);
    
    const isDnsError = err.message?.includes('ENOTFOUND') || err.cause?.message?.includes('ENOTFOUND') || err.code === 'ENOTFOUND';
    const isFetchFailed = err.message?.includes('fetch failed') || err.name === 'TypeError';
    
    if (isDnsError) {
      let sanitizedUrl = (process.env.VITE_SUPABASE_URL || "").trim();
      if (sanitizedUrl) {
        if (!sanitizedUrl.includes(".")) sanitizedUrl = `${sanitizedUrl}.supabase.co`;
        if (!sanitizedUrl.startsWith("http")) sanitizedUrl = `https://${sanitizedUrl}`;
        if (sanitizedUrl.endsWith("/")) sanitizedUrl = sanitizedUrl.slice(0, -1);
      }
      const projectId = sanitizedUrl.split('.')[0].replace('https://', '');
      const dashboardUrl = `https://supabase.com/dashboard/project/${projectId}`;
      
      return res.status(500).json({ 
        success: false, 
        message: `O projeto Supabase parece estar pausado ou a URL está incorreta. Por favor, reative-o ou verifique a URL no painel: ${dashboardUrl}` 
      });
    }

    if (isFetchFailed) {
      const cause = err.cause?.message || "Causa desconhecida";
      return res.status(500).json({ 
        success: false, 
        message: `Falha na conexão com o Supabase (fetch failed). Causa: ${cause}. Verifique se a URL nos Secrets está correta e começa com https://` 
      });
    }
    
    if (err.code === 'PGRST116' || err.message?.includes('relation "users" does not exist')) {
      return res.status(500).json({ 
        success: false, 
        message: "A tabela 'users' não foi encontrada. Por favor, execute o script SQL no painel do Supabase." 
      });
    }

    if (err.message?.includes('ENOTFOUND') || err.cause?.message?.includes('ENOTFOUND')) {
      return res.status(500).json({ 
        success: false, 
        message: "Erro de conexão (DNS): O endereço do Supabase não foi encontrado. Verifique se a URL está correta e se o projeto não está pausado no painel do Supabase." 
      });
    }

    res.status(500).json({ success: false, message: "Erro interno no servidor de autenticação: " + (err.message || "Erro desconhecido") });
  }
});

// --- WebAuthn Endpoints ---

app.post('/api/auth/generate-registration-options', async (req, res) => {
  const { username } = req.body;
  const sanitizedUsername = String(username || "").trim().toLowerCase();
  const client = getSupabase();
  
  const { data: user } = await client
    .from('users')
    .select('*')
    .eq('username', sanitizedUsername)
    .maybeSingle();

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: Buffer.from(user.id.toString()),
    userName: user.username,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  challenges.set(user.username, options.challenge);
  res.json(options);
});

app.post('/api/auth/verify-registration', async (req, res) => {
  const { username, body } = req.body;
  const sanitizedUsername = String(username || "").trim().toLowerCase();
  const client = getSupabase();
  
  const expectedChallenge = challenges.get(sanitizedUsername);
  if (!expectedChallenge) {
    return res.status(400).json({ error: 'Challenge não encontrado' });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      
      console.log("Registration verified for:", sanitizedUsername);
      console.log("Credential ID type:", typeof credential.id, Array.isArray(credential.id) ? "Array" : ((credential.id as any) instanceof Uint8Array ? "Uint8Array" : "Other"));
      
      // Store credential in database as Base64URL strings
      const { error } = await client
        .from('users')
        .update({
          biometric_credential: {
            id: toBase64URL(credential.id as any) as any,
            publicKey: toBase64URL(credential.publicKey) as any,
            counter: credential.counter,
            transports: body.response.transports,
          }
        })
        .eq('username', sanitizedUsername);

      if (error) {
        console.error("Error saving biometric credential:", JSON.stringify(error, null, 2));
        throw error;
      }
      
      res.json({ verified: true });
    } else {
      console.warn("Registration verification failed for:", username);
      res.status(400).json({ verified: false });
    }
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message });
  } finally {
    challenges.delete(username);
  }
});

app.post('/api/auth/generate-authentication-options', async (req, res) => {
  const { username } = req.body;
  const sanitizedUsername = String(username || "").trim().toLowerCase();
  const client = getSupabase();
  
  const { data: user } = await client
    .from('users')
    .select('*')
    .eq('username', sanitizedUsername)
    .maybeSingle();

  if (!user || !user.biometric_credential) {
    return res.status(404).json({ error: 'Biometria não configurada para este usuário' });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: [{
      id: fromBase64URL(user.biometric_credential.id) as any,
      transports: user.biometric_credential.transports,
    }],
    userVerification: 'preferred',
  });

  challenges.set(username, options.challenge);
  res.json(options);
});

app.post('/api/auth/verify-authentication', async (req, res) => {
  const { username, body } = req.body;
  const sanitizedUsername = String(username || "").trim().toLowerCase();
  const client = getSupabase();
  
  const { data: user } = await client
    .from('users')
    .select('*')
    .eq('username', sanitizedUsername)
    .maybeSingle();

  if (!user || !user.biometric_credential) {
    return res.status(404).json({ error: 'Usuário não encontrado ou biometria não configurada' });
  }

  const expectedChallenge = challenges.get(sanitizedUsername);
  if (!expectedChallenge) {
    return res.status(400).json({ error: 'Challenge não encontrado' });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: fromBase64URL(user.biometric_credential.id) as any,
        publicKey: fromBase64URL(user.biometric_credential.publicKey) as any,
        counter: user.biometric_credential.counter,
      },
    });

    if (verification.verified) {
      console.log("Authentication verified for:", username);
      // Update counter
      const { error: updateError } = await client
        .from('users')
        .update({
          biometric_credential: {
            ...user.biometric_credential,
            counter: verification.authenticationInfo.newCounter,
          }
        })
        .eq('id', user.id);

      if (updateError) {
        console.error("Error updating biometric counter:", JSON.stringify(updateError, null, 2));
      }

      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          username: user.username,
          role: user.role,
          hasBiometrics: true
        } 
      });
    } else {
      console.warn("Authentication verification failed for:", username);
      res.status(400).json({ success: false, message: 'Falha na verificação biométrica' });
    }
  } catch (error: any) {
    console.error("Authentication error:", error);
    res.status(400).json({ success: false, error: error.message });
  } finally {
    challenges.delete(username);
  }
});

// ... rest of API routes ...
// (Moving the rest of the logic outside or keeping it inside but ensuring app is exported)

app.put("/api/user/update", async (req, res) => {
  const client = getSupabase();
  const { id, username, password, role } = req.body;
  
  if (!id || !username || !password) {
    return res.status(400).json({ success: false, message: "Dados incompletos" });
  }

  const { error } = await client
    .from("users")
    .update({ username, password, role })
    .eq("id", id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Employees API
app.get("/api/employees", async (req, res) => {
  const client = getSupabase();
  const { data, error } = await client
    .from("employees")
    .select("*")
    .eq("active", true);
  
  if (error) return res.status(500).json({ error: error.message });
  
  // Map snake_case to camelCase
  const mappedData = (data || []).map((emp: any) => ({
    id: emp.id,
    name: emp.name,
    role: emp.role,
    dailyRate: emp.daily_rate,
    active: emp.active,
    cpf: emp.cpf,
    address: emp.address,
    pix_key: emp.pix_key
  }));
  
  res.json(mappedData);
});

app.post("/api/employees", async (req, res) => {
    const client = getSupabase();
    const { name, role, dailyRate, cpf, address, pix_key } = req.body;
    
    // Check for duplicate
    const { data: existing } = await client
      .from("employees")
      .select("id")
      .ilike("name", name)
      .eq("active", true)
      .maybeSingle();
      
    if (existing) {
      return res.status(400).json({ error: "Já existe um funcionário ativo com este nome." });
    }

    const { data, error } = await client
      .from("employees")
      .insert([{ 
        name, 
        role, 
        daily_rate: dailyRate, 
        active: true,
        cpf,
        address,
        pix_key
      }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.put("/api/employees/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    const { name, role, dailyRate, cpf, address, pix_key } = req.body;

    // Check for duplicate name (excluding current record)
    const { data: existing } = await client
      .from("employees")
      .select("id")
      .ilike("name", name)
      .eq("active", true)
      .neq("id", id)
      .maybeSingle();
      
    if (existing) {
      return res.status(400).json({ error: "Já existe outro funcionário ativo com este nome." });
    }

    const { error } = await client
      .from("employees")
      .update({ 
        name, 
        role, 
        daily_rate: dailyRate,
        cpf,
        address,
        pix_key
      })
      .eq("id", id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/employees/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    // Soft delete
    const { error, data } = await client
      .from("employees")
      .update({ active: false })
      .eq("id", id)
      .select();
    
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: "Funcionário não encontrado" });
    }
    res.json({ success: true });
  });

  // Shifts API
  app.get("/api/shifts", async (req, res) => {
    const client = getSupabase();
    const { data, error } = await client
      .from("shifts")
      .select(`
        *,
        employees!employee_id (
          name
        )
      `)
      .order("date", { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    
    // Map snake_case to camelCase and flatten employee name
    const flattenedData = (data || []).map((shift: any) => ({
      id: shift.id,
      employeeId: shift.employee_id,
      date: shift.date,
      amount: shift.amount,
      status: shift.status,
      notes: shift.notes,
      isHalfDay: shift.is_half_day,
      hoursWorked: shift.hours_worked,
      employeeName: shift.employees?.name
    }));
    
    res.json(flattenedData);
  });

  app.post("/api/shifts", async (req, res) => {
    const client = getSupabase();
    const { employeeId, date, amount, status, notes, isHalfDay, hoursWorked } = req.body;

    // Check for duplicate shift (same employee, same date)
    const { data: existing } = await client
      .from("shifts")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("date", date)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: "Este funcionário já possui uma diária registrada para esta data." });
    }

    const { data, error } = await client
      .from("shifts")
      .insert([{ 
        employee_id: employeeId, 
        date, 
        amount, 
        status, 
        notes, 
        is_half_day: !!isHalfDay, 
        hours_worked: hoursWorked 
      }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.put("/api/shifts/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    const { employeeId, date, amount, status, notes, isHalfDay, hoursWorked } = req.body;

    // Check for duplicate shift (same employee, same date, excluding current record)
    const { data: existing } = await client
      .from("shifts")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("date", date)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: "Este funcionário já possui outra diária registrada para esta data." });
    }

    const { error } = await client
      .from("shifts")
      .update({ 
        employee_id: employeeId, 
        date, 
        amount, 
        status, 
        notes, 
        is_half_day: !!isHalfDay, 
        hours_worked: hoursWorked 
      })
      .eq("id", id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.post("/api/shifts/bulk-delete", async (req, res) => {
    const client = getSupabase();
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "IDs inválidos" });
    }
    const { error } = await client
      .from("shifts")
      .delete()
      .in("id", ids);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/shifts/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    const { error, data } = await client
      .from("shifts")
      .delete()
      .eq("id", id)
      .select();
    
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: "Registro não encontrado" });
    }
    res.json({ success: true });
  });

  app.post("/api/system/reset", async (req, res) => {
    const client = getSupabase();
    try {
      const tables = ["production_steps", "production_orders", "shifts", "financial_transactions", "employees", "clients", "users"];
      for (const table of tables) {
        // Using a filter that matches all records to satisfy Supabase's requirement for a filter on delete
        await client.from(table).delete().neq("id", -1);
      }
      // Re-insert default users
      const defaultUsers = [
        { username: "admin", password: "admin", role: "admin" },
        { username: "fasbbrazil@gmail.com", password: "admin", role: "admin" },
        { username: "francielebrazil@gmail.com", password: "admin", role: "admin" }
      ];
      await client.from("users").upsert(defaultUsers, { onConflict: 'username' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: "Erro ao resetar banco de dados" });
    }
  });

  app.get("/api/system/backup", async (req, res) => {
    const client = getSupabase();
    const tables = ["employees", "shifts", "clients", "products", "production_orders", "production_steps", "financial_transactions", "users"];
    let sqlDump = "-- Supabase Data Backup\n";
    sqlDump += `-- Generated at: ${new Date().toISOString()}\n\n`;

    try {
      for (const table of tables) {
        const { data, error } = await client.from(table).select("*");
        if (error) {
          sqlDump += `-- Error fetching ${table}: ${error.message}\n\n`;
          continue;
        }

        if (data && data.length > 0) {
          sqlDump += `-- Data for table: ${table}\n`;
          const columns = Object.keys(data[0]);
          
          for (const row of data) {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return "NULL";
              if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
              if (typeof val === "boolean") return val ? "true" : "false";
              if (val instanceof Date) return `'${val.toISOString()}'`;
              if (Array.isArray(val)) {
                if (val.length === 0) return "'{}'::TEXT[]";
                const arrayVals = val.map(v => `'${String(v).replace(/'/g, "''")}'`).join(", ");
                return `ARRAY[${arrayVals}]::TEXT[]`;
              }
              if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              return val;
            });
            sqlDump += `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")});\n`;
          }
          sqlDump += "\n";
        } else {
          sqlDump += `-- Table ${table} is empty\n\n`;
        }
      }

      res.setHeader("Content-Type", "text/sql");
      res.setHeader("Content-Disposition", `attachment; filename=backup_${new Date().toISOString().split('T')[0]}.sql`);
      res.send(sqlDump);
    } catch (err: any) {
      res.status(500).json({ error: "Erro ao gerar backup: " + err.message });
    }
  });

  // Clients API
  app.get("/api/clients", async (req, res) => {
    const client = getSupabase();
    const { data, error } = await client.from("clients").select("*").eq("active", true);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/clients", async (req, res) => {
    const client = getSupabase();
    const { name, email, phone, address } = req.body;
    
    // Check for duplicate
    const { data: existing } = await client
      .from("clients")
      .select("id")
      .ilike("name", name)
      .eq("active", true)
      .maybeSingle();
      
    if (existing) {
      return res.status(400).json({ error: "Já existe um cliente ativo com este nome." });
    }

    const { data, error } = await client.from("clients").insert([{ name, email, phone, address, active: true }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.put("/api/clients/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    // Check for duplicate name (excluding current record)
    const { data: existing } = await client
      .from("clients")
      .select("id")
      .ilike("name", name)
      .eq("active", true)
      .neq("id", id)
      .maybeSingle();
      
    if (existing) {
      return res.status(400).json({ error: "Já existe outro cliente ativo com este nome." });
    }

    const { error } = await client.from("clients").update({ name, email, phone, address }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/clients/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    const { error } = await client.from("clients").update({ active: false }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Products API Helpers to store productionValue dynamically in the database
  const serializeTechnicalSheet = (productionValue: any, technicalSheet: string | undefined): string => {
    const cleanVal = productionValue !== undefined && productionValue !== null && !isNaN(Number(productionValue)) ? Number(productionValue) : 0;
    if (cleanVal > 0) {
      return `[VALOR_PRODUCAO: ${cleanVal}]\n${technicalSheet || ''}`;
    }
    return technicalSheet || '';
  };

  const deserializeTechnicalSheet = (sheet: string | undefined) => {
    if (!sheet) return { productionValue: 0, technicalSheet: '' };
    const match = sheet.match(/^\[VALOR_PRODUCAO:\s*([0-9.]+)\s*\]\r?\n?/);
    if (match) {
      const value = parseFloat(match[1]);
      const text = sheet.substring(match[0].length);
      return { productionValue: isNaN(value) ? 0 : value, technicalSheet: text };
    }
    return { productionValue: 0, technicalSheet: sheet };
  };

  // Products API
  app.get("/api/products", async (req, res) => {
    const client = getSupabase();
    const { data, error } = await client.from("products").select("*").eq("active", true);
    if (error) return res.status(500).json({ error: error.message });
    const mapped = (data || []).map((p: any) => {
      const deserialized = deserializeTechnicalSheet(p.technical_sheet);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        technicalSheet: deserialized.technicalSheet,
        productionValue: deserialized.productionValue,
        photos: p.photos || [],
        colors: p.colors || [],
        sizes: p.sizes || [],
        active: p.active
      };
    });
    res.json(mapped);
  });

  app.post("/api/products", async (req, res) => {
    const client = getSupabase();
    const { name, sku, category, technicalSheet, photos, colors, sizes, productionValue } = req.body;
    
    // Check for duplicate name
    const { data: existingName } = await client
      .from("products")
      .select("id")
      .ilike("name", name)
      .eq("active", true)
      .maybeSingle();
      
    if (existingName) {
      return res.status(400).json({ error: "Já existe um produto ativo com este nome." });
    }

    // Check for duplicate SKU if provided
    if (sku) {
      const { data: existingSku } = await client
        .from("products")
        .select("id")
        .eq("sku", sku)
        .eq("active", true)
        .maybeSingle();
        
      if (existingSku) {
        return res.status(400).json({ error: "Já existe um produto ativo com este SKU." });
      }
    }

    const compiledTechnicalSheet = serializeTechnicalSheet(productionValue, technicalSheet);

    const { data, error } = await client.from("products").insert([{ 
      name, 
      sku, 
      category, 
      technical_sheet: compiledTechnicalSheet, 
      photos: photos || [], 
      colors: colors || [],
      sizes: sizes || [],
      active: true 
    }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    
    const deserialized = deserializeTechnicalSheet(data.technical_sheet);
    res.json({
      id: data.id,
      name: data.name,
      sku: data.sku,
      category: data.category,
      technicalSheet: deserialized.technicalSheet,
      productionValue: deserialized.productionValue,
      photos: data.photos || [],
      colors: data.colors || [],
      sizes: data.sizes || [],
      active: data.active
    });
  });

  app.put("/api/products/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    const { name, sku, category, technicalSheet, photos, colors, sizes, productionValue } = req.body;

    // Check for duplicate name (excluding current record)
    const { data: existingName } = await client
      .from("products")
      .select("id")
      .ilike("name", name)
      .eq("active", true)
      .neq("id", id)
      .maybeSingle();
      
    if (existingName) {
      return res.status(400).json({ error: "Já existe outro produto ativo com este nome." });
    }

    // Check for duplicate SKU if provided (excluding current record)
    if (sku) {
      const { data: existingSku } = await client
        .from("products")
        .select("id")
        .eq("sku", sku)
        .eq("active", true)
        .neq("id", id)
        .maybeSingle();
        
      if (existingSku) {
        return res.status(400).json({ error: "Já existe outro produto ativo com este SKU." });
      }
    }

    const compiledTechnicalSheet = serializeTechnicalSheet(productionValue, technicalSheet);

    const { error } = await client.from("products").update({ 
      name, 
      sku, 
      category, 
      technical_sheet: compiledTechnicalSheet, 
      photos: photos || [],
      colors: colors || [],
      sizes: sizes || []
    }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/products/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    const { error } = await client.from("products").update({ active: false }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Production Orders API
  app.get("/api/production-orders", async (req, res) => {
    const client = getSupabase();
    const { data, error } = await client.from("production_orders").select("*, clients!client_id(name), products!product_id(name)").order("start_date", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    const mapped = (data || []).map((o: any) => {
      let items = o.items_breakdown || [];
      // Normalize old structure to new structure if needed
      if (Array.isArray(items) && items.length > 0 && !items[0].productId && items[0].color) {
        items = [{
          productId: o.product_id,
          productName: o.products?.name,
          quantity: o.total_pieces,
          itemsBreakdown: items
        }];
      }
      
      return {
        id: o.id,
        description: o.description,
        clientId: o.client_id,
        clientName: o.clients?.name,
        productId: o.product_id,
        productName: o.products?.name,
        totalPieces: o.total_pieces,
        unitPrice: o.unit_price,
        totalValue: o.total_value,
        orderNumber: o.order_number,
        status: o.status,
        priority: o.priority || 'medium',
        startDate: o.start_date,
        endDate: o.end_date,
        items: items,
        itemsBreakdown: items
      };
    });
    res.json(mapped);
  });

  app.post("/api/production-orders", async (req, res) => {
    const client = getSupabase();
    const { description, clientId, productId, totalPieces, status, priority, startDate, unitPrice, totalValue, itemsBreakdown, items } = req.body;

    // Generate automatic 6-digit order number
    const { data: lastOrder } = await client
      .from("production_orders")
      .select("order_number")
      .order("order_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNumber = 1;
    if (lastOrder && lastOrder.order_number) {
      nextNumber = parseInt(lastOrder.order_number, 10) + 1;
    }
    const orderNumber = String(nextNumber).padStart(6, '0');

    const { data, error } = await client.from("production_orders").insert([{ 
      description, 
      client_id: clientId, 
      product_id: productId,
      total_pieces: totalPieces, 
      unit_price: unitPrice,
      total_value: totalValue,
      order_number: orderNumber,
      status, 
      priority: priority || 'medium',
      start_date: startDate,
      items_breakdown: items || itemsBreakdown || []
    }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.put("/api/production-orders/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    const { description, clientId, productId, totalPieces, status, priority, startDate, endDate, unitPrice, totalValue, itemsBreakdown, items } = req.body;

    console.log("PUT /api/production-orders/:id - Update request");
    console.log("ID:", id);
    console.log("Received body:", JSON.stringify({ description, clientId, productId, totalPieces, status, priority, startDate, endDate, unitPrice, totalValue, items: items ? `[Array of ${items.length} items]` : 'null', itemsBreakdown: itemsBreakdown ? `[Array of ${itemsBreakdown.length} items]` : 'null' }, null, 2));

    const updateData = {
      description, 
      client_id: clientId, 
      product_id: productId,
      total_pieces: totalPieces, 
      unit_price: unitPrice,
      total_value: totalValue,
      status, 
      priority,
      start_date: startDate, 
      end_date: endDate,
      items_breakdown: items || itemsBreakdown || []
    };

    console.log("Update data:", JSON.stringify(updateData, null, 2));

    const { error } = await client.from("production_orders").update(updateData).eq("id", id);
    if (error) {
      console.error("Update error:", error);
      return res.status(500).json({ error: error.message });
    }
    console.log("Update successful for order ID:", id);
    res.json({ success: true });
  });

  app.delete("/api/production-orders/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    // First delete related steps
    await client.from("production_steps").delete().eq("order_id", id);
    const { error } = await client.from("production_orders").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Production Steps API
  app.get("/api/production-steps", async (req, res) => {
    const client = getSupabase();
    const { data, error } = await client.from("production_steps").select(`*, employees!employee_id(name)` ).order("date", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    const mapped = (data || []).map((s: any) => ({
      id: s.id,
      orderId: s.order_id,
      employeeId: s.employee_id,
      employeeName: s.employees?.name,
      stepType: s.step_type,
      quantity: s.quantity,
      date: s.date
    }));
    res.json(mapped);
  });

  app.post("/api/production-steps", async (req, res) => {
    const client = getSupabase();
    const { orderId, employeeId, stepType, quantity, date } = req.body;
    const { data, error } = await client.from("production_steps").insert([{ order_id: orderId, employee_id: employeeId, step_type: stepType, quantity, date }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.delete("/api/production-steps/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    const { error } = await client.from("production_steps").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Financial Transactions API
  app.get("/api/financial-transactions", async (req, res) => {
    const client = getSupabase();
    const { data, error } = await client.from("financial_transactions").select("*").order("date", { ascending: false }).order("id", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    
    const mappedData = (data || []).map((t: any) => ({
      id: t.id,
      type: t.type,
      category: t.category,
      amount: t.amount,
      paidAmount: t.paid_amount || 0,
      date: t.date,
      description: t.description,
      relatedId: t.related_id,
      clientName: t.client_name,
      status: t.status || 'completed',
      dueDate: t.due_date,
      finishedDate: t.finished_date,
      reconciled: t.reconciled || false
    }));
    
    res.json(mappedData);
  });

  app.post("/api/financial-transactions", async (req, res) => {
    const client = getSupabase();
    const { type, category, amount, paidAmount, date, description, relatedId, clientName, status, dueDate, finishedDate, reconciled } = req.body;

    // Check for duplicate transaction (same description, amount, date, type)
    const { data: existing } = await client
      .from("financial_transactions")
      .select("id")
      .ilike("description", description)
      .eq("amount", amount)
      .eq("date", date)
      .eq("type", type)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: "Já existe uma transação idêntica (mesma descrição, valor, data e tipo) registrada." });
    }

    const { data, error } = await client.from("financial_transactions").insert([{ 
      type, 
      category, 
      amount, 
      paid_amount: paidAmount || 0,
      date, 
      description, 
      related_id: relatedId,
      client_name: clientName,
      status: status || 'completed',
      due_date: dueDate,
      finished_date: finishedDate,
      reconciled: !!reconciled
    }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.put("/api/financial-transactions/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    const { type, category, amount, paidAmount, date, description, clientName, status, dueDate, finishedDate, reconciled } = req.body;

    // Check for duplicate transaction (same description, amount, date, type, excluding current record)
    const { data: existing } = await client
      .from("financial_transactions")
      .select("id")
      .ilike("description", description)
      .eq("amount", amount)
      .eq("date", date)
      .eq("type", type)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: "Já existe outra transação idêntica (mesma descrição, valor, data e tipo) registrada." });
    }

    const { error } = await client.from("financial_transactions").update({ 
      type, 
      category, 
      amount, 
      paid_amount: paidAmount,
      date, 
      description, 
      client_name: clientName,
      status, 
      due_date: dueDate, 
      finished_date: finishedDate,
      reconciled 
    }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/financial-transactions/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    const { error } = await client.from("financial_transactions").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Defects API
  app.get("/api/defects", async (req, res) => {
    const client = getSupabase();
    const { data, error } = await client
      .from("defects")
      .select("*, production_orders!order_id(order_number, description)")
      .order("date", { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    
    const mapped = (data || []).map((d: any) => ({
      id: d.id,
      orderId: d.order_id,
      orderNumber: d.production_orders?.order_number,
      orderDescription: d.production_orders?.description,
      type: d.type,
      quantity: d.quantity,
      reason: d.reason,
      date: d.date
    }));
    
    res.json(mapped);
  });

  app.post("/api/defects", async (req, res) => {
    const client = getSupabase();
    const { orderId, type, quantity, reason, date } = req.body;
    
    if (!type || !quantity || !date) {
      return res.status(400).json({ error: "Dados obrigatórios ausentes (tipo, quantidade ou data)." });
    }

    const { data, error } = await client
      .from("defects")
      .insert([{ 
        order_id: orderId || null, 
        type, 
        quantity, 
        reason, 
        date 
      }])
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting defect:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, id: data.id });
  });

  app.delete("/api/defects/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    const { error } = await client.from("defects").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Repairs API
  app.get("/api/repairs", async (req, res) => {
    const client = getSupabase();
    const { data, error } = await client
      .from("repairs")
      .select("*, products!product_id(name)")
      .order("date", { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    
    const mapped = (data || []).map((d: any) => ({
      id: d.id,
      productId: d.product_id,
      productName: d.products?.name,
      type: d.type,
      quantity: d.quantity,
      color: d.color,
      size: d.size,
      date: d.date,
      notes: d.notes
    }));
    
    res.json(mapped);
  });

  app.post("/api/repairs", async (req, res) => {
    const client = getSupabase();
    const { productId, type, quantity, color, size, date, notes, items } = req.body;
    
    if (!productId || !type || !date) {
      return res.status(400).json({ error: "Dados obrigatórios ausentes (produto, tipo ou data)." });
    }

    if (items && Array.isArray(items)) {
      if (items.length === 0) {
        return res.status(400).json({ error: "Adicione pelo menos um item para o concerto." });
      }

      const inserts = items.map((item: any) => ({
        product_id: productId,
        type,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        date,
        notes
      }));
      
      const { error } = await client.from("repairs").insert(inserts);
      if (error) {
        console.error("Error inserting repairs (bulk):", error);
        return res.status(500).json({ error: error.message });
      }
      return res.json({ success: true });
    }

    if (!quantity || !color || !size) {
      return res.status(400).json({ error: "Dados obrigatórios ausentes para o item (quantidade, cor ou tamanho)." });
    }

    const { data, error } = await client
      .from("repairs")
      .insert([{ 
        product_id: productId, 
        type, 
        quantity, 
        color, 
        size, 
        date, 
        notes 
      }])
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting repair (single):", error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, id: data.id });
  });

  app.delete("/api/repairs/:id", async (req, res) => {
    const client = getSupabase();
    const { id } = req.params;
    const { error } = await client.from("repairs").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // --- Company Settings Routes ---
  app.get("/api/company-settings", async (req, res) => {
    const client = getSupabase();
    const { data, error } = await client
      .from("company_settings")
      .select("*")
      .eq("id", 1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }
    
    // If not found, return default
    if (!data) {
      return res.json({ id: 1, name: "Confecção Pro" });
    }
    
    res.json(data);
  });

  app.put("/api/company-settings", async (req, res) => {
    const client = getSupabase();
    const { name, document_type, document_number, state_registration, rg, address, logo_url } = req.body;
    
    const { data, error } = await client
      .from("company_settings")
      .upsert({ 
        id: 1, 
        name, 
        document_type, 
        document_number, 
        state_registration, 
        rg, 
        address, 
        logo_url,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
  });

// Catch-all for unmatched API routes
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `Rota de API não encontrada: ${req.method} ${req.path}` });
});

// Global error handler for API routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error handler:", err);
  if (req.path.startsWith("/api/")) {
    return res.status(err.status || 500).json({ 
      error: "Erro interno no servidor", 
      message: err.message || "Erro desconhecido",
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  next(err);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite not found, skipping middleware");
    }
  } else if (!process.env.VERCEL) {
    // Only serve static files here if NOT on Vercel
    // Vercel handles static files via vercel.json
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

export default app;
