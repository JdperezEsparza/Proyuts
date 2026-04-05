// ============================================
// ProyUts - Modelo Usuario (POO) - ACTUALIZADO
// src/models/Usuario.js
// ============================================

const db = require('../config/db');
const bcrypt = require('bcrypt');

class Usuario {

    constructor(data) {
        this.id            = data.id || null;
        this.nombre        = data.nombre;
        this.apellido      = data.apellido;
        this.codigo        = data.codigo;
        this.email         = data.email;
        this.contrasena    = data.contrasena;
        this.semestre      = data.semestre;
        this.programa      = data.programa;
        this.rol           = data.rol || 'estudiante';
        this.puntos        = data.puntos || 0;
        this.fechaRegistro = data.fecha_registro || null;
    }

    getNombreCompleto() {
        return `${this.nombre} ${this.apellido}`;
    }

    // ── Registrar nuevo usuario ──────────────────
    static async registrar(data) {
        const hash = await bcrypt.hash(data.contrasena, 10);
        const sql = `INSERT INTO usuarios (nombre, apellido, codigo, email, contrasena, semestre, programa)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [
            data.nombre, data.apellido, data.codigo,
            data.email, hash, data.semestre, data.programa
        ]);
        return result.insertId;
    }

    // ── Login ────────────────────────────────────
    static async login(email, contrasena) {
        const sql = `SELECT * FROM usuarios WHERE email = ?`;
        const [rows] = await db.execute(sql, [email]);
        if (rows.length === 0) return null;
        const usuario = rows[0];
        const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!coincide) return null;
        return new Usuario(usuario);
    }

    // ── Buscar por ID ────────────────────────────
    static async buscarPorId(id) {
        const [rows] = await db.execute(`SELECT * FROM usuarios WHERE id = ?`, [id]);
        if (rows.length === 0) return null;
        return new Usuario(rows[0]);
    }

    // ── Verificar si email ya existe ─────────────
    static async emailExiste(email) {
        const [rows] = await db.execute(`SELECT id FROM usuarios WHERE email = ?`, [email]);
        return rows.length > 0;
    }

    // ── Verificar si código ya existe ────────────
    static async codigoExiste(codigo) {
        const [rows] = await db.execute(`SELECT id FROM usuarios WHERE codigo = ?`, [codigo]);
        return rows.length > 0;
    }

    // ── Actualizar perfil ────────────────────────
    static async actualizar(id, data) {
        const sql = `UPDATE usuarios SET nombre=?, apellido=?, semestre=?, programa=? WHERE id=?`;
        const [result] = await db.execute(sql, [
            data.nombre, data.apellido, data.semestre, data.programa, id
        ]);
        return result.affectedRows > 0;
    }

    // ── Obtener todos los usuarios (para chat) ───
    static async obtenerTodos(exceptoId) {
        const [rows] = await db.execute(
            `SELECT id, nombre, apellido, codigo, programa 
             FROM usuarios WHERE id != ? AND rol = 'estudiante'`,
            [exceptoId]
        );
        return rows;
    }

    // ── Sumar puntos al usuario ──────────────────
    static async sumarPuntos(usuarioId, puntos) {
        const sql = `UPDATE usuarios SET puntos = puntos + ? WHERE id = ?`;
        await db.execute(sql, [puntos, usuarioId]);
    }

    // ── Top 10 ranking ───────────────────────────
    static async obtenerRanking() {
        const sql = `
            SELECT 
                u.id,
                u.nombre,
                u.apellido,
                u.codigo,
                u.programa,
                u.semestre,
                u.puntos,
                COUNT(CASE WHEN p.estado = 'terminado' THEN 1 END) AS proyectos_terminados
            FROM usuarios u
            LEFT JOIN proyectos p ON p.usuario_id = u.id
            WHERE u.rol = 'estudiante'
            GROUP BY u.id
            ORDER BY u.puntos DESC, proyectos_terminados DESC
            LIMIT 10
        `;
        const [rows] = await db.execute(sql);
        return rows;
    }

    // ── Verificar y otorgar logros ───────────────
    static async verificarLogros(usuarioId) {
        // Contar proyectos terminados del usuario
        const [countRows] = await db.execute(
            `SELECT COUNT(*) as total FROM proyectos 
             WHERE usuario_id = ? AND estado = 'terminado'`,
            [usuarioId]
        );
        const total = countRows[0].total;

        // Obtener logros que aún no tiene y que ya cumple
        const [logros] = await db.execute(
            `SELECT l.* FROM logros l
             WHERE l.proyectos_requeridos <= ?
             AND l.id NOT IN (
                 SELECT logro_id FROM logros_usuario WHERE usuario_id = ?
             )`,
            [total, usuarioId]
        );

        // Otorgar cada logro pendiente y sumar puntos
        for (const logro of logros) {
            await db.execute(
                `INSERT INTO logros_usuario (usuario_id, logro_id) VALUES (?, ?)`,
                [usuarioId, logro.id]
            );
            await Usuario.sumarPuntos(usuarioId, logro.puntos_otorgados);
        }

        return logros; // Devuelve los nuevos logros obtenidos
    }

    // ── Obtener logros del usuario ───────────────
    static async obtenerLogros(usuarioId) {
        const [rows] = await db.execute(
            `SELECT l.*, lu.fecha_obtenido 
             FROM logros l
             LEFT JOIN logros_usuario lu ON lu.logro_id = l.id AND lu.usuario_id = ?
             ORDER BY l.proyectos_requeridos ASC`,
            [usuarioId]
        );
        return rows;
    }
}

module.exports = Usuario;