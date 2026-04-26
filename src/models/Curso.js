// ============================================
// ProyUts - Modelo Curso (POO)
// src/models/Curso.js
// ============================================

const db = require('../config/db');

class Curso {

    constructor(data) {
        this.id              = data.id || null;
        this.nombre          = data.nombre;
        this.descripcion     = data.descripcion || '';
        this.creditos        = data.creditos || 3;
        this.semestre        = data.semestre;
        this.activo          = data.activo !== undefined ? data.activo : true;
        this.capacidadMaxima = data.capacidad_maxima || 40;
        this.inscritos       = data.inscritos || 0;
        this.fechaCreacion   = data.fecha_creacion || null;
        this.inscrito        = data.inscrito || false;
        this.tieneProfesor   = data.tiene_profesor || false;
        this.nombreProfesor  = data.nombre_profesor || null;
    }

    // ── Obtener todos los cursos ─────────────────
    static async obtenerTodos() {
        const [rows] = await db.execute(`
            SELECT c.*,
                COUNT(DISTINCT i.usuario_id) AS inscritos,
                COUNT(DISTINCT pc.profesor_id) AS tiene_profesor,
                GROUP_CONCAT(DISTINCT CONCAT(u.nombre, ' ', u.apellido) SEPARATOR ', ') AS nombre_profesor
            FROM cursos c
            LEFT JOIN inscripciones i ON i.curso_id = c.id
            LEFT JOIN profesor_curso pc ON pc.curso_id = c.id
            LEFT JOIN usuarios u ON u.id = pc.profesor_id
            GROUP BY c.id
            ORDER BY c.semestre ASC, c.nombre ASC
        `);
        return rows.map(r => new Curso(r));
    }

    // ── Obtener cursos con estado de inscripción ──
    static async obtenerConInscripcion(usuarioId) {
        const [rows] = await db.execute(`
            SELECT c.*,
                CASE WHEN i.usuario_id IS NOT NULL THEN true ELSE false END AS inscrito,
                COUNT(DISTINCT i2.usuario_id) AS inscritos,
                COUNT(DISTINCT pc.profesor_id) AS tiene_profesor,
                GROUP_CONCAT(DISTINCT CONCAT(u.nombre, ' ', u.apellido) SEPARATOR ', ') AS nombre_profesor
            FROM cursos c
            LEFT JOIN inscripciones i ON i.curso_id = c.id AND i.usuario_id = ?
            LEFT JOIN inscripciones i2 ON i2.curso_id = c.id
            LEFT JOIN profesor_curso pc ON pc.curso_id = c.id
            LEFT JOIN usuarios u ON u.id = pc.profesor_id
            WHERE c.activo = true
            GROUP BY c.id, i.usuario_id
            ORDER BY c.semestre ASC, c.nombre ASC
        `, [usuarioId]);
        return rows.map(r => new Curso(r));
    }

    // ── Obtener cursos en los que está inscrito ───
    static async obtenerInscritos(usuarioId) {
        const [rows] = await db.execute(`
            SELECT c.*, i.fecha_inscripcion
            FROM cursos c
            INNER JOIN inscripciones i ON i.curso_id = c.id
            WHERE i.usuario_id = ?
            ORDER BY c.semestre ASC
        `, [usuarioId]);
        return rows.map(r => new Curso(r));
    }

    // ── Obtener un curso por ID ───────────────────
    static async obtenerPorId(id) {
        const [rows] = await db.execute(
            `SELECT * FROM cursos WHERE id = ?`, [id]
        );
        if (rows.length === 0) return null;
        return new Curso(rows[0]);
    }

    // ── Inscribirse a un curso ────────────────────
    static async inscribir(usuarioId, cursoId) {
        try {
            await db.execute(
                `INSERT INTO inscripciones (usuario_id, curso_id) VALUES (?, ?)`,
                [usuarioId, cursoId]
            );
            return true;
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') return false;
            throw err;
        }
    }

    // ── Darse de baja de un curso ─────────────────
    static async darDeBaja(usuarioId, cursoId) {
        const [result] = await db.execute(
            `DELETE FROM inscripciones WHERE usuario_id = ? AND curso_id = ?`,
            [usuarioId, cursoId]
        );
        return result.affectedRows > 0;
    }

    // ── Verificar si está inscrito ────────────────
    static async estaInscrito(usuarioId, cursoId) {
        const [rows] = await db.execute(
            `SELECT id FROM inscripciones WHERE usuario_id = ? AND curso_id = ?`,
            [usuarioId, cursoId]
        );
        return rows.length > 0;
    }

    // ── Crear curso (admin) ───────────────────────
    static async crear(data) {
        const [result] = await db.execute(
            `INSERT INTO cursos (nombre, descripcion, creditos, semestre, capacidad_maxima) VALUES (?, ?, ?, ?, ?)`,
            [data.nombre, data.descripcion, data.creditos, data.semestre, data.capacidadMaxima || 40]
        );
        return result.insertId;
    }

    // ── Actualizar curso (admin) ──────────────────
    static async actualizar(id, data) {
        const [result] = await db.execute(
            `UPDATE cursos SET nombre=?, descripcion=?, creditos=?, semestre=?, activo=?, capacidad_maxima=? WHERE id=?`,
            [data.nombre, data.descripcion, data.creditos, data.semestre, data.activo, data.capacidadMaxima || 40, id]
        );
        return result.affectedRows > 0;
    }

    // ── Eliminar curso (admin) ────────────────────
    static async eliminar(id) {
        const [result] = await db.execute(
            `DELETE FROM cursos WHERE id = ?`, [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Curso;