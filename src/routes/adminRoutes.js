// ============================================
// ProyUts - Rutas de Administración
// src/routes/adminRoutes.js
// ============================================

const express              = require('express');
const router               = express.Router();
const db                   = require('../config/db');
const Curso                = require('../models/Curso');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// ── GET /admin - Panel principal ──────────────
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [totalUsuarios]   = await db.execute(`SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'estudiante'`);
        const [totalProfesores] = await db.execute(`SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'profesor'`);
        const [totalProyectos]  = await db.execute(`SELECT COUNT(*) AS total FROM proyectos`);
        const [totalTerminados] = await db.execute(`SELECT COUNT(*) AS total FROM proyectos WHERE estado = 'terminado'`);
        const [totalCursos]     = await db.execute(`SELECT COUNT(*) AS total FROM cursos WHERE activo = true`);
        const [totalMensajes]   = await db.execute(`SELECT COUNT(*) AS total FROM mensajes`);

        const [ultimosUsuarios] = await db.execute(`
            SELECT id, nombre, apellido, codigo, programa, semestre, fecha_registro
            FROM usuarios WHERE rol = 'estudiante'
            ORDER BY fecha_registro DESC LIMIT 5
        `);

        const [topEstudiantes] = await db.execute(`
            SELECT u.nombre, u.apellido, u.codigo, u.puntos,
                COUNT(CASE WHEN p.estado = 'terminado' THEN 1 END) AS terminados
            FROM usuarios u
            LEFT JOIN proyectos p ON p.usuario_id = u.id
            WHERE u.rol = 'estudiante'
            GROUP BY u.id
            ORDER BY terminados DESC
            LIMIT 5
        `);

        res.render('admin/index', {
            totalUsuarios:   totalUsuarios[0].total,
            totalProfesores: totalProfesores[0].total,
            totalProyectos:  totalProyectos[0].total,
            totalTerminados: totalTerminados[0].total,
            totalCursos:     totalCursos[0].total,
            totalMensajes:   totalMensajes[0].total,
            ultimosUsuarios,
            topEstudiantes
        });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// ── GET /admin/usuarios ───────────────────────
router.get('/admin/usuarios', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [usuarios] = await db.execute(`
            SELECT u.*,
                COUNT(CASE WHEN p.estado = 'terminado' THEN 1 END) AS terminados,
                COUNT(p.id) AS total_proyectos
            FROM usuarios u
            LEFT JOIN proyectos p ON p.usuario_id = u.id
            WHERE u.rol = 'estudiante'
            GROUP BY u.id
            ORDER BY u.fecha_registro DESC
        `);
        res.render('admin/usuarios', { usuarios, mensaje: req.query.msg || null });
    } catch (err) {
        console.error(err);
        res.redirect('/admin');
    }
});

// ── POST /admin/usuarios/:id/eliminar ─────────
router.post('/admin/usuarios/:id/eliminar', requireAuth, requireAdmin, async (req, res) => {
    try {
        await db.execute(`DELETE FROM usuarios WHERE id = ? AND rol = 'estudiante'`, [req.params.id]);
        res.redirect('/admin/usuarios?msg=eliminado');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/usuarios');
    }
});

// ── POST /admin/usuarios/:id/hacer-profesor ───
router.post('/admin/usuarios/:id/hacer-profesor', requireAuth, requireAdmin, async (req, res) => {
    try {
        await db.execute(
            `UPDATE usuarios SET rol = 'profesor' WHERE id = ? AND rol = 'estudiante'`,
            [req.params.id]
        );
        res.redirect('/admin/usuarios?msg=profesor');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/usuarios');
    }
});

// ── GET /admin/profesores ─────────────────────
router.get('/admin/profesores', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [profesores] = await db.execute(`
            SELECT u.*,
                GROUP_CONCAT(c.nombre SEPARATOR ', ') AS cursos_asignados,
                COUNT(DISTINCT pc.curso_id) AS num_cursos
            FROM usuarios u
            LEFT JOIN profesor_curso pc ON pc.profesor_id = u.id
            LEFT JOIN cursos c ON c.id = pc.curso_id
            WHERE u.rol = 'profesor'
            GROUP BY u.id
            ORDER BY u.nombre ASC
        `);
        const cursos = await Curso.obtenerTodos();
        res.render('admin/profesores', { profesores, cursos, mensaje: req.query.msg || null });
    } catch (err) {
        console.error(err);
        res.redirect('/admin');
    }
});

// ── POST /admin/profesores/:id/asignar-curso ──
router.post('/admin/profesores/:id/asignar-curso', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { curso_id } = req.body;
        await db.execute(
            `INSERT IGNORE INTO profesor_curso (profesor_id, curso_id) VALUES (?, ?)`,
            [req.params.id, curso_id]
        );
        res.redirect('/admin/profesores?msg=asignado');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/profesores');
    }
});

// ── POST /admin/profesores/:id/quitar-curso ───
router.post('/admin/profesores/:id/quitar-curso', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { curso_id } = req.body;
        await db.execute(
            `DELETE FROM profesor_curso WHERE profesor_id = ? AND curso_id = ?`,
            [req.params.id, curso_id]
        );
        res.redirect('/admin/profesores?msg=quitado');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/profesores');
    }
});

// ── POST /admin/profesores/:id/quitar-rol ─────
router.post('/admin/profesores/:id/quitar-rol', requireAuth, requireAdmin, async (req, res) => {
    try {
        await db.execute(
            `UPDATE usuarios SET rol = 'estudiante' WHERE id = ? AND rol = 'profesor'`,
            [req.params.id]
        );
        await db.execute(`DELETE FROM profesor_curso WHERE profesor_id = ?`, [req.params.id]);
        res.redirect('/admin/profesores?msg=quitado-rol');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/profesores');
    }
});

// ── GET /admin/cursos ─────────────────────────
router.get('/admin/cursos', requireAuth, requireAdmin, async (req, res) => {
    try {
        const cursos = await Curso.obtenerTodos();
        res.render('admin/cursos', { cursos, mensaje: req.query.msg || null });
    } catch (err) {
        console.error(err);
        res.redirect('/admin');
    }
});

// ── GET /admin/cursos/nuevo ───────────────────
router.get('/admin/cursos/nuevo', requireAuth, requireAdmin, (req, res) => {
    res.render('admin/curso-form', { curso: null, error: null });
});

// ── POST /admin/cursos ────────────────────────
router.post('/admin/cursos', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { nombre, descripcion, creditos, semestre } = req.body;
        if (!nombre || !semestre) {
            return res.render('admin/curso-form', { curso: null, error: 'Nombre y semestre son obligatorios.' });
        }
        await Curso.crear({ nombre, descripcion, creditos, semestre });
        res.redirect('/admin/cursos?msg=creado');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/cursos');
    }
});

// ── GET /admin/cursos/:id/editar ──────────────
router.get('/admin/cursos/:id/editar', requireAuth, requireAdmin, async (req, res) => {
    try {
        const curso = await Curso.obtenerPorId(req.params.id);
        if (!curso) return res.redirect('/admin/cursos');
        res.render('admin/curso-form', { curso, error: null });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/cursos');
    }
});

// ── POST /admin/cursos/:id/editar ────────────
router.post('/admin/cursos/:id/editar', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { nombre, descripcion, creditos, semestre, activo } = req.body;
        if (!nombre || !semestre) {
            const curso = await Curso.obtenerPorId(req.params.id);
            return res.render('admin/curso-form', { curso, error: 'Nombre y semestre son obligatorios.' });
        }
        await Curso.actualizar(req.params.id, {
            nombre, descripcion, creditos, semestre,
            activo: activo === 'on' ? true : false,
            capacidadMaxima: req.body.capacidad_maxima || 40 
        });
        res.redirect('/admin/cursos?msg=actualizado');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/cursos');
    }
});

// ── POST /admin/cursos/:id/eliminar ──────────
router.post('/admin/cursos/:id/eliminar', requireAuth, requireAdmin, async (req, res) => {
    try {
        await Curso.eliminar(req.params.id);
        res.redirect('/admin/cursos?msg=eliminado');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/cursos');
    }
});

module.exports = router;