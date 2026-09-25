// Tema claro/oscuro. Sin elección guardada se sigue el del sistema.

export const THEME_STORAGE_KEY = "merlin-fm:theme";

/**
 * Se ejecuta en <head> antes de pintar (ver layout) para que no haya un
 * destello del tema claro al cargar en modo oscuro.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}`;
