// ============================================
// ProyUts - Rutas del Chatbot con Groq
// src/routes/chatbotRoutes.js
// ============================================

const express         = require('express');
const router          = express.Router();
const Groq            = require('groq-sdk');
const { requireAuth } = require('../middlewares/auth');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SISTEMA = `Eres un asistente virtual del sistema ProyUts de las Unidades Tecnológicas de Santander (UTS).
Tu función es ayudar a los estudiantes con preguntas sobre:
- El sistema ProyUts y cómo funciona
- Los proyectos académicos y cómo registrarlos
- Los requisitos de graduación (mínimo 52 proyectos terminados)
- Los cursos disponibles: Desarrollo de Aplicaciones Empresariales, Nuevas Tecnologías de Desarrollo, Programación Web, Aplicaciones Móviles, Programación Orientada a Objetos
- Consejos para avanzar más rápido en la acumulación de proyectos
- Dudas generales sobre la UTS

Responde siempre en español, de forma amable, clara y concisa.
Si te preguntan algo que no tiene relación con ProyUts o la UTS, redirige amablemente la conversación al tema principal.`;

// ── GET /chatbot ──────────────────────────────
router.get('/chatbot', requireAuth, (req, res) => {
    if (!req.session.chatHistorial) {
        req.session.chatHistorial = [];
    }
    res.render('chatbot/index', {
        historial: req.session.chatHistorial,
        error: null
    });
});

// ── POST /chatbot - Enviar mensaje ────────────
router.post('/chatbot', requireAuth, async (req, res) => {
    try {
        const { mensaje } = req.body;

        if (!mensaje || mensaje.trim() === '') {
            return res.redirect('/chatbot');
        }

        if (!req.session.chatHistorial) {
            req.session.chatHistorial = [];
        }

        // Agregar mensaje del usuario al historial
        req.session.chatHistorial.push({
            rol: 'usuario',
            contenido: mensaje.trim(),
            hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        });

        // Construir mensajes para Groq con historial
        const mensajesGroq = [
            { role: 'system', content: SISTEMA },
            // Últimos 10 mensajes del historial
            ...req.session.chatHistorial.slice(-10).map(m => ({
                role: m.rol === 'usuario' ? 'user' : 'assistant',
                content: m.contenido
            }))
        ];

        // Llamar a Groq
        const completion = await groq.chat.completions.create({
            messages: mensajesGroq,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 500
        });

        const respuesta = completion.choices[0].message.content;

        // Agregar respuesta al historial
        req.session.chatHistorial.push({
            rol: 'bot',
            contenido: respuesta,
            hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        });

        // Limitar historial a 50 mensajes
        if (req.session.chatHistorial.length > 50) {
            req.session.chatHistorial = req.session.chatHistorial.slice(-50);
        }

        res.redirect('/chatbot');
    } catch (err) {
        console.error('Error Groq:', err.message);
        if (!req.session.chatHistorial) req.session.chatHistorial = [];
        req.session.chatHistorial.push({
            rol: 'bot',
            contenido: 'Lo siento, tuve un problema al procesar tu mensaje. Por favor intenta de nuevo.',
            hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        });
        res.redirect('/chatbot');
    }
});

// ── POST /chatbot/limpiar ─────────────────────
router.post('/chatbot/limpiar', requireAuth, (req, res) => {
    req.session.chatHistorial = [];
    res.redirect('/chatbot');
});

module.exports = router;