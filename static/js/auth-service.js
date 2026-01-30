// static/js/auth-service.js
(function() {
    // 1. Configuration
    // Replace these with your actual project details from Supabase > Settings > API
    const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE'; 
    const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

    // 2. Initialize Client safely
    let sbClient = null;
    
    // Check if Supabase library is loaded AND if keys are valid (not placeholders)
    if (window.supabase && SUPABASE_URL.startsWith('http') && !SUPABASE_URL.includes('YOUR_SUPABASE')) {
        try {
            sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        } catch (e) {
            console.warn("Supabase initialization failed:", e.message);
        }
    } else {
        console.log("Supabase client not initialized (Missing valid URL/Key). Skipping cloud features.");
    }

    // 3. Expose Global Service
    window.AuthService = {
        async getUser() {
            if (!sbClient) return null;
            const { data } = await sbClient.auth.getUser();
            return data.user;
        },

        async login(email) {
            if (!sbClient) {
                alert("Cloud features are disabled. Please configure Supabase URL in auth-service.js");
                return { error: { message: "Supabase not initialized" } };
            }
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