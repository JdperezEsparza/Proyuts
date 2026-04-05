// ============================================
// ProyUts - Modelo Proyecto (POO)
// src/models/Proyecto.js
// ============================================

const db = require('../config/db');

class Proyecto {

    constructor(data) {
        this.id               = data.id || null;
        this.usuarioId        = data.usuario_id;
        this.cursoId          = data.curso_id || null;
        this.titulo           = data.titulo;
        this.descripcion      = data.descripcion || '';
        this.fechaRealizacion = data.fecha_realizacion;
        this.semestre         = data.semestre;
        this.anio             = data.anio;
        this.estado           = data.estado || 'en_progreso';
        this.fechaRegistro    = data.fecha_registro || null;
        this.nombreCurso      = data.nombre_curso || null; // para mostrar en vistas
    }

    // ── Crear nuevo proyecto ─────────────────────
    static async crear(data) {
        const sql = `
            INSERT INTO proyectos (usuario_id, curso_id, titulo, descripcion, fecha_realizacion, semestre, anio, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(sql, [
            data.usuarioId,
            data.cursoId || null,
            data.titulo,
            data.descripcion,
            data.fechaRealizacion,
            data.semestre,
            data.anio,
            data.estado || 'en_progreso'
        ]);
        return result.insertId;
    }

    // ── Obtener todos los proyectos de un usuario ─
    static async obtenerPorUsuario(usuarioId) {
        const sql = `
            SELECT p.*, c.nombre AS nombre_curso
            FROM proyectos p
            LEFT JOIN cursos c ON c.id = p.curso_id
            WHERE p.usuario_id = ?
            ORDER BY p.fecha_realizacion DESC
        `;
        const [rows] = await db.execute(sql, [usuarioId]);
        return rows.map(r => new Proyecto(r));
    }

    // ── Obtener un proyecto por ID ────────────────
    static async obtenerPorId(id, usuarioId) {
        const sql = `
            SELECT p.*, c.nombre AS nombre_curso
            FROM proyectos p
            LEFT JOIN cursos c ON c.id = p.curso_id
            WHERE p.id = ? AND p.usuario_id = ?
        `;
        const [rows] = await db.execute(sql, [id, usuarioId]);
        if (rows.length === 0) return null;
        return new Proyecto(rows[0]);
    }

    // ── Actualizar proyecto ───────────────────────
    static async actualizar(id, usuarioId, data) {
        const sql = `
            UPDATE proyectos 
            SET titulo=?, descripcion=?, curso_id=?, fecha_realizacion=?, semestre=?, anio=?, estado=?
            WHERE id=? AND usuario_id=?
        `;
        const [result] = await db.execute(sql, [
            data.titulo,
            data.descripcion,
            data.cursoId || null,
            data.fechaRealizacion,
            data.semestre,
            data.anio,
            data.estado,
            id,
            usuarioId
        ]);
        return result.affectedRows > 0;
    }

    // ── Eliminar proyecto ─────────────────────────
    static async eliminar(id, usuarioId) {
        const [result] = await db.execute(
            `DELETE FROM proyectos WHERE id = ? AND usuario_id = ?`,
            [id, usuarioId]
        );
        return result.affectedRows > 0;
    }

    // ── Contar proyectos terminados de un usuario ─
    static async contarTerminados(usuarioId) {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS total FROM proyectos WHERE usuario_id = ? AND estado = 'terminado'`,
            [usuarioId]
        );
        return rows[0].total;
    }

    // ── Contar todos los proyectos de un usuario ──
    static async contarTodos(usuarioId) {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS total FROM proyectos WHERE usuario_id = ?`,
            [usuarioId]
        );
        return rows[0].total;
    }

    // ── Estadísticas por semestre ─────────────────
    static async estadisticasPorSemestre(usuarioId) {
        const [rows] = await db.execute(`
            SELECT semestre, anio,
                COUNT(*) AS total,
                SUM(CASE WHEN estado = 'terminado' THEN 1 ELSE 0 END) AS terminados
            FROM proyectos
            WHERE usuario_id = ?
            GROUP BY semestre, anio
            ORDER BY anio ASC, semestre ASC
        `, [usuarioId]);
        return rows;
    }

    // ── Estadísticas por mes ──────────────────────
    static async estadisticasPorMes(usuarioId) {
        const [rows] = await db.execute(`
            SELECT 
                MONTH(fecha_realizacion) AS mes,
                YEAR(fecha_realizacion) AS anio,
                COUNT(*) AS total,
                SUM(CASE WHEN estado = 'terminado' THEN 1 ELSE 0 END) AS terminados
            FROM proyectos
            WHERE usuario_id = ?
            GROUP BY anio, mes
            ORDER BY anio ASC, mes ASC
        `, [usuarioId]);
        return rows;
    }
}

module.exports = Proyecto;