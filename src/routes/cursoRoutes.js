// ============================================
// ProyUts - Rutas de Cursos
// src/routes/cursoRoutes.js
// ============================================

const express         = require('express');
const router          = express.Router();
const Curso           = require('../models/Curso');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

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
        const cursoId   = req.params.id;
        await Curso.inscribir(usuarioId, cursoId);
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
        const cursoId   = req.params.id;
        await Curso.darDeBaja(usuarioId, cursoId);
        res.redirect('/cursos?msg=baja');
    } catch (err) {
        console.error(err);
        res.redirect('/cursos');
    }
});

// ── GET /admin/cursos - CRUD admin ────────────
router.get('/admin/cursos', requireAuth, requireAdmin, async (req, res) => {
    try {
        const cursos = await Curso.obtenerTodos();
        res.render('cursos/admin', { cursos, error: null, mensaje: req.query.msg || null });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// ── GET /admin/cursos/nuevo ───────────────────
router.get('/admin/cursos/nuevo', requireAuth, requireAdmin, (req, res) => {
    res.render('cursos/form', { curso: null, error: null });
});

// ── POST /admin/cursos ────────────────────────
router.post('/admin/cursos', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { nombre, descripcion, creditos, semestre } = req.body;
        if (!nombre || !semestre) {
            return res.render('cursos/form', {
                curso: null,
                error: 'Nombre y semestre son obligatorios.'
            });
        }
        await Curso.crear({ nombre, descripcion, creditos, semestre });
        res.redirect('/admin/cursos?msg=creado');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/cursos');
    }
});

// ── GET /admin/cursos/:id/editar ──────────────
router.get('/admin/cursos/:id/editar', requireAuth, requireAdmin, async (req, res) => {
    try {
        const curso = await Curso.obtenerPorId(req.params.id);
        if (!curso) return res.redirect('/admin/cursos');
        res.render('cursos/form', { curso, error: null });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/cursos');
    }
});

// ── POST /admin/cursos/:id/editar ────────────
router.post('/admin/cursos/:id/editar', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { nombre, descripcion, creditos, semestre, activo } = req.body;
        if (!nombre || !semestre) {
            const curso = await Curso.obtenerPorId(req.params.id);
            return res.render('cursos/form', {
                curso,
                error: 'Nombre y semestre son obligatorios.'
            });
        }
        await Curso.actualizar(req.params.id, {
            nombre, descripcion, creditos, semestre,
            activo: activo === 'on' ? true : false
        });
        res.redirect('/admin/cursos?msg=actualizado');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/cursos');
    }
});

// ── POST /admin/cursos/:id/eliminar ──────────
router.post('/admin/cursos/:id/eliminar', requireAuth, requireAdmin, async (req, res) => {
    try {
        await Curso.eliminar(req.params.id);
        res.redirect('/admin/cursos?msg=eliminado');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/cursos');
    }
});

module.exports = router;