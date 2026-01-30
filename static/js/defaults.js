// static/js/defaults.js
window.ResumeDefaults = {
    getSafeDefaults() {
        let data = window.hugoDefaultData;
        if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { data = null; } }
        
        // FIX: Ensure default font includes 'sans-serif' fallback matching the dropdown options
        const base = {
            theme: { font: "'Lato', sans-serif", sidebar_color: "#0b1120" },
            profile: { name: "", tagline: "", location: "", email: "", phone: "", linkedin: "", summary: "", impact_statement: "", image: "", image_align: "center center" },
            personal_details: { dob: "", nationality: "Indian", marital_status: "Single", languages: ["English"] },
            signature_achievements: [], experience: [], education: [], certifications: [], skills: [], custom_sections: [] 
        };

        const merged = { 
            ...base, ...data, 
            profile: { ...base.profile, ...(data?.profile || {}) },
            signature_achievements: data?.signature_achievements || [],
            experience: data?.experience || [],
            education: data?.education || [],
            certifications: data?.certifications || [],
            skills: data?.skills || [],
            custom_sections: data?.custom_sections || []
        };
        if (!merged.theme) merged.theme = base.theme;
        return merged;
    },
    
    getNewItem(section) {
        const defaults = {
            experience: { 
                role: "New Role", company: "Company", 
                startDate: new Date().toISOString().slice(0, 7), isCurrent: true, 
                achievements: "<ul><li>Add details here...</li></ul>" 
            },
            education: { 
                degree: "Degree", institution: "Institute", 
                startDate: "2020-01", endDate: "2024-05", details: "<p>Details...</p>" 
            },
            certifications: { name: "Cert Name", start: "2024", end: "Present", icon: "fas fa-certificate" },
            skills: { category: "NEW", list: [{ name: "Skill", level: 3 }] },
            signature_achievements: { title: "Title", icon: "fas fa-star", description: "<p>Impact...</p>" },
            custom_sections: { title: "Section", content: ["<p>Point 1</p>"] }
        };
        return defaults[section] ? JSON.parse(JSON.stringify(defaults[section])) : null;
    }
};