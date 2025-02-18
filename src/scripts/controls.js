import { createParticle } from "./effects.js";


// Função que é chamada ao pressionar um botão do mouse
export function onMouseDown(event, controls, scene, camera, particles) {
    event.preventDefault();

    if (controls.isLocked) { // Verifica se os controles estão travados (modo de jogo ativo)
        if (event.button === 0) { // Se o botão esquerdo do mouse for pressionado
            createParticle(scene, camera, particles); // Cria e dispara uma partícula
        }
    }
}

// Função que detecta o movimento do mouse
export function onMouseMove(event, mouse, camera, raycaster) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera); // Atualiza o raycaster para detectar interações com objetos
}