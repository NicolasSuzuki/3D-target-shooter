import { playExplosionSound, playLaserSound } from "./sounds.js";

function explosion(obj, scene, triangles, camera) {

    playExplosionSound(); // Som de explosão

    var explosionCount = 50; // Define o número de triângulos na explosão

    for (var i = 0; i < explosionCount; i++) {
        var triangle = createTriangle(obj, camera); // Cria um triângulo
        scene.add(triangle); // Adiciona o triângulo à cena
        triangles.push(triangle); // Armazena o triângulo no array

        triangle.userData = {
            direction: new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize(), // Direção aleatória normalizada
            speed: Math.random() * 0.05 + 0.01,  // Velocidade aleatória
            rotationAxis: new THREE.Vector3(
                Math.random(),
                Math.random(),
                Math.random()
            ).normalize(), // Define um eixo de rotação aleatório
            rotationSpeed: Math.random() * 0.1 + 0.005, // Velocidade de rotação aleatória
            distance: 0, // Distância percorrida pelo triângulo
            remove: false, // Indica remoção do triângulo
            parentCube: obj,  // Referência ao cubo colidido
        };
    }
}
// Cria um triângulo
function createTriangle(cube, camera) {
    var geometry = new THREE.BufferGeometry();
    var vertices = new Float32Array([
        -0.1, 0, 0,
        0.1, 0, 0,
        0, 0.1, 0
    ]);
    var indices = new Uint16Array([0, 1, 2]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    var material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });

    var triangle = new THREE.Mesh(geometry, material);

    // Define a posição inicial no centro do cubo colidido
    triangle.position.copy(cube.position);

    // Define a rotação para que o triângulo fique voltado para a câmera
    triangle.lookAt(camera.position);

    // Define um tamanho aleatório
    var scale = Math.random() * 1 + 0.5; // Ajuste a faixa de escala conforme necessário
    triangle.scale.set(scale, scale, scale);

    return triangle;
}

// Função geral que verifica colisões entre partículas e cubos
export function checkParticleCollision(cubes, esferas, targets, particles, collidedParticles, hasCubeMoved, hasEsferaMoved, hasTargetMoved, updatePlacar, moveObjRandomly, raycaster, scene, triangles, camera) {
    // Função que verifica a colisão entre objetos e atualiza suas propriedades
    function verifyCollision(objs, objsOnCollision, hasMoved, color) {
        for (var j = 0; j < objs.length; j++) {
            var obj = objs[j];
            var isColliding = false;

            if (obj.visible) { // Verifica se o objeto está visível na cena
                for (var i = 0; i < objsOnCollision.length; i++) {
                    var objOnCollision = objsOnCollision[i];
                    var objOnCollisionPosition = objOnCollision.position;
                    var objOnCollisionPositionEdge = objOnCollisionPosition // Calcula a posição da borda da partícula para a detecção de colisão
                        .clone()
                        .add(objOnCollision.velocity.clone().normalize().multiplyScalar(0.1));
                    
                    // Define o raycaster para detectar colisões
                    raycaster.set(objOnCollisionPosition, objOnCollisionPositionEdge.sub(objOnCollisionPosition).normalize());
                    var intersects = raycaster.intersectObject(obj); // Verifica interseções com o objeto

                    if (intersects.length === 1) {
                        // Se houver uma interseção, houve colisão
                        updatePlacar();
                        isColliding = true; // Atualiza a pontuação
                        break; // Fim do loop pois já ocorreu a colisão
                    }
                }
            }

            // Define a cor do cubo e sua visibilidade com base no status da colisão
            if (isColliding) {
                // Se houver colisão, o cubo fica vermelho
                if (obj && obj.material) obj.material.color.set(0xff0000);
                else {
                    // obj.traverse(function(child) {
                    //     if (child instanceof THREE.Mesh) {
                    //         child.material.color.set(0xff0000);
                    //     }
                    // });
                }
                explosion(obj, scene, triangles, camera); // Executa o efeito de explosão
                moveObjRandomly(obj); // Move o objeto para uma posição aleatória
                hasMoved = false; // Reseta a flag indicando que o objeto ainda não foi movido após a colisão
            } else {
                // Se não houver colisão, o objeto volta à sua cor original
                if (obj && obj.material) obj.material.color.set(color);
                else {
                    // obj.traverse(function(child) {
                    //     if (child instanceof THREE.Mesh) {
                    //         child.material.color.set(color);
                    //     }
                    // });
                }

                  // Verifica se todas as partículas foram removidas e o objeto ainda não foi movido
                if (collidedParticles === objsOnCollision.length && !hasMoved) {
                    collidedParticles = 0; // Reseta o contador de partículas que colidiram
                    hasMoved = true; // Objeto movido
                }
            }
        }
    }

    // Verifica colisões entre partículas e diferentes tipos de objetos
    verifyCollision(cubes, particles, hasCubeMoved, 0xEDD5B3);
    verifyCollision(esferas, particles, hasEsferaMoved, 0xff0000);
    verifyCollision(targets, particles, hasTargetMoved, 0xf00f00);

}

// Move o objeto para uma posição aleatória na grade
export function moveObjRandomly(obj) {
    var gridSize = Math.random() * 20;  // Define um tamanho aleatório
    var randomX = Math.floor(Math.random() * gridSize) - gridSize / 2;
    var randomZ = Math.floor(Math.random() * gridSize) - gridSize / 2;

    obj.position.x = randomX;
    obj.position.z = randomZ;
}

// Sistema de detecção de colisão com os limites do cenário
export function checkCollision(position) {
    var gridSize = 20;
    var halfGridSize = gridSize / 2;
    var margin = 0.1;

    // Se a posição estiver fora dos limites do grid, retorna verdadeiro (colisão)
    if (
        position.x < -halfGridSize + margin ||
        position.x > halfGridSize - margin ||
        position.z < -halfGridSize + margin ||
        position.z > halfGridSize - margin
    ) {
        return true; // Colidiu
    }

    return false; // Não colidiu
}

// Função que cria uma partícula (projetil)
export function createParticle(scene, camera, particles) {
    playLaserSound();
    var geometry = new THREE.SphereGeometry(0.05, 16, 16);
    var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var particle = new THREE.Mesh(geometry, material);
    particle.position.copy(camera.position); // Define a posição inicial como a posição da câmera
    particle.initialDirection = camera.getWorldDirection(new THREE.Vector3()); // Obtém a direção da câmera
    particle.velocity = particle.initialDirection.clone().multiplyScalar(0.25); // Define a velocidade da partícula
    scene.add(particle);
    particles.push(particle); // Armazena a partícula na lista de partículas
}