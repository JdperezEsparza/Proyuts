// ============================================
// ProyUts - Rutas del Ranking
// src/routes/rankingRoutes.js
// ============================================

const express         = require('express');
const router          = express.Router();
const db              = require('../config/db');
const Usuario         = require('../models/Usuario');
const { requireAuth } = require('../middlewares/auth');

// ── GET /ranking ──────────────────────────────
router.get('/ranking', requireAuth, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;

        // Top 10 usuarios con más puntos
        const ranking = await Usuario.obtenerRanking();

        // Buscar posición del usuario actual en el ranking general
        const [posRows] = await db.execute(`
            SELECT COUNT(*) + 1 AS posicion
            FROM usuarios
            WHERE puntos > (SELECT puntos FROM usuarios WHERE id = ?)
            AND rol = 'estudiante'
        `, [usuarioId]);

        const miPosicion = posRows[0].posicion;
        const usuarioActual = await Usuario.buscarPorId(usuarioId);

        res.render('ranking/index', {
            ranking,
            miPosicion,
            misPuntos: usuarioActual.puntos
        });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

module.exports = router;