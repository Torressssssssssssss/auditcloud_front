# 🔍 Guía de Verificación - AuditCloud

Esta guía te ayudará a verificar que todas las funcionalidades están trabajando correctamente según el flujo de trabajo.

**⚠️ IMPORTANTE:** Verifica cada paso y marca ✅ si funciona o ❌ si hay errores. Anota los errores para corregirlos.

---

## 📋 PREPARACIÓN

### Antes de empezar:
- [✅] Backend corriendo en `http://192.168.1.243:3000`
- [✅] Frontend corriendo en `http://localhost:4200`
- [✅] Base de datos configurada
- [✅] Consola del navegador abierta (F12) para ver errores

---

## 1️⃣ REGISTRO E INICIO DE SESIÓN

### Paso 1.1: Registrar Cliente
**URL:** `http://localhost:4200/registro`

**Acciones:**
1. Llenar el formulario:
   - Nombre: "Juan Pérez"
   - Correo: "juan@cliente.com"
   - Contraseña: "password123"
   - Nombre de empresa: "Mi Empresa S.A."
   - Ciudad: "Aguascalientes"
   - Estado: "Aguascalientes"
   - RFC: (opcional)

2. Hacer clic en "Crear cuenta"

**✅ Resultado Esperado:**
- Redirige automáticamente a `/cliente/dashboard`
- No muestra errores en consola
- El usuario queda logueado

**❌ Si falla:**
- Verifica que el endpoint `POST /api/cliente/registro` existe
- Revisa la consola del navegador para ver el error
- Verifica que el backend está creando la empresa y asignando el rol CLIENTE

**Checklist:**
- [✅] El formulario se envía correctamente
- [✅] No hay errores en consola
- [✅] Redirige al dashboard del cliente
- [✅] El usuario queda autenticado

---

### Paso 1.2: Iniciar Sesión
**URL:** `http://localhost:4200/login`

**Acciones:**
1. Usar las credenciales del cliente creado:
   - Correo: "juan@cliente.com"
   - Contraseña: "password123"

2. Hacer clic en "Iniciar sesión"

**✅ Resultado Esperado:**
- Redirige a `/cliente/dashboard`
- No muestra errores
- El usuario queda logueado

**❌ Si falla:**
- Verifica que el endpoint `POST /api/auth/login` existe
- Verifica que el token se está guardando en localStorage
- Revisa la consola para ver el error específico

**Checklist:**
- [✅] El login funciona correctamente
- [✅] No hay errores en consola
- [✅] Redirige al dashboard correcto según el rol

---

## 2️⃣ CONFIGURACIÓN DE EMPRESA AUDITORA

### Paso 2.1: Registrar Supervisor
**Acciones:**
1. Cerrar sesión del cliente
2. Registrar un nuevo usuario como SUPERVISOR (o crear directamente en BD)
   - Nombre: "María Supervisor"
   - Correo: "maria@auditora.com"
   - Contraseña: "password123"
   - Rol: SUPERVISOR (id_rol = 1)
   - Empresa: Crear empresa auditora con id_empresa = 2

3. Iniciar sesión como supervisor

**✅ Resultado Esperado:**
- Redirige a `/supervisor/dashboard`
- No hay errores

**Checklist:**
- [✅] El supervisor puede iniciar sesión
- [✅] Redirige al dashboard del supervisor

---

### Paso 2.2: Configurar Empresa Auditora
**URL:** `http://localhost:4200/supervisor/configuracion`

**Acciones:**
1. Llenar el formulario:
   - Nombre de la Empresa: "Auditora Demo S.A. de C.V."
   - RFC: "ADE123456XYZ"
   - Dirección: "Calle Principal 123"
   - Teléfono: "4491234567"

2. Seleccionar módulos:
   - ☑ Agua
   - ☑ Residuos
   - ☐ Energía

3. Hacer clic en "Guardar"

**✅ Resultado Esperado:**
- Muestra mensaje: "Configuración guardada exitosamente"
- No hay errores en consola
- Los datos se guardan correctamente

**❌ Si falla:**
- Verifica que el endpoint `GET /api/supervisor/empresa/:id` existe (para cargar)
- Verifica que el endpoint `PUT /api/supervisor/empresa/:id` existe (para guardar)
- Revisa la consola del navegador
- Verifica que la empresa se marca como `visible = true` en el backend

**Checklist:**
- [✅] La configuración se carga correctamente al entrar
- [✅] Se pueden editar los campos
- [✅] Se pueden seleccionar/deseleccionar módulos
- [✅] Al guardar, muestra mensaje de éxito
- [✅] No hay errores en consola
- [✅] Los datos se persisten (recargar página y verificar)

---

## 3️⃣ VISUALIZACIÓN DE EMPRESAS PARA CLIENTES

### Paso 3.1: Ver Empresas Auditoras Disponibles
**URL:** `http://localhost:4200/cliente/empresas`

**Acciones:**
1. Iniciar sesión como cliente (juan@cliente.com)
2. Ir a la sección "Empresas Auditoras"

**✅ Resultado Esperado:**
- Muestra la tarjeta de "Auditora Demo S.A. de C.V."
- Muestra la ubicación (México, Aguascalientes)
- Muestra los módulos (Agua, Residuos)
- Los botones "Ver perfil" y "Contactar" están bien posicionados (no sobrepuestos)

**❌ Si falla:**
- Verifica que el endpoint `GET /api/cliente/empresas-auditoras` existe
- Verifica que solo devuelve empresas con `visible = true` y con módulos configurados
- Revisa la consola para ver el error
- Si no aparece ninguna empresa, verifica que la empresa tiene módulos configurados

**Checklist:**
- [✅] Se muestran las empresas auditoras disponibles
- [✅] Se muestra la información correcta (nombre, ubicación, módulos)
- [✅] Los botones están bien posicionados
- [✅] No hay errores en consola
- [✅] El filtro por estado funciona
- [✅] El filtro por módulos funciona

---

### Paso 3.2: Ver Perfil de Empresa
**Acciones:**
1. En la lista de empresas, hacer clic en "Ver perfil"

**✅ Resultado Esperado:**
- Redirige a `/cliente/empresas/:id`
- Muestra toda la información de la empresa:
  - Nombre
  - RFC
  - Ubicación
  - Dirección
  - Teléfono
  - Módulos que ofrece
  - Descripción (si existe)
- Botón "Contactar Empresa" visible

**❌ Si falla:**
- Verifica que el endpoint `GET /api/cliente/empresas-auditoras/:id` existe
- Revisa la consola para ver el error específico
- Verifica que el parámetro `:id` se está pasando correctamente

**Checklist:**
- [✅] Se carga el perfil correctamente
- [✅] Se muestra toda la información
- [✅] No hay errores en consola
- [✅] El botón "Volver" funciona
- [✅] El botón "Contactar Empresa" funciona

---

## 4️⃣ MENSAJERÍA

### Paso 4.1: Cliente Envía Mensaje Inicial
**URL:** `http://localhost:4200/cliente/mensajes`

**Acciones:**
1. Como cliente, ir a "Mensajes"
2. Si no hay conversaciones, hacer clic en "Contactar" desde el perfil de la empresa
3. Escribir un mensaje:
   - "Hola, somos Mi Empresa S.A., queremos auditoría de agua + suelo en nuestra planta..."
4. Enviar el mensaje

**✅ Resultado Esperado:**
- Se crea una nueva conversación
- El mensaje se envía correctamente
- Aparece en la lista de conversaciones

**❌ Si falla:**
- Verifica que el endpoint `POST /api/cliente/mensajes` existe
- Verifica que se está creando la conversación en el backend
- Revisa la consola para ver el error

**Checklist:**
- [✅] Se puede enviar un mensaje
- [✅, pero se genera una nueva con la misma empresa, condicion donde si ya existe conversacion con esa empresa no cree otra] Se crea la conversación
- [✅, si pero no hay un historial de mensajes tipo ig, WA, donde este el hitorial de laconversaion] El mensaje aparece en la lista
- [✅] No hay errores en consola

---

### Paso 4.2: Supervisor Ve y Responde Mensaje
**URL:** `http://localhost:4200/supervisor/mensajes`

**Acciones:**
1. Iniciar sesión como supervisor
2. Ir a "Mensajes"
3. Ver la conversación del cliente
4. Responder con:
   - "Te propongo una auditoría de Agua + Suelo, en 30 días, por $50,000..."

**✅ Resultado Esperado:**
- El supervisor ve la conversación
- Puede responder
- El mensaje se envía correctamente

**❌ Si falla:**
- Verifica que el endpoint `GET /api/supervisor/conversaciones/:idEmpresa` existe
- Verifica que el endpoint `POST /api/supervisor/mensajes` existe
- Revisa la consola

**Checklist:**
- [✅] El supervisor ve las conversaciones
- [✅] Puede responder
- [✅] Los mensajes se envían correctamente
- [✅] No hay errores en consola
   Lo mismo Se genera otra conversaion cuando deberia de ser una por clientes e implementar historial de mensajes
---

### Paso 4.3: Cliente Acepta Propuesta
**Acciones:**
1. Volver a iniciar sesión como cliente
2. Ver la respuesta del supervisor
3. Responder: "Sí, quiero contratar"

**✅ Resultado Esperado:**
- El mensaje se envía
- El sistema debería crear automáticamente una solicitud de pago (o el supervisor la crea manualmente)

**Checklist:**
- [✅] El cliente puede responder
- [✅] El mensaje se envía
- [ ] Se crea la solicitud de pago (automática o manual)

---

## 5️⃣ PAGOS

### Paso 5.1: Supervisor Crea Solicitud de Pago
**Acciones:**
1. Como supervisor, después de que el cliente acepta
2. Crear solicitud de pago (puede ser automático o manual)
   - Monto: 50000.00
   - Módulos: Agua + Suelo
   - Fecha de vencimiento: 30 días

**✅ Resultado Esperado:**
- Se crea la solicitud de pago
- Estado: PENDIENTE_DE_PAGO

**❌ Si falla:**
- Verifica que el endpoint `POST /api/supervisor/solicitudes-pago` existe
- Verifica que se está creando correctamente en la BD

**Checklist:**
- [ ] Se crea la solicitud de pago
- [ ] Aparece en el panel del supervisor
- [ ] No hay errores

---

### Paso 5.2: Cliente Ve Solicitud de Pago
**URL:** `http://localhost:4200/cliente/pagos`

**Acciones:**
1. Como cliente, ir a "Pagos"
2. Ver la solicitud de pago pendiente

**✅ Resultado Esperado:**
- Se muestra la solicitud de pago
- Estado: Pendiente de pago
- Botón "Pagar ahora" visible

**❌ Si falla:**
- Verifica que el endpoint `GET /api/cliente/solicitudes-pago/:idCliente` existe
- Revisa la consola

**Checklist:**
- [ ] Se muestra la solicitud de pago
- [ ] La información es correcta
- [ ] No hay errores

---

### Paso 5.3: Cliente Procesa Pago
**Acciones:**
1. Hacer clic en "Pagar ahora"
2. El sistema debería redirigir a la pasarela de pago (PayPal/Stripe)

**✅ Resultado Esperado:**
- Se crea la transacción en la API de pagos
- Se redirige a la pasarela de pago
- O se muestra un popup de pago

**❌ Si falla:**
- Verifica que el endpoint `POST /api/cliente/pagos/:idSolicitud/procesar` existe
- Verifica la integración con la API de pagos

**Checklist:**
- [ ] Se puede iniciar el proceso de pago
- [ ] Se redirige a la pasarela
- [ ] No hay errores

---

### Paso 5.4: Webhook de Pago (Simular Pago Exitoso)
**Acciones:**
1. Simular que el pago fue exitoso
2. El webhook debería recibir la confirmación

**✅ Resultado Esperado:**
- El webhook marca la solicitud como PAGADA
- **Se crea automáticamente la auditoría** con:
  - Cliente correcto
  - Empresa auditora correcta
  - Módulos correctos (Agua + Suelo)
  - Estado: PROGRAMADA

**❌ Si falla:**
- Verifica que el endpoint `POST /api/cliente/pagos/webhook` existe
- Verifica que está creando la auditoría automáticamente
- Este es el paso MÁS IMPORTANTE del flujo

**Checklist:**
- [ ] El webhook recibe la confirmación
- [ ] La solicitud se marca como PAGADA
- [ ] **Se crea automáticamente la auditoría** ← CRÍTICO
- [ ] La auditoría tiene los datos correctos
- [ ] No hay errores

---

## 6️⃣ AUDITORÍAS

### Paso 6.1: Cliente Ve su Auditoría
**URL:** `http://localhost:4200/cliente/auditorias`

**Acciones:**
1. Como cliente, ir a "Mis Auditorías"
2. Ver la auditoría creada automáticamente

**✅ Resultado Esperado:**
- Se muestra la auditoría
- Estado: PROGRAMADA
- Módulos: Agua, Suelo
- Información de la empresa auditora

**❌ Si falla:**
- Verifica que el endpoint `GET /api/cliente/auditorias/:idCliente` existe
- Verifica que la auditoría se creó correctamente
- Revisa la consola

**Checklist:**
- [ ] Se muestra la auditoría
- [ ] La información es correcta
- [ ] El estado es PROGRAMADA
- [ ] No hay errores

---

### Paso 6.2: Supervisor Ve la Auditoría
**URL:** `http://localhost:4200/supervisor/auditorias`

**Acciones:**
1. Como supervisor, ir a "Auditorías"
2. Ver la auditoría en "Auditorías activas"

**✅ Resultado Esperado:**
- Se muestra la auditoría
- Cliente: Mi Empresa S.A.
- Módulos: Agua, Suelo
- Estado: PROGRAMADA

**❌ Si falla:**
- Verifica que el endpoint `GET /api/supervisor/auditorias/:idEmpresa` existe
- Revisa la consola

**Checklist:**
- [ ] Se muestra la auditoría
- [ ] La información es correcta
- [ ] No hay errores

---

### Paso 6.3: Supervisor Asigna Auditores
**Acciones:**
1. Entrar al detalle de la auditoría
2. Asignar auditores:
   - Auditor para Agua
   - Auditor para Suelo

**✅ Resultado Esperado:**
- Se pueden asignar auditores
- Los auditores quedan asignados a la auditoría

**❌ Si falla:**
- Verifica que el endpoint `GET /api/supervisor/auditores/:idEmpresa` existe
- Verifica que el endpoint `POST /api/supervisor/auditorias/:idAuditoria/asignar-auditor` existe

**Checklist:**
- [ ] Se pueden ver los auditores disponibles
- [ ] Se pueden asignar auditores
- [ ] Los auditores quedan asignados
- [ ] No hay errores

---

### Paso 6.4: Supervisor Cambia Estado
**Acciones:**
1. Cambiar el estado de la auditoría:
   - PROGRAMADA → EN_PREPARACION
   - EN_PREPARACION → EN_CAMPO
   - EN_CAMPO → EN_ANALISIS
   - EN_ANALISIS → EN_REVISION
   - EN_REVISION → COMPLETADA

**✅ Resultado Esperado:**
- Se puede cambiar el estado
- El estado se actualiza correctamente
- El cliente puede ver el cambio de estado

**❌ Si falla:**
- Verifica que el endpoint `PUT /api/supervisor/auditorias/:idAuditoria/estado` existe
- Revisa la consola

**Checklist:**
- [ ] Se puede cambiar el estado
- [ ] El estado se actualiza
- [ ] El cliente ve el cambio
- [ ] No hay errores

---

### Paso 6.5: Auditor Sube Evidencias
**Acciones:**
1. Iniciar sesión como auditor
2. Ver sus auditorías asignadas
3. Subir una evidencia (foto, documento)

**✅ Resultado Esperado:**
- El auditor puede ver sus auditorías
- Puede subir evidencias
- Las evidencias se guardan correctamente

**❌ Si falla:**
- Verifica que el endpoint `GET /api/auditor/auditorias/:idAuditor` existe
- Verifica que el endpoint `POST /api/auditor/evidencias` existe
- Verifica la subida de archivos

**Checklist:**
- [ ] El auditor ve sus auditorías
- [ ] Puede subir evidencias
- [ ] Las evidencias se guardan
- [ ] No hay errores

---

### Paso 6.6: Cliente Descarga Reporte
**Acciones:**
1. Cuando la auditoría está COMPLETADA
2. Como cliente, entrar al detalle de la auditoría
3. Hacer clic en "Descargar Reporte Final"

**✅ Resultado Esperado:**
- Se descarga el PDF del reporte
- El reporte contiene la información correcta

**❌ Si falla:**
- Verifica que el endpoint `GET /api/cliente/auditorias/:idAuditoria/reporte` existe
- Verifica que el PDF se genera correctamente
- Verifica que el archivo se sirve correctamente

**Checklist:**
- [ ] Se puede descargar el reporte
- [ ] El PDF se descarga correctamente
- [ ] El contenido es correcto
- [ ] No hay errores

---

## 7️⃣ DASHBOARD

### Paso 7.1: Dashboard del Cliente
**URL:** `http://localhost:4200/cliente/dashboard`

**Acciones:**
1. Verificar que se muestran:
   - Total de auditorías activas
   - Solicitudes pendientes
   - Conversaciones
   - Últimos mensajes

**✅ Resultado Esperado:**
- Se muestran todos los datos
- No hay errores en consola
- Los números son correctos

**❌ Si falla:**
- Verifica los endpoints del dashboard
- Revisa la consola para ver qué endpoint está fallando
- Verifica que las respuestas son arrays o objetos con `data`

**Checklist:**
- [ ] Se muestran las estadísticas
- [ ] Los números son correctos
- [ ] No hay errores en consola
- [ ] Los enlaces funcionan

---

### Paso 7.2: Dashboard del Supervisor
**URL:** `http://localhost:4200/supervisor/dashboard`

**Acciones:**
1. Verificar que se muestran:
   - Auditorías activas
   - Solicitudes pendientes
   - Conversaciones nuevas

**✅ Resultado Esperado:**
- Se muestran todos los datos
- No hay errores

**Checklist:**
- [ ] Se muestran las estadísticas
- [ ] Los números son correctos
- [ ] No hay errores

---

## 🐛 CHECKLIST DE ERRORES COMUNES

### Errores en Consola del Navegador:
- [ ] **404 Not Found**: El endpoint no existe en el backend
- [ ] **401 Unauthorized**: Problema con el token de autenticación
- [ ] **500 Internal Server Error**: Error en el backend
- [ ] **CORS Error**: Problema de configuración CORS en el backend
- [ ] **TypeError: X is not a function**: Problema con el formato de respuesta (debe ser array o objeto con `data`)

### Errores Visuales:
- [ ] Botones sobrepuestos → Ya corregido en el frontend
- [ ] Texto ilegible → Verificar colores en modo oscuro/claro
- [ ] Elementos no se muestran → Verificar que los datos llegan del backend

### Errores de Flujo:
- [ ] La auditoría no se crea después del pago → **CRÍTICO**: Verificar el webhook
- [ ] Las empresas no aparecen → Verificar que tienen `visible = true` y módulos
- [ ] Los mensajes no se envían → Verificar endpoints de mensajería

---

## ✅ RESUMEN FINAL

### Funcionalidades Críticas (Deben funcionar):
- [ ] Registro de cliente
- [ ] Inicio de sesión
- [ ] Configuración de empresa auditora
- [ ] Visualización de empresas para clientes
- [ ] Mensajería básica
- [ ] Creación de solicitud de pago
- [ ] Procesamiento de pago
- [ ] **Creación automática de auditoría después del pago** ← MÁS IMPORTANTE
- [ ] Visualización de auditorías
- [ ] Cambio de estados de auditoría

### Funcionalidades Secundarias:
- [ ] Asignación de auditores
- [ ] Subida de evidencias
- [ ] Registro de hallazgos
- [ ] Generación de reportes
- [ ] Descarga de reportes

---

## 📝 NOTAS PARA EL BACKEND

### Endpoints MÁS IMPORTANTES (Prioridad 1):
1. `POST /api/cliente/registro` - Registro
2. `POST /api/auth/login` - Login
3. `GET /api/cliente/empresas-auditoras` - Listar empresas
4. `GET /api/cliente/empresas-auditoras/:id` - Ver perfil empresa
5. `GET /api/supervisor/empresa/:id` - Cargar configuración
6. `PUT /api/supervisor/empresa/:id` - Guardar configuración
7. `POST /api/cliente/mensajes` - Enviar mensaje
8. `GET /api/cliente/conversaciones/:idCliente` - Ver conversaciones
9. `POST /api/supervisor/solicitudes-pago` - Crear solicitud de pago
10. `POST /api/cliente/pagos/webhook` - **CRÍTICO**: Crear auditoría automáticamente
11. `GET /api/cliente/auditorias/:idCliente` - Ver auditorías del cliente
12. `GET /api/supervisor/auditorias/:idEmpresa` - Ver auditorías del supervisor

### Validaciones Importantes:
- ✅ La empresa auditora solo aparece si tiene `visible = true` Y módulos configurados
- ✅ Después del pago exitoso, se DEBE crear la auditoría automáticamente
- ✅ Las respuestas deben ser arrays `[]` o objetos con `{ data: [] }`
- ✅ Todos los endpoints (excepto login/registro) requieren autenticación

---

## 🎯 SIGUIENTE PASO

Una vez que hayas verificado todos los pasos:
1. Anota los errores encontrados
2. Revisa qué endpoints faltan en el backend
3. Implementa los endpoints faltantes según `RUTAS_BACKEND.md`
4. Vuelve a verificar los pasos que fallaron

**¡Buena suerte! 🚀**

