# Implementation Plan: Endpoint `POST /habilitados`

## Overview

Implementación del endpoint `POST /habilitados` siguiendo un ciclo TDD con evidencia de fallo y corrección: primero los tests de requisitos funcionales (RF-1, RF-2) y de seguridad (RS-1, RS-2, RS-3) en rojo, luego una implementación ingenua sin defensas (solo RF, run en rojo por los tests de seguridad), después las defensas (validación, límites, middleware) hasta el run en verde con cobertura >= 80 %, y finalmente los gates de CI y el documento de trazabilidad. El plan culmina con dos pushes que el usuario ejecuta manualmente para registrar los links de los runs en rojo y en verde como evidencia en `TRAZABILIDAD.md`.

**Stack:** Express 4.22.3, Node >= 22, Jest 29 + supertest 7, lodash, fast-check (nueva devDependency, P-D3).

**Referencias:** requisitos en `.kiro/specs/habilitados/requirements.md` (RF-1, RF-2, RF-3, RS-1, RS-2, RS-3, RQ-1), diseño en `.kiro/specs/habilitados/design.md` (capas, propiedades 1-5, matriz de errores, gates).

## Tasks

- [x] 1. Escribir tests de RF-1 y RF-2 (en rojo)
  - Crear `tests/habilitados.test.js` con supertest sobre `app.js` (mismo patrón que `tests/cursos.test.js`).
  - Escribir los siguientes tests, cada uno etiquetado con `// Requisito: RF-x.y` en un comentario sobre el test:
    - `rf1.1`: `POST /habilitados` con `{"aprobados": ["1INF25","1INF27","1INF49"]}` → 200, exactamente 27 cursos, incluye "1INF29", "1INF30", "1INF31", "1INF32" (RF-1.1).
    - `rf2.1`: curso no aprobado con todos sus prereqs aprobados aparece en la respuesta, p. ej. "1INF29" con `["1INF25"]` (RF-2.1).
    - `rf2.2`: curso sin prerequisitos no aprobado aparece en la respuesta con `[]` (p. ej. cualquier curso sin prereqs de los 26) (RF-2.2).
    - `rf2.3`: curso con al menos un prereq faltante NO aparece, p. ej. "1INF32" con `["1INF25"]` (prereq "1INF26" ausente) (RF-2.3).
    - `rf2.4`: curso aprobado nunca aparece, p. ej. "1INF25" con `["1INF25","1INF27"]` (RF-2.4).
  - NO modificar los tests existentes de `tests/cursos.test.js`, `tests/cursosDetalle.test.js`, `tests/health.test.js`, `tests/repositorio.test.js`, `tests/errorMiddleware.test.js` (regresión RF-3 se valida con ellos tal cual).
  - Estado esperado: **FALLAN** (el endpoint no existe; 404 en todos).
  - _Requisitos: RF-1.1, RF-2.1, RF-2.2, RF-2.3, RF-2.4_
  - **Completada cuando:** los 5 tests nuevos existen y `npx jest tests/habilitados.test.js` falla (404).
  - **Dependencias:** ninguna.
  - **Commit:** `test: tests de RF-1 y RF-2 en rojo (endpoint inexistente)`

- [x] 2. Escribir tests de RS-1, RS-2 y RS-3 (en rojo sobre implementación ingenua)
  - Añadir a `tests/habilitados.test.js`, cada uno etiquetado con `// Requisito: RS-x.y`:
    - `rs1.1`: body > 2 KB (p. ej. 300 códigos válidos, ~2.7 KB) → 413 con body exactamente `{"error": "solicitud demasiado grande"}` (RS-1.1).
    - `rs1.2`: array con 88 elementos → 413; y array con 88 duplicados del mismo código (p. ej. 88× "1INF25") → 413 (valida conteo pre-deduplicación, P-D1) (RS-1.2).
    - `rs1.3`: los 87 códigos de la malla (leídos de `repositorio.listar()`) → 200 en < 300 ms, medido con `Date.now()` alrededor del request supertest (RS-1.3).
    - `rs2.1`: cada código inválido de la lista `"1INF30<script>"`, `"inf25"`, `"1INF2"`, `"1INF30\n"`, `" 1INF25 "`, `""` → 400 con body exactamente `{"error": "solicitud inválida"}` (un test por código o un `it.each`) (RS-2.1).
    - `rs2.2`: aserción auxiliar `sinFuga(body)` que serializa el body de respuesta y verifica que no contiene "stack", "C:", "\\", "src/"; aplicarla en cada test de error de este archivo (RS-2.2).
    - `rs2.3`: app de prueba con una ruta stub `POST /habilitados` que lanza `new Error('C:\\apps\\malla\\src\\interna.js')` → 500 con body exactamente `{"error": "error interno del servidor"}` y sin fuga (RS-2.3).
    - `rs3.1`: `aprobados` como string (`"1INF25"`), objeto (`{"0":"1INF25"}`), `null`, y campo ausente (`{}`) → 400; y request con `Content-Type: text/plain` y body JSON → 400, nunca 200 (RS-3.1).
    - `rs3.2`: elemento no string: `[42]`, `[null]`, `[{}]` → 400 (RS-3.2).
    - `rs3.3`: array vacío `[]` → 200 con exactamente los 26 cursos sin `prerequisites` (RS-3.3).
  - Estado esperado: **FALLAN** (sobre la implementación ingenua de la tarea 3, aún sin defensas).
  - _Requisitos: RS-1.1, RS-1.2, RS-1.3, RS-2.1, RS-2.2, RS-2.3, RS-3.1, RS-3.2, RS-3.3_
  - **Completada cuando:** los 9 grupos de tests existen y fallan sobre la implementación ingenua.
  - **Dependencias:** 1 (mismo archivo, los tests RF ya escritos).
  - **Commit:** `test: tests de RS-1/RS-2/RS-3 en rojo sobre implementación ingenua`

- [x] 3. Implementación ingenua SIN defensas (solo RF)
  - Crear `src/routes/habilitados.js`: router Express con `POST /` que llama al servicio y responde `res.json(cursos)`; sin validación de tipo, sin patrón, sin límites, sin middleware extendido.
  - Crear `src/services/habilitados.js`: `calcular(aprobados)` con `new Set(aprobados)`, `repositorio.listar()`, filtro `!set.has(curso.id) && curso.prerequisites.every(r => set.has(r))`, y `_.sortBy(habilitados, 'id')` (lodash ya disponible; P-D5).
  - Montar en `src/app.js`: `app.use('/habilitados', require('./routes/habilitados'));` — por ahora SIN `express.json` con límite.
  - Ejecutar `npx jest`: `rf1.1` y `rf2.1`-`rf2.4` y `rs3.3` deben pasar; los tests `rs1.x`, `rs2.1`, `rs2.3`, `rs3.1`, `rs3.2` deben seguir en rojo; los tests existentes (RF-3) siguen en verde (regresión).
  - Hacer commit y **push** — el usuario anota el link del run en rojo en `TRAZABILIDAD.md` (EVIDENCIA DE FALLA).
  - _Requisitos: RF-1.1, RF-2.1, RF-2.2, RF-2.3, RF-2.4 (implementación); RF-3.1, RF-3.2, RF-3.3 (regresión en verde)_
  - **Completada cuando:** `npx jest` muestra tests RF en verde, tests RS en rojo, tests existentes en verde; commit + push hechos.
  - **Dependencias:** 1, 2.
  - **Commit:** `feat: implementación ingenua de POST /habilitados (solo cálculo, sin defensas)`

- [x] 4. Checkpoint - Confirmar estado TDD
  - Verificar: tests RF en verde, tests RS en rojo, tests de regresión en verde.
  - Confirmar que el usuario anotó el link del run en rojo en `TRAZABILIDAD.md`.
  - Asegurar que todos los tests pasan, hacer preguntas al usuario si surgen.

- [x] 5. Tests de propiedad PBT (fast-check)
  - Ejecutar `npm install --save-dev fast-check` y verificar `npm audit --audit-level=high` sin vulnerabilidades alta/crítica (gate SCA).
  - Crear `tests/habilitadosProp.test.js` con fast-check, cada test etiquetado `// Feature: habilitados, Propiedad N: <título>`, mínimo 100 iteraciones (Propiedad 1 con `numRuns: 200`):
    - **Propiedad 1 — Bicondicional de habilitación** (`numRuns: 200`): generar subconjunto aleatorio de ids de la malla con `fc.shuffledSubarray`; llamar al servicio; verificar inclusión (todo retornado cumple la condición) y completitud (todo curso que cumple la condición está retornado). **Valida: RF-2.1, RF-2.2, RF-2.3, RF-2.4.**
    - **Propiedad 2 — Rechazo universal de códigos inválidos**: generar strings que no cumplen el patrón (o contienen `\n`); request HTTP → 400 con body exacto. **Valida: RS-2.1.**
    - **Propiedad 3 — No fuga de información interna**: para cada request inválido generado, body serializado sin "stack", "C:", "\\", "src/". **Valida: RS-2.2.**
    - **Propiedad 4 — Idempotencia de duplicados**: `calcular(arr)` ≡ `calcular([...new Set(arr)])` para arrays válidos (≤ 87 elementos). **Valida: RF-2 (duplicados).**
    - **Propiedad 5 — Tolerancia a inexistentes**: `calcular(arr)` ≡ `calcular([...arr, "INF999"])` para arrays válidos. **Valida: RF-2 (códigos inexistentes).**
    - **Test de integridad de datos**: contra `data/cursos.json`, 87 cursos y 0 referencias colgantes en `prerequisites`.
  - Nota: las Propiedades 2 y 3 harán requests HTTP y estarán en rojo hasta la tarea 7 (igual que los tests RS); las Propiedades 1, 4 y 5 contra el servicio ya pueden pasar tras la tarea 3.
  - _Requisitos: RF-2.1, RF-2.2, RF-2.3, RF-2.4, RS-2.1, RS-2.2_
  - **Completada cuando:** el archivo existe con las 5 propiedades + test de integridad; `npx jest tests/habilitadosProp.test.js` reporta Propiedades 1, 4, 5 y test de integridad en verde (2 y 3 en rojo, esperado).
  - **Dependencias:** 3.
  - **Commit:** `test: propiedades PBT fast-check (Propiedades 1-5) + test de integridad de datos`

- [x] 6. Implementar validación de entrada (src/util/validacion.js)
  - Crear `src/util/validacion.js` con `validarAprobados(body)` según el diseño:
    - `const PATRON_CODIGO = /^(?:[0-9][A-Z]{3}[0-9]{2}|[A-Z]{3}[0-9]{3})$/;` y `const MAX_APROBADOS = 87;`
    - `aprobados = body?.aprobados` (evita TypeError con `req.body` undefined).
    - `!Array.isArray(aprobados)` → `{ status: 400, body: { error: 'solicitud inválida' } }` (RS-3.1).
    - `!aprobados.every(e => typeof e === 'string')` → 400 (RS-3.2).
    - `aprobados.length > 87` → 413 (contado ANTES de deduplicar, P-D1) (RS-1.2).
    - Por cada código: `codigo.includes('\n') || !PATRON_CODIGO.test(codigo)` → 400 (guarda `\n` ANTES del regex, P-D2) (RS-2.1).
    - Válido → `null`.
  - Conectar en `src/routes/habilitados.js`: `const error = validarAprobados(req.body); if (error) return res.status(error.status).json(error.body);`
  - _Requisitos: RS-2.1, RS-3.1, RS-3.2, RS-1.2 (parte de validación)_
  - **Completada cuando:** `npx jest` muestra `rs2.1`, `rs3.1`, `rs3.2`, Propiedad 2 y Propiedad 4/5 (parte de entrada) en verde.
  - **Dependencias:** 3, 5.
  - **Commit:** `feat: validación estricta de aprobados (tipo, patrón, límite 87)`

- [x] 7. Implementar límite de body y middleware extendido
  - En `src/app.js`, montar `express.json({ limit: '2kb' })` SOLO para `/habilitados`, antes de la ruta (primera barrera de DoS, P-D4):
    `app.use('/habilitados', express.json({ limit: '2kb' }), require('./routes/habilitados'));`
    (el `express.json()` global sin límite sigue para el resto).
  - Extender `src/middleware/errors.js` según el diseño:
    - `err.type === 'entity.too.large'` → 413 `{"error": "solicitud demasiado grande"}`.
    - `err.type === 'entity.parse.failed'` → 400 `{"error": "solicitud inválida"}`.
    - Resto → 500 `{"error": "error interno del servidor"}` (nunca `err.message` ni `err.stack`).
  - _Requisitos: RS-1.1, RS-2.2, RS-2.3_
  - **Completada cuando:** `npx jest` muestra TODOS los tests en verde, incluidos `rs1.1`, `rs2.2`, `rs2.3`, `rs1.2` (413 por parser y por validación) y `rs1.3` (< 300 ms).
  - **Dependencias:** 6.
  - **Commit:** `feat: límite 2kb en /habilitados y middleware de errores extendido (413/400/500)`

- [x] 8. Ajustar servicio si falta sortBy
  - Verificar `src/services/habilitados.js`: respuesta ordenada por `id` ascendente (`_.sortBy(habilitados, 'id')`, P-D5) y deduplicación vía `Set`.
  - Si la tarea 3 ya incluyó el servicio completo, esta tarea se reduce a una verificación con un test de orden (`ids` estrictamente crecientes).
  - _Requisitos: RF-1.1, RF-2.1 (orden determinista de la respuesta)_
  - **Completada cuando:** test de orden en verde o verificación manual confirmada.
  - **Dependencias:** 3.
  - **Commit:** `test: verificar orden id ascendente en la respuesta` (solo si se añade test)

- [x] 9. Checkpoint - Verificación local completa
  - Ejecutar `npx jest --coverage --coverageThreshold='{"global":{"lines":80}}'`.
  - Si coverage < 80 %, añadir tests para las líneas no cubiertas de `src/**/*.js` (p. ej. ramas de `validacion.js` o `errors.js`).
  - Verificar `npm audit --audit-level=high` en verde.
  - Asegurar que todos los tests pasan, hacer preguntas al usuario si surgen.
  - _Requisitos: RQ-1.1, RQ-1.2_
  - **Completada cuando:** `npx jest --coverage` verde localmente con >= 80 % líneas sobre `src/**/*.js`.
  - **Dependencias:** 7, 8.

- [x] 10. Commit de corrección y push (EVIDENCIA DE CORRECCIÓN)
  - Commit de todos los cambios de las tareas 6-9 (si no se hizo commit intermedio) y push.
  - El usuario anota el link del run en verde en `TRAZABILIDAD.md` (EVIDENCIA DE CORRECCIÓN).
  - _Requisitos: RS-1, RS-2, RS-3, RQ-1 (run en verde)_
  - **Completada cuando:** commit + push hechos y el usuario confirma el run en verde.
  - **Dependencias:** 9.
  - **Commit:** `fix: validación y límites para RS-1/RS-2/RS-3 + cobertura 80`

- [x] 11. Actualizar CI con gates de seguridad (fase 5)
  - Actualizar `.github/workflows/ci.yml` según el diseño:
    - `permissions: contents: read` a nivel de workflow.
    - Job `gitleaks` (primer job): `actions/checkout@v4` con `fetch-depth: 0` + `gitleaks/gitleaks-action@v2`.
    - Job `build` (`needs: gitleaks`): `actions/setup-node@v4` (node 22, cache npm) → `npm ci` → `npm audit --audit-level=high` → `npx jest --coverage --coverageThreshold='{"global":{"lines":80}}'`.
    - Job `codeql` (`needs: build`, `permissions: { contents: read, security-events: write }`): `github/codeql-action/init@v3` con `languages: javascript, queries: security-extended` → `github/codeql-action/analyze@v3`.
    - Conservar triggers `push`/`pull_request` a `main`.
  - Commit y push; verificar que el run de CI pasa con los tres jobs.
  - _Requisitos: RQ-1.1, RQ-1.2 (gate de cobertura), SCA (npm audit), Secretos (gitleaks), SAST (CodeQL)_
  - **Completada cuando:** el workflow actualizado está commiteado y el run de CI en GitHub Actions pasa (jobs gitleaks, build, codeql en verde).
  - **Dependencias:** 10.
  - **Commit:** `ci: gates de gitleaks, npm audit, cobertura 80 y CodeQL security-extended`

- [x] 12. Completar TRAZABILIDAD.md (fase 6)
  - Reemplazar cada `TODO(link run)` de la tabla de evidencias con los links reales que el usuario anotó (run en rojo de la tarea 3, run en verde de la tarea 10, run de CI de la tarea 11).
  - Completar la sección "Diagnóstico de runs en rojo": para el run en rojo, causa exacta por requisito (RS-1: sin `express.json` con límite ni guarda de 87; RS-2: sin patrón ni middleware extendido; RS-3: sin `Array.isArray`).
  - Mantener la sección "Cambios que hice a la propuesta de Kiro" con los 2 cambios ya documentados (64 KB→2 KB, 100 ms→300 ms); añadir cualquier cambio nuevo si surge.
  - _Requisitos: cobertura documental de todos (RF-1 a RQ-1, SCA, secretos, SAST)_
  - **Completada cuando:** `TRAZABILIDAD.md` no contiene `TODO(link run)` (todos reemplazados) y las secciones de diagnóstico y cambios están completas.
  - **Dependencias:** 10, 11.
  - **Commit:** `docs: trazabilidad completa con evidencias de runs rojo/verde`

## Notes

- Tareas marcadas con `*` serían opcionales; este plan no usa el marcado `*` porque todos los tests son parte de la evidencia de cumplimiento de RS-2.2 y RQ-1.
- Orden TDD estricto: tests en rojo (1-2) → implementación ingenua (3) → push con run en rojo → defensas (5-7) → verificación (8-9) → push con run en verde (10) → CI (11) → trazabilidad (12).
- Los pushes y la anotación de links de runs los ejecuta el usuario manualmente (no hay tarea de deploy: prohibido por reglas del workflow).
- Cada test de error aplica la aserción `sinFuga` (RS-2.2) para no filtrar "stack", "C:", "\\", "src/".
- `npx jest` local antes de cada commit; nunca en modo watch.
- Referencia de propiedades: design.md, sección "Correctness Properties" (Propiedades 1-5) y "Testing Strategy".

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2"] },
    { "id": 2, "tasks": ["3"] },
    { "id": 3, "tasks": ["4"] },
    { "id": 4, "tasks": ["5", "8"] },
    { "id": 5, "tasks": ["6"] },
    { "id": 6, "tasks": ["7"] },
    { "id": 7, "tasks": ["9"] },
    { "id": 8, "tasks": ["10"] },
    { "id": 9, "tasks": ["11"] },
    { "id": 10, "tasks": ["12"] }
  ]
}
```
