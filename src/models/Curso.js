// ============================================
// ProyUts - Modelo Curso (POO)
// src/models/Curso.js
// ============================================

const db = require('../config/db');

class Curso {

    constructor(data) {
        this.id          = data.id || null;
        this.nombre      = data.nombre;
        this.descripcion = data.descripcion || '';
        this.creditos    = data.creditos || 3;
        this.semestre    = data.semestre;
        this.activo      = data.activo !== undefined ? data.activo : true;
        this.fechaCreacion = data.fecha_creacion || null;
        // Extra para vistas
        this.inscrito    = data.inscrito || false;
    }

    // ── Obtener todos los cursos ─────────────────
    static async obtenerTodos() {
        const [rows] = await db.execute(
            `SELECT * FROM cursos ORDER BY semestre ASC, nombre ASC`
        );
        return rows.map(r => new Curso(r));
    }

    // ── Obtener cursos con estado de inscripción ──
    static async obtenerConInscripcion(usuarioId) {
        const [rows] = await db.execute(`
            SELECT c.*,
                CASE WHEN i.usuario_id IS NOT NULL THEN true ELSE false END AS inscrito
            FROM cursos c
            LEFT JOIN inscripciones i ON i.curso_id = c.id AND i.usuario_id = ?
            WHERE c.activo = true
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
            // Error de duplicado (ya inscrito)
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
            `INSERT INTO cursos (nombre, descripcion, creditos, semestre) VALUES (?, ?, ?, ?)`,
            [data.nombre, data.descripcion, data.creditos, data.semestre]
        );
        return result.insertId;
    }

    // ── Actualizar curso (admin) ──────────────────
    static async actualizar(id, data) {
        const [result] = await db.execute(
            `UPDATE cursos SET nombre=?, descripcion=?, creditos=?, semestre=?, activo=? WHERE id=?`,
            [data.nombre, data.descripcion, data.creditos, data.semestre, data.activo, id]
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