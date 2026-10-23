# Contexto del proyecto

## Propósito

Este repositorio contiene material educativo sobre algoritmos de cifrado. La aplicación principal, **Cifrario**, es una web estática en español para practicar cifrados clásicos y compartir mensajes cifrados junto con la configuración necesaria para descifrarlos. No hay backend ni cuentas.

Estos métodos son históricos y sirven para aprendizaje y demostración. No deben presentarse ni usarse como protección para información sensible.

## Estructura

- `src/main.tsx`: interfaz React y flujo para cifrar/descifrar.
- `src/ciphers.ts`: lógica y validación de configuraciones para los cifrados.
- `src/style.css`: estilos de la aplicación.
- `strings/`: programa independiente en Rust para procesar/imprimir cadenas; consulta su `Cargo.toml` antes de asumir más sobre su propósito.
- `documento/`: informes, diapositivas y recursos académicos relacionados.
- `README.md`: descripción de uso, métodos y publicación en GitHub Pages.

## Cifrados implementados

- **Disco de Alberti:** sustitución con dos alfabetos configurables, giro inicial, incremento periódico, manejo de caracteres fuera del disco y opción de conservar la caja. La configuración JSON incluye los parámetros necesarios para descifrar.
- **Rejilla giratoria de Fleissner:** transposición en rejillas de 2×2 a 16×16, con una perforación por órbita de rotación, dirección configurable y modos de completar cuatro giros o detenerse al terminar el texto. La configuración guarda la longitud original y las opciones necesarias para reconstruir el texto.
- La interfaz permite preprocesar texto (mayúsculas, diacríticos, espacios y filtro de caracteres). Mantén coherentes el preprocesado y la configuración exportada al modificar estos flujos.
- En Alberti, la vista previa de texto recuperable simula el cifrado y descifrado con los parámetros actuales. Los caracteres fuera del alfabeto exterior pueden perderse al eliminarlos o resultar ambiguos si se conservan y también pertenecen al alfabeto interior.

## Convenciones de trabajo

- La interfaz y los textos para usuarios están en español.
- Mantén la lógica criptográfica en `src/ciphers.ts` y la presentación/estado de la interfaz en `src/main.tsx`.
- Conserva validaciones explícitas de parámetros y compatibilidad de los JSON de configuración existentes al cambiar los formatos.
- Al describir las capacidades del proyecto, deja claro que son cifrados clásicos educativos y no criptografía moderna.
- No añadas dependencias sin necesidad; revisa `package.json` y los manifiestos del subproyecto antes de cambiar herramientas o comandos.

## Desarrollo

La aplicación requiere Node.js 22 o posterior:

```sh
npm install
npm run dev
npm run build
```

El subproyecto Rust tiene su propio manifiesto (`strings/Cargo.toml`) y se ejecuta desde `strings/` con Cargo.

La publicación web está configurada mediante GitHub Actions para GitHub Pages; consulta el README y el workflow correspondiente antes de cambiar el proceso de despliegue.
