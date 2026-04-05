// ============================================
// ProyUts - Rutas de Perfil
// src/routes/perfilRoutes.js
// ============================================

const express         = require('express');
const router          = express.Router();
const Usuario         = require('../models/Usuario');
const Proyecto        = require('../models/Proyecto');
const { requireAuth } = require('../middlewares/auth');

// ── GET /perfil ───────────────────────────────
router.get('/perfil', requireAuth, async (req, res) => {
    try {
        const usuarioId  = req.session.usuario.id;
        const usuario    = await Usuario.buscarPorId(usuarioId);
        const logros     = await Usuario.obtenerLogros(usuarioId);
        const terminados = await Proyecto.contarTerminados(usuarioId);
        const total      = await Proyecto.contarTodos(usuarioId);
        const faltan     = Math.max(0, 52 - terminados);

        res.render('perfil/index', {
            usuarioPerfil: usuario,
            logros,
            terminados,
            total,
            faltan,
            error: null,
            mensaje: req.query.msg || null
        });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// ── POST /perfil - Actualizar datos ──────────
router.post('/perfil', requireAuth, async (req, res) => {
    try {
        const usuarioId              = req.session.usuario.id;
        const { nombre, apellido, semestre, programa } = req.body;

        if (!nombre || !apellido || !semestre || !programa) {
            const usuario    = await Usuario.buscarPorId(usuarioId);
            const logros     = await Usuario.obtenerLogros(usuarioId);
            const terminados = await Proyecto.contarTerminados(usuarioId);
            const total      = await Proyecto.contarTodos(usuarioId);
            const faltan     = Math.max(0, 52 - terminados);
            return res.render('perfil/index', {
                usuarioPerfil: usuario,
                logros,
                terminados,
                total,
                faltan,
                error: 'Por favor completa todos los campos.',
                mensaje: null
            });
        }

        await Usuario.actualizar(usuarioId, { nombre, apellido, semestre, programa });

        // Actualizar sesión
        req.session.usuario.nombre   = nombre;
        req.session.usuario.apellido = apellido;
        req.session.usuario.semestre = semestre;
        req.session.usuario.programa = programa;

        res.redirect('/perfil?msg=actualizado');
    } catch (err) {
        console.error(err);
        res.redirect('/perfil');
    }
});

module.exports = router;