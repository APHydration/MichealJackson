type AppEnv = {
  appUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  youtubeApiKey: string;
  cronSecret: string;
  youtubeSyncLookbackDays: number;
};

type BrowserEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getEnv(): AppEnv {
  return {
    appUrl: required("NEXT_PUBLIC_APP_URL"),
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    youtubeApiKey: required("YOUTUBE_API_KEY"),
    cronSecret: required("CRON_SECRET"),
    youtubeSyncLookbackDays: Number(process.env.YOUTUBE_SYNC_LOOKBACK_DAYS ?? 120),
  };
}

export function getBrowserEnv(): BrowserEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export function getEnvSnapshot() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
    cronSecret: process.env.CRON_SECRET,
    youtubeSyncLookbackDays: Number(process.env.YOUTUBE_SYNC_LOOKBACK_DAYS ?? 120),
  };
}

export function getEnvChecklist() {
  return [
    { name: "NEXT_PUBLIC_APP_URL", present: Boolean(process.env.NEXT_PUBLIC_APP_URL) },
    { name: "NEXT_PUBLIC_SUPABASE_URL", present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) },
    { name: "SUPABASE_SERVICE_ROLE_KEY", present: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { name: "YOUTUBE_API_KEY", present: Boolean(process.env.YOUTUBE_API_KEY) },
    { name: "CRON_SECRET", present: Boolean(process.env.CRON_SECRET) },
  ];
}
