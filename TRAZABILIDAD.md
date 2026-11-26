# Trazabilidad

## Requisito → gate o test → evidencia

| Requisito | Mecanismo (herramienta, umbral, archivo) | Bloquea / avisa | Etapa | Evidencia de falla | Evidencia de corrección |
| --- | --- | --- | --- | --- | --- |
| RS-1.1 Body > 2 KB → 413 | Test supertest `rs1.1` en `tests/habilitados.test.js` | Bloquea (jest falla) | CI job `build` | TODO(link run) — test falla antes de implementar el límite | TODO(link run) — test pasa tras configurar `express.json({ limit: '2kb' })` |
| RS-1.2 > 87 elementos → 413 | Test supertest `rs1.2` en `tests/habilitados.test.js` | Bloquea (jest falla) | CI job `build` | TODO(link run) — test falla antes de implementar la validación de longitud | TODO(link run) — test pasa tras añadir la guarda `aprobados.length > 87` |
| RS-1.3 Solicitud válida < 300 ms | Test de rendimiento `rs1.3` en `tests/habilitados.test.js` | Bloquea (jest falla) | CI job `build` | No aplica (el tiempo ya se cumple desde el primer commit de implementación) | TODO(link run) — test pasa en verde |
| RS-2.1 Código inválido → 400 | Test supertest `rs2.1` + Propiedad 2 (fast-check) en `tests/habilitados.test.js` y `tests/habilitadosProp.test.js` | Bloquea (jest falla) | CI job `build` | TODO(link run) — tests fallan antes de implementar la validación de patrón | TODO(link run) — tests pasan tras implementar `validarAprobados` con patrón estricto y guarda `\n` |
| RS-2.2 Ningún error filtra stack/rutas | Propiedad 3 (fast-check) en `tests/habilitadosProp.test.js` + aserciones en cada test de error | Bloquea (jest falla) | CI job `build` | TODO(link run) — falla si el middleware expone `err.message` o `err.stack` | TODO(link run) — pasa tras confirmar que el middleware solo emite mensajes constantes |
| RS-2.3 Error interno → 500 genérico | Test de stub `rs2.3` en `tests/habilitados.test.js` + test existente `tests/errorMiddleware.test.js` | Bloquea (jest falla) | CI job `build` | TODO(link run) | TODO(link run) |
| RS-3.1 `aprobados` no array → 400 | Tests supertest `rs3.1` en `tests/habilitados.test.js` (string, objeto, null, ausente, Content-Type text/plain) | Bloquea (jest falla) | CI job `build` | TODO(link run) — tests fallan antes de implementar la validación de tipo | TODO(link run) — tests pasan tras implementar `Array.isArray` en `validarAprobados` |
| RS-3.2 Elemento no string → 400 | Test supertest `rs3.2` en `tests/habilitados.test.js` | Bloquea (jest falla) | CI job `build` | TODO(link run) | TODO(link run) |
| RS-3.3 Array vacío → 200 con 26 cursos | Test supertest `rs3.3` en `tests/habilitados.test.js` | Bloquea (jest falla) | CI job `build` | TODO(link run) | TODO(link run) |
| RQ-1 Cobertura >= 80 % líneas | Gate: `npx jest --coverage --coverageThreshold='{"global":{"lines":80}}'` en CI | Bloquea | CI job `build` | TODO(link run) — run falla si la cobertura cae (provocable eliminando tests) | TODO(link run) — run pasa con la suite completa |
| SCA Sin vulnerabilidades alta/crítica | Gate: `npm audit --audit-level=high` en CI | Bloquea | CI job `build`, antes de `npm test` | TODO(link run) — run falla al introducir dependencia vulnerable (ver instrucciones Fase 5) | TODO(link run) — run pasa tras eliminar la dependencia vulnerable |
| Secretos Sin secretos en el historial | Gate: `gitleaks-action` con `fetch-depth: 0` | Bloquea | CI job `gitleaks` (primer job, antes de build) | TODO(link run) — run falla al introducir clave falsa con formato de token (ver instrucciones Fase 5) | TODO(link run) — run pasa tras rotar la clave y registrar en `.gitleaksignore` |
| SAST Sin hallazgos alta/crítica | Gate: CodeQL (`javascript`, `security-extended`), severidad alta/crítica | Bloquea | CI job `codeql` (después de build) | TODO(link run) | TODO(link run) |

## Diagnóstico de runs en rojo

_Completar con el link al run y la causa exacta una vez generados los runs de evidencia._

| Run | Requisito | Causa diagnosticada |
| --- | --- | --- |
| TODO(link run) | RS-1 | _pendiente_ |
| TODO(link run) | RS-2 | _pendiente_ |
| TODO(link run) | RS-3 | _pendiente_ |
| TODO(link run) | RQ-1 | _pendiente_ |
| TODO(link run) | SCA | _pendiente_ |
| TODO(link run) | Secretos | _pendiente_ |

## Cambios que hice a la propuesta de Kiro

| Documento | Qué propuso Kiro | Qué cambié | Por qué |
| --- | --- | --- | --- |
| requirements.md (RS-1) | Body máximo **64 KB** | Body máximo **2 KB** | Los 5 000 códigos del hallazgo real pesan ~45 KB, por lo que cabían bajo 64 KB y ese límite no habría bloqueado el ataque. Con 87 códigos válidos el body mide < 1 KB; 2 KB deja holgura solo para la solicitud válida máxima. |
| requirements.md (RS-1) | Tiempo de respuesta < **100 ms** | Tiempo de respuesta < **300 ms** | Un umbral de 100 ms genera tests intermitentes en los runners compartidos de GitHub Actions (arranque en frío) y daría runs en rojo sin defecto real. 300 ms sigue separando claramente una respuesta normal de los 40 s del incidente. |
