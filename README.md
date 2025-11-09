# Práctica 1: Portal de Productos con Autenticación y Chat

Este proyecto es una aplicación web completa desarrollada como parte de la asignatura de Programación Web. La aplicación integra un portal de gestión de productos (CRUD), un sistema robusto de autenticación de usuarios con roles (JWT) y un chat en tiempo real, todo conectado a una base de datos NoSQL (MongoDB).

El frontend ha sido diseñado para tener una apariencia moderna, profesional y responsiva, utilizando un esquema de color sofisticado, tipografías de Google Fonts e iconos de Font Awesome.

---

## 🚀 Características Principales

* **Autenticación de Usuarios**: Sistema completo de Registro e Inicio de Sesión.
* **Seguridad con JWT**: Las rutas privadas y la conexión al chat están protegidas mediante JSON Web Tokens.
* **Sistema de Roles**:
    * **Rol `user`**: Puede ver el listado de productos y participar en el chat.
    * **Rol `admin`**: Tiene permisos de `user` y además puede Crear, Editar y Eliminar productos.
* **Gestión de Productos (CRUD)**: Los administradores pueden gestionar el catálogo completo de productos, incluyendo un nombre, descripción, precio, stock y una **URL de imagen**.
* **Chat en Tiempo Real**: Un chat global (estilo "lobby") donde solo los usuarios autenticados pueden unirse y enviar mensajes.
* **Interfaz Profesional**: Un diseño visual pulido, moderno y responsivo que mejora la experiencia de usuario.
* **Persistencia de Datos**: Toda la información de usuarios y productos se almacena de forma persistente en MongoDB.

---

## 🛠️ Stack de Tecnologías

Este proyecto utiliza el stack MERN (sin React) y tecnologías complementarias:

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla) | Interfaz de usuario y lógica del lado del cliente. |
| **Backend** | Node.js, Express | El servidor que maneja la lógica de negocio y la API. |
| **Base de Datos** | MongoDB (con Mongoose) | Base de datos NoSQL para persistencia de usuarios y productos. |
| **Autenticación** | JSON Web Tokens (JWT) | Para proteger rutas y sesiones. |
| **Seguridad** | bcrypt.js | Para el "hasheo" seguro de contraseñas. |
| **Tiempo Real** | Socket.IO | Para la comunicación bidireccional del chat. |
| **Desarrollo** | `nodemon` | Para reiniciar el servidor automáticamente en desarrollo. |

---

## 📁 Estructura del Proyecto

El proyecto sigue la estructura de carpetas solicitada en la práctica, separando claramente las responsabilidades del backend y del frontend estático.