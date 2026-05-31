# Guía Completa de Rutas del Backend - AuditCloud

Esta guía documenta todas las rutas que el backend debe implementar según el flujo de trabajo de AuditCloud.

**Base URL:** `http://192.168.1.243:3000`

**Frontend Angular:** usa la variable centralizada `src/environments/environment.ts` con `apiUrl = 'http://192.168.1.243:3000'`.

**Usuarios demo:**
- Supervisor: `supervisor@auditcloud.com / 123456`
- Auditor: `auditor@auditcloud.com / 123456`
- Cliente: `cliente@auditcloud.com / 123456`

**Autenticación:** Todas las rutas (excepto login/registro) requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

---

## 🔐 AUTENTICACIÓN

### 1. POST `/api/auth/login`
**Descripción:** Iniciar sesión de cualquier usuario (cliente, supervisor, auditor)

**Body:**
```json
{
  "correo": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Respuesta (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id_usuario": 1,
    "id_rol": 3,
    "id_empresa": 5,
    "nombre": "Juan Pérez",
    "correo": "usuario@ejemplo.com"
  }
}
```

**Errores:**
- `401`: Credenciales incorrectas
- `400`: Datos inválidos

---

### 2. POST `/api/cliente/registro`
**Descripción:** Registrar nuevo cliente (empresa cliente)

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "correo": "juan@empresa.com",
  "password": "password123",
  "nombre_empresa": "Mi Empresa S.A.",
  "ciudad": "Aguascalientes",
  "estado": "Aguascalientes",
  "rfc": "ABC123456XYZ"
}
```

**Respuesta (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id_usuario": 10,
    "id_rol": 3,
    "id_empresa": 15,
    "nombre": "Juan Pérez",
    "correo": "juan@empresa.com"
  }
}
```

**Notas:**
- El sistema debe crear automáticamente la empresa cliente
- Asignar rol CLIENTE (id_rol = 3)
- Crear la empresa en la BD

---

## 👤 CLIENTE - Dashboard

### 3. GET `/api/cliente/auditorias/:idCliente`
**Descripción:** Obtener todas las auditorías de un cliente

**Parámetros:**
- `idCliente` (path): ID del usuario cliente
- `page` (query, opcional): Número de página (default: 1)
- `limit` (query, opcional): Límite por página (default: 100)

**Respuesta (200):**
```json
[
  {
    "id_auditoria": 1,
    "id_cliente": 5,
    "id_empresa_auditora": 2,
    "id_estado": 1,
    "modulos": [1, 2],
    "fecha_creacion": "2024-01-15T10:00:00Z",
    "fecha_inicio": "2024-01-20T08:00:00Z",
    "monto": 50000.00
  }
]
```

**O si usas paginación:**
```json
{
  "data": [...],
  "total": 10,
  "page": 1,
  "limit": 100
}
```

---

### 4. GET `/api/cliente/solicitudes-pago/:idCliente`
**Descripción:** Obtener solicitudes de pago de un cliente

**Parámetros:**
- `idCliente` (path): ID del usuario cliente

**Respuesta (200):**
```json
[
  {
    "id_solicitud": 1,
    "id_cliente": 5,
    "id_empresa_auditora": 2,
    "id_estado": 1,
    "monto": 50000.00,
    "modulos": [1, 2],
    "fecha_creacion": "2024-01-15T10:00:00Z",
    "fecha_vencimiento": "2024-01-30T23:59:59Z"
  }
]
```

**Estados:**
- `1`: PENDIENTE_DE_PAGO
- `2`: PAGADA
- `3`: EXPIRADA
- `4`: CANCELADA

---

### 5. GET `/api/cliente/conversaciones/:idCliente`
**Descripción:** Obtener conversaciones de un cliente

**Parámetros:**
- `idCliente` (path): ID del usuario cliente

**Respuesta (200):**
```json
[
  {
    "id_conversacion": 1,
    "id_cliente": 5,
    "id_empresa_auditora": 2,
    "fecha_creacion": "2024-01-15T10:00:00Z",
    "empresa": {
      "id_empresa": 2,
      "nombre": "Auditora Demo S.A. de C.V."
    },
    "ultimo_mensaje": {
      "id_mensaje": 10,
      "contenido": "Hola, queremos auditoría de agua + suelo...",
      "fecha_envio": "2024-01-15T10:30:00Z",
      "id_remitente": 5
    }
  }
]
```

---

## 🏢 CLIENTE - Empresas Auditoras

### 6. GET `/api/cliente/empresas-auditoras`
**Descripción:** Listar todas las empresas auditoras disponibles (visibles y con módulos configurados)

**Respuesta (200):**
```json
[
  {
    "id_empresa": 2,
    "nombre": "Auditora Demo S.A. de C.V.",
    "pais": "México",
    "estado": "Aguascalientes",
    "modulos": [1, 2]
  }
]
```

**Lógica del Backend:**
- Solo empresas con `visible = true` o `activa = true`
- Solo empresas con al menos un módulo configurado (`modulos.length > 0`)
- Incluir `pais` y `estado` si están disponibles

**Módulos:**
- `1`: Agua
- `2`: Residuos/Suelo
- `3`: Energía

---

### 7. GET `/api/cliente/empresas-auditoras/:id`
**Descripción:** Obtener detalle de una empresa auditora específica

**Parámetros:**
- `id` (path): ID de la empresa auditora

**Respuesta (200):**
```json
{
  "id_empresa": 2,
  "nombre": "Auditora Demo S.A. de C.V.",
  "rfc": "ADE123456XYZ",
  "direccion": "Calle Principal 123",
  "telefono": "4491234567",
  "pais": "México",
  "estado": "Aguascalientes",
  "modulos": [1, 2],
  "descripcion": "Empresa especializada en auditorías ambientales..."
}
```

**Errores:**
- `404`: Empresa no encontrada

---

## 💬 CLIENTE - Mensajes

### 8. GET `/api/cliente/mensajes/:idConversacion`
**Descripción:** Obtener mensajes de una conversación específica

**Parámetros:**
- `idConversacion` (path): ID de la conversación

**Respuesta (200):**
```json
{
  "id_conversacion": 1,
  "id_cliente": 5,
  "id_empresa_auditora": 2,
  "mensajes": [
    {
      "id_mensaje": 1,
      "id_remitente": 5,
      "contenido": "Hola, queremos auditoría de agua + suelo...",
      "fecha_envio": "2024-01-15T10:00:00Z"
    },
    {
      "id_mensaje": 2,
      "id_remitente": 2,
      "contenido": "Perfecto, te propongo una auditoría...",
      "fecha_envio": "2024-01-15T11:00:00Z"
    }
  ]
}
```

---

### 9. POST `/api/cliente/mensajes`
**Descripción:** Enviar un mensaje (crear conversación o responder)

**Body:**
```json
{
  "id_empresa_auditora": 2,
  "contenido": "Hola, queremos auditoría de agua + suelo en nuestra planta..."
}
```

**O si es respuesta a conversación existente:**
```json
{
  "id_conversacion": 1,
  "contenido": "Perfecto, aceptamos la propuesta"
}
```

**Respuesta (201):**
```json
{
  "id_mensaje": 10,
  "id_conversacion": 1,
  "id_remitente": 5,
  "contenido": "Hola, queremos auditoría...",
  "fecha_envio": "2024-01-15T10:00:00Z"
}
```

---

## 💳 CLIENTE - Pagos

### 10. GET `/api/cliente/pagos/:idCliente`
**Descripción:** Obtener todas las solicitudes de pago de un cliente

**Parámetros:**
- `idCliente` (path): ID del usuario cliente

**Respuesta (200):**
```json
[
  {
    "id_solicitud": 1,
    "id_cliente": 5,
    "id_empresa_auditora": 2,
    "id_estado": 1,
    "monto": 50000.00,
    "modulos": [1, 2],
    "fecha_creacion": "2024-01-15T10:00:00Z",
    "fecha_vencimiento": "2024-01-30T23:59:59Z",
    "empresa_auditora": {
      "id_empresa": 2,
      "nombre": "Auditora Demo S.A. de C.V."
    }
  }
]
```

---

### 11. POST `/api/cliente/pagos/:idSolicitud/procesar`
**Descripción:** Procesar pago de una solicitud (llamar a API de pagos)

**Parámetros:**
- `idSolicitud` (path): ID de la solicitud de pago

**Body:**
```json
{
  "metodo_pago": "paypal" // o "stripe", etc.
}
```

**Respuesta (200):**
```json
{
  "id_transaccion": "PAY-123456789",
  "url_pago": "https://paypal.com/checkout/...",
  "estado": "PENDIENTE"
}
```

**Notas:**
- El backend debe crear la transacción en la API de pagos
- Redirigir al cliente a la URL de pago

---

### 12. POST `/api/cliente/pagos/webhook`
**Descripción:** Webhook para recibir confirmación de pago de la API externa

**Body (ejemplo PayPal):**
```json
{
  "id_transaccion": "PAY-123456789",
  "estado": "COMPLETADO",
  "monto": 50000.00
}
```

**Lógica del Backend:**
- Si `estado === "COMPLETADO"`:
  1. Marcar solicitud como `PAGADA` (id_estado = 2)
  2. **Crear automáticamente la auditoría** con:
     - `id_cliente`: del cliente que pagó
     - `id_empresa_auditora`: de la solicitud
     - `modulos`: de la solicitud
     - `id_estado`: PROGRAMADA o ASIGNADA
     - `monto`: monto pagado

**Respuesta (200):**
```json
{
  "success": true
}
```

---

## 📋 CLIENTE - Auditorías

### 13. GET `/api/cliente/auditorias/:idAuditoria`
**Descripción:** Obtener detalle de una auditoría específica

**Parámetros:**
- `idAuditoria` (path): ID de la auditoría

**Respuesta (200):**
```json
{
  "id_auditoria": 1,
  "id_cliente": 5,
  "id_empresa_auditora": 2,
  "id_estado": 2,
  "modulos": [1, 2],
  "fecha_creacion": "2024-01-15T10:00:00Z",
  "fecha_inicio": "2024-01-20T08:00:00Z",
  "monto": 50000.00,
  "empresa_auditora": {
    "id_empresa": 2,
    "nombre": "Auditora Demo S.A. de C.V."
  },
  "estado_actual": {
    "id_estado": 2,
    "nombre": "EN_CAMPO"
  },
  "modulos_estado": [
    {
      "id_modulo": 1,
      "nombre": "Agua",
      "estado": "EN_ANALISIS"
    },
    {
      "id_modulo": 2,
      "nombre": "Suelo",
      "estado": "EN_CAMPO"
    }
  ]
}
```

---

### 14. GET `/api/cliente/auditorias/:idAuditoria/reporte`
**Descripción:** Descargar reporte PDF de una auditoría completada

**Parámetros:**
- `idAuditoria` (path): ID de la auditoría

**Respuesta (200):**
- Content-Type: `application/pdf`
- Archivo PDF del reporte

**Errores:**
- `404`: Auditoría no encontrada
- `400`: Reporte no disponible (auditoría no completada)

---

## 👨‍💼 SUPERVISOR - Dashboard

### 15. GET `/api/supervisor/dashboard/:idSupervisor`
**Descripción:** Obtener datos del dashboard del supervisor

**Parámetros:**
- `idSupervisor` (path): ID del usuario supervisor

**Respuesta (200):**
```json
{
  "auditorias_activas": 5,
  "auditorias_por_estado": {
    "1": 2, // PROGRAMADA
    "2": 1, // EN_CAMPO
    "3": 2  // EN_ANALISIS
  },
  "solicitudes_pendientes": 3,
  "conversaciones_nuevas": 2
}
```

---

## 🏢 SUPERVISOR - Configuración de Empresa

### 16. GET `/api/supervisor/empresa/:id`
**Descripción:** Obtener configuración de la empresa auditora del supervisor

**Parámetros:**
- `id` (path): ID de la empresa

**Respuesta (200):**
```json
{
  "id_empresa": 2,
  "nombre": "Auditora Demo S.A. de C.V.",
  "rfc": "ADE123456XYZ",
  "direccion": "Calle Principal 123",
  "telefono": "4491234567",
  "modulos": [1, 2]
}
```

**Notas:**
- `modulos` es un array de números: `[1]` = Agua, `[2]` = Residuos/Suelo, `[3]` = Energía
- Si no hay módulos, devolver `[]`

---

### 17. PUT `/api/supervisor/empresa/:id`
**Descripción:** Actualizar configuración de la empresa auditora

**Parámetros:**
- `id` (path): ID de la empresa

**Body:**
```json
{
  "nombre": "Auditora Demo S.A. de C.V.",
  "rfc": "ADE123456XYZ",
  "direccion": "Calle Principal 123",
  "telefono": "4491234567",
  "modulos": [1, 2]
}
```

**Validaciones:**
- `nombre`: requerido
- `rfc`, `direccion`, `telefono`: opcionales
- `modulos`: array de números (puede estar vacío `[]`)

**Respuesta (200):**
```json
{
  "id_empresa": 2,
  "nombre": "Auditora Demo S.A. de C.V.",
  "rfc": "ADE123456XYZ",
  "direccion": "Calle Principal 123",
  "telefono": "4491234567",
  "modulos": [1, 2]
}
```

**Lógica del Backend:**
- Al guardar, marcar la empresa como `visible = true` para que aparezca a los clientes
- Si no tiene módulos configurados, no debería aparecer a los clientes

---

## 📋 SUPERVISOR - Auditorías

### 18. GET `/api/supervisor/auditorias/:idEmpresa`
**Descripción:** Obtener todas las auditorías de una empresa auditora

**Parámetros:**
- `idEmpresa` (path): ID de la empresa auditora
- `page` (query, opcional): Número de página
- `limit` (query, opcional): Límite por página
- `id_estado` (query, opcional): Filtrar por estado

**Respuesta (200):**
```json
[
  {
    "id_auditoria": 1,
    "id_cliente": 5,
    "id_empresa_auditora": 2,
    "id_estado": 2,
    "modulos": [1, 2],
    "fecha_creacion": "2024-01-15T10:00:00Z",
    "fecha_inicio": "2024-01-20T08:00:00Z",
    "monto": 50000.00,
    "cliente": {
      "id_empresa": 15,
      "nombre": "Mi Empresa S.A."
    }
  }
]
```

---

### 19. GET `/api/supervisor/auditorias/:idAuditoria/detalle`
**Descripción:** Obtener detalle completo de una auditoría

**Parámetros:**
- `idAuditoria` (path): ID de la auditoría

**Respuesta (200):**
```json
{
  "id_auditoria": 1,
  "id_cliente": 5,
  "id_empresa_auditora": 2,
  "id_estado": 2,
  "modulos": [1, 2],
  "fecha_creacion": "2024-01-15T10:00:00Z",
  "fecha_inicio": "2024-01-20T08:00:00Z",
  "monto": 50000.00,
  "cliente": {
    "id_empresa": 15,
    "nombre": "Mi Empresa S.A."
  },
  "auditores_asignados": [
    {
      "id_usuario": 8,
      "nombre": "María García",
      "modulos": [1]
    }
  ],
  "hallazgos": [...],
  "evidencias": [...]
}
```

---

### 20. PUT `/api/supervisor/auditorias/:idAuditoria/estado`
**Descripción:** Cambiar estado de una auditoría

**Parámetros:**
- `idAuditoria` (path): ID de la auditoría

**Body:**
```json
{
  "id_estado": 2
}
```

**Estados posibles:**
- `1`: PROGRAMADA
- `2`: EN_CAMPO
- `3`: EN_ANALISIS
- `4`: EN_REVISION
- `5`: COMPLETADA

**Respuesta (200):**
```json
{
  "id_auditoria": 1,
  "id_estado": 2,
  "mensaje": "Estado actualizado correctamente"
}
```

---

### 21. POST `/api/supervisor/auditorias/:idAuditoria/asignar-auditor`
**Descripción:** Asignar auditor a una auditoría

**Parámetros:**
- `idAuditoria` (path): ID de la auditoría

**Body:**
```json
{
  "id_auditor": 8,
  "modulos": [1] // Módulos que manejará este auditor
}
```

**Respuesta (200):**
```json
{
  "id_auditoria": 1,
  "id_auditor": 8,
  "modulos": [1],
  "mensaje": "Auditor asignado correctamente"
}
```

---

### 22. GET `/api/supervisor/auditores/:idEmpresa`
**Descripción:** Obtener lista de auditores de una empresa

**Parámetros:**
- `idEmpresa` (path): ID de la empresa auditora
- `page` (query, opcional): Número de página
- `limit` (query, opcional): Límite por página

**Respuesta (200):**
```json
[
  {
    "id_usuario": 8,
    "nombre": "María García",
    "correo": "maria@auditora.com",
    "id_rol": 2,
    "modulos_especialidad": [1, 2]
  }
]
```

---

## 💬 SUPERVISOR - Mensajes

### 23. GET `/api/supervisor/conversaciones/:idEmpresa`
**Descripción:** Obtener conversaciones de la empresa auditora

**Parámetros:**
- `idEmpresa` (path): ID de la empresa auditora

**Respuesta (200):**
```json
[
  {
    "id_conversacion": 1,
    "id_cliente": 5,
    "id_empresa_auditora": 2,
    "fecha_creacion": "2024-01-15T10:00:00Z",
    "cliente": {
      "id_empresa": 15,
      "nombre": "Mi Empresa S.A."
    },
    "ultimo_mensaje": {
      "id_mensaje": 10,
      "contenido": "Hola, queremos auditoría...",
      "fecha_envio": "2024-01-15T10:30:00Z"
    }
  }
]
```

---

### 24. POST `/api/supervisor/mensajes`
**Descripción:** Enviar mensaje desde el supervisor

**Body:**
```json
{
  "id_conversacion": 1,
  "contenido": "Te propongo una auditoría de Agua + Suelo, en 30 días, por $50,000..."
}
```

**Respuesta (201):**
```json
{
  "id_mensaje": 11,
  "id_conversacion": 1,
  "id_remitente": 3,
  "contenido": "Te propongo una auditoría...",
  "fecha_envio": "2024-01-15T11:00:00Z"
}
```

---

## 💳 SUPERVISOR - Pagos/Órdenes

### 25. GET `/api/supervisor/solicitudes-pago/:idEmpresa`
**Descripción:** Obtener solicitudes de pago de la empresa auditora

**Parámetros:**
- `idEmpresa` (path): ID de la empresa auditora

**Respuesta (200):**
```json
[
  {
    "id_solicitud": 1,
    "id_cliente": 5,
    "id_empresa_auditora": 2,
    "id_estado": 1,
    "monto": 50000.00,
    "modulos": [1, 2],
    "fecha_creacion": "2024-01-15T10:00:00Z",
    "fecha_vencimiento": "2024-01-30T23:59:59Z",
    "cliente": {
      "id_empresa": 15,
      "nombre": "Mi Empresa S.A."
    }
  }
]
```

---

### 26. POST `/api/supervisor/solicitudes-pago`
**Descripción:** Crear solicitud de pago (cuando el cliente acepta la propuesta)

**Body:**
```json
{
  "id_cliente": 5,
  "id_empresa_auditora": 2,
  "monto": 50000.00,
  "modulos": [1, 2],
  "fecha_vencimiento": "2024-01-30T23:59:59Z"
}
```

**Respuesta (201):**
```json
{
  "id_solicitud": 1,
  "id_cliente": 5,
  "id_empresa_auditora": 2,
  "id_estado": 1,
  "monto": 50000.00,
  "modulos": [1, 2],
  "fecha_creacion": "2024-01-15T10:00:00Z",
  "fecha_vencimiento": "2024-01-30T23:59:59Z"
}
```

**Notas:**
- Se crea automáticamente cuando el cliente dice "Sí, quiero contratar" en el chat
- Estado inicial: `PENDIENTE_DE_PAGO` (id_estado = 1)

---

## 📊 SUPERVISOR - Reportes

### 27. GET `/api/supervisor/reportes/:idAuditoria`
**Descripción:** Obtener reporte de una auditoría

**Parámetros:**
- `idAuditoria` (path): ID de la auditoría

**Respuesta (200):**
```json
{
  "id_auditoria": 1,
  "id_reporte": 5,
  "url_pdf": "/uploads/reportes/reporte_1.pdf",
  "fecha_generacion": "2024-02-01T10:00:00Z",
  "estado": "COMPLETADO"
}
```

---

### 28. POST `/api/supervisor/reportes/generar`
**Descripción:** Generar reporte PDF de una auditoría

**Body:**
```json
{
  "id_auditoria": 1
}
```

**Respuesta (200):**
```json
{
  "id_reporte": 5,
  "url_pdf": "/uploads/reportes/reporte_1.pdf",
  "mensaje": "Reporte generado correctamente"
}
```

---

## 👨‍🔬 AUDITOR - Dashboard

### 29. GET `/api/auditor/dashboard/:idAuditor`
**Descripción:** Obtener datos del dashboard del auditor

**Parámetros:**
- `idAuditor` (path): ID del usuario auditor

**Respuesta (200):**
```json
{
  "auditorias_asignadas": 3,
  "auditorias_por_estado": {
    "2": 2, // EN_CAMPO
    "3": 1  // EN_ANALISIS
  },
  "evidencias_pendientes": 5
}
```

---

## 📋 AUDITOR - Auditorías

### 30. GET `/api/auditor/auditorias/:idAuditor`
**Descripción:** Obtener auditorías asignadas a un auditor

**Parámetros:**
- `idAuditor` (path): ID del usuario auditor

**Respuesta (200):**
```json
[
  {
    "id_auditoria": 1,
    "id_cliente": 5,
    "id_empresa_auditora": 2,
    "id_estado": 2,
    "modulos": [1, 2],
    "fecha_inicio": "2024-01-20T08:00:00Z",
    "cliente": {
      "id_empresa": 15,
      "nombre": "Mi Empresa S.A."
    }
  }
]
```

---

### 31. POST `/api/auditor/evidencias`
**Descripción:** Subir evidencia (foto, documento, etc.)

**Body (multipart/form-data):**
```
id_auditoria: 1
id_modulo: 1
tipo: "foto" // o "documento", "nota"
archivo: <file>
descripcion: "Punto de muestreo en río"
```

**Respuesta (201):**
```json
{
  "id_evidencia": 10,
  "id_auditoria": 1,
  "id_modulo": 1,
  "tipo": "foto",
  "url_archivo": "/uploads/evidencias/evidencia_10.jpg",
  "descripcion": "Punto de muestreo en río",
  "fecha_subida": "2024-01-25T10:00:00Z"
}
```

---

### 32. POST `/api/auditor/hallazgos`
**Descripción:** Registrar un hallazgo

**Body:**
```json
{
  "id_auditoria": 1,
  "id_modulo": 1,
  "severidad": "CRITICO", // CRITICO, MAYOR, MENOR, OBSERVACION
  "descripcion": "Contaminación detectada en punto de muestreo",
  "ubicacion": "Río Principal, km 5"
}
```

**Respuesta (201):**
```json
{
  "id_hallazgo": 5,
  "id_auditoria": 1,
  "id_modulo": 1,
  "severidad": "CRITICO",
  "descripcion": "Contaminación detectada...",
  "ubicacion": "Río Principal, km 5",
  "estado": "ABIERTO",
  "fecha_registro": "2024-01-25T10:00:00Z"
}
```

---

## 📝 NOTAS IMPORTANTES

### Estados de Auditoría
- `1`: PROGRAMADA
- `2`: EN_CAMPO
- `3`: EN_ANALISIS
- `4`: EN_REVISION
- `5`: COMPLETADA

### Estados de Solicitud de Pago
- `1`: PENDIENTE_DE_PAGO
- `2`: PAGADA
- `3`: EXPIRADA
- `4`: CANCELADA

### Módulos
- `1`: Agua
- `2`: Residuos/Suelo
- `3`: Energía

### Roles
- `1`: SUPERVISOR
- `2`: AUDITOR
- `3`: CLIENTE

### Flujo de Pago → Auditoría
Cuando el webhook de pago confirma el pago exitoso:
1. Marcar solicitud como `PAGADA` (id_estado = 2)
2. **Crear automáticamente la auditoría** con:
   - `id_cliente`: del cliente que pagó
   - `id_empresa_auditora`: de la solicitud
   - `modulos`: de la solicitud
   - `id_estado`: 1 (PROGRAMADA)
   - `monto`: monto pagado

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Prioridad Alta (Funcionalidad Básica)
- [ ] POST `/api/auth/login`
- [ ] POST `/api/cliente/registro`
- [ ] GET `/api/cliente/empresas-auditoras`
- [ ] GET `/api/cliente/empresas-auditoras/:id`
- [ ] GET `/api/supervisor/empresa/:id`
- [ ] PUT `/api/supervisor/empresa/:id`
- [ ] GET `/api/cliente/auditorias/:idCliente`
- [ ] GET `/api/cliente/conversaciones/:idCliente`
- [ ] POST `/api/cliente/mensajes`
- [ ] GET `/api/supervisor/conversaciones/:idEmpresa`
- [ ] POST `/api/supervisor/mensajes`

### Prioridad Media (Flujo de Pago)
- [ ] POST `/api/supervisor/solicitudes-pago`
- [ ] GET `/api/cliente/solicitudes-pago/:idCliente`
- [ ] POST `/api/cliente/pagos/:idSolicitud/procesar`
- [ ] POST `/api/cliente/pagos/webhook` (crear auditoría automáticamente)

### Prioridad Baja (Funcionalidades Avanzadas)
- [ ] Resto de endpoints de auditorías
- [ ] Endpoints de reportes
- [ ] Endpoints de evidencias y hallazgos
