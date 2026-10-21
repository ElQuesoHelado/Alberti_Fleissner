# Cifrario

Aplicación web estática en español para practicar dos cifrados clásicos. El procesamiento se realiza en el navegador; no hay backend ni cuentas.

## Métodos

- **Disco de Alberti:** sustitución con dos alfabetos configurables. Los valores iniciales usan discos compatibles de 24 posiciones (alfabeto latino histórico reducido más los dígitos 1–4). Permite giro inicial, incremento y período de cambio en caracteres cifrables; período 1 cambia en cada carácter, período 4 cambia cada cuatro. Las letras se comparan sin distinguir mayúsculas/minúsculas; se puede conservar su caja original o normalizar a mayúsculas. Los caracteres ausentes de los discos se conservan por defecto o se eliminan. Es una variante periódica del método de disco; el sistema histórico podía cambiar el disco en posiciones acordadas e indicarlo en el criptograma.
- **Rejilla giratoria de Fleissner:** transposición en rejillas cuadradas de 2×2 a 16×16, pares o impares. Elige una perforación por órbita de rotación, sentido horario o antihorario, y si se completan cuatro giros o se detiene al terminar las letras. El filtro puede conservar solo letras/dígitos o todos los caracteres salvo espacios. La salida es la rejilla leída por filas; `X` rellena las celdas restantes y `·` marca posiciones no visitadas cuando se detiene antes de cuatro giros. La configuración guarda opciones y longitud para recuperar el texto filtrado.

## Compartir mensajes

El cifrado produce dos piezas separadas: el **mensaje cifrado** y la **configuración JSON**. Comparte ambas por separado con quien vaya a descifrar. En el otro equipo, selecciona el método, pega cada pieza en su campo y pulsa **Descifrar**. La configuración incluye los parámetros necesarios (y la longitud original para la rejilla), así que estos cifrados son útiles para aprendizaje y demostración, no para mantener mensajes secretos.

Estos métodos son históricos y sirven para enseñanza y demostraciones; no protegen información sensible.

## Desarrollo local

Requiere Node.js 22 o posterior.

```sh
npm install
npm run dev
```

Para generar la carpeta de publicación:

```sh
npm run build
```

## GitHub Pages

El workflow `.github/workflows/deploy.yml` construye y publica el sitio en cada push a `main`. En GitHub, configura **Settings → Pages → Build and deployment → Source: GitHub Actions**. Vite configura automáticamente la ruta base con el nombre del repositorio.
