// static/js/auth-service.js

// 1. Configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

// 2. Initialize Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 3. Auth Service Class
export const AuthService = {
    async getUser() {
        const { data } = await supabase.auth.getUser();
        return data.user;
    },

    async login(email) {
        return await supabase.auth.signInWithOtp({ email });
    },

    async logout() {
        return await supabase.auth.signOut();
    },

    // Save Resume Data (Upsert: Create or Update)
    async saveResume(userId, resumeData) {
        return await supabase
            .from('resumes')
            .upsert({ 
                user_id: userId, 
                content: resumeData,
                updated_at: new Date()
            }, { onConflict: 'user_id' });
    },

    // Load Resume Data
    async loadResume(userId) {
        const { data, error } = await supabase
            .from('resumes')
            .select('content')
            .eq('user_id', userId)
            .single();
        
        return { data: data?.content, error };
    }
};