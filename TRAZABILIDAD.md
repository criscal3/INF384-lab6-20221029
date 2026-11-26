# Trazabilidad

## Requisito → gate o test → evidencia

| Requisito | Mecanismo | Evidencia roja | Evidencia verde |
| --- | --- | --- | --- |
| RF-1.1 / RF-2.1-4 | Tests supertest y PBT 1 | [Run rojo 45909021052](https://github.com/criscal3/INF384-lab6-20221029/actions/runs/45909021052) | [Run verde 45909211204](https://github.com/criscal3/INF384-lab6-20221029/actions/runs/45909211204) |
| RF-3.1-3 | Suites existentes de cursos | En verde durante la implementación ingenua | [Run verde 45909211204](https://github.com/criscal3/INF384-lab6-20221029/actions/runs/45909211204) |
| RS-1.1-3 | Parser 2 KB, límite 87, test < 300 ms | Sin límites ni guarda durante la tarea 3 | [Run verde 45909211204](https://github.com/criscal3/INF384-lab6-20221029/actions/runs/45909211204) |
| RS-2.1-3 | Patrón estricta y middleware genérico | Sin patrón ni middleware seguro | [Run verde 45909211204](https://github.com/criscal3/INF384-lab6-20221029/actions/runs/45909211204) |
| RS-3.1-3 | Validación de array y elementos | Sin Array.isArray ni tipo de elementos | [Run verde 45909211204](https://github.com/criscal3/INF384-lab6-20221029/actions/runs/45909211204) |
| RQ-1.1-2 | Jest coverage, líneas >= 80 % | Cobertura no era gate rojo | Cobertura local 95.55 %; run [45909211204](https://github.com/criscal3/INF384-lab6-20221029/actions/runs/45909211204) |
| SCA | npm audit --audit-level=high | lodash 4.17.20 producía hallazgo alto | 0 vulnerabilidades con lodash 4.18.1 |
| Secretos | gitleaks-action | Sin evidencia previa roja | [Run CI 45909242165](https://github.com/criscal3/INF384-lab6-20221029/actions/runs/45909242165) |
| SAST | CodeQL security-extended | Sin configuración previa | [Run CI 45909242165](https://github.com/criscal3/INF384-lab6-20221029/actions/runs/45909242165) |

## Diagnóstico del run en rojo

- **Run:** https://github.com/criscal3/INF384-lab6-20221029/actions/runs/45909021052
- **RS-1:** no existían `express.json({ limit: '2kb' })` ni la guarda de más de 87 elementos.
- **RS-2:** no existían validación de patrón, guarda para `\n` ni middleware seguro extendido.
- **RS-3:** no existía `Array.isArray`, validación de elementos ni rechazo de tipos incorrectos.
- **Resultado:** los tests RF y regresión pasaron con el cálculo ingenuo; las pruebas RS fallaron hasta añadir las defensas.

## Evidencia local

- 53 pruebas en verde después de la corrección.
- Cobertura de líneas: 95.55 %.
- npm audit: 0 vulnerabilidades alta/crítica.
- Commits reproducidos por tarea:
  - `696633e` tests RF en rojo.
  - `55102c8` tests RS en rojo.
  - `6660e58` implementación ingenua y run rojo.
  - `facbc35` PBT.
  - `29ea646` validación.
  - `6ce7b18` límite 2 KB y middleware.
  - `57c536a` corrección verde y cobertura.
  - `5d51ed9` CI con gitleaks, cobertura, SCA y CodeQL.

## Cambios respecto de la propuesta de Kiro

| Documento | Propuesta | Cambio aplicado | Justificación |
| --- | --- | --- | --- |
| requirements.md RS-1 | Body máximo 64 KB | Body máximo 2 KB | El payload real de 45 KB quedaba permitido por 64 KB. |
| requirements.md RS-1 | Tiempo < 100 ms | Tiempo < 300 ms | Evita resultados intermitentes en runners compartidos. |
| package.json | lodash 4.17.20 | lodash 4.18.1 | npm audit detectaba una vulnerabilidad alta. |
