// Manejo del botón rojo de emergencia - Versión Corregida
document.addEventListener("DOMContentLoaded", () => {
    const btnEmergencia = document.getElementById("btn-nueva-emergencia");
    
    if (btnEmergencia) {
        btnEmergencia.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Se presionó el botón rojo de emergencia");

            const modalElement = document.getElementById("modalEmergencia");
            
            if (!modalElement) {
                // Alerta visual si te falta el modal en el HTML
                alert("Error: No existe el diseño del modal con id='modalEmergencia' en tu HTML.");
                console.error("No se encontró el modal #modalEmergencia en el documento.");
                return;
            }

            // Si usa Bootstrap integrado
            if (typeof bootstrap !== 'undefined') {
                try {
                    // Verifica si ya hay una instancia activa para no duplicar
                    let modal = bootstrap.Modal.getInstance(modalElement);
                    if (!modal) {
                        modal = new bootstrap.Modal(modalElement);
                    }
                    modal.show();
                } catch (error) {
                    console.error("Error al iniciar el modal de Bootstrap:", error);
                }
            } else {
                // Fallback para clases de Tailwind o CSS personalizado
                modalElement.classList.remove('hidden');
                modalElement.classList.add('flex');
            }
        });
    } else {
        console.error("No se encontró ningún botón con el id='btn-nueva-emergencia' en esta página.");
    }
});
