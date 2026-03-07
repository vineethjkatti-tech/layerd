import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://kdqhjcncsskyxtfhnkev.supabase.co"
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcWhqY25jc3NreXh0Zmhua2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTA1MTgsImV4cCI6MjA4Nzg2NjUxOH0.gy8KX-gAvIWXt0I-LQsU27J1dKycH_NKQrj_LHjdS18"

export const supabase = createClient(supabaseUrl, supabaseKey)
