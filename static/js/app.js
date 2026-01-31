// static/js/app.js
const resumeAppData = () => ({
    ...window.imageEditorMixin(),
    ...window.crudMixin(),
    ...window.previewMixin(),
    user: null, loading: false, isDirty: false,
    activeTab: 'about', showThemePanel: false, 
    
    resume: window.ResumeDefaults.getSafeDefaults(),

    async init() {
        console.log("Resume App Initialized");
        const localData = localStorage.getItem('localResumeDraft');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                this.resume = { ...this.resume, ...parsed };
                
                // MIGRATION: Array -> String
                if (this.resume.experience) {
                    this.resume.experience.forEach(job => {
                        if (Array.isArray(job.achievements)) {
                            const listItems = job.achievements.map(a => `<li>${a}</li>`).join("");
                            job.achievements = `<ul>${listItems}</ul>`;
                        }
                    });
                }
                if (!this.resume.theme) this.resume.theme = { font: "Lato", sidebar_color: "#0b1120" };
            } catch (e) { console.error("Error loading local data:", e); }
        }

        const savedTab = localStorage.getItem('activeTab');
        if (savedTab) this.activeTab = savedTab;

        this.updateTheme();
        this.$watch('resume.theme', () => this.updateTheme());
        this.$watch('activeTab', (val) => localStorage.setItem('activeTab', val));
        this.$watch('resume', (val) => {
            this.isDirty = true;
            localStorage.setItem('localResumeDraft', JSON.stringify(val));
        });

        if (window.AuthService) {
            try {
                this.user = await window.AuthService.getUser();
                if (this.user) await this.syncFromCloud();
            } catch (e) { console.error(e); }
        }
    },

    setTab(tabName) {
        this.activeTab = tabName;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    updateTheme() {
        const r = document.documentElement;
        if (this.resume.theme) {
            r.style.setProperty('--sidebar-bg', this.resume.theme.sidebar_color);
            r.style.setProperty('--doc-font', this.resume.theme.font);
        }
    },
    
    resetThemeOnly() { 
        this.resume.theme = { font: "Lato", sidebar_color: "#0b1120" }; 
        this.updateTheme(); 
    },

    // Bridge functions for HTML access
    resize(el) { window.ResumeHelpers.resize(el); },
    promptIcon(item) { window.ResumeHelpers.promptIcon(item); },
    exportToWord() { window.ResumeHelpers.exportToWord(); },
    formatDate(dateStr) { return formatDate(dateStr); },

    async login() { const e = prompt("Email:"); if(e && window.AuthService) window.AuthService.login(e).then(() => alert("Check email")); },
    async logout() { if(window.AuthService && confirm("Logout?")) { await window.AuthService.logout(); window.location.reload(); } },
    async saveToCloud() { if(!this.user) return this.login(); this.loading = true; await window.AuthService.saveResume(this.user.id, this.resume); this.loading = false; this.isDirty = false; alert("Saved!"); },
    async syncFromCloud() { 
        this.loading = true; const {data} = await window.AuthService.loadResume(this.user.id); this.loading = false;
        if (data) { if (this.isDirty && !confirm("Overwrite local?")) return; this.resume = data; this.$nextTick(() => document.querySelectorAll('textarea').forEach(el => this.resize(el))); }
    }
});

document.addEventListener('alpine:init', () => { 
    Alpine.data('resumeApp', resumeAppData); 

    Alpine.data('richText', (initialContent, modelCallback) => ({
        editor: null,
        content: initialContent,
        init() {
            this.$nextTick(() => {
                this.editor = new Quill(this.$refs.quillEditor, {
                    theme: 'snow',
                    modules: { toolbar: [[{ 'font': [] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['clean']] },
                    placeholder: 'Type details here...'
                });
                if (this.content) { this.editor.root.innerHTML = this.content; }
                this.editor.on('text-change', () => {
                    let html = this.editor.root.innerHTML;
                    if (html === '<p><br></p>') html = '';
                    modelCallback(html);
                });
            });
        }
    }));
});