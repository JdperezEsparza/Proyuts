// ============================================
// ProyUts - Rutas de Chat (CORREGIDO)
// src/routes/chatRoutes.js
// ============================================

const express         = require('express');
const router          = express.Router();
const db              = require('../config/db');
const Usuario         = require('../models/Usuario');
const { requireAuth } = require('../middlewares/auth');

// ── GET /chat - Lista de conversaciones ───────
router.get('/chat', requireAuth, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;

        // Obtener el último mensaje de cada conversación agrupado por usuario
        const [conversaciones] = await db.execute(`
            SELECT 
                u.id, u.nombre, u.apellido, u.codigo, u.programa,
                m.contenido AS ultimo_mensaje,
                m.fecha_envio AS ultima_fecha,
                m.remitente_id,
                (
                    SELECT COUNT(*) FROM mensajes 
                    WHERE remitente_id = u.id 
                    AND destinatario_id = ? 
                    AND leido = false
                ) AS no_leidos
            FROM usuarios u
            INNER JOIN mensajes m ON m.id = (
                SELECT id FROM mensajes
                WHERE (remitente_id = u.id AND destinatario_id = ?)
                   OR (remitente_id = ? AND destinatario_id = u.id)
                ORDER BY fecha_envio DESC
                LIMIT 1
            )
            WHERE u.id != ?
            ORDER BY m.fecha_envio DESC
        `, [usuarioId, usuarioId, usuarioId, usuarioId]);

        const usuarios = await Usuario.obtenerTodos(usuarioId);

        res.render('chat/index', { conversaciones, usuarios });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// ── GET /chat/:id - Conversación con un usuario ──
router.get('/chat/:id', requireAuth, async (req, res) => {
    try {
        const usuarioId      = req.session.usuario.id;
        const destinatarioId = req.params.id;

        const destinatario = await Usuario.buscarPorId(destinatarioId);
        if (!destinatario) return res.redirect('/chat');

        const [mensajes] = await db.execute(`
            SELECT m.*, 
                u.nombre AS remitente_nombre,
                u.apellido AS remitente_apellido
            FROM mensajes m
            INNER JOIN usuarios u ON u.id = m.remitente_id
            WHERE (m.remitente_id = ? AND m.destinatario_id = ?)
               OR (m.remitente_id = ? AND m.destinatario_id = ?)
            ORDER BY m.fecha_envio ASC
        `, [usuarioId, destinatarioId, destinatarioId, usuarioId]);

        // Marcar mensajes como leídos
        await db.execute(`
            UPDATE mensajes SET leido = true
            WHERE remitente_id = ? AND destinatario_id = ? AND leido = false
        `, [destinatarioId, usuarioId]);

        res.render('chat/conversacion', { mensajes, destinatario });
    } catch (err) {
        console.error(err);
        res.redirect('/chat');
    }
});

// ── POST /chat/:id - Enviar mensaje ──────────
router.post('/chat/:id', requireAuth, async (req, res) => {
    try {
        const remitenteId    = req.session.usuario.id;
        const destinatarioId = req.params.id;
        const { contenido }  = req.body;

        if (!contenido || contenido.trim() === '') {
            return res.redirect(`/chat/${destinatarioId}`);
        }

        await db.execute(`
            INSERT INTO mensajes (remitente_id, destinatario_id, contenido)
            VALUES (?, ?, ?)
        `, [remitenteId, destinatarioId, contenido.trim()]);

        res.redirect(`/chat/${destinatarioId}`);
    } catch (err) {
        console.error(err);
        res.redirect(`/chat/${req.params.id}`);
    }
});

module.exports = router;