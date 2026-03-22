CREATE DATABASE IF NOT EXISTS el_vitral_db;
USE el_vitral_db;

CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    rol ENUM('usuario', 'admin') DEFAULT 'usuario',
    aprobado BOOLEAN DEFAULT false,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('vidrio', 'espejo', 'aluminio', 'herraje', 'insumo') NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(255),
    unidad_medida VARCHAR(20),
    precio_base DECIMAL(10,2) NOT NULL,
    stock_minimo INT DEFAULT 5,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE cotizaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NULL,
    nombre_cliente VARCHAR(100) NOT NULL,
    email_cliente VARCHAR(100) NOT NULL,
    telefono_cliente VARCHAR(20),
    direccion_cliente TEXT,
    fecha_cotizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2),
    iva DECIMAL(10,2),
    total DECIMAL(10,2),
    estado ENUM('vigente', 'aprobada', 'rechazada', 'convertida') DEFAULT 'vigente',
    codigo_unico VARCHAR(50) UNIQUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE cotizacion_detalles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cotizacion_id INT NOT NULL,
    producto_id INT NOT NULL,
    descripcion VARCHAR(255),
    cantidad INT NOT NULL,
    medida_largo DECIMAL(10,2),
    medida_ancho DECIMAL(10,2),
    grosor INT,
    precio_unitario DECIMAL(10,2),
    subtotal DECIMAL(10,2),
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cotizacion_id INT NULL,
    usuario_id INT NOT NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega DATE,
    estado ENUM('pendiente', 'en_proceso', 'listo', 'entregado') DEFAULT 'pendiente',
    total DECIMAL(10,2),
    notas TEXT,
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE inventario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    tipo_movimiento ENUM('entrada', 'salida') NOT NULL,
    descripcion TEXT,
    pedido_id INT NULL,
    usuario_id INT NOT NULL,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);