// ============================================
// ProyUts - Rutas de Cursos (estudiantes)
// src/routes/cursoRoutes.js
// ============================================

const express         = require('express');
const router          = express.Router();
const Curso           = require('../models/Curso');
const db              = require('../config/db');
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
        const cursoId   = req.params.id;

        // Verificar que el curso tiene al menos un profesor asignado
        const [profesores] = await db.execute(
            `SELECT COUNT(*) AS total FROM profesor_curso WHERE curso_id = ?`,
            [cursoId]
        );
        if (profesores[0].total === 0) {
            return res.redirect('/cursos?msg=sin-profesor');
        }

        // Verificar capacidad máxima del curso
        const [capacidad] = await db.execute(`
            SELECT c.capacidad_maxima,
                COUNT(i.id) AS inscritos
            FROM cursos c
            LEFT JOIN inscripciones i ON i.curso_id = c.id
            WHERE c.id = ?
            GROUP BY c.id
        `, [cursoId]);

        if (capacidad.length > 0 && capacidad[0].inscritos >= capacidad[0].capacidad_maxima) {
            return res.redirect('/cursos?msg=lleno');
        }

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
        await Curso.darDeBaja(usuarioId, req.params.id);
        res.redirect('/cursos?msg=baja');
    } catch (err) {
        console.error(err);
        res.redirect('/cursos');
    }
});

module.exports = router;