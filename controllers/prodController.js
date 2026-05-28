const db = require('../config/db');

// =====================================================
// CREAR TABLA PRODUCCION SI NO EXISTE
// =====================================================
const inicializarTablaProduccion = async () => {

    try {

        await db.query(`
            CREATE TABLE IF NOT EXISTS produccion (

                id_produccion SERIAL PRIMARY KEY,

                id_planta INTEGER NOT NULL,

                cantidad INTEGER NOT NULL,

                fecha_siembra DATE NOT NULL,

                fecha_cosecha DATE,

                observaciones TEXT,

                CONSTRAINT fk_planta
                FOREIGN KEY (id_planta)
                REFERENCES planta(id_planta)
                ON DELETE CASCADE
            )
        `);

        console.log('✅ Tabla producción lista');

    } catch (error) {

        console.error('❌ Error creando tabla producción:', error);

    }
};

inicializarTablaProduccion();

// =====================================================
// REGISTRAR PRODUCCIÓN
// =====================================================
exports.registrarProduccion = async (req, res) => {

    const {
        id_planta,
        cantidad,
        fecha_siembra,
        fecha_cosecha
    } = req.body;

    try {

        const query = `
            INSERT INTO produccion
            (
                id_planta,
                cantidad,
                fecha_siembra,
                fecha_cosecha,
                observaciones
            )
            VALUES
            ($1, $2, $3, $4, $5)

            RETURNING id_produccion
        `;

        const result = await db.query(query, [
            id_planta,
            cantidad,
            fecha_siembra,
            fecha_cosecha,
            'Lote del invernadero'
        ]);

        res.status(201).json({
            success: true,
            id_produccion: result.rows[0].id_produccion,
            message: 'Lote registrado correctamente'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });

    }
};

// =====================================================
// LISTAR PRODUCCIÓN
// =====================================================
exports.listarProduccion = async (req, res) => {

    try {

        const query = `
            SELECT
                p.*,
                pl.nombre_comun
            FROM produccion p
            JOIN planta pl
                ON p.id_planta = pl.id_planta
            ORDER BY p.id_produccion DESC
        `;

        const result = await db.query(query);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }
};