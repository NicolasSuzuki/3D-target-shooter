// Cria a cena e ajusta camera
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(9, 0.3, 3); 

// Cria o renderizador
var renderer = new THREE.WebGLRenderer({ alpha: true, depth: true });
// Configuracao do renderizador
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping; // Cor e brilho
renderer.setClearColor(0x000000, 1); //Cor do background
renderer.domElement.style.position = 'fixed';
renderer.domElement.id = 'renderer';
renderer.domElement.style.zIndex = '-1';
renderer.domElement.style.left = '0';
renderer.domElement.style.top = '0';
renderer.shadowMap.enabled = true; // Habilitar sombras no renderizador
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Criar luz hemisférica (luz suave global)
var hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.5); // Cor do céu, cor do chão , intensidade
scene.add(hemisphereLight);

// Criar luz direcional (como a luz do céu), possibilita sombra para as esferas
var directionalLight = new THREE.DirectionalLight(0xffffff, 1, 30); // Cor branca, intensidade baixa, alcance
directionalLight.position.set(0, 10, 0); // Posição da luz vindo do "céu" (acima)
directionalLight.target.position.set(0, 0, 0); // Direcionar para o centro (onde as esferas estão)
directionalLight.castShadow = true; // Habilitar sombras
scene.add(directionalLight);

// Criar luz pontual (simulando uma lâmpada), sombra para os cubos
var pointLight = new THREE.PointLight(0xFFFF00, 10, 60); // Cor, intensidade, alcance
pointLight.position.set(6, 2, 3); // Posição inicial
pointLight.castShadow = true; // Habilitar sombras
scene.add(pointLight);

// Criando um plano que recebe sombras
var planeGeometry = new THREE.PlaneGeometry(30, 30);
// O roughness controla a rugosidade enquanto o metalness dá uma sensação de superfície metálica
var planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, color: 0xffffff, roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide });
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
plane.receiveShadow = true;  // O plano recebe sombras
scene.add(plane);

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var particles = [];
var triangles = [];
let cubes = [];
let targets = [];
let esferas = [];

var hasCubeMoved = false; // rastrear se cubo moveu
var hasEsferaMoved = false; // rastrear se esfera moveu
var hasTargetMoved = false; // rastrear se esfera moveu

// Gravity effect variables
var gravity = new THREE.Vector3(0, -0.01, 0); // Adjust the gravity strength as needed
var maxGravityDistance = 2; // Adjust the maximum distance affected by gravity as needed

// Add PointerLockControls
var controls = new THREE.PointerLockControls(camera, document.body);

/*----- ACHO que essa parte pode ser removida ------
// Criar a grid do chao
var gridHelper = new THREE.GridHelper(20, 20);

// Cor da grid do chao
gridHelper.material.color.set(0xffffff);

scene.add(gridHelper);


/*Criacao do chão diferente da grid branca
// Create a plane geometry with the same size as the grid
var planeGeometry = new THREE.PlaneGeometry(20, 20);

// Create a blue material
var blueMaterial = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    side: THREE.DoubleSide
});

// Create a plane mesh with the geometry and material
var planeMesh = new THREE.Mesh(planeGeometry, blueMaterial);
// Rotate the grid by 90 degrees
planeMesh.rotation.x = Math.PI / 2;
// Set the position of the plane to align with the grid
planeMesh.position.copy(gridHelper.position);
//scene.add(planeMesh);*/

function createPersonTarget() {
    const personGroup = new THREE.Group();
  
    //------------------------------------------------
    // 1) TRONCO - usando varredura rotacional (Lathe)
    //------------------------------------------------
    // Desenhe um perfil 2D (Array de Vector2) para depois girar.
    // Imagine esse perfil visto de lado (altura no eixo Y).
    // Por ex., começa na cintura (y=0.0), vai até o pescoço (y=1.0).
    const torsoPoints = [];
    // da cintura (largura 0.3) até o ombro (largura 0.2) e subindo no eixo Y
    torsoPoints.push(new THREE.Vector2(0.3, 0.0));   // base do tronco
    torsoPoints.push(new THREE.Vector2(0.28, 0.3));
    torsoPoints.push(new THREE.Vector2(0.25, 0.6));
    torsoPoints.push(new THREE.Vector2(0.20, 1.0)); // topo do tronco, perto do pescoço
  
    // Cria LatheGeometry girando esses pontos em torno do eixo Y.
    const segments = 32; // quantos "passos" na rotação
    const torsoGeometry = new THREE.LatheGeometry(torsoPoints, segments);
    const torsoMaterial = new THREE.MeshStandardMaterial({ color: 0x5566ff });
    const torsoMesh = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torsoMesh.position.set(0, 0, 0); 
    personGroup.add(torsoMesh);
  
    //------------------------------------------------
    // 2) CABEÇA - usando SphereGeometry
    //------------------------------------------------
    const headRadius = 0.18;
    const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    // Posicionar a cabeça logo acima do topo do tronco (y ~ 1.0 + raio)
    headMesh.position.set(0, 1.0 + headRadius, 0);
    personGroup.add(headMesh);
  
    //------------------------------------------------
    // 3) BRAÇOS - usando CylinderGeometry
    //------------------------------------------------
    // Braço: um cilindro fino (raio sup ~ 0.07, raio inf ~ 0.06)
    // para simular ombro mais largo que o pulso
    const armRadiusTop = 0.07;
    const armRadiusBot = 0.06;
    const armHeight = 0.5;
    const armGeo = new THREE.CylinderGeometry(armRadiusTop, armRadiusBot, armHeight, 16);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    
    // Braço esquerdo
    const leftArmMesh = new THREE.Mesh(armGeo, armMat);
    // Rotaciona para ficar “pendurado” no eixo X e desloca para a esquerda
    leftArmMesh.rotation.z = Math.PI / 2;
    // Ajusta a posição em relação ao tronco: os ombros estão ~ y=0.7..1.0
    leftArmMesh.position.set(-0.35, 0.7, 0);
    personGroup.add(leftArmMesh);
  
    // Braço direito
    const rightArmMesh = leftArmMesh.clone();
    rightArmMesh.position.set(0.35, 0.7, 0);
    personGroup.add(rightArmMesh);
  
    //------------------------------------------------
    // 4) PERNAS - usando CylinderGeometry
    //------------------------------------------------
    // Pernas: outro cilindro, maior (~0.55 de altura),
    // raio maior que o braço.
    const legRadiusTop = 0.09;
    const legRadiusBot = 0.08;
    const legHeight = 0.6;
    const legGeo = new THREE.CylinderGeometry(legRadiusTop, legRadiusBot, legHeight, 16);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  
    // Perna esquerda
    const leftLegMesh = new THREE.Mesh(legGeo, legMat);
    // Rotação para deixá-la alinhada (cilindro fica de pé)
    leftLegMesh.position.set(-0.12, -legHeight / 2, 0); 
    personGroup.add(leftLegMesh);
  
    // Perna direita
    const rightLegMesh = leftLegMesh.clone();
    rightLegMesh.position.set(0.12, -legHeight / 2, 0);
    personGroup.add(rightLegMesh);
  
    //------------------------------------------------
    // Ajustes Finais
    //------------------------------------------------
    // Eleva o boneco um pouco acima
    personGroup.position.set(0, 4.5, 0);
  
    // Faz o grupo olhar para a câmera
    personGroup.lookAt(camera.position);
  
    // Define escala aleatória
    const scale = Math.random() * 0.4 + 0.8;
    personGroup.scale.set(scale, scale, scale);
  
    return personGroup;
}
  

// Adicionar alvos à cena
for (var i = 0; i < 5; i++) {
    var target = createPersonTarget();
    scene.add(target);
    targets.push(target); // Adicionar o alvo à matriz de alvos
}

// Criar um carregador de texturas
var textureLoader = new THREE.TextureLoader();

// Carregar textura de um link externo
var cubeTexture = textureLoader.load('https://threejs.org/manual/resources/images/compressed-but-large-wood-texture.jpg');
var sphereTexture = textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/flower-2.jpg');

// Criar cubo
var geometry = new THREE.BoxGeometry(1, 1, 1);
// Substituimos o MeshBasicMaterial pelo MashStandard por conta de realismo e sombras
var cubeMaterial = new THREE.MeshStandardMaterial({map: cubeTexture});

for (var i = 0; i < 5; i++) {
    var cube = new THREE.Mesh(geometry, cubeMaterial);
    cube.position.set(0, 0.6, 0); // Definir posição 0.5 unidades acima do grid
    cube.castShadow = true; // Projetar sombra
    scene.add(cube);
    cubes.push(cube);
}

// Criar esfera
var geometry = new THREE.SphereGeometry(0.5, 16, 16); // Raio 0.5, 16 segmentos horizontais e verticais
var sphereMaterial = new THREE.MeshStandardMaterial({ map: sphereTexture });

for (var i = 0; i < 5; i++) {
var esfera = new THREE.Mesh(geometry, sphereMaterial);
    esfera.position.set(0, 4.5, 0); // Definir posição 4.5 unidades acima do grid
    esfera.castShadow = true; // Projetar sombra
    scene.add(esfera);
    esferas.push(esfera);
    }

// Criar um array e laço para controlar a velocidades dos alvos
var velocidadesCubes = [];
    for (var i = 0; i < cubes.length; i++) {
        velocidadesCubes.push({
        vx: (Math.random() - 0.05) * 0.02, // Velocidade X aleatória
        vz: (Math.random() - 0.05) * 0.02  // Velocidade Z aleatória
    });
  }

var velocidadesEsferas = [];
    for (var i = 0; i < esferas.length; i++) {
        velocidadesEsferas.push({
        vx: (Math.random() - 0.5) * 0.05, // Velocidade X aleatória
        vz: (Math.random() - 0.5) * 0.05  // Velocidade Z aleatória
    });
  }

// Set camera to face cube position
camera.lookAt(cube.position)

// Set up pointer lock controls
var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
var playButton = document.getElementById('playButton');

playButton.addEventListener('click', function () {
    controls.lock();
    cronometroJogo();
});

controls.addEventListener('lock', function () {
    instructions.style.display = 'none';
    blocker.style.display = 'none';
    document.getElementById('crosshair').style.display = 'block'; // Show the crosshair when screen is locked
});

controls.addEventListener('unlock', function () {
    blocker.style.display = 'block';
    instructions.style.display = '';
    document.getElementById('crosshair').style.display = 'none'; // Hide the crosshair when screen is unlocked
});

scene.add(controls.getObject());

// controles de movimento
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;

var onKeyDown = function (event) {
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

var onKeyUp = function (event) {
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

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Check colisao com o grid
function checkCollision(position) {
    var gridSize = 20;
    var halfGridSize = gridSize / 2;
    var margin = 0.1;

    if (
        position.x < -halfGridSize + margin ||
        position.x > halfGridSize - margin ||
        position.z < -halfGridSize + margin ||
        position.z > halfGridSize - margin
    ) {
        return true; // colidiu
    }

    return false; // n colidiu
}

// render loop
function animate() {
    if(!jogoAtivo) return;
    requestAnimationFrame(animate);

    // Atualizar a posição dos cubos
    for (var i = 0; i < cubes.length; i++) {
        cubes[i].position.x += velocidadesCubes[i].vx;
        cubes[i].position.z += velocidadesCubes[i].vz;
    }

    // Atualizar a posição das esferas
    for (var i = 0; i < esferas.length; i++) {
        esferas[i].position.x += velocidadesEsferas[i].vx;
        esferas[i].position.z += velocidadesEsferas[i].vz;
        esferas[i].position.y = 1.5 + Math.sin(Date.now() * 0.002 + i) * 0.2; 
    }

    updateParticles();

    checkParticleCollision();

    if (controls.isLocked) {
        var delta = 0.03;

        if (moveForward) {
            controls.moveForward(delta);
            if (checkCollision(controls.getObject().position)) {
                controls.moveForward(-delta); // Move back to the previous position
            }
        }

        if (moveBackward) {
            controls.moveForward(-delta);
            if (checkCollision(controls.getObject().position)) {
                controls.moveForward(delta); // Move back to the previous position
            }
        }

        if (moveLeft) {
            controls.moveRight(-delta);
            if (checkCollision(controls.getObject().position)) {
                controls.moveRight(delta); // Move back to the previous position
            }
        }

        if (moveRight) {
            controls.moveRight(delta);
            if (checkCollision(controls.getObject().position)) {
                controls.moveRight(-delta); // Move back to the previous position
            }
        }
    }

    updateTriangles()

    renderer.render(scene, camera);
}

let tempoRestante = 0;
let jogoAtivo = false;
let totalPlacar = 0;

function cronometroJogo(){
    if(!jogoAtivo){
        jogoAtivo = true;
        tempoRestante = 30;
        console.log("Jogo iniciado!");

        let contador = setInterval(() => {
            tempoRestante--;
            console.log(`Tempo restante: ${tempoRestante} segundos`);
            const tempoDisplay = document.getElementById('tempo');
            tempoDisplay.textContent = `${tempoRestante}s`;

            if (tempoRestante <= 0){
                clearInterval(contador);
                encerrarJogo();
            }
        }, 1000);
    }
    animate();
}

function encerrarJogo(){
    jogoAtivo = false;
    alert(`Tempo esgotado! Jogo encerrado. Você conseguiu ${totalPlacar} pontos`);
    controls.unlock();
}

function removeParticle(particle) {
    scene.remove(particle);
    particles.splice(particles.indexOf(particle), 1);
}

function updatePlacar() {
    console.log(`Atingiu um objeto: ${totalPlacar} + 30`);
    totalPlacar = totalPlacar + 30;
    const placarDisplay = document.getElementById('placar');
    placarDisplay.textContent = `${totalPlacar}`;
}

function createParticle() {
    playLaserSound();
    var geometry = new THREE.SphereGeometry(0.05, 16, 16);
    var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var particle = new THREE.Mesh(geometry, material);
    particle.position.copy(camera.position);
    particle.initialDirection = camera.getWorldDirection(new THREE.Vector3());
    particle.velocity = particle.initialDirection.clone().multiplyScalar(0.25);
    scene.add(particle);
    particles.push(particle);
}

function updateParticles() {
    var distanceThreshold = 20;

    for (var i = particles.length - 1; i >= 0; i--) {
        var particle = particles[i];
        particle.position.add(particle.velocity);

        var distance = particle.position.distanceTo(camera.position);
        if (distance > distanceThreshold) {
            removeParticle(particle);
        }
    }
}

function onMouseDown(event) {
    event.preventDefault();

    if (controls.isLocked) {
        // Particle creation is allowed only when controls are locked
        if (event.button === 0) {
            createParticle();
        }
    }
}

function onMouseMove(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
}

// Mouse click event listener
document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove, false);

// Declare a variable to count collided particles
var collidedParticles = 0;

var hasCubeMoved = false; // Flag to track if the cube has already been moved
var hasEsferaMoved = false;

// Check collision between particles and cubes
function checkParticleCollision() {
    function verifyCollision(objs, objsOnCollision, hasMoved, color) {
        for (var j = 0; j < objs.length; j++) {
            var obj = objs[j];
            var isColliding = false;

            if (obj.visible) {
                for (var i = 0; i < objsOnCollision.length; i++) {
                    var objOnCollision = objsOnCollision[i];
                    var objOnCollisionPosition = objOnCollision.position;
                    var objOnCollisionPositionEdge = objOnCollisionPosition
                        .clone()
                        .add(objOnCollision.velocity.clone().normalize().multiplyScalar(0.1));

                    raycaster.set(objOnCollisionPosition, objOnCollisionPositionEdge.sub(objOnCollisionPosition).normalize());
                    var intersects = raycaster.intersectObject(obj);

                    if (intersects.length === 1) {
                        // Particle collided with the obj
                        updatePlacar();
                        isColliding = true;
                        break;
                    }
                }
            }

            // Set cube color and visibility based on collision status
            if (isColliding) {
                // Cube is red during collision
                
                if (obj && obj.material) obj.material.color.set(0xff0000);
                else {
                    obj.traverse(function(child) {
                        if (child instanceof THREE.Mesh) {
                            child.material.color.set(0xff0000);
                        }
                    });
                }
                explosion(obj);
                moveObjRandomly(obj);
                hasMoved = false; // Reset the flag when the cube is hidden
            } else {
                // Cube is green when there is no collision
                if (obj && obj.material) obj.material.color.set(color);
                else {
                    obj.traverse(function(child) {
                        if (child instanceof THREE.Mesh) {
                            child.material.color.set(color);
                        }
                    });
                }

                // Check if all particles have been removed and the cube has not moved
                if (collidedParticles === objsOnCollision.length && !hasMoved) {
                    collidedParticles = 0; // Reset the collided particles counter
                    hasMoved = true; // Set the flag to indicate that the cube has been moved
                }
            }
        }
    }

    verifyCollision(cubes, particles, hasCubeMoved, 0x00ff00);
    verifyCollision(esferas, particles, hasEsferaMoved, 0xff0000);
    verifyCollision(targets, particles, hasTargetMoved, 0xf00f00);

}

// Move the cube to a random location on the grid
function moveObjRandomly(obj) {
    var gridSize = Math.random() * 20; // Adjust the grid size as desired
    var randomX = Math.floor(Math.random() * gridSize) - gridSize / 2;
    var randomZ = Math.floor(Math.random() * gridSize) - gridSize / 2;

    obj.position.x = randomX;
    obj.position.z = randomZ;
}

// Create an explosion of small triangles
function explosion(cube) {

    playExplosionSound();

    var explosionCount = 50;

    for (var i = 0; i < explosionCount; i++) {
        var triangle = createTriangle(cube);
        scene.add(triangle);
        triangles.push(triangle); // Add the triangle to the triangles array

        triangle.userData = {
            direction: new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize(),
            speed: Math.random() * 0.05 + 0.01, // Random speed
            rotationAxis: new THREE.Vector3(
                Math.random(),
                Math.random(),
                Math.random()
            ).normalize(),
            rotationSpeed: Math.random() * 0.1 + 0.005, // Random rotation speed
            distance: 0, // Distance traveled by the triangle
            remove: false, // Flag to mark if the triangle should be removed
            parentCube: cube, // Reference to the collided cube
        };
    }
}

function explosionEsfera(esfera) {

    playExplosionSound();

    var explosionCount = 50;

    for (var i = 0; i < explosionCount; i++) {
        var triangle = createTriangleE(esfera);
        scene.add(triangle);
        triangles.push(triangle); // Add the triangle to the triangles array

        triangle.userData = {
            direction: new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize(),
            speed: Math.random() * 0.05 + 0.01, // Random speed
            rotationAxis: new THREE.Vector3(
                Math.random(),
                Math.random(),
                Math.random()
            ).normalize(),
            rotationSpeed: Math.random() * 0.1 + 0.005, // Random rotation speed
            distance: 0, // Distance traveled by the triangle
            remove: false, // Flag to mark if the triangle should be removed
            parentEsfera: esfera, // Reference to the collided esfera
        };
    }
}

function createTarget(cube) {
    var targetGroup = new THREE.Group();

    var materialRed = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    var materialWhite = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    
    var outerRadius = 0.15;
    var numberOfRings = 5;

    for (var i = 0; i < numberOfRings; i++) {
        var radius = outerRadius - (i * outerRadius / numberOfRings);
        var geometry = new THREE.CircleGeometry(radius, 32);
        var material = (i % 2 === 0) ? materialRed : materialWhite;
        var ring = new THREE.Mesh(geometry, material);
        ring.position.z = 0.01 * i; // Slightly offset each ring to avoid z-fighting
        targetGroup.add(ring);
    }

    // Set initial position at the center of the collided cube
    targetGroup.position.copy(cube.position);

    // Set the rotation to face the camera
    targetGroup.lookAt(camera.position);

    // Set random scale
    var scale = Math.random() * 1 + 0.5; // Adjust the scale range as desired
    targetGroup.scale.set(scale, scale, scale);

    return targetGroup;
}

// Create a small triangle
function createTriangle(cube) {
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

    // Set initial position at the center of the collided cube
    triangle.position.copy(cube.position);

    // Set the rotation to face the camera
    triangle.lookAt(camera.position);

    // Set random scale
    var scale = Math.random() * 1 + 0.5; // Adjust the scale range as desired
    triangle.scale.set(scale, scale, scale);

    return triangle;
}

function createTriangleE(esfera) {
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

    // Set initial position at the center of the collided esfera
    triangle.position.copy(esfera.position);

    // Set the rotation to face the camera
    triangle.lookAt(camera.position);

    // Set random scale
    var scale = Math.random() * 1 + 0.5; // Adjust the scale range as desired
    triangle.scale.set(scale, scale, scale);

    return triangle;
}


// Update the triangles' positions, rotations, and remove them if necessary
function updateTriangles() {
    for (var i = 0; i < triangles.length; i++) {
        var triangle = triangles[i];
        var userData = triangle.userData;

        // Move the triangle in its direction at a random speed
        var speed = userData.speed;
        triangle.position.add(userData.direction.clone().multiplyScalar(speed));

        // Rotate the triangle around its rotation axis at a random speed
        var rotationSpeed = userData.rotationSpeed;
        triangle.rotateOnWorldAxis(userData.rotationAxis, rotationSpeed);

        // Update the distance traveled by the triangle
        userData.distance += speed;

        // If the triangle has traveled a certain distance, mark it for removal
        if (userData.distance >= 2) {
            userData.remove = true;
        }
    }

    // Remove triangles that are marked for removal
    for (var i = triangles.length - 1; i >= 0; i--) {
        if (triangles[i].userData.remove) {
            scene.remove(triangles[i]);
            triangles.splice(i, 1);
        }
    }


    // Resize renderer when window size changes
    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });


}


// Create an AudioContext
var audioContext = null;
var musicBuffer = null;
var laserSoundBuffer = null;
var explosionSoundBuffer = null;
var isMusicPlaying = false;
var musicSource = null;

// Function to load audio files
function loadAudioFile(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = function () {
        audioContext.decodeAudioData(request.response, function (buffer) {
            callback(buffer);
        });
    };

    request.send();
}

// Function to play the music
function playMusic() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (!musicBuffer) {
        loadAudioFile('https://www.shanebrumback.com/sounds/first-person-shooter-music.wav', function (buffer) {
            musicBuffer = buffer;
            playLoopedSound(buffer, .35);
            isMusicPlaying = true;
        });
    } else {
        if (isMusicPlaying) {
            pauseSound();
            isMusicPlaying = false;
        } else {
            resumeSound();
            isMusicPlaying = true;
        }
    }
}

// Function to play a sound in a loop with a specific volume
function playLoopedSound(buffer, volume) {
    musicSource = audioContext.createBufferSource();
    musicSource.buffer = buffer;
    musicSource.loop = true; // Enable looping
    var gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Set initial volume to 0
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 2); // Gradually increase volume to desired level (adjust time as needed)
    musicSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Delay the start of the audio source
    musicSource.start(audioContext.currentTime + 0.1); // Adjust the delay as needed

    // Note: You can adjust the delay time and volume ramping to find the appropriate values that work best for your audio files.
}

// Function to pause the music
function pauseSound() {
    if (musicSource) {
        musicSource.stop();
        musicSource.disconnect();
        musicSource = null;
    }
}

// Function to resume the music
function resumeSound() {
    if (musicBuffer) {
        playLoopedSound(musicBuffer, .35);
    }
}

// Function to play the laser sound
function playLaserSound() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (!laserSoundBuffer) {
        loadAudioFile('https://www.shanebrumback.com/sounds/laser.wav', function (buffer) {
            laserSoundBuffer = buffer;
            playSound(buffer, 1);
        });
    } else {
        playSound(laserSoundBuffer, 1);
    }  
}

// Function to play the explosion sound
function playExplosionSound() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (!explosionSoundBuffer) {
        loadAudioFile('https://www.shanebrumback.com/sounds/explosion.wav', function (buffer) {
            explosionSoundBuffer = buffer;
            playSound(buffer, 0.25); // Adjust the volume here (0.5 = 50% volume)
        });
    } else {
        playSound(explosionSoundBuffer, 0.25); // Adjust the volume here (0.5 = 50% volume)
    }
}

// Function to play a sound with a specific volume
function playSound(buffer, volume) {
    var source = audioContext.createBufferSource();
    var gainNode = audioContext.createGain();
    gainNode.gain.value = volume;

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
}


// Event listener for key press
document.addEventListener('keydown', function (event) {

    if (event.key === 'm' || event.key === 'M') {
        playMusic();
    } else if (event.key === ' ') {
        if (controls.isLocked) {
            event.preventDefault(); // Prevent default action of spacebar
            createParticle();
            playLaserSound();
        }
    } else if (event.key === 'e' || event.key === 'E') {
        playExplosionSound();
    }

});