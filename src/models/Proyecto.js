// ============================================
// ProyUts - Modelo Proyecto (POO) - ACTUALIZADO
// src/models/Proyecto.js
// ============================================

const db = require('../config/db');

class Proyecto {

    constructor(data) {
        this.id = data.id || null;
        this.usuarioId = data.usuario_id;
        this.cursoId = data.curso_id || null;
        this.titulo = data.titulo;
        this.descripcion = data.descripcion || '';
        this.fechaRealizacion = data.fecha_realizacion;
        this.semestre = data.semestre;
        this.anio = data.anio;
        this.estado = data.estado || 'en_progreso';
        this.comentarioProfesor = data.comentario_profesor || null;
        this.fechaRegistro = data.fecha_registro || null;
        this.nombreCurso = data.nombre_curso || null;
        this.nombreEstudiante = data.nombre_estudiante || null;
        this.apellidoEstudiante = data.apellido_estudiante || null;
        this.codigoEstudiante = data.codigo_estudiante || null;
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
            'en_progreso' // siempre inicia en progreso
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

    // ── Obtener proyecto por ID sin restricción de usuario (para profesor) ──
    static async obtenerPorIdAdmin(id) {
        const sql = `
            SELECT p.*, c.nombre AS nombre_curso,
                u.nombre AS nombre_estudiante, u.apellido AS apellido_estudiante,
                u.codigo AS codigo_estudiante
            FROM proyectos p
            LEFT JOIN cursos c ON c.id = p.curso_id
            LEFT JOIN usuarios u ON u.id = p.usuario_id
            WHERE p.id = ?
        `;
        const [rows] = await db.execute(sql, [id]);
        if (rows.length === 0) return null;
        return rows[0];
    }

    // ── Obtener proyectos de los cursos de un profesor ──
    static async obtenerPorProfesor(profesorId) {
        const sql = `
            SELECT p.*, c.nombre AS nombre_curso,
                u.nombre AS nombre_estudiante, u.apellido AS apellido_estudiante,
                u.codigo AS codigo_estudiante
            FROM proyectos p
            LEFT JOIN cursos c ON c.id = p.curso_id
            LEFT JOIN usuarios u ON u.id = p.usuario_id
            INNER JOIN profesor_curso pc ON pc.curso_id = p.curso_id AND pc.profesor_id = ?
            ORDER BY p.fecha_registro DESC
        `;
        const [rows] = await db.execute(sql, [profesorId]);
        return rows.map(r => new Proyecto(r));
    }

    // ── Actualizar proyecto (estudiante solo puede editar en_progreso y enviado) ──
    static async actualizar(id, usuarioId, data) {
        const sql = `
            UPDATE proyectos 
            SET titulo=?, descripcion=?, curso_id=?, fecha_realizacion=?, semestre=?, anio=?, estado=?
            WHERE id=? AND usuario_id=? AND estado NOT IN ('terminado')
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

    // ── Enviar proyecto para revisión del profesor ──
    static async enviarParaRevision(id, usuarioId) {
        const [result] = await db.execute(
            `UPDATE proyectos SET estado = 'enviado' WHERE id = ? AND usuario_id = ? AND estado = 'en_progreso'`,
            [id, usuarioId]
        );
        return result.affectedRows > 0;
    }

    // ── Aprobar proyecto (profesor) ───────────────
    static async aprobar(id) {
        const [result] = await db.execute(
            `UPDATE proyectos SET estado = 'terminado', comentario_profesor = NULL WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    // ── Rechazar proyecto (profesor) ──────────────
    static async rechazar(id, comentario) {
        const [result] = await db.execute(
            `UPDATE proyectos SET estado = 'rechazado', comentario_profesor = ? WHERE id = ?`,
            [comentario, id]
        );
        return result.affectedRows > 0;
    }

    // ── Eliminar proyecto ─────────────────────────
    static async eliminar(id, usuarioId) {
        const [result] = await db.execute(
            `DELETE FROM proyectos WHERE id = ? AND usuario_id = ? AND estado NOT IN ('terminado')`,
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