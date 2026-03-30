-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 30-03-2026 a las 05:11:22
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `el_vitral_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `tipo` enum('vidrio','espejo','aluminio','herraje','insumo') NOT NULL,
  `descripcion` text DEFAULT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `unidad_medida` varchar(20) DEFAULT NULL,
  `precio_base` decimal(10,2) NOT NULL,
  `stock_minimo` int(11) DEFAULT 5,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `nombre`, `tipo`, `descripcion`, `imagen_url`, `unidad_medida`, `precio_base`, `stock_minimo`, `activo`) VALUES
(203, 'Vidrio Claro 3mm', 'vidrio', 'Vidrio transparente de 3mm de espesor', 'https://media.istockphoto.com/id/2148805322/photo/glass-sheets-super-clear-float-glass-panels.jpg?s=612x612&w=0&k=20&c=4ICd6ne9n7J1WfBydbF5PU5SyqrGT1O9oPAasgvxNoo=', 'm2', 35000.00, 20, 1),
(204, 'Vidrio Claro 4mm', 'vidrio', 'Vidrio transparente de 4mm de espesor', 'https://media.istockphoto.com/id/961823942/photo/sheets-of-factory-manufacturing-tempered-clear-float-glass-panels-cut-to-size.jpg?s=612x612&w=0&k=20&c=u3g9k-Ek1aCj6wvJQKsW66Xmhp97hrf35Af3qhKS8Ww=', 'm2', 45000.00, 20, 1),
(205, 'Vidrio Claro 5mm', 'vidrio', 'Vidrio transparente de 5mm de espesor', 'https://media.istockphoto.com/id/2130497433/photo/glass-factory-produces-a-variety-of-transparent-glass-thicknesses.jpg?s=612x612&w=0&k=20&c=Uiyv5cqyHKEUsS_Gtcys56dfIEpFZHfJ1JY_LEnwpAk=', 'm2', 75000.00, 15, 1),
(206, 'Vidrio Claro 6mm', 'vidrio', 'Vidrio transparente de 6mm de espesor', 'https://media.istockphoto.com/id/1279064276/photo/glass-factory-produces-a-variety-of-transparent-glass-thicknesses.jpg?s=612x612&w=0&k=20&c=R8fPPOEwjILrOnWEguLSSg3UYdYIEaEOsf0s9x3tWHw=', 'm2', 100000.00, 15, 1),
(207, 'Vidrio Claro 8mm', 'vidrio', 'Vidrio transparente de 8mm de espesor', 'https://media.istockphoto.com/id/2130497780/photo/sheets-of-factory-manufacturing-tempered-clear-float-glass-panels-cut-to-size.jpg?s=612x612&w=0&k=20&c=kYs4OQSmlcXmfY3kGp-BExpcA33TAbD32DBp8meCrHI=', 'm2', 150000.00, 10, 1),
(208, 'Vidrio Claro 10mm', 'vidrio', 'Vidrio transparente de 10mm de espesor', 'https://media.istockphoto.com/id/1220308342/photo/glass-factory-produces-a-variety-of-transparent-glass-thicknesses.jpg?s=612x612&w=0&k=20&c=UFXEXol_JBLu4BENymGUTCf7yUKOXoqeaqGxIyXWn3Q=', 'm2', 180000.00, 8, 1),
(209, 'Vidrio Templado 5mm', 'vidrio', 'Vidrio templado, 5mm', 'https://media.istockphoto.com/id/1412943657/photo/toughened-glass-protection-of-the-glass-pane-in-a-special-furnace-inscription-denoting-ready.jpg?s=612x612&w=0&k=20&c=kBMUZbAaLXMdMs42iuF1OZR3iKqZKC_zN-ZxI5ylyF8=', 'm2', 96000.00, 10, 1),
(210, 'Vidrio Templado 6mm', 'vidrio', 'Vidrio templado, 6mm', 'https://media.istockphoto.com/id/1412943655/photo/toughened-glass-close-up-fired-glass-tempering-markings.jpg?s=612x612&w=0&k=20&c=W9cCgz9uLv6nYEYWMbj196IoYWW3KOuMQbXiYUMZGAQ=', 'm2', 102000.00, 10, 1),
(211, 'Vidrio Templado 8mm', 'vidrio', 'Vidrio templado, 8mm', 'https://media.istockphoto.com/id/1410129320/photo/toughened-glass-protection-of-glass-panes-in-a-special-furnace-burnt-inscription-denoting.jpg?s=612x612&w=0&k=20&c=ggXxaCQvikkJtVO0OyoPjglqRAVOUnVUJX7788B9VOc=', 'm2', 133000.00, 8, 1),
(212, 'Vidrio Templado 10mm', 'vidrio', 'Vidrio templado, 10mm', 'https://media.istockphoto.com/id/1410129305/photo/toughened-glass-protection-of-glass-panes-in-a-special-furnace-burnt-inscription-denoting.jpg?s=612x612&w=0&k=20&c=WWe5-4mppnpZnsEhe8xNR6SsYe2InAJs9aPAfr3Cq_U=', 'm2', 165000.00, 6, 1),
(213, 'Espejo 3mm', 'espejo', 'Espejo estándar de 3mm', 'https://tse1.mm.bing.net/th/id/OIP.x_GPHYIF-_s0ZfS9IwbPdQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3', 'm2', 65000.00, 15, 1),
(214, 'Espejo 4mm', 'espejo', 'Espejo estándar de 4mm', 'https://www.alo.bg/user_files/m/maiaa/9779042_132893434_big.jpg', 'm2', 90000.00, 15, 1),
(215, 'Espejo Color Bronce', 'espejo', 'Espejo con acabado bronce, 4mm', 'https://th.bing.com/th/id/OIP.OkbbZCHELXtF13s3vT6BowAAAA?w=201&h=201&c=7&r=0&o=7&dpr=1.1&pid=1.7&rm=3', 'm2', 160000.00, 8, 1),
(216, 'Espejo Color Ahumado', 'espejo', 'Espejo con acabado ahumado, 4mm', 'https://tse4.mm.bing.net/th/id/OIP.F7ldjHp69HJNRe6QTKKtpQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3', 'm2', 200000.00, 8, 1),
(217, 'Kit Herrajes Ventana', 'herraje', 'Juego de herrajes para ventana corrediza', 'https://aone-holding.com/wp-content/uploads/2021/09/types-of-fittings-five.jpg', 'unidad', 25000.00, 20, 1),
(218, 'Kit Herrajes Puerta', 'herraje', 'Juego de herrajes para puerta de aluminio', 'https://m.media-amazon.com/images/I/81d6qFQwV1L._AC_SL1500_.jpg', 'unidad', 45000.00, 15, 1),
(219, 'Silicona Transparente', '', 'Silicona para sellado de vidrios', 'https://th.bing.com/th/id/OIP.rI3f8LLoX7rYzrgcWS4CEQHaHa?w=187&h=187&c=7&r=0&o=7&dpr=1.1&pid=1.7&rm=3', 'unidad', 12000.00, 30, 1),
(220, 'Manija Aluminio', 'herraje', 'Manija de aluminio cromado', 'https://media.falabella.com/sodimacCO/648107/w=1035,h=832,f=webp,fit=contain,q=85', 'unidad', 18000.00, 25, 1),
(221, 'Bisagra Invisible', 'herraje', 'Bisagra invisible para puertas de vidrio', 'https://media.istockphoto.com/id/1199529908/photo/glass-door-with-iron-hinges-close-up-of-fastenings-for-a-transparent-door.jpg?s=612x612&w=0&k=20&c=-sV0uEn875QjJX2YdESIOba1L2fwWzFsodHzJ-CO44w=', 'unidad', 35000.00, 20, 1),
(222, 'Perfil Aluminio Blanco', 'aluminio', 'Perfil de aluminio color blanco (6m)', 'https://th.bing.com/th/id/OIP.4bZDXB0sh_Om4eKDWoVP3gHaFj?w=259&h=194&c=7&r=0&o=7&dpr=1.1&pid=1.7&rm=3', 'metro', 45000.00, 30, 1),
(223, 'Perfil Aluminio Negro', 'aluminio', 'Perfil de aluminio color negro mate', 'https://media.istockphoto.com/id/988644714/photo/several-aluminum-profile.jpg?s=612x612&w=0&k=20&c=HqdF5qn1pm3ydZfEUj6kxyCuBgT75XDdIxFH8vVQP4U=', 'metro', 52000.00, 25, 1),
(224, 'Cinta Doble Faz', 'insumo', 'Cinta de doble faz para instalación de espejos', 'https://media.falabella.com/sodimacCO/3029973/w=1036,h=832,f=webp,fit=contain,q=85', 'unidad', 15000.00, 30, 1),
(225, 'Espuma Selladora', 'insumo', 'Espuma de poliuretano para sellado de ventanas', 'https://media.falabella.com/sodimacCO/679187/w=1036,h=832,f=webp,fit=contain,q=85', 'metro', 8000.00, 25, 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=226;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
