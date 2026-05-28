const db = require('../config/db');

// =====================================================
// LOGIN
// =====================================================
exports.login = async (req, res) => {

    const { telefono, contrasenia } = req.body;

    try {

        const query = `
            SELECT *
            FROM usuario
            WHERE telefono = $1
            AND contraseña = $2
        `;

        const result = await db.query(query, [
            telefono,
            contrasenia
        ]);

        if (result.rows.length > 0) {

            res.json({
                success: true,
                usuario: result.rows[0]
            });

        } else {

            res.status(401).json({
                success: false,
                mensaje: 'Credenciales incorrectas'
            });

        }

    } catch (error) {

        console.error("Error en login:", error);

        res.status(500).json({
            error: 'Error interno en el servidor'
        });

    }
};

// =====================================================
// LISTAR USUARIOS
// =====================================================
exports.listarUsuarios = async (req, res) => {

    try {

        const query = `
            SELECT
                id_usuario,
                nombre,
                apellidoP,
                apellidoM,
                contraseña,
                rol,
                telefono
            FROM usuario
        `;

        const result = await db.query(query);

        res.json(result.rows);

    } catch (error) {

        console.error("Error en listarUsuarios:", error);

        res.status(500).json({
            error: 'Error al obtener la lista de personal'
        });

    }
};

// =====================================================
// BUSCAR USUARIO
// =====================================================
exports.buscarUsuario = async (req, res) => {

    const { telefono } = req.query;

    try {

        const query = `
            SELECT
                id_usuario,
                nombre,
                apellidoP,
                apellidoM,
                telefono,
                contraseña,
                rol
            FROM usuario
            WHERE telefono = $1
        `;

        const result = await db.query(query, [telefono]);

        if (result.rows.length > 0) {

            res.json(result.rows[0]);

        } else {

            res.status(404).json({
                error: 'Empleado no encontrado'
            });

        }

    } catch (error) {

        console.error("Error en buscarUsuario:", error);

        res.status(500).json({
            error: 'Error al consultar el usuario'
        });

    }
};

// =====================================================
// REGISTRAR USUARIO
// =====================================================
exports.registrarUsuario = async (req, res) => {

    const {
        nombre,
        apellidoP,
        apellidoM,
        telefono,
        contrasenia,
        rol
    } = req.body;

    try {

        // VALIDAR TELÉFONO DUPLICADO
        const validacion = await db.query(
            `
            SELECT id_usuario
            FROM usuario
            WHERE telefono = $1
            `,
            [telefono]
        );

        if (validacion.rows.length > 0) {

            return res.status(400).json({
                success: false,
                error: 'Este teléfono ya existe'
            });

        }

        // INSERTAR USUARIO
        const query = `
            INSERT INTO usuario
            (
                nombre,
                apellidoP,
                apellidoM,
                telefono,
                contraseña,
                rol
            )

            VALUES
            ($1, $2, $3, $4, $5, $6)

            RETURNING id_usuario
        `;

        const result = await db.query(query, [
            nombre,
            apellidoP,
            apellidoM,
            telefono,
            contrasenia,
            rol
        ]);

        return res.json({
            success: true,
            id_usuario: result.rows[0].id_usuario,
            mensaje: 'Usuario registrado correctamente'
        });

    } catch (error) {

        console.error("Error registrarUsuario:", error);

        return res.status(500).json({
            success: false,
            error: 'Error interno'
        });

    }
};

// =====================================================
// ACTUALIZAR USUARIO
// =====================================================
exports.actualizarUsuario = async (req, res) => {

    const { id_usuario } = req.params;

    const {
        nombre,
        apellidoP,
        apellidoM,
        telefono,
        contrasenia,
        rol
    } = req.body;

    try {

        const query = `
            UPDATE usuario SET

                nombre = $1,
                apellidoP = $2,
                apellidoM = $3,
                telefono = $4,
                contraseña = $5,
                rol = $6

            WHERE id_usuario = $7
        `;

        await db.query(query, [
            nombre,
            apellidoP,
            apellidoM,
            telefono,
            contrasenia,
            rol,
            id_usuario
        ]);

        return res.json({
            success: true,
            mensaje: 'Usuario actualizado correctamente'
        });

    } catch (error) {

        console.error("Error actualizarUsuario:", error);

        return res.status(500).json({
            success: false,
            error: 'Error al actualizar usuario'
        });

    }
};