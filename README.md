# AuditCloud Front

Frontend de AuditCloud construido con Angular.

## Objetivo

Permitir que los usuarios del sistema interactuen con el flujo principal de AuditCloud:

Cliente -> empresa auditora -> conversacion -> solicitud de pago -> pago -> auditoria -> evidencias/reportes -> cierre.

## Backend conectado

El frontend consume el backend real desplegado en la VM Linux:

http://192.168.1.243:3000

La URL se centraliza en:

src/environments/environment.ts
src/environments/environment.development.ts

Variable usada:

apiUrl: 'http://192.168.1.243:3000'

## Requisitos

- Node.js 20+
- npm 10+
- Angular CLI

## Instalacion

npm install

## Ejecutar en desarrollo

npm start

Abrir en navegador:

http://localhost:4200

## Compilar

npm run build

En Windows, si PowerShell bloquea npm, usar:

npm.cmd run build

## Usuarios demo

Supervisor:
supervisor@auditcloud.com / 123456

Auditor:
auditor@auditcloud.com / 123456

Cliente:
cliente@auditcloud.com / 123456

## Login

Endpoint usado:

POST /api/auth/login

Payload:

{
  "correo": "supervisor@auditcloud.com",
  "password": "123456"
}

Respuesta esperada:

{
  "token": "...",
  "usuario": {
    "id_usuario": 1,
    "id_empresa": 1,
    "nombre": "Supervisor Demo",
    "correo": "supervisor@auditcloud.com",
    "id_rol": 1,
    "rol": "SUPERVISOR"
  }
}

## Flujo por rol

### Cliente

- Inicia sesion.
- Consulta empresas auditoras.
- Inicia conversacion con la empresa auditora.
- Recibe solicitud de pago.
- Realiza pago.
- Consulta auditorias, evidencias y reportes segun avance.

### Supervisor

- Inicia sesion.
- Revisa conversaciones y solicitudes.
- Genera solicitudes de pago.
- Verifica pagos.
- Asigna auditor a una auditoria.
- Supervisa avance, evidencias y reportes.

### Auditor

- Inicia sesion.
- Consulta auditorias asignadas.
- Sube evidencias.
- Genera o consulta reportes.
- Actualiza avance segun el flujo de auditoria.

## Estructura principal

src/app/auth
src/app/cliente
src/app/auditor
src/app/supervisor
src/app/services
src/environments

## Pruebas recomendadas

1. Iniciar sesion como supervisor y validar redireccion a /supervisor/dashboard.
2. Iniciar sesion como auditor y validar redireccion a /auditor/dashboard.
3. Iniciar sesion como cliente y validar redireccion a /cliente/dashboard.
4. Revisar que los menus por rol naveguen correctamente.
5. Probar que el frontend consuma el backend real en 192.168.1.243:3000.

## Notas

- No hardcodear URLs del backend en componentes.
- Usar environment.apiUrl.
- No modificar el diseno si solo se esta trabajando conexion.
- El backend debe estar activo antes de probar el frontend.
