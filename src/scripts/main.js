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

/*----------------------------------------------------
Fontes de luz e sombras
------------------------------------------------------*/
// Criar luz hemisférica (luz suave global)
var hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.5); // Cor do céu, cor do chão , intensidade
scene.add(hemisphereLight);

// Criar luz direcional (como a luz do céu), possibilita sombra para as esferas
var directionalLight = new THREE.DirectionalLight(0xffffff, 1, 30); // Cor branca, intensidade baixa, alcance
directionalLight.position.set(0, 10, 0); // Posição da luz vindo do "céu" (acima)
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

// Variáveis do efeito da gravidade
var gravity = new THREE.Vector3(0, -0.01, 0); // Ajuste a intensidade da gravidade conforme necessário
var maxGravityDistance = 2; // Ajuste a distância máxima afetada pela gravidade conforme necessário

// Adicionar PointerLockControls permitindo o controle da câmera através do movimento do mouse
var controls = new THREE.PointerLockControls(camera, document.body);

/*----------------------------------------------------
Alvo/Personagem complexo
------------------------------------------------------*/
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
    target.castShadow = true; 
    scene.add(target);
    targets.push(target); // Adicionar o alvo à matriz de alvos
}


/*----------------------------------------------------
Cubos e esferas: alvos simples com movimento e textura
------------------------------------------------------*/
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
var velocidadesTarget = [];
    for (var i = 0; i < targets.length; i++) {
        velocidadesTarget.push({
        vx: (Math.random() - 0.5) * 0.05, // Velocidade X aleatória
        vz: (Math.random() - 0.5) * 0.05  // Velocidade Z aleatória
    });
  }

var velocidadesEsferas = [];
    for (var i = 0; i < esferas.length; i++) {
        velocidadesEsferas.push({
        vx: (Math.random() - 0.5) * 0.05, // Velocidade X aleatória
        vz: (Math.random() - 0.5) * 0.05  // Velocidade Z aleatória
    });
  }

var velocidadesCubes = [];
    for (var i = 0; i < cubes.length; i++) {
        velocidadesCubes.push({
        vx: (Math.random() - 0.05) * 0.08, // Velocidade X aleatória
        vz: (Math.random() - 0.05) * 0.08  // Velocidade Z aleatória
    });
  }

// Configura a câmera para olhar na direção da posição do cubo
camera.lookAt(cube.position)

/*----------------------------------------------------
Controle de jogabilidade
------------------------------------------------------*/
// Configuração dos controles para bloqueio de tela, instruções e play
var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
var playButton = document.getElementById('playButton');

// Evento para iniciar os controles quando o botão for clicado
playButton.addEventListener('click', function () {
    controls.lock();
    cronometroJogo();
});

// Evento acionado quando o controle do mouse é ativado (cursor bloqueado)
controls.addEventListener('lock', function () {
    instructions.style.display = 'none';
    blocker.style.display = 'none';
    document.getElementById('crosshair').style.display = 'block'; // Exibe a mira quando o cursor está bloqueado
});

// Evento acionado quando o controle do mouse é desativado (cursor liberado)
controls.addEventListener('unlock', function () {
    blocker.style.display = 'block'; // Mostra novamente a tela de bloqueio
    instructions.style.display = ''; // Mostra as instruções
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

// Sistema de detecção de colisão com os limites do cenário
function checkCollision(position) {
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

// Definir um limite máximo para os objetos
const LIMITE_X = 30; // Limite de movimentação no eixo X
const LIMITE_Z = 30; // Limite de movimentação no eixo Z

// Render loop: atualiza o jogo continuamente
function animate() {
    if(!jogoAtivo) return;

    requestAnimationFrame(animate);

    // Atualizar a posição dos cubos
    for (var i = 0; i < cubes.length; i++) {
        // Atualiza a posição do cubo
        cubes[i].position.x += velocidadesCubes[i].vx;
        cubes[i].position.z += velocidadesCubes[i].vz;

        // Inverter direção quando o cubo ultrapassar o limite
        if (Math.abs(cubes[i].position.x) > LIMITE_X) {
            velocidadesCubes[i].vx = -velocidadesCubes[i].vx; // Inverte a direção no eixo X
        }
        if (Math.abs(cubes[i].position.z) > LIMITE_Z) {
            velocidadesCubes[i].vz = -velocidadesCubes[i].vz; // Inverte a direção no eixo Z
        }
    }

    // Atualizar a posição das esferas
    for (var i = 0; i < esferas.length; i++) {
        esferas[i].position.x += velocidadesEsferas[i].vx;
        esferas[i].position.z += velocidadesEsferas[i].vz;
        esferas[i].position.y = 1.5 + Math.sin(Date.now() * 0.002 + i) * 0.2; // Faz a esfera "flutuar" verticalmente usando uma função senoidal

        // Inverter direção quando a esfera ultrapassar o limite
        if (Math.abs(esferas[i].position.x) > LIMITE_X) {
            velocidadesEsferas[i].vx = -velocidadesEsferas[i].vx; // Inverte a direção no eixo X
        }
        if (Math.abs(esferas[i].position.z) > LIMITE_Z) {
            velocidadesEsferas[i].vz = -velocidadesEsferas[i].vz; // Inverte a direção no eixo Z
        }
    }

    // Atualizar a posição dos alvos
    for (var i = 0; i < targets.length; i++) {
        targets[i].position.x += velocidadesTarget[i].vx;
        targets[i].position.z += velocidadesTarget[i].vz;
        targets[i].position.y = 4.5 + Math.sin(Date.now() * 0.002 + i) * 0.2; // Ajusta a altura do alvo

        // Inverter direção quando o alvo ultrapassar o limite
        if (Math.abs(targets[i].position.x) > LIMITE_X) {
            velocidadesTarget[i].vx = -velocidadesTarget[i].vx; // Inverte a direção no eixo X
        }
        if (Math.abs(targets[i].position.z) > LIMITE_Z) {
            velocidadesTarget[i].vz = -velocidadesTarget[i].vz; // Inverte a direção no eixo Z
        }
    }

    updateParticles();

    checkParticleCollision();

    // Se o controle do jogador estiver ativo (cursor travado na tela)
    if (controls.isLocked) {
        var delta = 0.03;

        // Movimentação para frente
        if (moveForward) {
            controls.moveForward(delta);
            if (checkCollision(controls.getObject().position)) {
                controls.moveForward(-delta); // Reverte o movimento se houver colisão
            }
        }

        // Movimentação para trás
        if (moveBackward) {
            controls.moveForward(-delta);
            if (checkCollision(controls.getObject().position)) {
                controls.moveForward(delta); 
            }
        }

        if (moveLeft) {
            controls.moveRight(-delta);
            if (checkCollision(controls.getObject().position)) {
                controls.moveRight(delta); 
            }
        }

        if (moveRight) {
            controls.moveRight(delta);
            if (checkCollision(controls.getObject().position)) {
                controls.moveRight(-delta); 
            }
        }
    }

    updateTriangles()

    // Renderiza a cena do jogo com a câmera atual
    renderer.render(scene, camera);
}

let tempoRestante = 0;
let jogoAtivo = false;
let totalPlacar = 0;

// Função que inicia o cronômetro e a lógica do jogo
function cronometroJogo(){
    if(!jogoAtivo){
        jogoAtivo = true;
        tempoRestante = 30;
        console.log("Jogo iniciado!");

        // Cria um intervalo para diminuir o tempo a cada segundo
        let contador = setInterval(() => {
            tempoRestante--;
            console.log(`Tempo restante: ${tempoRestante} segundos`);
            const tempoDisplay = document.getElementById('tempo');
            tempoDisplay.textContent = `${tempoRestante}s`;

            if (tempoRestante <= 0){
                clearInterval(contador);
                encerrarJogo();
            }
        }, 1000); // Executa a cada 1 segundo
    }
    animate();
}

// Função que finaliza o jogo quando o tempo se esgota
function encerrarJogo(){
    jogoAtivo = false;
    alert(`Tempo esgotado! Jogo encerrado. Você conseguiu ${totalPlacar} pontos`);
    totalPlacar = 0; // Zera o placar sempre que o jogo acaba
    controls.unlock();
}

// Função que atualiza a pontuação do jogador ao atingir um objeto
function updatePlacar() {
    console.log(`Atingiu um objeto: ${totalPlacar} + 30`);
    totalPlacar = totalPlacar + 30;
    const placarDisplay = document.getElementById('placar');
    placarDisplay.textContent = `${totalPlacar}`;
}

/*----------------------------------------------------
Definição, movimento e disparo do projetil
------------------------------------------------------*/
// Função que remove uma partícula da cena
function removeParticle(particle) {
    scene.remove(particle);
    particles.splice(particles.indexOf(particle), 1);
}

// Função que cria uma partícula (projetil)
function createParticle() {
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

// Função que atualiza a posição das partículas e remove as que saírem do limite
function updateParticles() {
    var distanceThreshold = 20;

    for (var i = particles.length - 1; i >= 0; i--) {
        var particle = particles[i];
        particle.position.add(particle.velocity); // Move a partícula na direção definida

        var distance = particle.position.distanceTo(camera.position);
        if (distance > distanceThreshold) {
            removeParticle(particle);
        }
    }
}

// Função que é chamada ao pressionar um botão do mouse
function onMouseDown(event) {
    event.preventDefault();

    if (controls.isLocked) { // Verifica se os controles estão travados (modo de jogo ativo)
        if (event.button === 0) { // Se o botão esquerdo do mouse for pressionado
            createParticle(); // Cria e dispara uma partícula
        }
    }
}

// Função que detecta o movimento do mouse
function onMouseMove(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera); // Atualiza o raycaster para detectar interações com objetos
}

// Adiciona eventos de clique e movimento do mouse
document.addEventListener('mousedown', onMouseDown); // Detecta cliques do jogador
document.addEventListener('mousemove', onMouseMove, false); // Atualiza a posição do mouse

// Variável para contar quantas partículas colidiram com objetos
var collidedParticles = 0;

// Variável para verificar se um alvo já foi movido
var hasCubeMoved = false; 
var hasEsferaMoved = false;

// Função geral que verifica colisões entre partículas e cubos
function checkParticleCollision() {
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
                    obj.traverse(function(child) {
                        if (child instanceof THREE.Mesh) {
                            child.material.color.set(0xff0000);
                        }
                    });
                }
                explosion(obj); // Executa o efeito de explosão
                moveObjRandomly(obj); // Move o objeto para uma posição aleatória
                hasMoved = false; // Reseta a flag indicando que o objeto ainda não foi movido após a colisão
            } else {
                // Se não houver colisão, o objeto volta à sua cor original
                if (obj && obj.material) obj.material.color.set(color);
                else {
                    obj.traverse(function(child) {
                        if (child instanceof THREE.Mesh) {
                            child.material.color.set(color);
                        }
                    });
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
    verifyCollision(cubes, particles, hasCubeMoved, 0x00ff00);
    verifyCollision(esferas, particles, hasEsferaMoved, 0xff0000);
    verifyCollision(targets, particles, hasTargetMoved, 0xf00f00);

}

// Move o objeto para uma posição aleatória na grade
function moveObjRandomly(obj) {
    var gridSize = Math.random() * 20;  // Define um tamanho aleatório
    var randomX = Math.floor(Math.random() * gridSize) - gridSize / 2;
    var randomZ = Math.floor(Math.random() * gridSize) - gridSize / 2;

    obj.position.x = randomX;
    obj.position.z = randomZ;
}

/*----------------------------------------------------
Efeito especial de explosão
------------------------------------------------------*/
// Cria uma explosão de pequenos triângulos
function explosion(cube) {

    playExplosionSound(); // Som de explosão

    var explosionCount = 50; // Define o número de triângulos na explosão

    for (var i = 0; i < explosionCount; i++) {
        var triangle = createTriangle(cube); // Cria um triângulo
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
            parentCube: cube,  // Referência ao cubo colidido
        };
    }
}

// Processo para as esferas
function explosionEsfera(esfera) {

    playExplosionSound();

    var explosionCount = 50;

    for (var i = 0; i < explosionCount; i++) {
        var triangle = createTriangleE(esfera);
        scene.add(triangle);
        triangles.push(triangle); 

        triangle.userData = {
            direction: new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize(),
            speed: Math.random() * 0.05 + 0.01, 
            rotationAxis: new THREE.Vector3(
                Math.random(),
                Math.random(),
                Math.random()
            ).normalize(),
            rotationSpeed: Math.random() * 0.1 + 0.005, 
            distance: 0, 
            remove: false, 
            parentEsfera: esfera, 
        };
    }
}

function createTarget(cube) {
    var targetGroup = new THREE.Group();

    // Define os materiais vermelho e branco para os anéis do alvo
    var materialRed = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    var materialWhite = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    
    var outerRadius = 0.15; // Raio externo do alvo
    var numberOfRings = 5; // Número de anéis no alvo

    for (var i = 0; i < numberOfRings; i++) { // Cria os anéis do alvo alternando as cores vermelho e branco
        var radius = outerRadius - (i * outerRadius / numberOfRings); // Calcula o raio do anel atual
        var geometry = new THREE.CircleGeometry(radius, 32);
        var material = (i % 2 === 0) ? materialRed : materialWhite; // Alterna as cores
        var ring = new THREE.Mesh(geometry, material);
        ring.position.z = 0.01 * i; // Desloca levemente os anéis para evitar z-fighting (sobreposição gráfica)
        targetGroup.add(ring);
    }

    // Define a posição inicial do alvo no centro do cubo com o qual colidiu
    targetGroup.position.copy(cube.position);

    // Faz o alvo sempre olhar para a câmera
    targetGroup.lookAt(camera.position);

    // Define um tamanho aleatório para o alvo
    var scale = Math.random() * 1 + 0.5; // Ajusta o intervalo de escala conforme necessário
    targetGroup.scale.set(scale, scale, scale);

    return targetGroup;
}


// Cria um triângulo
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

    // Define a posição inicial no centro do cubo colidido
    triangle.position.copy(cube.position);

    // Define a rotação para que o triângulo fique voltado para a câmera
    triangle.lookAt(camera.position);

    // Define um tamanho aleatório
    var scale = Math.random() * 1 + 0.5; // Ajuste a faixa de escala conforme necessário
    triangle.scale.set(scale, scale, scale);

    return triangle;
}

// O mesmo processo para as esferas
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

    triangle.position.copy(esfera.position);

    triangle.lookAt(camera.position);

    var scale = Math.random() * 1 + 0.5;
    triangle.scale.set(scale, scale, scale);

    return triangle;
}

// Atualiza a posição, rotação e remove triângulos se necessário
function updateTriangles() {
    for (var i = 0; i < triangles.length; i++) {
        var triangle = triangles[i];
        var userData = triangle.userData;

        // Move o triângulo na direção definida com uma velocidade aleatória
        var speed = userData.speed;
        triangle.position.add(userData.direction.clone().multiplyScalar(speed));

        // Rotaciona o triângulo em torno de seu eixo de rotação com uma velocidade aleatória
        var rotationSpeed = userData.rotationSpeed;
        triangle.rotateOnWorldAxis(userData.rotationAxis, rotationSpeed);

        // Atualiza a distância percorrida pelo triângulo
        userData.distance += speed;

        // Se o triângulo percorreu uma certa distância, marca para remoção
        if (userData.distance >= 2) {
            userData.remove = true;
        }
    }

    // Remove os triângulos que foram marcados para remoção
    for (var i = triangles.length - 1; i >= 0; i--) {
        if (triangles[i].userData.remove) {
            scene.remove(triangles[i]);
            triangles.splice(i, 1);
        }
    }

    // Redimensiona o renderizador quando o tamanho da janela muda
    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

/*----------------------------------------------------
Efeitos sonoros e controle do som
------------------------------------------------------*/
var audioContext = null;
var musicBuffer = null; // Música
var laserSoundBuffer = null; // Laser
var explosionSoundBuffer = null; // Explosão
var isMusicPlaying = false;
var musicSource = null;

// Função para carregar arquivos de áudio a partir de uma URL
function loadAudioFile(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer'; // Define o tipo de resposta como um buffer de áudio

    request.onload = function () { // Decodifica o áudio recebido e chama o callback com o buffer processado
        audioContext.decodeAudioData(request.response, function (buffer) {
            callback(buffer);
        });
    };

    request.send();
}

// Função para iniciar ou pausar a música
function playMusic() {
    if (!audioContext) {  // Se o contexto de áudio ainda não foi criado, inicializa um novo
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (!musicBuffer) {  // Se a música ainda não foi carregada, faz o carregamento e a reprodução
        loadAudioFile('https://www.shanebrumback.com/sounds/first-person-shooter-music.wav', function (buffer) {
            musicBuffer = buffer;
            playLoopedSound(buffer, .35); // Toca a música com volume de 35%
            isMusicPlaying = true;
        });
    } else {  // Se a música já está carregada, alterna entre pausar e continuar a reprodução
        if (isMusicPlaying) {
            pauseSound();
            isMusicPlaying = false;
        } else {
            resumeSound();
            isMusicPlaying = true;
        }
    }
}

// Função para tocar um som em loop com um volume específico
function playLoopedSound(buffer, volume) {
    musicSource = audioContext.createBufferSource();
    musicSource.buffer = buffer;
    musicSource.loop = true; // Ativa a reprodução em loop
    var gainNode = audioContext.createGain(); // Cria um nó de controle de volume
    gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Define o volume inicial como 0
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 2); // Aumenta gradualmente o volume

    musicSource.connect(gainNode); // Conecta a fonte ao nó de volume
    gainNode.connect(audioContext.destination);

    // Inicia a reprodução com um pequeno atraso para evitar cortes abruptos
    musicSource.start(audioContext.currentTime + 0.1);
}

// Função para pausar a música
function pauseSound() {
    if (musicSource) {
        musicSource.stop(); // Para a reprodução da música
        musicSource.disconnect(); // // Desconecta a fonte de áudio
        musicSource = null;
    }
}

// Função para retomar a música pausada
function resumeSound() {
    if (musicBuffer) {
        playLoopedSound(musicBuffer, .35);
    }
}

// Função para tocar o som do laser
function playLaserSound() {
    if (!audioContext) { // Inicializa o contexto de áudio se ainda não estiver criado
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (!laserSoundBuffer) { // Se o som do laser ainda não foi carregado, carrega e toca
        loadAudioFile('https://www.shanebrumback.com/sounds/laser.wav', function (buffer) {
            laserSoundBuffer = buffer;
            playSound(buffer, 1); 
        });
    } else {
        playSound(laserSoundBuffer, 1);
    }  
}

// Função para reproduzir o som de explosão
function playExplosionSound() {
    if (!audioContext) {  // Verifica se o contexto de áudio já foi criado, se não, cria um novo
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Se o som da explosão ainda não foi carregado, faz o carregamento
    if (!explosionSoundBuffer) {
        loadAudioFile('https://www.shanebrumback.com/sounds/explosion.wav', function (buffer) {
            explosionSoundBuffer = buffer;
            playSound(buffer, 0.25); // Ajusta o volume do som para 25% (0.25)
        });
    } else {
        playSound(explosionSoundBuffer, 0.25); // Se o som já foi carregado anteriormente, apenas o reproduz
    }
}

// Função genérica para tocar um som com um volume específico
function playSound(buffer, volume) {
    var source = audioContext.createBufferSource();
    var gainNode = audioContext.createGain();
    gainNode.gain.value = volume; // Define o volume do som

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
}

// Eventos do teclado para interações no jogo
document.addEventListener('keydown', function (event) {
    if (event.key === 'm' || event.key === 'M') {
        playMusic(); // Ativa ou desativa a música
    } else if (event.key === ' ') {
        if (controls.isLocked) {
            event.preventDefault(); 
            createParticle(); // Cria efeito ao atirar
            playLaserSound(); // Toca som de laser
        }
    } else if (event.key === 'e' || event.key === 'E') {
        playExplosionSound(); // Toca som de explosão
    }
});