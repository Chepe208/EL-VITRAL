CREATE DATABASE IF NOT EXISTS el_vitral_db;
USE el_vitral_db;

CREATE TABLE usuarios (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    rol ENUM('usuario', 'admin') DEFAULT 'usuario',
    aprobado BOOLEAN DEFAULT false,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL,
    activo BOOLEAN DEFAULT true,
    politica_datos_aceptada BOOLEAN NOT NULL DEFAULT false,
    politica_datos_aceptada_at TIMESTAMP NULL,
    terminos_aceptados BOOLEAN NOT NULL DEFAULT false,
    terminos_aceptados_at TIMESTAMP NULL
);

CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('vidrio', 'espejo', 'aluminio', 'herraje', 'insumo') NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(255),
    unidad_medida VARCHAR(20),
    precio_base DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 5,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE cotizaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id VARCHAR(36) NULL,
    nombre_cliente VARCHAR(100) NOT NULL,
    email_cliente VARCHAR(100) NOT NULL,
    telefono_cliente VARCHAR(20),
    direccion_cliente TEXT,
    fecha_cotizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2),
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
    usuario_id VARCHAR(36) NOT NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega DATE,
    estado ENUM('pendiente', 'en_proceso', 'listo', 'entregado') DEFAULT 'pendiente',
    pago ENUM('pendiente', 'pagado', 'anticipo') DEFAULT 'pendiente',
    total DECIMAL(10,2),
    notas TEXT,
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE encuestas_satisfaccion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    usuario_id VARCHAR(36) NOT NULL,
    calificacion TINYINT NOT NULL,
    comentario TEXT,
    fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_encuesta_pedido (pedido_id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CHECK (calificacion BETWEEN 1 AND 5)
);

CREATE TABLE proyectos_destacados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    resumen VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(2048) NOT NULL,
    tecnologias TEXT,
    orden INT NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_proyectos_destacados_publicos (activo, orden)
);

CREATE TABLE inventario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    tipo_movimiento ENUM('entrada', 'salida') NOT NULL,
    descripcion TEXT,
    pedido_id INT NULL,
    usuario_id VARCHAR(36) NOT NULL,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE citas_agenda (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id VARCHAR(36) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_cita DATETIME NOT NULL,
    tipo ENUM('entrega', 'consulta', 'medidas', 'pago', 'otro') DEFAULT 'otro',
    estado ENUM('pendiente', 'confirmada', 'realizada', 'cancelada') DEFAULT 'pendiente',
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha_cita (fecha_cita)
);

CREATE TABLE agenda_dias_disponibles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_agenda_fecha (fecha)
);
