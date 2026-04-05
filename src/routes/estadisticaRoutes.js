// ============================================
// ProyUts - Rutas de Estadísticas
// src/routes/estadisticaRoutes.js
// ============================================

const express         = require('express');
const router          = express.Router();
const Proyecto        = require('../models/Proyecto');
const Usuario         = require('../models/Usuario');
const { requireAuth } = require('../middlewares/auth');

// ── GET /estadisticas ─────────────────────────
router.get('/estadisticas', requireAuth, async (req, res) => {
    try {
        const usuarioId   = req.session.usuario.id;
        const usuario     = await Usuario.buscarPorId(usuarioId);

        const total       = await Proyecto.contarTodos(usuarioId);
        const terminados  = await Proyecto.contarTerminados(usuarioId);
        const faltan      = Math.max(0, 52 - terminados);
        const porSemestre = await Proyecto.estadisticasPorSemestre(usuarioId);
        const porMes      = await Proyecto.estadisticasPorMes(usuarioId);

        // Calcular promedios
        const fechaRegistro    = new Date(usuario.fechaRegistro || Date.now());
        const hoy              = new Date();
        const semanasTotales   = Math.max(1, Math.ceil((hoy - fechaRegistro) / (1000 * 60 * 60 * 24 * 7)));
        const mesesTotales     = Math.max(1, Math.ceil((hoy - fechaRegistro) / (1000 * 60 * 60 * 24 * 30)));
        const anyosTotales     = Math.max(1, Math.ceil((hoy - fechaRegistro) / (1000 * 60 * 60 * 24 * 365)));
        const semestresCursados = Math.max(1, usuario.semestre);

        const promedioPorSemana   = (terminados / semanasTotales).toFixed(1);
        const promedioPorMes      = (terminados / mesesTotales).toFixed(1);
        const promedioPorAnyo     = (terminados / anyosTotales).toFixed(1);
        const promedioPorSemestre = (terminados / semestresCursados).toFixed(1);

        // Estimación de fecha de graduación
        const proyectosPorSemana = parseFloat(promedioPorSemana);
        let fechaEstimada = null;
        if (proyectosPorSemana > 0 && faltan > 0) {
            const semanasRestantes = Math.ceil(faltan / proyectosPorSemana);
            fechaEstimada = new Date();
            fechaEstimada.setDate(fechaEstimada.getDate() + semanasRestantes * 7);
        } else if (faltan === 0) {
            fechaEstimada = 'ya';
        }

        res.render('estadisticas/index', {
            total,
            terminados,
            faltan,
            porSemestre,
            porMes,
            promedioPorSemana,
            promedioPorMes,
            promedioPorAnyo,
            promedioPorSemestre,
            fechaEstimada
        });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

module.exports = router;