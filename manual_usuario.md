# Manual de Usuario — SGE-UNT

**Sistema de Gestión de Egresados — Universidad Nacional de Trujillo**

---

## 1. Introducción

### 1.1 Qué es el sistema

El **SGE-UNT** (Sistema de Gestión de Egresados de la Universidad Nacional de Trujillo) es una plataforma web que permite a la universidad y a sus egresados mantener un vínculo organizado después de la titulación. El sistema centraliza la información de los egresados, ofrece una bolsa laboral con ofertas de empresas, realiza seguimiento de la empleabilidad mediante encuestas y reportes, y cuenta con una red de mentores para apoyo en la carrera profesional.

### 1.2 Para qué sirve

- **Para la universidad:** contar con un registro actualizado de egresados, medir indicadores de empleabilidad por escuela o facultad, y ofrecer servicios de bolsa laboral y mentoría.
- **Para el egresado:** mantener un perfil profesional visible, postularse a ofertas laborales con recomendaciones según sus habilidades, responder encuestas de seguimiento y solicitar mentoría a otros egresados.
- **Para las empresas:** publicar ofertas laborales y gestionar postulaciones y entrevistas de candidatos egresados de la UNT.

---

## 2. Acceso al sistema

### 2.1 Login (inicio de sesión)

1. Abra el navegador y acceda a la dirección del sistema (por ejemplo, `http://localhost:5173` en entorno de desarrollo).
2. En la pantalla de inicio, localice el formulario de **Iniciar sesión**.
3. Ingrese su **usuario** (nombre de usuario o correo electrónico, según lo configurado).
4. Ingrese su **contraseña**.
5. Pulse el botón para iniciar sesión.
6. Si los datos son correctos, será redirigido al **Dashboard** o página principal y verá el menú de navegación superior con acceso a los módulos.

**Roles típicos:** Administrador, Egresado, Empresa, Docente. Las opciones del menú pueden variar según el rol.

_[Insertar captura aquí: pantalla de login]_

### 2.2 Registro (alta de nuevos usuarios)

Si el sistema permite el **registro público** de egresados:

1. En la pantalla de login, busque el enlace tipo **“Registrarse”** o **“Crear cuenta”**.
2. Accederá a un formulario que suele dividirse en varios pasos:
   - **Datos personales:** documento de identidad, nombres, apellidos, correo, teléfono, dirección.
   - **Datos académicos:** código universitario, escuela profesional, promoción, años de ingreso/egreso/titulación, promedio.
   - **Datos de acceso:** nombre de usuario y contraseña.
3. Complete cada paso y confirme. Al finalizar, podrá iniciar sesión con el usuario y contraseña elegidos.

En algunos entornos, el registro de egresados lo realiza un **administrador** desde el módulo de administración; en ese caso no existirá registro público.

_[Insertar captura aquí: pantalla de registro o primer paso]_

---

## 3. Estructura general del sistema

El SGE-UNT se organiza en **cuatro módulos** accesibles desde la barra de navegación principal (una vez iniciada sesión):

| Módulo | Nombre breve           | Función principal                                      |
|--------|------------------------|--------------------------------------------------------|
| **1**  | Registro y Perfil     | Datos personales y académicos, perfil profesional, administración. |
| **2**  | Bolsa Laboral         | Ofertas de trabajo, postulaciones y recomendaciones.   |
| **3**  | Seguimiento           | Encuestas de empleabilidad y dashboards de indicadores. |
| **4**  | Red de Mentores       | Directorio de mentores, solicitudes y sesiones de mentoría. |

Desde la **barra superior** se puede ir a: Inicio, Registro y Perfil, Bolsa Laboral Inteligente, Seguimiento de Empleabilidad y Red de Mentores. En la esquina superior derecha suele mostrarse el nombre del usuario y un menú para ir a configuración o cerrar sesión.

_[Insertar captura aquí: barra de navegación o dashboard principal]_

---

## 4. Los cuatro módulos

---

### Módulo 1: Registro y Perfil de Egresados

#### Descripción

Este módulo permite gestionar la identidad y el perfil profesional del egresado: datos personales, datos académicos (escuela, promoción, años, promedio), perfil profesional (resumen, redes, disponibilidad, pretensión salarial), habilidades, experiencia laboral y educación continua. Los administradores pueden, además, gestionar usuarios y dar de alta egresados.

#### Funcionalidades principales

- Ver y editar **datos personales** (nombre, documento, correo, teléfono, dirección).
- Ver y editar **datos académicos** (código universitario, escuela, años de ingreso/egreso/titulación, promedio).
- Gestionar **perfil profesional:** resumen, LinkedIn, GitHub, portfolio, disponibilidad, modalidad de trabajo, pretensión salarial.
- Gestionar **habilidades** (añadir, quitar, nivel: básico, intermedio, avanzado, experto).
- Gestionar **experiencia laboral** (empresa, cargo, fechas, descripción, indicar si es el trabajo actual).
- Gestionar **educación continua** (cursos, diplomados, certificaciones, maestrías, etc.).
- **Administración (rol admin):** gestión de usuarios y creación/edición de egresados.

#### Flujo de uso (paso a paso)

1. Iniciar sesión con usuario de tipo egresado o admin.
2. En el menú, elegir **“Registro y Perfil”** o **“Perfil”**.
3. Ver el resumen del perfil (datos personales, académicos, profesional).
4. Para editar: pulsar el botón o sección correspondiente (por ejemplo “Editar datos personales”, “Gestionar habilidades”).
5. Completar o modificar los campos y guardar.
6. Para agregar experiencia o educación continua: usar los botones “Añadir experiencia” / “Añadir formación” y llenar el formulario.
7. Si es administrador: acceder a **“Admin”** o **“Usuarios”** / **“Egresados”** para dar de alta o editar egresados y usuarios.

#### Capturas del módulo

- _[Insertar captura aquí: vista principal del perfil del egresado]_
- _[Insertar captura aquí: formulario de edición de datos personales o académicos]_
- _[Insertar captura aquí: gestión de habilidades o experiencia laboral]_
- _[Insertar captura aquí: pantalla de administración de usuarios o egresados (si aplica)]_

---

### Módulo 2: Bolsa Laboral Inteligente

#### Descripción

Este módulo pone en contacto a egresados con ofertas de trabajo publicadas por empresas. Los egresados pueden ver ofertas activas, postularse con una carta de presentación y recibir recomendaciones según el grado de coincidencia con las habilidades requeridas (matching). Las empresas pueden publicar ofertas, ver postulaciones y gestionar estados (pendiente, en revisión, entrevista, aceptado, rechazado) y entrevistas.

#### Funcionalidades principales

- **Egresado:** listado de ofertas activas, detalle de oferta, postulación con carta opcional, ver “Mis postulaciones” y estado de cada una, ver recomendaciones según matching.
- **Empresa:** publicar ofertas (título, descripción, requisitos, beneficios, rango salarial, modalidad, tipo de contrato, vacantes), listar ofertas propias, ver postulaciones por oferta, cambiar estado de postulaciones, gestionar entrevistas (fecha, modalidad, enlace).
- **Matching:** puntaje de afinidad (por ejemplo 0–100%) entre perfil del egresado y la oferta (habilidades, modalidad, pretensión salarial).

#### Flujo de uso (paso a paso)

**Como egresado:**

1. Ir a **“Bolsa Laboral Inteligente”** en el menú.
2. Ver el listado de ofertas o las recomendadas.
3. Hacer clic en una oferta para ver el detalle (empresa, requisitos, beneficios, salario, modalidad).
4. Pulsar **“Postularme”**, completar la carta de presentación si se solicita y confirmar.
5. En **“Mis postulaciones”** ver el estado (pendiente, en revisión, entrevista, etc.) y, si aplica, datos de entrevista.

**Como empresa:**

1. Iniciar sesión con usuario de tipo empresa.
2. Ir al módulo de Bolsa Laboral y acceder al **Dashboard de empresa** o **“Crear oferta”**.
3. Completar el formulario de la oferta y publicarla.
4. En el listado de ofertas propias, abrir una oferta y ver las postulaciones.
5. Cambiar el estado de cada postulación (por ejemplo a “En entrevista”) y, si corresponde, agendar entrevistas (fecha, modalidad, enlace).

#### Capturas del módulo

- _[Insertar captura aquí: listado de ofertas laborales]_
- _[Insertar captura aquí: detalle de una oferta con botón de postulación]_
- _[Insertar captura aquí: Mis postulaciones con estados]_
- _[Insertar captura aquí: Dashboard empresa / postulaciones por oferta]_
- _[Insertar captura aquí: formulario de creación o edición de oferta]_

---

### Módulo 3: Seguimiento de Empleabilidad

#### Descripción

Este módulo sirve para medir y visualizar la empleabilidad de los egresados. Incluye encuestas de seguimiento (por ejemplo a 1, 3 y 5 años de la titulación), respuestas por egresado y dashboards con indicadores (tasa de empleabilidad, tiempo promedio de colocación, salario promedio, sector predominante) por escuela o facultad. También puede incluir reportes descargables.

#### Funcionalidades principales

- **Egresado:** ver encuestas pendientes, responder preguntas (texto, número, opción múltiple, escala, etc.) y marcar la encuesta como completada.
- **Administrador / responsable:** dashboard con KPIs y gráficas por facultad/escuela, filtros por año o período, y reportes de empleabilidad (posible exportación en PDF u otro formato).

#### Flujo de uso (paso a paso)

**Como egresado:**

1. Ir a **“Seguimiento de Empleabilidad”** en el menú.
2. Ver el dashboard o listado de **encuestas pendientes**.
3. Seleccionar una encuesta y abrirla.
4. Responder cada pregunta según el tipo (texto, número, opciones, escala).
5. Enviar o marcar la encuesta como completada.

**Como administrador o responsable:**

1. Ir al módulo de Seguimiento.
2. En el **Dashboard** ver resúmenes: tasa de empleabilidad, salario promedio, tiempo de colocación, etc., por escuela o facultad.
3. Ajustar filtros (año, escuela, facultad) si están disponibles.
4. Generar o descargar **reportes** de empleabilidad si la opción está implementada.

#### Capturas del módulo

- _[Insertar captura aquí: dashboard de seguimiento con indicadores o gráficas]_
- _[Insertar captura aquí: listado de encuestas pendientes]_
- _[Insertar captura aquí: pantalla de respuesta de encuesta (preguntas)]_
- _[Insertar captura aquí: reporte o gráfica por escuela/facultad]_

---

### Módulo 4: Red de Mentores

#### Descripción

Este módulo permite que egresados con experiencia actúen como **mentores** y que otros egresados soliciten **mentoría**. Incluye un directorio de mentores (con filtros por área o habilidades), solicitudes de mentoría (objetivo, estado: pendiente, aceptada, rechazada, completada), agenda de **sesiones** (fecha, duración, modalidad, enlace) y **evaluaciones** del mentor (por ejemplo calificación en estrellas y comentario).

#### Funcionalidades principales

- **Cualquier egresado:** ver directorio de mentores, filtrar por área o especialidad, ver perfil de un mentor, enviar solicitud de mentoría indicando el objetivo.
- **Egresado que solicita mentoría:** ver estado de sus solicitudes (pendiente, aceptada, rechazada), ver sesiones agendadas y enlaces, y evaluar al mentor tras una sesión.
- **Mentor:** ver solicitudes recibidas, aceptar o rechazar, agendar sesiones (fecha, duración, modalidad, enlace), marcar sesiones como realizadas y ver evaluaciones.

#### Flujo de uso (paso a paso)

**Para solicitar mentoría:**

1. Ir a **“Red de Mentores”** en el menú.
2. Ver el **Directorio de mentores** (listado o tarjetas).
3. Usar filtros si existen (área, habilidades).
4. Abrir el **perfil de un mentor** (experiencia, empresa, especialidades).
5. Pulsar **“Solicitar mentoría”**, escribir el objetivo de la mentoría y enviar.
6. En **“Mi mentoría”** o similar ver el estado de la solicitud; si es aceptada, ver las sesiones agendadas y el enlace si es virtual.

**Para el mentor:**

1. Acceder al **Dashboard de mentor** o “Solicitudes recibidas”.
2. Revisar cada solicitud y **aceptar** o **rechazar**.
3. Para solicitudes aceptadas, **agendar una o más sesiones** (fecha, duración, modalidad, enlace).
4. Tras realizar la sesión, marcarla como **realizada** (si la aplicación lo permite).
5. El mentorado puede **evaluar** la sesión (calificación y comentario).

#### Capturas del módulo

- _[Insertar captura aquí: directorio de mentores]_
- _[Insertar captura aquí: perfil de un mentor con botón solicitar mentoría]_
- _[Insertar captura aquí: formulario o pantalla de solicitud de mentoría]_
- _[Insertar captura aquí: Mi mentoría / estado de solicitudes y sesiones]_
- _[Insertar captura aquí: Dashboard mentor / solicitudes y agendar sesión]_

---

## 5. Flujo general del sistema

- **Registro y perfil (Módulo 1)** es la base: sin datos personales y académicos no se puede postular ni solicitar mentoría con identidad clara. El perfil profesional y las habilidades alimentan el **matching** en la Bolsa Laboral (Módulo 2).
- **Bolsa Laboral (Módulo 2)** usa el perfil del egresado (habilidades, modalidad, pretensión salarial) para calcular recomendaciones y para que las empresas vean candidatos coherentes con sus ofertas.
- **Seguimiento (Módulo 3)** usa los mismos egresados y escuelas para encuestas y para calcular indicadores de empleabilidad; no depende de los otros módulos para funcionar, pero enriquece la visión global de la universidad.
- **Red de Mentores (Módulo 4)** usa el perfil del egresado (y en algunos diseños las habilidades) para mostrar mentores por especialidad; las sesiones y evaluaciones son independientes de la bolsa y del seguimiento, pero complementan la inserción laboral.

En la práctica, el usuario inicia sesión una vez (Módulo 1), mantiene actualizado su perfil y desde el mismo menú accede a Bolsa, Seguimiento y Mentores según su rol (egresado, empresa, admin, docente).

---

## 6. Buenas prácticas de uso

- **Mantener el perfil actualizado:** especialmente habilidades, experiencia laboral y pretensión salarial, para que las recomendaciones de la bolsa laboral y el perfil ante empresas sean útiles.
- **Revisar “Mis postulaciones”** con frecuencia para no perder plazos de entrevistas o respuestas de las empresas.
- **Responder las encuestas de seguimiento** cuando estén disponibles; los resultados sirven para mejorar indicadores y políticas de la universidad.
- **Usar contraseñas seguras** y no compartir credenciales; cerrar sesión al usar equipos compartidos.
- **En mentoría:** describir con claridad el objetivo de la solicitud y asistir a las sesiones agendadas; después, evaluar al mentor para ayudar a otros usuarios.
- **Empresas:** describir bien los requisitos y beneficios de las ofertas y mantener actualizado el estado de las postulaciones para una buena experiencia del candidato.

---

*Documento preparado para el proyecto SGE-UNT — Universidad Nacional de Trujillo.*
