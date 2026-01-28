// static/js/auth-service.js
(function() {
    // 1. Configuration
    const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
    const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

    // 2. Initialize Client safely
    // We rename the local variable to 'sbClient' to avoid conflict with the global 'supabase' library
    let sbClient = null;
    
    if (window.supabase) {
        sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.error("Supabase library not loaded. Check head.html");
    }

    // 3. Expose Global Service
    window.AuthService = {
        async getUser() {
            if (!sbClient) return null;
            const { data } = await sbClient.auth.getUser();
            return data.user;
        },

        async login(email) {
            if (!sbClient) return { error: { message: "Supabase not initialized" } };
            return await sbClient.auth.signInWithOtp({ email });
        },

        async logout() {
            if (!sbClient) return;
            return await sbClient.auth.signOut();
        },

        async saveResume(userId, resumeData) {
            if (!sbClient) return { error: { message: "Supabase not initialized" } };
            return await sbClient
                .from('resumes')
                .upsert({ 
                    user_id: userId, 
                    content: resumeData,
                    updated_at: new Date()
                }, { onConflict: 'user_id' });
        },

        async loadResume(userId) {
            if (!sbClient) return { data: null, error: "Supabase not initialized" };
            const { data, error } = await sbClient
                .from('resumes')
                .select('content')
                .eq('user_id', userId)
                .single();
            
            return { data: data?.content, error };
        }
    };
})();