
export function redrawCanvas() {
    const storedImage = localStorage.getItem('uploadedImage');
    const calibrationCanvas = document.getElementById('calibrationCanvas');
    if (!calibrationCanvas) return;
    const ctx = calibrationCanvas.getContext('2d');
    if (!ctx) return;

    if (storedImage) {
        const img = new Image();
        img.onload = () => {
            calibrationCanvas.width = img.naturalWidth;
            calibrationCanvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0, calibrationCanvas.width, calibrationCanvas.height);
            import('./calibration.js').then(module => {
                if (module.point1) module.drawPoint(module.point1, 'red');
                if (module.point2) module.drawPoint(module.point2, 'blue');
            });
        };
        img.src = storedImage;
        calibrationCanvas.style.display = 'block';
    } else {
        calibrationCanvas.style.display = 'none';
        import('./calibration.js').then(module => {
            const calibrationInfoElement = document.getElementById('calibrationInfo');
            if (calibrationInfoElement) calibrationInfoElement.textContent = '';
            module.point1 = null;
            module.point2 = null;
        });
    }
}