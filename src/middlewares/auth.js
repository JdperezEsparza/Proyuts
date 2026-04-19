// ============================================
// ProyUts - Middleware de autenticación
// src/middlewares/auth.js
// ============================================

function requireAuth(req, res, next) {
    if (req.session && req.session.usuario) {
        next();
    } else {
        res.redirect('/login');
    }
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.usuario && req.session.usuario.rol === 'admin') {
        next();
    } else {
        res.redirect('/dashboard');
    }
}

function requireProfesor(req, res, next) {
    if (req.session && req.session.usuario &&
        (req.session.usuario.rol === 'profesor' || req.session.usuario.rol === 'admin')) {
        next();
    } else {
        res.redirect('/dashboard');
    }
}

module.exports = { requireAuth, requireAdmin, requireProfesor };