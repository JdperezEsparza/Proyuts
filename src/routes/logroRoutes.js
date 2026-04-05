// ============================================
// ProyUts - Rutas de Logros
// src/routes/logroRoutes.js
// ============================================

const express         = require('express');
const router          = express.Router();
const Usuario         = require('../models/Usuario');
const Proyecto        = require('../models/Proyecto');
const { requireAuth } = require('../middlewares/auth');

// ── GET /logros ───────────────────────────────
router.get('/logros', requireAuth, async (req, res) => {
    try {
        const usuarioId  = req.session.usuario.id;
        const logros     = await Usuario.obtenerLogros(usuarioId);
        const terminados = await Proyecto.contarTerminados(usuarioId);
        const obtenidos  = logros.filter(l => l.fecha_obtenido).length;

        res.render('logros/index', { logros, terminados, obtenidos });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

module.exports = router;