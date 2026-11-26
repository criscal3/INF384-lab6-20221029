# Trazabilidad

## Requisito → gate → evidencia

| Requisito | Gate (herramienta y umbral) | Bloquea / avisa | Etapa | Run fallido | Run corregido |
| --- | --- | --- | --- | --- | --- |
| RS-1 (DoS) | npm audit --audit-level=high + límite 2 KB + máx. 87 elementos | Bloquea | push/PR (antes de build/test) | TODO(link run) | TODO(link run) |
| RS-2 (inyección/stack trace) | Patrón estricto de código + middleware de errores sin stack | Bloquea | Tests (jest --coverage) | TODO(link run) | TODO(link run) |
| RS-3 (tipo incorrecto) | Validación de tipo en middleware de entrada | Bloquea | Tests (jest --coverage) | TODO(link run) | TODO(link run) |
| RQ-1 | jest --coverage --coverageThreshold lines:80 | Bloquea | CI (job test) | TODO(link run) | TODO(link run) |

## Diagnóstico de runs en rojo

_Completar con el link al run y la causa exacta una vez generados los runs de evidencia._

## Cambios que hice a la propuesta de Kiro

| Documento | Qué propuso Kiro | Qué cambié | Por qué |
| --- | --- | --- | --- |
| requirements.md (RS-1) | Body máximo **64 KB** | Body máximo **2 KB** | Los 5 000 códigos del hallazgo real pesan ~45 KB, por lo que cabían bajo 64 KB y ese límite no habría bloqueado el ataque. Con 87 códigos válidos el body mide < 1 KB; 2 KB deja holgura solo para la solicitud válida máxima. |
| requirements.md (RS-1) | Tiempo de respuesta < **100 ms** | Tiempo de respuesta < **300 ms** | Un umbral de 100 ms genera tests intermitentes en los runners compartidos de GitHub Actions (arranque en frío) y daría runs en rojo sin defecto real. 300 ms sigue separando claramente una respuesta normal de los 40 s del incidente. |
