// ============================================
// ProyUts - Middleware de autenticación
// src/middlewares/auth.js
// ============================================

// Verifica que el usuario esté autenticado
function requireAuth(req, res, next) {
    if (req.session && req.session.usuario) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Verifica que sea administrador
function requireAdmin(req, res, next) {
    if (req.session && req.session.usuario && req.session.usuario.rol === 'admin') {
        next();
    } else {
        res.redirect('/dashboard');
    }
}

module.exports = { requireAuth, requireAdmin };