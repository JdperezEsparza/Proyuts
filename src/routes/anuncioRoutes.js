// ============================================
// ProyUts - Rutas de Anuncios
// src/routes/anuncioRoutes.js
// ============================================

const express         = require('express');
const router          = express.Router();
const db              = require('../config/db');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// ── GET /anuncios - Ver todos los anuncios ────
router.get('/anuncios', requireAuth, async (req, res) => {
    try {
        const [anuncios] = await db.execute(`
            SELECT a.*, u.nombre AS autor_nombre, u.apellido AS autor_apellido
            FROM anuncios a
            LEFT JOIN usuarios u ON u.id = a.autor_id
            ORDER BY a.fecha_publicacion DESC
        `);
        res.render('anuncios/index', { anuncios, mensaje: req.query.msg || null });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// ── GET /anuncios/nuevo (solo admin) ─────────
router.get('/anuncios/nuevo', requireAuth, requireAdmin, (req, res) => {
    res.render('anuncios/form', { anuncio: null, error: null });
});

// ── POST /anuncios (solo admin) ───────────────
router.post('/anuncios', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { titulo, contenido } = req.body;
        const autorId = req.session.usuario.id;

        if (!titulo || !contenido) {
            return res.render('anuncios/form', {
                anuncio: null,
                error: 'Por favor completa todos los campos.'
            });
        }

        await db.execute(
            `INSERT INTO anuncios (titulo, contenido, autor_id) VALUES (?, ?, ?)`,
            [titulo, contenido, autorId]
        );
        res.redirect('/anuncios?msg=creado');
    } catch (err) {
        console.error(err);
        res.redirect('/anuncios');
    }
});

// ── GET /anuncios/:id/editar (solo admin) ─────
router.get('/anuncios/:id/editar', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT * FROM anuncios WHERE id = ?`, [req.params.id]);
        if (rows.length === 0) return res.redirect('/anuncios');
        res.render('anuncios/form', { anuncio: rows[0], error: null });
    } catch (err) {
        console.error(err);
        res.redirect('/anuncios');
    }
});

// ── POST /anuncios/:id/editar (solo admin) ────
router.post('/anuncios/:id/editar', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { titulo, contenido } = req.body;
        if (!titulo || !contenido) {
            const [rows] = await db.execute(`SELECT * FROM anuncios WHERE id = ?`, [req.params.id]);
            return res.render('anuncios/form', {
                anuncio: rows[0],
                error: 'Por favor completa todos los campos.'
            });
        }
        await db.execute(
            `UPDATE anuncios SET titulo = ?, contenido = ? WHERE id = ?`,
            [titulo, contenido, req.params.id]
        );
        res.redirect('/anuncios?msg=actualizado');
    } catch (err) {
        console.error(err);
        res.redirect('/anuncios');
    }
});

// ── POST /anuncios/:id/eliminar (solo admin) ──
router.post('/anuncios/:id/eliminar', requireAuth, requireAdmin, async (req, res) => {
    try {
        await db.execute(`DELETE FROM anuncios WHERE id = ?`, [req.params.id]);
        res.redirect('/anuncios?msg=eliminado');
    } catch (err) {
        console.error(err);
        res.redirect('/anuncios');
    }
});

module.exports = router;