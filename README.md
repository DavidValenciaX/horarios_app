# Horarios App

Esta es una aplicación web interactiva diseñada para ayudar a los usuarios a organizar sus horarios. Permite crear múltiples actividades, cada una con diferentes opciones de horario, y luego calcula y muestra todas las combinaciones de horarios posibles que no tienen conflictos entre sí.

**Puedes probar la aplicación aquí: [https://horarios-application.netlify.app/](https://horarios-application.netlify.app/)**

## ✨ Características Principales

- **Creación de Actividades Dinámicas**: Añade o elimina actividades fácilmente (por ejemplo, "Cálculo I", "Laboratorio de Física", "Entrenamiento de Fútbol").
- **Múltiples Opciones de Horario**: Para cada actividad, puedes definir uno o más horarios alternativos. Esto es ideal para asignaturas con diferentes grupos o secciones.
- **Interfaz Visual e Interactiva**: Un tablero de horarios semanal te permite hacer clic para agregar o quitar horas a cada opción de horario.
- **Generador de Combinaciones**: El núcleo de la aplicación. Calcula todas las posibles combinaciones de horarios válidas sin solapamientos entre las actividades seleccionadas.
- **Activación/Desactivación Selectiva**: Puedes excluir temporalmente actividades u opciones de horario específicas del proceso de combinación.
- **Guardar y Cargar Progreso**: Guarda tu configuración de actividades en un archivo JSON para cargarla más tarde y continuar donde la dejaste.
- **Exportar Horarios**: Exporta las combinaciones de horarios generadas como imágenes PNG.

## 🚀 Cómo Empezar

Sigue estos pasos para ejecutar el proyecto en tu máquina local.

### Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 16 o superior recomendada)
- [npm](https://www.npmjs.com/) (generalmente viene con Node.js)

### Instalación y Ejecución

1. **Clona el repositorio** (si aún no lo has hecho).

2. **Navega al directorio del frontend**

    ```bash
    cd ruta/a/tu/proyecto/frontend
    ```

3. **Instala las dependencias**

    ```bash
    npm install
    ```

4. **Inicia el servidor de desarrollo**

    ```bash
    npm run dev
    ```

5. Abre tu navegador y ve a la dirección que se muestra en la terminal (normalmente `http://localhost:5173`).

## 🛠️ Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo con Vite.
- `npm run build`: Compila la aplicación para producción en la carpeta `dist/`.
- `npm run preview`: Sirve localmente la compilación de producción para previsualizarla.

## 📁 Estructura del Proyecto

```bash
frontend/
├── dist/               # Archivos de producción (generados por `npm run build`)
├── node_modules/       # Dependencias del proyecto
├── classes.js          # Clases principales (ActivityManager, Activity, TimeTable)
├── colors.js           # Utilidades para la gestión de colores
├── combinations.js     # Lógica para calcular las combinaciones de horarios
├── createTables.js     # Funciones para renderizar las tablas de horarios en el DOM
├── files.js            # Lógica para guardar y cargar archivos JSON
├── index.html          # Punto de entrada de la aplicación
├── initScript.js       # Script de inicialización y orquestación principal
├── package.json        # Dependencias y scripts del proyecto
├── styles.css          # Estilos CSS
└── UI.js               # Lógica de la interfaz de usuario (event listeners, manipulación del DOM)
```

## 💻 Tecnologías Utilizadas

- **HTML, CSS, JavaScript (ESM)**: La base de la aplicación.
- **Vite**: Herramienta de frontend para el entorno de desarrollo y la compilación.
- **html-to-image**: Librería para convertir el HTML de los horarios en imágenes.
