# Práctica 1: Portal de Productos con Autenticación y Chat

Este proyecto es una aplicación web full-stack completa que integra un portal de gestión de productos (CRUD), un sistema de autenticación de usuarios basado en JWT con roles, y un chat en tiempo real.

El proyecto está desplegado en Render y utiliza MongoDB Atlas para la persistencia de datos.

Enlace al repositorio: https://github.com/ikercelaya/Programaci-n-Web-I

---

## 🚀 Demo en Vivo (Acceso a Render)

**Enlace de la aplicación:**
**[https://portal-app-practica1.onrender.com](https://portal-app-practica1.onrender.com)**

*(Nota: El plan gratuito de Render puede "dormir" el servidor tras 15 minutos de inactividad. La primera carga puede tardar 30-50 segundos en arrancar.)*

### Usuarios de Prueba (En Render)
La base de datos de producción ha sido pre-cargada con los siguientes usuarios para pruebas:

* **Administrador:**
    * **Usuario:** `admin@test.com`
    * **Contraseña:** `admin`
* **Usuario Normal:**
    * **Usuario:** `user@test.com`
    * **Contraseña:** `user`

---

## 🌟 Características Principales

* **Autenticación Segura:** Sistema completo de Registro e Inicio de Sesión. Las contraseñas se almacenan hasheadas (`bcrypt.js`) y las sesiones se gestionan con **JSON Web Tokens (JWT)**.
* **Control de Roles:**
    * **Usuario (`user`):** Puede ver productos y participar en el chat.
    * **Administrador (`admin`):** Puede crear, editar y eliminar productos.
* **Gestión de Productos (CRUD):** Los administradores tienen un panel para gestionar el inventario.
* **Subida de Imágenes (Funcional en Local):** El administrador puede subir una imagen de producto desde su equipo, que se guarda en el servidor local.
* **Chat en Tiempo Real:** Un chat global (estilo "lobby") implementado con **Socket.IO**.
* **Persistencia de Mensajes:** El historial del chat se guarda en MongoDB y se carga cada vez que un usuario se conecta.

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
| **Subida de Archivos**| `multer` | Procesamiento de subida de imágenes al disco local. |
| **Alojamiento (Cloud)**| **Render** | Despliegue del Web Service (Node.js). |

---

## 🧠 Decisiones Tomadas Durante el Desarrollo

Esta sección describe las decisiones de arquitectura y tecnología tomadas para cumplir con los requisitos de la práctica.

### 1. Autenticación: JWT vs. Sesiones de Express
Aunque se podía implementar la autenticación con `express-session`, se optó por **JSON Web Tokens (JWT)** por varias razones clave:

* **Sin Estado (Stateless):** El servidor no necesita almacenar información de la sesión en su memoria. Simplemente valida la firma del token en cada petición.
* **Escalabilidad:** Al ser *stateless*, el proyecto es mucho más fácil de desplegar en plataformas en la nube (como Render) y podría escalarse horizontalmente (con múltiples servidores) sin problemas.
* **Flexibilidad:** El mismo token sirve para autenticar tanto las peticiones a la **API REST** (ej. `/api/products`) como las conexiones de **Socket.IO**.

**Flujo de implementación:** El cliente guarda el token en `localStorage` tras el login y lo envía en el *header* `Authorization` en cada petición HTTP y en el paquete `auth` al conectarse a Socket.IO.

### 2. La Decisión Crítica: Subida de Imágenes (Disco Local vs. Cloud)
Esta fue una decisión técnica clave y un importante punto de aprendizaje durante el despliegue.

* **Implementación Local:** Se implementó la subida de imágenes usando `multer` para guardar los archivos en una carpeta local del servidor (`/src/public/uploads`). Esta solución **funciona perfectamente** cuando se ejecuta el proyecto en un entorno de desarrollo local (`npm start`).
* **Problema en la Nube (Render):** Se ha constatado que al desplegar en Render, esta funcionalidad **deja de ser viable**. Las plataformas en la nube como Render tienen un **"sistema de archivos efímero"**: cualquier archivo subido (como una imagen de producto) se borra a los pocos minutos o la próxima vez que el servidor se reinicia. El plan gratuito de Render ya no ofrece "Discos Persistentes".
* **Conclusión (Para Evaluación):** Se ha demostrado la capacidad de subir archivos localmente y se ha identificado la problemática del despliegue en la nube. Para que esta función sea persistente en producción, la decisión correcta (como siguiente paso) sería refactorizar el código para usar un servicio de almacenamiento externo como **Cloudinary** o **AWS S3**, guardando únicamente la URL en la base de datos. Por esta razón, la subida de imágenes **no es funcional en la demo de Render**, aunque la lógica del backend para el resto del CRUD (crear producto con texto, editarlo, etc.) funciona perfectamente conectada a la base de datos de Atlas.

### 3. Persistencia del Chat
Para cumplir con la ampliación opcional, el chat no podía ser efímero (donde los mensajes desaparecen al refrescar).

* **Decisión:** Se creó un nuevo modelo en Mongoose (`ChatMessage.js`).
* **Implementación:**
    1.  **Guardar:** Cuando el servidor recibe un evento `chat message` de un cliente, primero crea un nuevo documento `ChatMessage` y lo guarda en MongoDB.
    2.  **Cargar:** Cuando un usuario se conecta (`io.on('connection')`), el servidor realiza una consulta a MongoDB (`ChatMessage.find()`), obtiene los últimos 50 mensajes y se los emite a *ese* cliente en particular (`socket.emit('chat history', ...)`).

### 4. Elección de la Plataforma de Despliegue: Render vs. Vercel
* **Vercel** es increíble para frontends (React, Vue) y sitios estáticos, pero es **incompatible** con este proyecto. Su arquitectura *serverless* (funciones que se apagan) no soporta las conexiones persistentes que **Socket.IO necesita** para funcionar.
* **Render** fue la elección ideal porque su "Web Service" gratuito funciona como un servidor tradicional (persistente), lo que permite que las conexiones de Socket.IO se mantengan activas.
