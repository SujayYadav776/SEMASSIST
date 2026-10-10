#!/usr/bin/env node
/**
 * Point Supabase Auth at a transactional email provider's SMTP server, so its
 * own emails (sign-up confirmation, resend, password reset) can actually be
 * delivered.
 *
 * Why this is needed: an out-of-the-box Supabase project only delivers auth
 * mail to the addresses on the project team, at 2 messages/hour. For anyone
 * else `POST /auth/v1/signup` answers 500
 * `{"error_code":"unexpected_failure","msg":"Error sending confirmation email"}`
 * and no account can ever be confirmed. This project hit exactly that.
 *
 * There is no public endpoint the dashboard can call to fix it — custom SMTP is
 * a Management API change performed by a project owner. This script performs
 * that one call reproducibly instead of clicking through the dashboard, and
 * reads the result back so you can see it took.
 *
 * Safe by default: prints what it would do and changes nothing. Pass --apply to
 * write. It does NOT change whether email confirmation is required
 * (`mailer_autoconfirm`) — see the note printed in the summary.
 *
 * Usage:
 *   # Resend (host/port/user are fixed, so only the API key is needed)
 *   SUPABASE_ACCESS_TOKEN=sbp_... \
 *   SUPABASE_PROJECT_REF=nrxbelpmydquivcphxry \
 *   RESEND_API_KEY=re_... \
 *   SMTP_SENDER_EMAIL=no-reply@yourdomain.com \
 *   SMTP_SENDER_NAME="SEM ASSIST" \
 *   node scripts/configure-auth-smtp.mjs --provider resend --apply
 *
 *   # Any other SMTP provider
 *   ... SMTP_HOST=... SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... \
 *   node scripts/configure-auth-smtp.mjs --provider generic --apply
 *
 * Get a Management API token at https://supabase.com/dashboard/account/tokens.
 * Never commit it — put these in .env.local (git-ignored) and read them from
 * the environment. `npm run smtp:configure` passes --env-file-if-exists, so the
 * npm path picks .env.local up automatically; the raw `node scripts/...` form
 * above expects the variables to already be exported.
 */

import process from "node:process";

const API_BASE = "https://api.supabase.com/v1/projects";

// Providers whose SMTP host/port/username are fixed, so the owner only has to
// supply the secret. Password convention follows each provider's own docs.
const PROVIDERS = {
  resend: {
    label: "Resend",
    host: "smtp.resend.com",
    port: 465, // implicit SSL/TLS
    user: "resend",
    passwordVar: "RESEND_API_KEY",
    passwordHint: "an API key from https://resend.com/api-keys",
    docs: "https://resend.com/docs/send-with-supabase-smtp",
  },
};

function parseArgs(argv) {
  const options = { apply: false, help: false, badArg: null, provider: "generic" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") options.apply = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--provider") options.provider = argv[++i];
    else if (arg.startsWith("--provider=")) options.provider = arg.split("=")[1];
    // Tracked separately from --help: a mistyped flag is a failure, not a
    // request for help, and must not exit 0 (a typo would read as success).
    else options.badArg = arg;
  }
  return options;
}

const HELP = `Configure Supabase Auth custom SMTP.

  node scripts/configure-auth-smtp.mjs [--provider resend|generic] [--apply]

  --provider resend   Use Resend's fixed SMTP host/port/username and read the
                      password from RESEND_API_KEY. (default: generic)
  --apply             Actually write the change. Without it, nothing is sent.
  --help              Show this message.

Required environment:
  SUPABASE_ACCESS_TOKEN   Management API token (https://supabase.com/dashboard/account/tokens)
  SUPABASE_PROJECT_REF    Project ref, e.g. nrxbelpmydquivcphxry
  SMTP_SENDER_EMAIL       From address, e.g. no-reply@yourdomain.com
  SMTP_SENDER_NAME        From name, e.g. SEM ASSIST

Required for --provider generic:
  SMTP_HOST  SMTP_PORT  SMTP_USER  SMTP_PASS

Required for --provider resend:
  RESEND_API_KEY
`;

/** Reads the environment, returning the SMTP config or a list of problems. */
function buildConfig(provider) {
  const env = process.env;
  const missing = [];
  const required = (name) => {
    const value = String(env[name] ?? "").trim();
    if (!value) missing.push(name);
    return value;
  };

  const token = required("SUPABASE_ACCESS_TOKEN");
  const projectRef = required("SUPABASE_PROJECT_REF");
  const senderEmail = required("SMTP_SENDER_EMAIL");
  const senderName = required("SMTP_SENDER_NAME");

  const preset = PROVIDERS[provider];
  let host;
  let port;
  let user;
  let pass;
  if (preset) {
    host = preset.host;
    port = preset.port;
    user = preset.user;
    pass = required(preset.passwordVar);
  } else {
    host = required("SMTP_HOST");
    port = Number(required("SMTP_PORT"));
    user = required("SMTP_USER");
    pass = required("SMTP_PASS");
    if (host && Number.isNaN(port)) {
      missing.push("SMTP_PORT (must be a number, e.g. 587)");
    }
  }

  if (senderEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(senderEmail)) {
    missing.push(`SMTP_SENDER_EMAIL (not a valid address: ${senderEmail})`);
  }

  return {
    token,
    projectRef,
    missing,
    // The body Supabase documents for custom SMTP. `external_email_enabled`
    // re-asserts that email/password auth is on; mailer_autoconfirm is left
    // alone so this script never silently changes your confirmation policy.
    body: {
      external_email_enabled: true,
      smtp_admin_email: senderEmail,
      smtp_sender_name: senderName,
      smtp_host: host,
      smtp_port: port,
      smtp_user: user,
      smtp_pass: pass,
    },
  };
}

/** Hides the password before anything is logged. */
const redacted = (body) => ({ ...body, smtp_pass: body.smtp_pass ? "***" : "" });

async function request(token, url, init) {
  let response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    return { ok: false, status: 0, detail: `network error: ${error.message}` };
  }
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  return {
    ok: response.ok,
    status: response.status,
    data: parsed,
    detail: parsed?.message ?? text.slice(0, 300),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.badArg) {
    console.error(`Unknown argument: ${options.badArg}\n`);
    console.error(HELP);
    process.exitCode = 2;
    return;
  }
  if (options.help) {
    console.log(HELP);
    return;
  }
  if (!PROVIDERS[options.provider] && options.provider !== "generic") {
    console.error(
      `Unknown provider "${options.provider}". Known: generic, ${Object.keys(PROVIDERS).join(", ")}`
    );
    process.exitCode = 2;
    return;
  }

  const { token, projectRef, missing, body } = buildConfig(options.provider);
  if (missing.length) {
    console.error("Missing or invalid configuration:");
    for (const item of missing) console.error(`  - ${item}`);
    console.error("\nRun with --help for the full list.");
    process.exitCode = 2;
    return;
  }

  const url = `${API_BASE}/${projectRef}/config/auth`;
  const preset = PROVIDERS[options.provider];
  console.log(`Provider:      ${preset ? preset.label : "custom SMTP"}`);
  console.log(`Project:       ${projectRef}`);
  console.log(`SMTP server:   ${body.smtp_host}:${body.smtp_port} (user ${body.smtp_user})`);
  console.log(`Sender:        ${body.smtp_sender_name} <${body.smtp_admin_email}>`);
  if (preset) console.log(`Provider docs: ${preset.docs}`);

  if (!options.apply) {
    console.log("\nDry run — nothing was sent. Planned PATCH body:");
    console.log(JSON.stringify(redacted(body), null, 2));
    console.log(`\nTarget: PATCH ${url}`);
    console.log("Re-run with --apply to write it.");
    return;
  }

  const written = await request(token, url, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!written.ok) {
    console.error(`\nFailed (HTTP ${written.status}): ${written.detail}`);
    if (written.status === 401 || written.status === 403) {
      console.error(
        "Check SUPABASE_ACCESS_TOKEN — it must be a personal access token from\nhttps://supabase.com/dashboard/account/tokens with access to this project."
      );
    }
    // Set exitCode rather than calling process.exit(): exiting inside a live
    // fetch leaves undici's sockets mid-close, which on Windows trips a libuv
    // assertion and replaces the real code with 127.
    process.exitCode = 1;
    return;
  }
  console.log("\nApplied.");

  const check = await request(token, url, { method: "GET" });
  if (!check.ok) {
    console.log(`Could not read the config back (HTTP ${check.status}).`);
    return;
  }
  const current = check.data ?? {};
  console.log("Supabase Auth now reports:");
  console.log(`  smtp_host:            ${current.smtp_host}`);
  console.log(`  smtp_port:            ${current.smtp_port}`);
  console.log(`  smtp_user:            ${current.smtp_user}`);
  console.log(`  smtp_admin_email:     ${current.smtp_admin_email}`);
  console.log(`  smtp_sender_name:     ${current.smtp_sender_name}`);
  console.log(`  mailer_autoconfirm:   ${current.mailer_autoconfirm}`);

  if (current.mailer_autoconfirm === true) {
    console.log(
      "\nNote: mailer_autoconfirm is TRUE, so Supabase is not sending confirmation\nemails at all and this SMTP config is unused. That is fine if you meant to skip\nconfirmation; otherwise turn Confirm email back on in Authentication → Sign In /\nProviders → Email."
    );
  } else {
    console.log(
      "\nConfirmation emails now go out through the provider above. A new project on\ncustom SMTP is rate-limited to 30 messages/hour — raise it in Authentication →\nRate Limits once you have checked the provider accepts the volume."
    );
  }
  console.log(
    "\nVerify end to end: sign up with a real address, then watch the send appear in\nthe provider's dashboard (Resend: https://resend.com/emails)."
  );
}

main().catch((error) => {
  console.error(`Unexpected failure: ${error?.message ?? error}`);
  process.exitCode = 1;
});
