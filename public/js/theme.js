// ============================================
// ProyUts - Toggle de tema claro/oscuro
// public/js/theme.js
// ============================================

(function () {
    // Cargar tema guardado en localStorage
    const temaGuardado = localStorage.getItem('proyuts-tema') || 'light';
    document.documentElement.setAttribute('data-theme', temaGuardado);

    // Actualizar ícono del botón según el tema actual
    function actualizarIcono() {
        const tema = document.documentElement.getAttribute('data-theme');
        const btn  = document.getElementById('btnTema');
        if (btn) {
            btn.innerHTML = tema === 'dark'
                ? '<i class="bi bi-sun-fill"></i>'
                : '<i class="bi bi-moon-fill"></i>';
            btn.title = tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
        }
    }

    // Cambiar tema al hacer clic
    window.toggleTema = function () {
        const actual = document.documentElement.getAttribute('data-theme');
        const nuevo  = actual === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nuevo);
        localStorage.setItem('proyuts-tema', nuevo);
        actualizarIcono();
    };

    // Ejecutar al cargar la página
    document.addEventListener('DOMContentLoaded', actualizarIcono);
})();