// ============================================
// ProyUts - Rutas de Proyectos (CRUD)
// src/routes/proyectoRoutes.js
// ============================================

const express         = require('express');
const router          = express.Router();
const Proyecto        = require('../models/Proyecto');
const Usuario         = require('../models/Usuario');
const db              = require('../config/db');
const { requireAuth } = require('../middlewares/auth');

// ── GET /proyectos - Listar todos los proyectos ──
router.get('/proyectos', requireAuth, async (req, res) => {
    try {
        const usuarioId  = req.session.usuario.id;
        const proyectos  = await Proyecto.obtenerPorUsuario(usuarioId);
        const total      = await Proyecto.contarTodos(usuarioId);
        const terminados = await Proyecto.contarTerminados(usuarioId);
        const faltan     = Math.max(0, 52 - terminados);

        res.render('proyectos/index', { proyectos, total, terminados, faltan });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// ── GET /proyectos/nuevo - Formulario de creación ──
router.get('/proyectos/nuevo', requireAuth, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        // Solo cursos en los que el estudiante está inscrito
        const [cursos] = await db.execute(`
            SELECT c.* FROM cursos c
            INNER JOIN inscripciones i ON i.curso_id = c.id
            WHERE i.usuario_id = ? AND c.activo = true
            ORDER BY c.semestre ASC, c.nombre ASC
        `, [usuarioId]);

        res.render('proyectos/form', { proyecto: null, cursos, error: null });
    } catch (err) {
        console.error(err);
        res.redirect('/proyectos');
    }
});

// ── POST /proyectos - Crear proyecto ─────────────
router.post('/proyectos', requireAuth, async (req, res) => {
    try {
        const { titulo, descripcion, curso_id, fecha_realizacion, semestre } = req.body;
        const usuarioId = req.session.usuario.id;

        if (!titulo || !fecha_realizacion || !semestre) {
            const [cursos] = await db.execute(`
                SELECT c.* FROM cursos c
                INNER JOIN inscripciones i ON i.curso_id = c.id
                WHERE i.usuario_id = ? AND c.activo = true
                ORDER BY c.semestre ASC, c.nombre ASC
            `, [usuarioId]);
            return res.render('proyectos/form', {
                proyecto: null,
                cursos,
                error: 'Por favor completa los campos obligatorios.'
            });
        }

        const anio = new Date(fecha_realizacion).getFullYear();

        await Proyecto.crear({
            usuarioId,
            cursoId: curso_id || null,
            titulo,
            descripcion,
            fechaRealizacion: fecha_realizacion,
            semestre,
            anio
        });

        res.redirect('/proyectos');
    } catch (err) {
        console.error(err);
        res.redirect('/proyectos');
    }
});

// ── GET /proyectos/:id/editar - Formulario de edición ──
router.get('/proyectos/:id/editar', requireAuth, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const proyecto  = await Proyecto.obtenerPorId(req.params.id, usuarioId);

        if (!proyecto) return res.redirect('/proyectos');

        // Solo cursos en los que el estudiante está inscrito
        const [cursos] = await db.execute(`
            SELECT c.* FROM cursos c
            INNER JOIN inscripciones i ON i.curso_id = c.id
            WHERE i.usuario_id = ? AND c.activo = true
            ORDER BY c.semestre ASC, c.nombre ASC
        `, [usuarioId]);

        res.render('proyectos/form', { proyecto, cursos, error: null });
    } catch (err) {
        console.error(err);
        res.redirect('/proyectos');
    }
});

// ── POST /proyectos/:id/editar - Actualizar proyecto ──
router.post('/proyectos/:id/editar', requireAuth, async (req, res) => {
    try {
        const { titulo, descripcion, curso_id, fecha_realizacion, semestre } = req.body;
        const usuarioId  = req.session.usuario.id;
        const proyectoId = req.params.id;

        if (!titulo || !fecha_realizacion || !semestre) {
            const [cursos] = await db.execute(`
                SELECT c.* FROM cursos c
                INNER JOIN inscripciones i ON i.curso_id = c.id
                WHERE i.usuario_id = ? AND c.activo = true
                ORDER BY c.semestre ASC, c.nombre ASC
            `, [usuarioId]);
            const proyecto = await Proyecto.obtenerPorId(proyectoId, usuarioId);
            return res.render('proyectos/form', {
                proyecto,
                cursos,
                error: 'Por favor completa los campos obligatorios.'
            });
        }

        const anio = new Date(fecha_realizacion).getFullYear();

        await Proyecto.actualizar(proyectoId, usuarioId, {
            titulo,
            descripcion,
            cursoId: curso_id || null,
            fechaRealizacion: fecha_realizacion,
            semestre,
            anio
        });

        res.redirect('/proyectos');
    } catch (err) {
        console.error(err);
        res.redirect('/proyectos');
    }
});

// ── POST /proyectos/:id/eliminar - Eliminar proyecto ──
router.post('/proyectos/:id/eliminar', requireAuth, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        await Proyecto.eliminar(req.params.id, usuarioId);
        res.redirect('/proyectos');
    } catch (err) {
        console.error(err);
        res.redirect('/proyectos');
    }
});

module.exports = router;