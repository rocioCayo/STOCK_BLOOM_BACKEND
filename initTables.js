const db = require('./config/db');

const crearTablas = async () => {

    try {

        // =========================
        // TABLA USUARIO
        // =========================
        await db.query(`
            CREATE TABLE IF NOT EXISTS usuario (

                id_usuario SERIAL PRIMARY KEY,

                nombre VARCHAR(100) NOT NULL,

                apellidoP VARCHAR(100),

                apellidoM VARCHAR(100),

                telefono VARCHAR(20) UNIQUE NOT NULL,

                contraseña VARCHAR(255) NOT NULL,

                rol VARCHAR(50) NOT NULL
            )
        `);

        console.log('✅ Tabla usuario creada');

        // =========================
        // TABLA PLANTA
        // =========================
        await db.query(`
            CREATE TABLE IF NOT EXISTS planta (

                id_planta SERIAL PRIMARY KEY,

                nombre_comun VARCHAR(100) NOT NULL,

                nombre_cientifico VARCHAR(150),

                stock INTEGER DEFAULT 0,

                ambiente VARCHAR(100),

                temporada VARCHAR(100),

                categoría VARCHAR(100),

                precio_mayoreo DECIMAL(10,2),

                precio_menudeo DECIMAL(10,2),

                descripcion TEXT
            )
        `);

        console.log('✅ Tabla planta creada');

        // =========================
        // TABLA PRODUCCION
        // =========================
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

        console.log('✅ Tabla produccion creada');

        // =========================
        // TABLA VENTA
        // =========================
        await db.query(`
            CREATE TABLE IF NOT EXISTS venta (

                id_venta SERIAL PRIMARY KEY,

                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                total DECIMAL(10,2) NOT NULL,

                id_usuario INTEGER,

                CONSTRAINT fk_usuario
                FOREIGN KEY (id_usuario)
                REFERENCES usuario(id_usuario)
                ON DELETE SET NULL
            )
        `);

        console.log('✅ Tabla venta creada');

        // =========================
        // TABLA DETALLE_VENTA
        // =========================
        await db.query(`
            CREATE TABLE IF NOT EXISTS detalle_venta (

                id_detalle SERIAL PRIMARY KEY,

                id_venta INTEGER NOT NULL,

                id_planta INTEGER NOT NULL,

                cantidad INTEGER NOT NULL,

                precio_unitario DECIMAL(10,2),

                subtotal DECIMAL(10,2),

                CONSTRAINT fk_venta
                FOREIGN KEY (id_venta)
                REFERENCES venta(id_venta)
                ON DELETE CASCADE,

                CONSTRAINT fk_planta_detalle
                FOREIGN KEY (id_planta)
                REFERENCES planta(id_planta)
                ON DELETE CASCADE
            )
        `);

        console.log('✅ Tabla detalle_venta creada');

        console.log('\n🚀 TODAS LAS TABLAS FUERON CREADAS\n');

        process.exit();

    } catch (error) {

        console.error('❌ Error creando tablas:', error);

    }

};

crearTablas();