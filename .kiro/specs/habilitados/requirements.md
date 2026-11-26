# Requirements Document

## Introduction

El servicio Malla INF debe exponer un endpoint `POST /habilitados` que, dada una lista de códigos de cursos aprobados por un alumno, devuelva los cursos de la malla que el alumno está habilitado a llevar: los cursos no aprobados cuyos requisitos están todos aprobados (incluidos los cursos sin requisitos). Este documento define los requisitos funcionales, de seguridad y de calidad del endpoint, en notación EARS, con criterios de aceptación verificables.

## Contexto

- Usuario: criscal3 (c.calderonb@pucp.edu.pe).
- Proyecto: Express 4.21 sobre Node >= 22, con Jest 29 + supertest 7. Cobertura medida con `jest --coverage` sobre `src/**/*.js`.
- Endpoints existentes `GET /cursos` y `GET /cursos/:codigo` con tests en verde; su comportamiento no debe cambiar (regresión cubierta por RF-3).
- Modelo de curso (87 cursos en `data/cursos.json`): `{ id, name, credits, cycle (número o null), type: "obligatorio"|"electivo", prerequisites: [códigos] }`.
- Patrón de código derivado de los 87 ids reales: conviven formatos "1INF25" (1 dígito + 3 letras mayúsculas + 2 dígitos) y "INF238" (3 letras mayúsculas + 3 dígitos). Patrón estricto: `^(?:[0-9][A-Z]{3}[0-9]{2}|[A-Z]{3}[0-9]{3})$`.
- Hallazgos de seguridad que motivan RS-1, RS-2 y RS-3:
  - Una lista de 5000 códigos en "aprobados" dejó el servicio 40 s sin responder (denegación de servicio por payload excesivo; esos 5 000 códigos pesan ~45 KB, muy por encima del límite de 2 KB adoptado).
  - Un código malicioso "1INF30&lt;script&gt;" produjo un 500 que filtró un stack trace con rutas internas del servidor (p. ej. `C:\apps\malla\src\...`).
  - Un body `{"aprobados": "1INF25"}` (string en lugar de array) devolvió 200 con resultados incorrectos por validación de tipo ausente.
- Política de TI del laboratorio: sin dependencias con vulnerabilidades alta/crítica (`npm audit`), sin secretos en el repo (gitleaks), cobertura de líneas >= 80 % en CI.

## Glossary

- **System**: El servicio web Malla INF (aplicación Express) que expone la API REST.
- **Aprobados**: Array de strings enviado en el body del request `POST /habilitados`; cada elemento es el código de un curso que el alumno ha aprobado.
- **Habilitado**: Curso de la malla que no está en Aprobados y cuyos códigos en `prerequisites` están todos presentes en Aprobados. Un curso sin `prerequisites` (y no aprobado) es habilitado.
- **Código de curso**: String que cumple el patrón `^(?:[0-9][A-Z]{3}[0-9]{2}|[A-Z]{3}[0-9]{3})$` (p. ej. "1INF25", "INF238").
- **Body genérico de error**: Respuesta JSON sin detalles internos, sin stack trace y sin rutas de archivo.

## Requirements

### RF-1: Cálculo de cursos habilitados para un caso base verificado

**User Story:** Como alumno, quiero enviar mis cursos aprobados y recibir los cursos que puedo llevar, para planificar mi matrícula.

#### Acceptance Criteria

1. WHEN se envía `POST /habilitados` con body `{"aprobados": ["1INF25","1INF27","1INF49"]}`, THEN THE System SHALL responder 200 con un array JSON de exactamente 27 cursos, y el array SHALL incluir los códigos "1INF29", "1INF30", "1INF31" y "1INF32".

### RF-2: Regla de habilitación y exclusión de aprobados

**User Story:** Como alumno, quiero que la regla de habilitación sea correcta en todos los casos, para confiar en la respuesta.

#### Acceptance Criteria

1. WHEN un curso no aprobado tiene todos sus códigos de `prerequisites` dentro de Aprobados, THEN THE System SHALL incluir ese curso en la respuesta 200 de `POST /habilitados`.
2. WHEN un curso no aprobado tiene `prerequisites` vacío, THEN THE System SHALL incluir ese curso en la respuesta 200 de `POST /habilitados`.
3. WHEN un curso tiene al menos un requisito cuyo código no está en Aprobados, THEN THE System SHALL excluir ese curso de la respuesta 200 de `POST /habilitados`.
4. WHEN un curso está en Aprobados, THEN THE System SHALL excluir ese curso de la respuesta 200 de `POST /habilitados` (los cursos aprobados nunca aparecen en la respuesta).

### RF-3: Regresión de endpoints existentes

**User Story:** Como desarrollador, quiero que `GET /cursos` y `GET /cursos/:codigo` conserven su comportamiento actual, para no romper funcionalidad existente.

#### Acceptance Criteria

1. WHEN se envía `GET /cursos` sin query, THEN THE System SHALL responder 200 con un array de exactamente 87 cursos.
2. WHEN se envía `GET /cursos/:codigo` con un código inexistente (p. ej. "XXX999"), THEN THE System SHALL responder 404 con body `{"error": "curso no encontrado"}`.
3. WHEN se envía `GET /cursos?ciclo=4` (o cualquier ciclo no entero o fuera de [5,10]), THEN THE System SHALL responder 400 con body `{"error": "ciclo debe ser un entero entre 5 y 10"}`.

### RS-1: Límites de tamaño de la solicitud

**User Story:** Como administrador del servicio, quiero límites de payload y de elementos, para evitar denegación de servicio por listas gigantes (hallazgo: 5000 códigos dejó el servicio 40 s sin responder).

**Justificación de los límites:** los 5 000 códigos del hallazgo 1 pesan ~45 KB (≈9 bytes por código), así que cabían bajo un límite de 64 KB y ese límite no habría frenado el caso real; con 87 códigos válidos el body mide menos de 1 KB, de modo que 2 KB deja holgura solo para la solicitud válida máxima y bloquea el payload del incidente. En cuanto al tiempo, un umbral de 100 ms genera tests intermitentes en los runners compartidos de GitHub Actions (arranque en frío) y daría runs en rojo sin defecto real; 300 ms sigue separando una solicitud normal de los 40 s del incidente.

#### Acceptance Criteria

1. WHEN el body del request `POST /habilitados` pesa más de 2 KB, THEN THE System SHALL responder 413 con body `{"error": "solicitud demasiado grande"}`.
2. WHEN el array Aprobados contiene más de 87 elementos, THEN THE System SHALL responder 413 con body `{"error": "solicitud demasiado grande"}` (87 = total de cursos de la malla; un alumno no puede aprobar más cursos de los que existen).
3. WHEN se envía una solicitud válida con 87 códigos (todos los de la malla), THEN THE System SHALL responder en menos de 300 ms.

### RS-2: Validación de formato de códigos y no filtración de detalles internos

**User Story:** Como administrador del servicio, quiero validación estricta de cada código y respuestas de error seguras, para prevenir inyección y fuga de información interna (hallazgo: "1INF30&lt;script&gt;" produjo un 500 que filtró un stack trace con rutas internas).

#### Acceptance Criteria

1. WHEN Aprobados contiene al menos un elemento que no cumple el patrón `^(?:[0-9][A-Z]{3}[0-9]{2}|[A-Z]{3}[0-9]{3})$` (p. ej. "1INF30&lt;script&gt;", "inf25", "1INF2"), THEN THE System SHALL responder 400 con body `{"error": "solicitud inválida"}`.
2. WHEN el System responde cualquier error (400, 413 o 500), THEN THE System SHALL incluir en el body únicamente el mensaje genérico correspondiente, sin stack trace ni rutas de archivo (ninguna ocurrencia de "stack", ":", "\", "src/" ni "C:").
3. WHEN ocurre un error interno no controlado durante el procesamiento de `POST /habilitados`, THEN THE System SHALL responder 500 con body `{"error": "error interno del servidor"}`.

### RS-3: Validación del tipo de "aprobados" y de sus elementos

**User Story:** Como administrador del servicio, quiero validación estricta del tipo del body, para rechazar solicitudes malformadas (hallazgo: `{"aprobados": "1INF25"}` devolvió 200 con resultados incorrectos).

#### Acceptance Criteria

1. WHEN el body de `POST /habilitados` tiene "aprobados" como string, objeto, o null, o el campo está ausente, THEN THE System SHALL responder 400 con body `{"error": "solicitud inválida"}` y nunca 200.
2. WHEN Aprobados contiene al menos un elemento que no es string, THEN THE System SHALL responder 400 con body `{"error": "solicitud inválida"}`.
3. WHEN Aprobados es un array vacío `[]`, THEN THE System SHALL responder 200 con todos los cursos sin requisitos de la malla que no estén aprobados (ninguno está aprobado).

### RQ-1: Cobertura mínima en CI

**User Story:** Como responsable de calidad, quiero un umbral de cobertura de líneas en CI, para impedir que código sin testear se fusione.

#### Acceptance Criteria

1. WHEN el job de CI ejecuta `jest --coverage` con `--coverageThreshold` en `lines: 80`, y la cobertura de líneas del código bajo `src/**/*.js` es menor a 80 %, THEN THE CI pipeline SHALL fallar.
2. WHEN la cobertura de líneas es mayor o igual a 80 %, THEN THE CI pipeline SHALL pasar (junto con el resto de chequeos: `npm audit` sin vulnerabilidades alta/crítica y gitleaks sin secretos).
