AUDITCLOUD FRONT
================

Frontend de AuditCloud construido con Angular.

OBJETIVO
--------
Facilitar que cualquier integrante nuevo pueda instalar, ejecutar y empezar a contribuir en minutos.

REQUISITOS
----------
- Node.js 20+
- npm 10+

INICIO RAPIDO
-------------
1) Instalar dependencias:
	npm install
2) Levantar entorno local:
	npm start
3) Abrir en navegador:
	http://localhost:4200

COMANDOS PRINCIPALES
--------------------
- Desarrollo local: npm start
- Ejecutar pruebas: npm test
- Generar build: npm run build

FLUJO RECOMENDADO PARA NUEVOS INTEGRANTES
-----------------------------------------
1) Hacer pull de la rama principal.
2) Crear una rama de trabajo para tu tarea.
3) Levantar el proyecto con npm start.
4) Implementar cambios pequenos y hacer commits claros.
5) Correr pruebas antes de abrir PR (npm test).

ESTRUCTURA BASE
---------------
- src/app/auth: login y registro
- src/app/cliente: modulo cliente
- src/app/auditor: modulo auditor
- src/app/supervisor: modulo supervisor
- src/app/services: integracion con API y auth

NOTAS IMPORTANTES
-----------------
- Este repositorio es solo frontend.
- Backend esperado en: http://localhost:3000
- Si cambia la URL del backend, actualizar la configuracion en servicios del frontend.
