USE el_vitral_db;

CREATE TABLE IF NOT EXISTS encuestas_satisfaccion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    usuario_id INT NOT NULL,
    calificacion TINYINT NOT NULL,
    comentario TEXT,
    fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_encuesta_pedido (pedido_id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CHECK (calificacion BETWEEN 1 AND 5)
);