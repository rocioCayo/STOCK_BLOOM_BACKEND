require('dotenv').config();

const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const authController = require('./controllers/authController');
const prodController = require('./controllers/prodController');
const db = require('./config/db');

const app = express();

// ===============================
// MIDDLEWARES
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// CONEXIÓN A POSTGRESQL
// ===============================
db.connect()
    .then(() => {
        console.log('✅ PostgreSQL conectado');
    })
    .catch((err) => {
        console.error('❌ Error PostgreSQL:', err);
    });

// =================================================================
// RUTAS AUTENTICACIÓN
// =================================================================
app.post('/api/login', authController.login);

app.get('/api/usuarios', authController.listarUsuarios);

app.post('/api/usuarios', authController.registrarUsuario);

app.get('/api/usuarios/buscar', authController.buscarUsuario);

app.put('/api/usuarios/:id_usuario', authController.actualizarUsuario);

// =================================================================
// PRODUCCIÓN
// =================================================================
app.post('/api/produccion', prodController.registrarProduccion);

app.get('/api/produccion', prodController.listarProduccion);

// =================================================================
// PLANTAS
// =================================================================

// OBTENER PLANTAS
app.get('/api/planta', async (req, res) => {
    try {

        const result = await db.query(`
            SELECT 
                id_planta,
                nombre_comun,
                nombre_cientifico,
                stock,
                ambiente,
                temporada,
                categoría AS categoria,
                precio_mayoreo,
                precio_menudeo,
                descripcion
            FROM planta
        `);

        res.json(result.rows);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// REGISTRAR PLANTA
app.post('/api/planta', async (req, res) => {

    const {
        nombre_comun,
        nombre_cientifico,
        stock,
        ambiente,
        temporada,
        categoria,
        precio_mayoreo,
        precio_menudeo,
        descripcion
    } = req.body;

    try {

        const query = `
            INSERT INTO planta
            (
                nombre_comun,
                nombre_cientifico,
                stock,
                ambiente,
                temporada,
                categoría,
                precio_mayoreo,
                precio_menudeo,
                descripcion
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9)

            RETURNING id_planta
        `;

        const result = await db.query(query, [
            nombre_comun,
            nombre_cientifico,
            stock,
            ambiente,
            temporada,
            categoria,
            precio_mayoreo,
            precio_menudeo,
            descripcion
        ]);

        res.status(201).json({
            success: true,
            id_planta: result.rows[0].id_planta
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }
});

// ACTUALIZAR PLANTA
app.put('/api/planta/:id_planta', async (req, res) => {

    const { id_planta } = req.params;

    const {
        nombre_comun,
        nombre_cientifico,
        stock,
        ambiente,
        temporada,
        categoria,
        precio_mayoreo,
        precio_menudeo,
        descripcion
    } = req.body;

    try {

        const query = `
            UPDATE planta SET
                nombre_comun = $1,
                nombre_cientifico = $2,
                stock = $3,
                ambiente = $4,
                temporada = $5,
                categoría = $6,
                precio_mayoreo = $7,
                precio_menudeo = $8,
                descripcion = $9
            WHERE id_planta = $10
        `;

        await db.query(query, [
            nombre_comun,
            nombre_cientifico,
            stock,
            ambiente,
            temporada,
            categoria,
            precio_mayoreo,
            precio_menudeo,
            descripcion,
            id_planta
        ]);

        res.json({
            success: true,
            message: 'Planta actualizada correctamente'
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }
});

// =================================================================
// VENTAS
// =================================================================
app.post('/api/ventas', async (req, res) => {

    const { id_usuario, total, detalles } = req.body;

    const client = await db.connect();

    try {

        await client.query('BEGIN');

        // INSERTAR VENTA
        const ventaResult = await client.query(
            `
            INSERT INTO venta
            (fecha, total, id_usuario)

            VALUES (NOW(), $1, $2)

            RETURNING id_venta
            `,
            [total, id_usuario]
        );

        const id_venta = ventaResult.rows[0].id_venta;

        // INSERTAR DETALLES
        for (const item of detalles) {

            await client.query(
                `
                INSERT INTO detalle_venta
                (
                    id_venta,
                    id_planta,
                    cantidad,
                    precio_unitario,
                    subtotal
                )
                VALUES ($1,$2,$3,$4,$5)
                `,
                [
                    id_venta,
                    item.id_planta,
                    item.cantidad,
                    item.precio_unitario,
                    item.subtotal
                ]
            );

            // ACTUALIZAR STOCK
            await client.query(
                `
                UPDATE planta
                SET stock = stock - $1
                WHERE id_planta = $2
                `,
                [
                    item.cantidad,
                    item.id_planta
                ]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            id_venta
        });

    } catch (err) {

        await client.query('ROLLBACK');

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    } finally {

        client.release();

    }
});

// =================================================================
// REPORTES PDF
// =================================================================
app.get('/api/reportes/:tipo', async (req, res) => {

    const { tipo } = req.params;

    let dias =
        tipo === 'mensual'
            ? 30
            : tipo === 'anual'
                ? 365
                : 7;

    try {

        const query = `
            SELECT
                p.nombre_comun,
                dv.cantidad,
                dv.precio_unitario,
                p.stock
            FROM detalle_venta dv
            INNER JOIN venta v
                ON dv.id_venta = v.id_venta
            INNER JOIN planta p
                ON dv.id_planta = p.id_planta
            WHERE v.fecha >= NOW() - INTERVAL '${dias} days'
        `;

        const result = await db.query(query);

        const rows = result.rows;

        const doc = new PDFDocument({
            margin: 30
        });

        res.setHeader(
            'Content-Type',
            'application/pdf'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Reporte_${tipo}.pdf`
        );

        doc.pipe(res);

        doc
            .fontSize(20)
            .text(
                'Reporte de Ventas - Stock Bloom',
                {
                    align: 'center'
                }
            );

        doc.moveDown();

        rows.forEach((row) => {

            doc
                .fontSize(10)
                .text(
                    `${row.nombre_comun} | ${row.cantidad} | $${row.precio_unitario} | ${row.stock}`
                );

        });

        doc.end();

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Error al generar PDF'
        });

    }
});

// =================================================================
// SERVIDOR
// =================================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`
==========================================
🚀 Backend corriendo en puerto ${PORT}
==========================================
`);

});