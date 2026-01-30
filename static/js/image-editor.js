// static/js/image-editor.js
window.imageEditorMixin = function() {
    return {
        showImageModal: false,
        imageUrlInput: '',
        cropperInstance: null,
        defaultImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Atul&backgroundColor=c0aede",

        openImageEditor() {
            this.showImageModal = true;
            const currentSrc = this.resume.profile.image || this.defaultImage;
            this.$nextTick(() => this.initCropper(currentSrc));
        },
        closeImageEditor() {
            this.showImageModal = false;
            if (this.cropperInstance) {
                this.cropperInstance.destroy();
                this.cropperInstance = null;
            }
        },
        triggerFileUpload() { document.getElementById('hidden-file-input').click(); },
        handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => this.initCropper(e.target.result);
                reader.readAsDataURL(file);
            }
            event.target.value = ''; 
        },
        loadImageFromUrl() {
            if (this.imageUrlInput) {
                this.initCropper(this.imageUrlInput);
                this.imageUrlInput = '';
            }
        },
        initCropper(imageSrc) {
            const imageElement = document.getElementById('cropper-target');
            if (this.cropperInstance) this.cropperInstance.destroy();
            imageElement.src = imageSrc;
            this.cropperInstance = new Cropper(imageElement, {
                aspectRatio: 1, viewMode: 1, dragMode: 'move', autoCropArea: 1,
                guides: true, center: true, highlight: false, 
                cropBoxMovable: true, cropBoxResizable: true, toggleDragModeOnDblclick: false,
            });
        },
        saveCroppedImage() {
            if (this.cropperInstance) {
                const canvas = this.cropperInstance.getCroppedCanvas({ width: 400, height: 400 });
                this.resume.profile.image = canvas.toDataURL('image/png');
                this.closeImageEditor();
            }
        },
        promptImage() { this.openImageEditor(); }
    };
};