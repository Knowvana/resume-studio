// static/js/preview-manager.js
window.previewMixin = function() {
    return {
        previewMode: false,
        togglePreview() {
            this.previewMode = !this.previewMode;
            // Force a resize on all textareas when exiting preview
            if (!this.previewMode) {
                this.$nextTick(() => {
                    document.querySelectorAll('textarea').forEach(el => this.resize(el));
                });
            }
        }
    };
};