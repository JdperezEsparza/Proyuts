// ============================================
// ProyUts - Servidor principal
// server.js
// ============================================

require('dotenv').config();
const express           = require('express');
const session           = require('express-session');
const path              = require('path');
const { requireAuth }   = require('./src/middlewares/auth');

// ── Importar todas las rutas ─────────────────
const authRoutes        = require('./src/routes/authRoutes');
const proyectoRoutes    = require('./src/routes/proyectoRoutes');
const cursoRoutes       = require('./src/routes/cursoRoutes');
const perfilRoutes      = require('./src/routes/perfilRoutes');
const anuncioRoutes     = require('./src/routes/anuncioRoutes');
const chatRoutes        = require('./src/routes/chatRoutes');
const estadisticaRoutes = require('./src/routes/estadisticaRoutes');
const chatbotRoutes     = require('./src/routes/chatbotRoutes');
const rankingRoutes     = require('./src/routes/rankingRoutes');
const logroRoutes       = require('./src/routes/logroRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const profesorRoutes = require('./src/routes/profesorRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Motor de vistas ──────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// ── Archivos estáticos ───────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Middlewares ──────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'proyuts_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

// Pasar usuario a todas las vistas
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});


// Ruta raíz
app.get('/', (req, res) => {
    if (req.session.usuario) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// ── Rutas ────────────────────────────────────
app.use('/', authRoutes);
app.use('/', proyectoRoutes);
app.use('/', cursoRoutes);
app.use('/', perfilRoutes);
app.use('/', anuncioRoutes);
app.use('/', chatRoutes);
app.use('/', estadisticaRoutes);
app.use('/', chatbotRoutes);
app.use('/', rankingRoutes);
app.use('/', logroRoutes);
app.use('/', adminRoutes);
app.use('/', profesorRoutes);


// Dashboard (protegido)
app.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const Usuario = require('./src/models/Usuario');
        const usuarioActualizado = await Usuario.buscarPorId(req.session.usuario.id);
        req.session.usuario.puntos = usuarioActualizado.puntos;
        res.render('dashboard', { titulo: 'Panel Principal' });
    } catch (err) {
        res.render('dashboard', { titulo: 'Panel Principal' });
    }
});
// ── Iniciar servidor ─────────────────────────
app.listen(PORT, () => {
    console.log(`ProyUts corriendo en http://localhost:${PORT}`);
});