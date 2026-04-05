// ============================================
// ProyUts - Rutas de autenticación
// src/routes/authRoutes.js
// ============================================

const express = require('express');
const router  = express.Router();
const Usuario = require('../models/Usuario');

// GET /login
router.get('/login', (req, res) => {
    if (req.session.usuario) return res.redirect('/dashboard');
    res.render('auth/login', { error: null });
});

// POST /login
router.post('/login', async (req, res) => {
    try {
        const { email, contrasena } = req.body;
        if (!email || !contrasena) {
            return res.render('auth/login', { error: 'Por favor completa todos los campos.' });
        }
        const usuario = await Usuario.login(email, contrasena);
        if (!usuario) {
            return res.render('auth/login', { error: 'Correo o contraseña incorrectos.' });
        }
        req.session.usuario = {
            id:       usuario.id,
            nombre:   usuario.nombre,
            apellido: usuario.apellido,
            codigo:   usuario.codigo,
            email:    usuario.email,
            semestre: usuario.semestre,
            programa: usuario.programa,
            rol:      usuario.rol
        };
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('auth/login', { error: 'Error interno. Intenta de nuevo.' });
    }
});

// GET /registro
router.get('/registro', (req, res) => {
    if (req.session.usuario) return res.redirect('/dashboard');
    res.render('auth/registro', { error: null });
});

// POST /registro
router.post('/registro', async (req, res) => {
    try {
        const { nombre, apellido, codigo, email, contrasena, semestre, programa } = req.body;

        if (!nombre || !apellido || !codigo || !email || !contrasena || !semestre || !programa) {
            return res.render('auth/registro', { error: 'Por favor completa todos los campos.' });
        }

        if (await Usuario.emailExiste(email)) {
            return res.render('auth/registro', { error: 'Este correo ya está registrado.' });
        }

        if (await Usuario.codigoExiste(codigo)) {
            return res.render('auth/registro', { error: 'Este código estudiantil ya está registrado.' });
        }

        await Usuario.registrar({ nombre, apellido, codigo, email, contrasena, semestre, programa });
        res.redirect('/login?registered=true');
    } catch (err) {
        console.error(err);
        res.render('auth/registro', { error: 'Error al crear la cuenta. Intenta de nuevo.' });
    }
});

// GET /logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;