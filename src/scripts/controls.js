import { createParticle } from "./effects.js";

export var onKeyDown = function (event, moveForward, moveLeft, moveBackward, moveRight) {
    switch (event.keyCode) {
        case 38: // cima - seta
        case 87: // W - tecla
            moveForward = true;
            break;
        case 37: // esquerda - seta 
        case 65: // A - tecla
            moveLeft = true;
            break;
        case 40: // baixo - seta
        case 83: // S - tecla
            moveBackward = true;
            break;
        case 39: // direita - seta
        case 68: // D - tecla
            moveRight = true;
            break;
    }
};

export var onKeyUp = function (event, moveForward, moveLeft, moveBackward, moveRight) {
    switch (event.keyCode) {
        case 38: // cima - seta
        case 87: // W - tecla
            moveForward = false;
            break;
        case 37: // esquerda - seta 
        case 65: // A - tecla
            moveLeft = false;
            break;
        case 40: // baixo - seta
        case 83: // S - tecla
            moveBackward = false;
            break;
        case 39: // direita - seta
        case 68: // D - tecla
            moveRight = false;
            break;
    }
};

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