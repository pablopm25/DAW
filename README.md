Plataforma de Gestión de Cursos (Proyecto DAW)

Plataforma web completa orientada a la gestión académica, matriculación de alumnos y administración de contenidos. 

Este proyecto fue desarrollado como Trabajo de Fin de Ciclo para la titulación de **Desarrollo de Aplicaciones Web (DAW)**, demostrando el manejo de arquitecturas MVC, bases de datos relacionales y sistemas de autenticación.

## Tecnologías Utilizadas

* **Backend:** PHP, Laravel
* **Base de Datos:** MySQL
* **Frontend:** HTML5, CSS3, JavaScript (Blade Templates)
* **Arquitectura:** Patrón Modelo-Vista-Controlador (MVC)

## Características Principales

* **Sistema de Autenticación:** Login seguro y registro de nuevos usuarios.
* **Gestión de Roles:** Diferenciación de permisos entre Administradores y Alumnos.
* **Panel de Administración:** Interfaz privada para la creación, edición y borrado (CRUD) de cursos y gestión del alumnado.
* **Matriculación:** Lógica de negocio para que los estudiantes puedan inscribirse y visualizar su progreso en los cursos disponibles.

## 📄 Documentación del Proyecto (Memoria)

Para una comprensión técnica profunda sobre las decisiones de arquitectura, el modelo Entidad-Relación de la base de datos y los flujos de usuario, puedes consultar la memoria completa del proyecto:

## Instalación y Despliegue en Local

Si deseas probar el proyecto en tu entorno local:

1. Clona este repositorio: `git clone https://github.com/pablopm25/nombre-de-tu-repo-daw.git`
2. Instala las dependencias de PHP usando Composer: `composer install`
3. Copia el archivo `.env.example` a `.env` y configura tus credenciales de base de datos MySQL.
4. Genera la clave de la aplicación: `php artisan key:generate`
5. Ejecuta las migraciones para crear las tablas: `php artisan migrate`
6. Levanta el servidor local: `php artisan serve`

---
*Desarrollado por Pablo Pérez*
