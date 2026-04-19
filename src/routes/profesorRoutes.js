// ============================================
// ProyUts - Rutas del Profesor
// src/routes/profesorRoutes.js
// ============================================

const express              = require('express');
const router               = express.Router();
const Proyecto             = require('../models/Proyecto');
const Usuario              = require('../models/Usuario');
const { requireAuth, requireProfesor } = require('../middlewares/auth');

// ── GET /profesor - Panel del profesor ────────
router.get('/profesor', requireAuth, requireProfesor, async (req, res) => {
    try {
        const profesorId = req.session.usuario.id;
        const proyectos  = await Proyecto.obtenerPorProfesor(profesorId);

        const enviados   = proyectos.filter(p => p.estado === 'enviado').length;
        const terminados = proyectos.filter(p => p.estado === 'terminado').length;
        const rechazados = proyectos.filter(p => p.estado === 'rechazado').length;
        const enProgreso = proyectos.filter(p => p.estado === 'en_progreso').length;

        res.render('profesor/index', {
            proyectos,
            enviados,
            terminados,
            rechazados,
            enProgreso,
            filtro: req.query.filtro || 'todos'
        });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// ── POST /profesor/proyectos/:id/aprobar ──────
router.post('/profesor/proyectos/:id/aprobar', requireAuth, requireProfesor, async (req, res) => {
    try {
        const proyectoId = req.params.id;
        const proyecto   = await Proyecto.obtenerPorIdAdmin(proyectoId);
        if (!proyecto) return res.redirect('/profesor');

        await Proyecto.aprobar(proyectoId);

        // Verificar logros del estudiante y sumar puntos
        await Usuario.verificarLogros(proyecto.usuario_id);
        const usuarioActualizado = await Usuario.buscarPorId(proyecto.usuario_id);

        res.redirect('/profesor?filtro=enviado&msg=aprobado');
    } catch (err) {
        console.error(err);
        res.redirect('/profesor');
    }
});

// ── POST /profesor/proyectos/:id/rechazar ─────
router.post('/profesor/proyectos/:id/rechazar', requireAuth, requireProfesor, async (req, res) => {
    try {
        const { comentario } = req.body;
        await Proyecto.rechazar(req.params.id, comentario || 'El proyecto necesita correcciones.');
        res.redirect('/profesor?filtro=enviado&msg=rechazado');
    } catch (err) {
        console.error(err);
        res.redirect('/profesor');
    }
});

module.exports = router;