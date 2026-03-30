# BlackBullOnmiYield

BlackBullOnmiYield es una dApp de agregación de rendimiento cross-chain. Permite depositar activos, enrutar fondos entre cadenas y seleccionar estrategias de yield (Aave, Yearn, Beefy) con una interfaz web en Next.js y contratos en Solidity.

---

## Tabla de contenidos

1. [Visión general](#visión-general)
2. [Arquitectura técnica](#arquitectura-técnica)
3. [Guía paso a paso de implementación](#guía-paso-a-paso-de-implementación)
4. [Guía paso a paso de despliegue local](#guía-paso-a-paso-de-despliegue-local)
5. [Guía paso a paso de despliegue en testnet (Sepolia / Base Sepolia)](#guía-paso-a-paso-de-despliegue-en-testnet-sepolia--base-sepolia)
6. [Integración frontend con contratos desplegados](#integración-frontend-con-contratos-desplegados)
7. [Testing y validación](#testing-y-validación)
8. [Troubleshooting](#troubleshooting)
9. [Estructura del proyecto](#estructura-del-proyecto)

---

## Visión general

### ¿Qué resuelve?
- Ruteo cross-chain de capital.
- Abstracción del usuario final sobre estrategias de rendimiento.
- Selección de APY y gestión de depósitos desde una UI simple.

### Stack
- **Contratos**: Solidity + Hardhat
- **Seguridad**: OpenZeppelin (`Ownable`, `ReentrancyGuard`)
- **Orquestación off-chain**: Chainlink Functions (para datos APY)
- **Cross-chain bridge**: LayerZero (según endpoints configurados)
- **Frontend**: Next.js + Wagmi + Viem + Tailwind

---

## Arquitectura técnica

### Contratos principales

- **`CrossChainRouter`**
  - Administra chains soportadas.
  - Registra estrategias de yield.
  - Expone selección de mejor estrategia.

- **`BlackBullOnmiYield`**
  - Contrato de entrada del usuario.
  - Recibe depósitos, aprueba token al router y ejecuta ruteo.
  - Guarda depósitos por usuario/cadena.

- **`LayerZeroBridge`**
  - Capa de bridge para mensajes/tokens entre chains (según endpoint configurado).

- **Estrategias**
  - `RealAaveStrategy`
  - `RealYearnStrategy`
  - `RealBeefyStrategy`

### Frontend

- **`frontend/pages/index.tsx`**: pantalla principal (wallet connect, estrategias, depósito).
- **`frontend/hooks/useYieldRouter.ts`**: hook de interacción con contrato.
- **`frontend/pages/api/*`**: endpoints de datos (APY / addresses).

---

## Guía paso a paso de implementación

> Esta sección explica cómo está implementada la dApp y qué debes tocar para extenderla.

### Paso 1) Implementar/ajustar el contrato de entrada de usuario

Archivo: `contracts/BlackBullOnmiYield.sol`

1. Define el estado mínimo:
   - referencia a `ICrossChainRouter`
   - mappings de depósitos por usuario/cadena
2. Implementa `deposit(...)`:
   - valida `amount > 0`
   - transfiere token al contrato
   - aprueba token al router
   - invoca `routeFunds(...)`
3. Emite eventos (`DepositMade`, `APYUpdated`, etc.) para trazabilidad.

### Paso 2) Configurar router cross-chain

Archivo: `contracts/CrossChainRouter.sol`

1. Agrega chains soportadas con `addSupportedChain(chainId, bridgeAddress)`.
2. Registra estrategias con `addYieldStrategy(strategy, protocolName, apyBps)`.
3. Usa `getBestYieldStrategy()` para exponer selección óptima a la capa superior.

### Paso 3) Implementar estrategias

Archivos:
- `contracts/strategies/RealAaveStrategy.sol`
- `contracts/strategies/RealYearnStrategy.sol`
- `contracts/strategies/RealBeefyStrategy.sol`

1. Implementa interfaz común (`deposit`, `withdraw`, `getAPY`).
2. Aplica `nonReentrant` y validación de inputs.
3. Mantén addresses de protocolo por red en config externa (evita hardcodear para producción real).

### Paso 4) Bridge y endpoints

Archivo: `contracts/bridges/LayerZeroBridge.sol`

1. Configura endpoint según red en despliegue.
2. Registra tokens soportados en post-deploy.
3. Valida origen/destino antes de ejecutar recepción cross-chain.

### Paso 5) Integración frontend

1. Hook de escritura al contrato (`useYieldRouter`) con ABI y dirección desplegada.
2. Formulario de depósito con validaciones y feedback UX.
3. Vista de estrategias + mejor APY para guiar elección del usuario.

---

## Guía paso a paso de despliegue local

### 1) Prerrequisitos

- Node.js 18+
- npm
- Git

### 2) Clonar e instalar

```bash
git clone <TU_REPO>
cd Omni-YieldRouter
npm install
cd frontend && npm install
cd ..
```

### 3) Variables de entorno

```bash
cp env.example .env
```

Configura al menos:
- `PRIVATE_KEY`
- RPC URLs necesarias
- `CHAINLINK_FUNCTIONS_ROUTER`
- `CHAINLINK_SUBSCRIPTION_ID`

### 4) Levantar nodo local

```bash
npx hardhat node
```

### 5) Desplegar contratos en local

```bash
npm run deploy:localhost
```

### 6) Ejecutar pruebas locales

```bash
npm run test:localhost
```

### 7) Iniciar frontend

```bash
cd frontend
npm run dev
```

---

## Guía paso a paso de despliegue en testnet (Sepolia / Base Sepolia)

## Opción A (Hardhat estándar)

### Sepolia
```bash
npm run deploy:sepolia
npm run test:sepolia
```

### Base Sepolia
```bash
npm run deploy:base-sepolia
npm run test:base-sepolia
```

## Opción B (fallback con solc-js, sin compilación Hardhat remota)

Usa esta opción si tu entorno falla con `HH502` al descargar compilador.

### Sepolia
```bash
npm run deploy:sepolia:solcjs
```

### Base Sepolia
```bash
npm run deploy:base-sepolia:solcjs
```

El script fallback:
- compila localmente con `solc`
- despliega contratos con `ethers`
- escribe `deployed-addresses-<network>.json`

---

## Integración frontend con contratos desplegados

1. Toma el archivo generado:
   - `deployed-addresses-sepolia.json`
   - `deployed-addresses-baseSepolia.json`
2. Copia las direcciones a tu fuente de configuración usada por el frontend/API (`frontend/pages/api/addresses.ts` o archivo equivalente).
3. Verifica que el campo `yieldRouter` o `blackBullOnmiYield` coincida con el contrato desplegado.
4. Reinicia frontend y confirma:
   - conexión wallet
   - lectura de APY
   - envío de depósito

---

## Testing y validación

### Comandos recomendados

```bash
# Sintaxis JS scripts
node --check scripts/deploy.js
node --check scripts/deploy-testnet.js
node --check scripts/test.js
node --check scripts/test-testnet.js

# Compilación (Hardhat)
npm run compile

# Tests locales
npm run test:localhost
```

### Criterios mínimos de aceptación

- Deploy finaliza sin errores.
- Se genera JSON de direcciones por red.
- Frontend puede conectar wallet y llamar `deposit`.
- `getUserDeposits` retorna datos esperados.

---

## Troubleshooting

### Error `HH502` al compilar con Hardhat

Causa común: entorno sin salida a internet / proxy bloqueando descarga de compilador.

Solución:
1. Usa fallback `solcjs`:
   - `npm run deploy:sepolia:solcjs`
   - `npm run deploy:base-sepolia:solcjs`
2. O ejecuta en una máquina con salida a internet.

### Error de RPC / `ENETUNREACH`

- Verifica conectividad al RPC.
- Cambia a otro proveedor RPC confiable.
- Revisa variables `SEPOLIA_RPC_URL` y `BASE_SEPOLIA_RPC_URL`.

### Error por private key

- Debe estar en formato hexadecimal válido.
- Recomendado con prefijo `0x`.
- Nunca la subas al repo.

---

## Estructura del proyecto

```text
contracts/
  BlackBullOnmiYield.sol
  CrossChainRouter.sol
  bridges/
    LayerZeroBridge.sol
  strategies/
    RealAaveStrategy.sol
    RealYearnStrategy.sol
    RealBeefyStrategy.sol
scripts/
  deploy.js
  deploy-testnet.js
  deploy-testnet-solcjs.js
  test.js
  test-testnet.js
frontend/
  pages/
  components/
  hooks/
config/
  testnet.json
  production.json
```

---

## Seguridad

- Usa una wallet de despliegue dedicada con fondos limitados.
- Nunca reutilices clave privada personal.
- Audita permisos `onlyOwner` antes de producción.
- Implementa pausas/emergency paths para incident response.

---

## Licencia

MIT
