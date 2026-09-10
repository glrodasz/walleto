# AGENTS.md

Convenciones de **sublr**. La regla general: **archivos pequeños y con una sola responsabilidad**, para que cada pieza se pueda testear por separado y leer de un vistazo.

Stack: Next.js 14 (Pages Router) · TypeScript estricto · Firestore + `firebase-admin` · Auth0 · Zod · styled-jsx · Jest · pnpm 9.

---

## 1. Dónde va cada cosa

### `utils/` — genérico, sin negocio

Utilidades que funcionarían igual en cualquier otro proyecto, al estilo de lodash. **No** importan de `types/`, `helpers/` ni `features/`.

```
utils/request.ts               wrapper de fetch
utils/sortByCreatedAt.ts       ordenar por createdAt, nulls al final
utils/startOfPreviousMonth.ts  medianoche del 1° del mes anterior
utils/formatList.ts            "A", "A y B", "A, B y C"
```

> Si una utilidad necesita importar un tipo del dominio (`Domain`, `Currency`, `Frequency`…), **no es un util: es un helper**. Esa es la prueba rápida.

### `helpers/` — con contexto del proyecto

Misma idea de "utilidad", pero conoce el negocio de sublr.

```
helpers/aggregations.ts           montos mensuales por dominio, rate-aware (ver §3.1); shareByCurrency para la mezcla de monedas
helpers/fx.ts                     convert()/tryConvert() por cross-rates a USD, IDENTITY_RATES
helpers/chartData.ts              buckets por día/semana/mes + serie income/expense para FlowChart y MonthlyBarsChart
helpers/materializeOccurrences.ts ocurrencias de un item recurrente en un rango, ids determinísticos
helpers/scheduleAnchor.ts         elección de fecha del usuario → startDate (incl. "backfill" = 6 meses atrás)
helpers/paymentMethodLabel.ts     "name - last4" para tablas, "SEB - Autogiro (Bank transfer)" para dropdowns
helpers/paymentMethodOptions.ts   tipos de método, sugerencias de red/proveedor, CARD_TYPES, sortByName/groupMethodsByType (wizard, Methods y PaymentMethodField)
helpers/accounts.ts               isAccountDomain (INVESTMENT | SAVING), ACCOUNT_NOUN (account / pocket), accountLabel, formatInterestRate
helpers/tags.ts                   normaliseTagName / tagKey (sin espacios; key en minúsculas), tagNames (ids → nombres)
helpers/hidden.ts                 qué filas del ledger están ocultas (por su item recurrente o su categoría)
helpers/recurrence.ts             próxima ocurrencia según Frequency
helpers/seedDefaultCategories.ts  categorías por defecto
```

### `lib/` y `firebase/` — configuración de terceros

Solo singletons y configuración de SDKs. Nada de lógica propia.

```
lib/auth0.ts         initAuth0
firebase/admin.ts    firebase-admin (solo servidor)
firebase/client.ts   SDK de cliente
```

### `features/<nombre>/` — agrupado por feature

Todo lo que solo sirve a una feature vive junta:

```
features/
  onboarding/   el wizard de configuración inicial + el guard de acceso
  dashboard/    la home: net-flow, stat cards, barras mensuales income vs expense, próximos vencimientos
  domains/      DomainPage — la pantalla month-first que comparten incomes/expenses/investments/savings:
                selector de mes, gastado vs esperado, barras mensuales, y Categories / Transactions / Recurring
  methods/      CRUD de métodos de pago (la lista de MethodsStep no alcanza para editar)
  insights/     SubscriptionInsights — costo mensual/anualizado de suscripciones
  investments/  valor por cuenta / pocket (y por categoría para lo que no tiene cuenta): invertido vs valor,
                % de ganancia, historial; helpers/interest.ts estima con la tasa de la cuenta;
                AccountValueList (vista Value), AccountValuePanels (drilldown), RecordValueModal ("+")
  settings/     CategoriesSettings (categorías raíz), TagsSettings y AccountsSettings (cuentas / pockets) desde Settings
  prospect/     simulador what-if: qué pasa si cancelo X
  create/       CreateLauncher — el botón flotante "+" y su sheet (¿pago puntual, recurrente, o valor de una cuenta?)
```

Cada una con la misma forma interna: `components/`, `hooks/`, `helpers/`, `data/`.

**La regla para decidir dónde va algo: cuenta los consumidores.**

- **Un solo consumidor** → baja a la feature.
- **Dos o más** → sube a la raíz, aunque hoy "parezca" de una feature.

Ejemplos reales: `Combobox` nació en el wizard y vive en `components/atoms/` porque es genérico; `helpers/aggregations` y `hooks/useMoneyContext` parecen de `domains` pero los usan también dashboard, insights y prospect, así que se quedan compartidos. `hooks/useDomainTransactions` nació en `expenses/` (dos consumidores después: dashboard y domains) y subió a `hooks/`.

> Cuidado con los barrels: `helpers/index.ts` reexporta, así que un `grep` por el nombre del archivo **no** encuentra a quien lo importa como `from "../helpers"`. Cuenta consumidores mirando también los barrels, o te llevarás a una feature algo que usan tres.

### Compartido entre features

```
components/atoms|molecules|organisms/   Atomic Design
hooks/                                  hooks reutilizables
schemas/                                esquemas Zod
types/                                  tipos del dominio
constants.ts                            constantes y mapas de presentación
```

`components/atoms/EmptyState.tsx` y `components/atoms/ErrorState.tsx` son **distintos a propósito**: una regla de Firestore rota o un índice building deben leerse como error, nunca como "sin datos" — esa ambigüedad ya vació la lista de categorías del wizard una vez (ver §3). `components/molecules/Modal.tsx` y `KebabMenu.tsx` son los building blocks de cualquier CRUD nuevo (crear/editar en un modal, acciones por fila en un kebab) — no reinventes overlay ni dropdown. `Modal` es un diálogo centrado en desktop y un **bottom sheet** bajo 768px (ancho completo, `dvh`, safe-area, scroll del body bloqueado); los formularios largos fijan su fila de acciones con `position: sticky; bottom: 0` para que Cancelar/Guardar no queden fuera de vista. `components/molecules/CategoryField.tsx` y `PaymentMethodField.tsx` son los selects de categoría y de método de pago con creación inline que comparten los dos formularios de alta.

**La única excepción a "los organisms no importan features"** es `PageLayout`, que monta `features/create/CreateLauncher` (el "+" flotante de mobile): tiene que existir en todas las páginas y todas las páginas se construyen sobre ese layout. Los dos formularios que abre se montan solo mientras están abiertos, así ninguna página paga sus listeners.

---

## 2. Estilos

- **styled-jsx** dentro del componente (`<style jsx>{\`…\`}</style>`). No usamos CSS Modules.
- Siempre **design tokens**, nunca hex a mano: `var(--bg-1)`, `var(--accent)`, `var(--r-md)`. Los tokens están en `styles/globals.css`.
- Tema oscuro ("Fintech-noir"). Los acentos por dominio ya existen: `--domain-income`, `--domain-expense`, `--domain-investment`, `--domain-saving`.

### Trampa de especificidad (importante)

`styles/globals.css` estiliza **todos** los `input` y `select`:

```css
input:not([type="checkbox"]):not([type="radio"]) { … }   /* (0,2,1) */
```

styled-jsx compila `.input` a `.input.jsx-hash`, que es solo `(0,2,0)` — **el global gana**. Para sobrescribir hay que anidar:

```css
.control .input { … }   /* (0,4,0) ✓ */
```

Ese detalle causó un doble borde en el wizard. Ojo también con `select`, que trae su propio chevron por `background-image`: si el componente dibuja su icono, hay que poner `background-image: none`.

### Trampa del `className` en componentes hijos (importante)

styled-jsx **no** le pone su hash de scope al `className` que le pasas a un componente hijo (`<Link className="nav-item">`, cualquier componente propio). La regla compila a `.nav-item.jsx-hash`, el `<a>` renderizado solo tiene `nav-item`, y el CSS queda muerto **sin ningún error**. Así estuvo el Sidebar entero: iconos pegados al texto, sin padding ni hover. La salida es `:global()` desde un padre con scope, nunca estilos inline:

```css
.nav :global(.nav-item) { … }        /* ✓ aplica al <a> de Link */
.nav :global(.nav-item.is-active) { … }
```

Mismo patrón en `pages/index.tsx` (`.row > :global(*)`). Si estilas algo que no es un elemento DOM literal en ese JSX, asume que necesitas `:global()`.

### Trampa de los render helpers (importante)

El hash de scope solo se estampa en el JSX que devuelve **el propio componente**. Una función auxiliar dentro del componente (`const renderRow = (o) => <li className="row">…`) devuelve elementos **sin** el hash, y sus reglas quedan muertas igual de silenciosamente — así salió el checklist de Recurring con todo el texto pegado. La salida es un componente hijo con su propio `<style jsx>` (`OccurrenceRow` en `RecurringChecklist.tsx`), nunca un helper que devuelve JSX.

---

## 3. Datos

**Lectura** — hook con `onSnapshot`, siempre protegido:

```ts
const { ready } = useFirebaseAuth();
useEffect(() => {
  if (!ready || !user?.sub) return;
  return onSnapshot(q, onNext, onError);
}, [ready, user?.sub]);
```

**Escritura** — siempre `fetch` a una API route. El cliente nunca escribe directo a Firestore, aunque las reglas lo permitan.

**Índices** — una query que combine filtros de igualdad con un `orderBy` sobre otro campo, o con una desigualdad (`>=`), **necesita índice compuesto** en `firestore.indexes.json`. Varios filtros de igualdad solos **no** lo necesitan. Si falta, `onSnapshot` falla y la lista queda vacía. Este error ya vació las categorías del wizard una vez y, más tarde, los totales y las gráficas de todas las pantallas de dominio — porque declarar el índice no basta: **hay que desplegarlo** (`pnpm firebase:deploy`). Para colecciones chicas suele salir más barato filtrar y ordenar en cliente y no depender del deploy (ver `hooks/useCategories.ts` y `features/dashboard/hooks/useUpcomingItems.ts`); para historiales que crecen, el índice es la herramienta correcta.

**Errores visibles** — `ErrorState` recibe el `Error` y muestra su mensaje tal cual; los de índice de Firestore traen la URL de consola que lo crea y se pintan como link. No lo escondas detrás de copy amable: eso es justo lo que convirtió un índice sin desplegar en un dashboard vacío y silencioso.

**Otras reglas**

- **Cuentas / pockets** (`accounts`): solo para INVESTMENT y SAVING (`helpers/accounts.ts`). Las categorías clasifican; la cuenta es _dónde_ está la plata, así que las valoraciones y el interés cuelgan de ella. `accountId` es opcional en recurrentes y transacciones (las ocurrencias lo heredan del item vía `occurrenceToTransaction`); lo que no tiene cuenta cae en el bucket "No account" del dominio (`ValueSelector = { accountId } | { domain }`; el bucket solo casa filas **sin** cuenta para no contar doble). Toda valoración nueva lleva `domain`; las anteriores a las cuentas solo tienen `categoryId` y `valuationDomain()` las resuelve por la categoría (INVESTMENT si no hay). Las cuentas se editan/archivan en Settings (`features/settings/components/AccountsSettings`). `interestRate` se guarda como lo cotiza el banco (`{ value, period: MONTHLY | YEARLY }`); `features/investments/helpers/interest.ts` lo pasa a mensual y compone desde cada depósito; un value check registrado manda desde su fecha. `AccountField` es el patrón de `CategoryField` con creador inline.
- **Tags** (`tags`): entidad global por usuario. `name` conserva mayúsculas pero sin espacios ("Trip 2026" → `Trip2026`); `key` es el `name` en minúsculas y es único por usuario (POST 409 si hay uno vivo con la misma key; si solo hay uno archivado, lo revive). Las filas (`recurrentTransactions`, `transactions`) guardan **ids** en `tags: string[]` y las rutas comprueban con `db.getAll` que sean del usuario; los nombres se resuelven al pintar con `tagNames` (`DomainPage` hace un solo `useTags()` y lo baja como `paymentMethods`). `TagsField` (chips + Combobox) reutiliza por key antes de crear. `note` es texto libre en ambas colecciones. **Herencia**: `inheritTags` / `inheritNote` en el item hacen que `occurrenceToTransaction` copie tags / note a cada ocurrencia (materializador, mark-paid y seed). Al editar un item con la herencia activa, el modal ofrece "Also update the existing payments": el PATCH recibe `applyToExisting: true` (nunca se guarda), reescribe las filas con `recurrentTransactionId == id` en lotes de 450 y responde `{ id, updated }`. Una fila editada a mano diverge hasta el siguiente "also update".
- Borrado suave: `archived: true` en categorías, métodos de pago, cuentas y tags, `active: false` en transacciones recurrentes, `status: "SKIPPED"` en transacciones. Nunca `.delete()` sobre algo que otro doc referencia. La única excepción es `investmentValuations`: un punto de datos que nadie apunta, se borra de verdad.
- **Fechas de un item recurrente**: la UI nunca escribe `startDate` a mano; pasa la elección del usuario (día de pago, mes+día, fecha) por `helpers/scheduleAnchor.ts`. "Backfill los últimos 6 meses" no es un campo: es el mismo `startDate` movido 6 meses atrás, y el materializador hace el resto. Tras crear algo con fecha en el pasado, llama `materializeNow()` para que el historial aparezca sin esperar otra sesión.
- `createdAt` con `serverTimestamp()`. Llega **`null`** en el eco local antes de que el servidor lo resuelva: cualquier orden o formato tiene que tolerarlo.
- Los campos opcionales se **omiten**, no se mandan como `null` en `POST`. En `PATCH`, en cambio, `null` significa "borrar este campo" (`FieldValue.delete()`) — así es como `chargedAmount`/`chargedCurrency`/`paymentMethodId` se limpian sin un endpoint aparte.
- Ocurrencias materializadas usan **id determinístico** `{itemId}_{YYYY-MM-DD}` (`helpers/materializeOccurrences.ts`): recrear el rango nunca duplica ni pisa una que el usuario ya editó o saltó.

### 3.1 Dinero y monedas

Todo monto se **guarda en su moneda nativa** y se **convierte solo al leer**. El punto único de conversión es `helpers/aggregations.ts` (`convertedAmount`/`toMonthlyAmount`/`sumMonthly`/`groupByCategory`/`computeMoM`/`computeFlow`), todas reciben un `MoneyContext = { rates, target }`.

- **`useMoneyContext()`** (`hooks/useMoneyContext.ts`) es el único lugar que decide moneda objetivo y tasas: `target = displayCurrency ?? mainCurrency`, `rates = useExchangeRates() ?? IDENTITY_RATES`. Cualquier pantalla que muestre montos agregados lo usa — no leas `mainCurrency` directo de `useUserDoc`.
- **Precedencia del par charged**: si un item tiene `chargedAmount`/`chargedCurrency` y `chargedCurrency === target`, se usa `chargedAmount` tal cual — lo que de verdad se cobró le gana a cualquier tasa de mercado.
- **`IDENTITY_RATES`** (`helpers/fx.ts`) son tasas 1:1 — útiles en tests y como fallback cuando no hay tasas reales; con ellas la salida es la suma cruda (para verificar mecánicamente un refactor).
- **Honestidad ante la falta de datos**: `fxMissing` (nunca hubo cache) y `fxStale` (sirviendo cache vencido o el fallback del servidor) se propagan hasta la UI. Nunca se inventa un número — cuando `fxMissing` y hay monedas mezcladas, se muestra un aviso en vez de una suma falsa (ver `pages/index.tsx`).
- **`Amount`** (`components/atoms/Amount.tsx`): `colorize` para netos (verde ≥0, rojo <0), `showCode` cuando la moneda difiere del target, `approximate` antepone "≈" en agregados convertidos. Decimales por moneda vía `ZERO_DECIMAL_CURRENCIES` en `constants.ts` (JPY, COP sin centavos), no un `maximumFractionDigits` fijo.
- **`/api/currencies`**: cache in-memory de 12h + mirror diario a Firestore (`rates/{YYYY-MM-DD}`) como fallback; el cliente cachea 24h en `localStorage` (`hooks/useExchangeRates.ts`). Nunca lo llames sin pasar por ese hook.

---

## 4. API routes

Mismo esqueleto en todas (`pages/api/**`):

```ts
export default auth0.withApiAuthRequired(async (req, res) => {
  const session = await auth0.getSession(req, res);
  if (!session?.user?.sub) return res.status(401).json({ error: "Unauthorized" });
  const userId = session.user.sub;

  if (req.method === "POST") {
    const parsed = SomeInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    // recurso ajeno → 403; duplicado → 409
    return res.status(201).json({ id });
  }

  res.setHeader("Allow", "POST");
  return res.status(405).json({ error: "Method not allowed" });
});
```

- Validación con **Zod** desde `schemas/` en toda frontera de entrada.
- Toda FK que venga del cliente (`categoryId`, `paymentMethodId`) se verifica: existe y es del usuario → si no, **403**.
- Rutas estáticas ganan a las dinámicas: `/api/categories/defaults` no choca con `[id].ts`.

---

## 5. Tests

- **Módulos puros** (`utils/`, `helpers/`, `hooks/`, `components/`, `features/**`): test **colocado** junto al archivo.
- **API routes y pages**: en `__tests__/`, con `jest.mock` de `lib/auth0` y `firebase/admin` (ver `__tests__/api/categories/index.test.ts`).
- **Nunca** un `*.test.tsx` dentro de `pages/`: Next lo compila como ruta y rompe el build. Hay un test que lo vigila (`__tests__/pagesDirectory.test.ts`).
- Separa el hook de datos del componente que lo pinta. Así la lógica se testea sin montar UI — ver `features/onboarding/hooks/useMethodsStep.test.ts`.
- Si un test necesita `firebase/client`, mockéalo: el módulo pide credenciales reales al importarse.

---

## 6. Antes de subir

```bash
pnpm tsc --noEmit
pnpm lint
pnpm test
pnpm build
```

Es exactamente lo que corre CI (`.github/workflows/ci.yml`). **`pnpm build` no es opcional**: es el único que detecta rutas rotas, y `tsc` + `jest` en verde no lo garantizan.

Otras notas:

- `pnpm seed:global` siembra el catálogo de `services`; `pnpm seed:user <userId>` siembra el perfil demo multi-moneda de un usuario (`--dry-run` lo valida e imprime el resumen sin escribir ni pedir credenciales; `--no-wipe` no borra lo que ya hay). El historial **no** está escrito a mano: se deriva de los recurrentes con `helpers/materializeOccurrences`, así que comparte los ids determinísticos del materializador de la app y montar el dashboard no duplica nada. Si tocas `data/testSeedData.json`, corre el `--dry-run` — valida categorías, métodos, servicios y pares charged.
- Husky + lint-staged formatean con Prettier al commitear, así que no pelees con el formato.

---

### 3.2 Ocultar del dashboard

El dashboard es el **run-rate de los recurrentes** (las cards y el neto lo dicen con la etiqueta "Recurring"); por eso solo un item recurrente se oculta: `hiddenFromDashboard` en `recurrentTransactions` lo saca de todos los números y listas del dashboard, y sus filas del ledger lo siguen por `recurrentTransactionId` (`helpers/hidden.ts`: `hiddenItemIds`, `withoutHidden`). Las transacciones no tienen flag propio. En las páginas de dominio, además, una categoría raíz puede ocultarse de la gráfica (`Category.hiddenFromChart`, kebab en Categories; los hijos la siguen): barras y cifra del mes excluyen items ocultos y categorías ocultas salvo que el owner active "Show hidden" (preferencia por dominio en `localStorage`). Las listas siempre muestran todo, con la etiqueta "Hidden".

### 3.3 Reflejar mensualmente (spread)

Un item no mensual (anual, trimestral, semanal…) con `spreadMonthly` se pinta en la página de dominio como **una rebanada por mes** (`amount × FREQ_TO_MONTHS`, en su moneda) en lugar del pico real: `features/domains/helpers/spread.ts` (`spreadTransactions`) quita las filas reales del item y añade rebanadas sintéticas con `recurrentTransactionId` y `categoryId`, así que `helpers/hidden` las oculta igual que a cualquier fila. `DomainPage` las usa para barras, cifra del mes y Categories (`planItems` excluye esos items del plan para no sumarlos dos veces); el ledger y el checklist de Recurring siguen con las filas reales. El dashboard no cambia: sus cards ya normalizan con `toMonthlyAmount` y sus barras de cash flow muestran el pago real.

### 3.4 Puntual vs recurrente

Hay **un solo formulario** para todo lo que entra: `RecurrentTransactionModal`. "Record a payment" del "+" lo abre con `initialFrequency="ONE_TIME"`; editar una fila del ledger lo abre con `transaction` (frecuencia fija en One time, PATCH con solo lo que cambió). Un `frequency: "ONE_TIME"` elegido ahí o en la sección One-time del wizard **no crea un item recurrente**: escribe una transacción PAID directa (`POST /api/transactions`). El plan (recurrentTransactions) es solo lo que se repite; el ledger (transactions) es lo que pasó. Los items ONE_TIME antiguos siguen funcionando, pero no se crean más.

## 7. Deferido a propósito

Decisiones explícitas de scope, no descuidos:

- **Migración de producción**: no hay suite de migración en el repo. Cuando toque promover, el owner baja los datos de prod y se escribe un script local en ese momento — el schema actual de la DB es con el que se trabaja.
- **Persistencia de escenarios what-if** (`features/prospect`): el estado vive en memoria (`useWhatIf`), se pierde al salir de la página.
- **Entradas "Simulate cancel"** desde otras pantallas (tablas, insights) hacia un escenario de Prospect precargado — la página funciona standalone con su propio checklist.
- **Presupuestos manuales** por dominio o categoría: la barra "gastado vs esperado" usa el plan (ocurrencias de los recurrentes hasta fin de mes, `features/domains/helpers/months.ts`), no un número tecleado.
- **Saltar una ocurrencia futura** desde el checklist de Recurring ("no este mes"): necesitaría escribir un doc SKIPPED con el id determinístico; hoy solo Mark as paid y Stop.
- `endDate` en los recurrentes está en el tipo pero nunca se escribe; el forecast trata los items como vigentes hasta que se paran.
- Scheduler / Cloud Functions, integraciones bancarias, y una experiencia mobile nativa (hoy: bottom nav, sheet "More", "+" flotante y páginas month-first — sin gestos, toasts, offline ni PWA).
