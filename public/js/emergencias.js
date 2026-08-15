// Manejo del botón rojo de emergencia
document.addEventListener("DOMContentLoaded", () => {
    const btnEmergencia = document.getElementById("btn-nueva-emergencia");
    if (btnEmergencia) {
        btnEmergencia.addEventListener("click", (e) => {
            e.preventDefault();
            const modalElement = document.getElementById("modalEmergencia");
            if (modalElement) {
                // Si usa Bootstrap integrado
                if (typeof bootstrap !== 'undefined') {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                } else {
                    // Fallback para clases de Tailwind
                    modalElement.classList.remove('hidden');
                    modalElement.classList.add('flex');
                }
            } else {
                console.error("No se encontró el modal #modalEmergencia");
            }
        });
    }
});
