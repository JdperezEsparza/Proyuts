// ============================================
// ProyUts - Rutas de Cursos (estudiantes)
// src/routes/cursoRoutes.js
// ============================================

const express         = require('express');
const router          = express.Router();
const Curso           = require('../models/Curso');
const { requireAuth } = require('../middlewares/auth');

// ── GET /cursos - Ver todos los cursos ────────
router.get('/cursos', requireAuth, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const cursos    = await Curso.obtenerConInscripcion(usuarioId);
        const inscritos = cursos.filter(c => c.inscrito);
        res.render('cursos/index', { cursos, inscritos, mensaje: req.query.msg || null });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// ── POST /cursos/:id/inscribir ────────────────
router.post('/cursos/:id/inscribir', requireAuth, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        await Curso.inscribir(usuarioId, req.params.id);
        res.redirect('/cursos?msg=inscrito');
    } catch (err) {
        console.error(err);
        res.redirect('/cursos');
    }
});

// ── POST /cursos/:id/baja ─────────────────────
router.post('/cursos/:id/baja', requireAuth, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        await Curso.darDeBaja(usuarioId, req.params.id);
        res.redirect('/cursos?msg=baja');
    } catch (err) {
        console.error(err);
        res.redirect('/cursos');
    }
});

module.exports = router;