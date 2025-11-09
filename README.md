# Portal de Productos con Autenticación y Chat

Este proyecto es una aplicación web full-stack completa que integra un portal de gestión de productos (CRUD), un sistema de autenticación de usuarios basado en JWT con roles, y un chat en tiempo real.

El proyecto cumple con todos los requisitos de la [Práctica 1](#) (enunciado de la tarea), incluyendo todas las **ampliaciones opcionales**:
* Persistencia del historial del chat.
* Interfaz de usuario con diseño moderno.
* Subida de imágenes de producto (implementado con Cloudinary).
* Despliegue en un servicio cloud (Render).

---

## 🚀 Demo en Vivo

**[https://portal-app-practica1.onrender.com](https://portal-app-practica1.onrender.com)**

*(Nota: El plan gratuito de Render puede "dormir" el servidor tras 15 minutos de inactividad. La primera carga puede tardar 30-50 segundos en arrancar.)*

---

## 🌟 Características Principales

* **Autenticación Segura:** Sistema completo de Registro e Inicio de Sesión. Las contraseñas se almacenan hasheadas (`bcrypt.js`) y las sesiones se gestionan con **JSON Web Tokens (JWT)**.
* **Control de Roles:**
    * **Usuario (`user`):** Puede ver productos y participar en el chat.
    * **Administrador (`admin`):** Puede crear, editar y eliminar productos.
* **Gestión de Productos (CRUD):** Los administradores tienen un panel para gestionar el inventario.
* **Subida de Imágenes a la Nube:** Las imágenes de los productos no se guardan en el servidor. Se suben directamente a **Cloudinary** usando `multer` y `multer-storage-cloudinary`, guardando únicamente la URL en la base de datos.
* **Chat en Tiempo Real:** Un chat global (estilo "lobby") implementado con **Socket.IO**.
* **Persistencia de Mensajes:** El historial del chat se guarda en MongoDB y se carga cada vez que un usuario se conecta.
* **Despliegue en Producción:** La aplicación está desplegada en **Render** (Web Service) y la base de datos en **MongoDB Atlas**.

---

## 🛠️ Stack de Tecnologías

| Categoría | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla) | Interfaz de usuario y lógica del cliente. |
| **Backend** | Node.js, Express | Creación del servidor y la API REST. |
| **Base de Datos** | MongoDB Atlas (con Mongoose) | Almacenamiento de usuarios, productos y mensajes. |
| **Autenticación**| `jsonwebtoken` (JWT) | Creación y verificación de tokens de sesión. |
| **Seguridad** | `bcrypt.js` | Hasheo de contraseñas de usuario. |
| **Tiempo Real** | Socket.IO | Comunicación bidireccional para el chat. |
| **Subida de Archivos**| `multer`, `multer-storage-cloudinary` | Procesamiento de subida de imágenes. |
| **Alojamiento (Cloud)**| **Render** | Despliegue del Web Service (Node.js). |
| **Alojamiento (Media)**| **Cloudinary** | Almacenamiento y servicio de imágenes en la nube. |

---

## 💡 Datos Interesantes y Flujo del Proyecto

Este proyecto combina varias tecnologías clave. Aquí hay un resumen de cómo funcionan juntas:

### 1. Flujo de Autenticación (JWT)
La seguridad de las rutas y del chat se maneja vía tokens:
1.  El usuario envía `email` y `password` a `/api/auth/login`.
2.  El servidor verifica las credenciales con `bcrypt.compare()`.
3.  Si es exitoso, genera un token JWT (`jsonwebtoken.sign()`) que contiene el `userId` y el `role`.
4.  El cliente guarda este token en `localStorage`.
5.  Para cada petición a rutas protegidas (ej. `GET /api/products`), el cliente añade el token al *header* `Authorization: Bearer ...`.
6.  En el backend, el middleware `authenticateJWT` intercepta la petición, verifica el token (`jwt.verify()`) y, si es válido, permite el acceso.

### 2. Flujo de Subida de Imágenes (Cloudinary)
Para evitar los problemas de almacenamiento de archivos en despliegues en la nube:
1.  El admin rellena el formulario de producto y selecciona un archivo de imagen.
2.  El frontend envía la petición como `FormData`.
3.  En el backend, la ruta `POST /api/products` usa `multer` configurado con `CloudinaryStorage`.
4.  `multer` intercepta el archivo y lo sube directamente a la API de Cloudinary, sin tocar el disco del servidor de Render.
5.  Cloudinary devuelve la URL segura (`https://res.cloudinary.com/...`) y el `imageId`.
6.  Estos dos campos se guardan en el documento del producto en MongoDB Atlas.

### 3. Flujo del Chat Persistente (Socket.IO + MongoDB)
1.  El cliente intenta conectarse a Socket.IO enviando su token JWT.
2.  Un middleware de Socket.IO en el servidor (`io.use()`) intercepta la conexión, verifica el JWT y, si es válido, permite la conexión.
3.  Al conectarse, el servidor busca en la colección `chatmessages` de MongoDB y emite los últimos 50 mensajes al nuevo usuario (`socket.emit('chat history', ...)`).
4.  Cuando un usuario envía un mensaje (`socket.on('chat message', ...)`), el servidor primero lo guarda en la base de datos (creando un `new ChatMessage`) y luego lo retransmite a *todos* los usuarios conectados (`io.emit(...)`).

---

## ⚙️ Cómo Ejecutarlo Localmente

### Prerrequisitos
* Node.js (v16 o superior)
* MongoDB (local o una cuenta gratuita en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
* Una cuenta gratuita en [Cloudinary](https://cloudinary.com/)

### 1. Clonar el Repositorio
```bash
git clone https://[TU_REPOSITORIO_DE_GITHUB].git
cd [NOMBRE_DEL_PROYECTO]