import { playMusic, playLaserSound, playExplosionSound } from './sounds.js';
import { moveObjRandomly, checkParticleCollision, checkCollision, createParticle } from './effects.js';
import { createCubeTarget, createPersonTarget, createSphereTarget } from './targets.js';
import { onKeyUp, onKeyDown, onMouseDown, onMouseMove } from './controls.js';
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

/* ------------------------------------------------------- */
/* --------------------- ADD TARGETS --------------------- */
/* ------------------------------------------------------- */
// Adicionar alvos complexo à cena
for (var i = 0; i < 5; i++) {
    var target = createPersonTarget(camera);
    target.castShadow = true; 
    scene.add(target);
    targets.push(target); // Adicionar o alvo à matriz de alvos
}

// Criar cubos
for (var i = 0; i < 5; i++) {
    var cube = createCubeTarget();
    cube.position.set(0, 0.6, 0); // Definir posição 0.5 unidades acima do grid
    cube.castShadow = true; // Projetar sombra
    scene.add(cube);
    cubes.push(cube);
}

// Criar esfera
for (var i = 0; i < 5; i++) {
    var esfera = createSphereTarget();
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

document.addEventListener('keydown', (e) => onKeyDown(e, moveForward, moveBackward, moveLeft, moveRight));
document.addEventListener('keyup', (e) => onKeyUp(e, moveForward, moveBackward, moveLeft, moveRight));

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

    checkParticleCollision(
        cubes, 
        esferas, 
        targets, 
        particles, 
        collidedParticles, 
        hasCubeMoved, 
        hasEsferaMoved, 
        hasTargetMoved, 
        updatePlacar, 
        moveObjRandomly, 
        raycaster, 
        scene, 
        triangles, 
        camera
    );

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

// Adiciona eventos de clique e movimento do mouse
document.addEventListener('mousedown', e => onMouseDown(e, controls, scene, camera, particles)); // Detecta cliques do jogador
document.addEventListener('mousemove', e => onMouseMove(e, mouse, camera, raycaster), false); // Atualiza a posição do mouse

// Variável para contar quantas partículas colidiram com objetos
var collidedParticles = 0;

// Variável para verificar se um alvo já foi movido
var hasCubeMoved = false; 
var hasEsferaMoved = false;

// Função que remove uma partícula da cena
function removeParticle(particle) {
    scene.remove(particle);
    particles.splice(particles.indexOf(particle), 1);
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


// Eventos do teclado para interações no jogo
document.addEventListener('keydown', function (event) {
    if (event.key === 'm' || event.key === 'M') {
        playMusic(); // Ativa ou desativa a música
    } else if (event.key === ' ') {
        if (controls.isLocked) {
            event.preventDefault(); 
            createParticle(scene, camera, particles); // Cria efeito ao atirar
            playLaserSound(); // Toca som de laser
        }
    } else if (event.key === 'e' || event.key === 'E') {
        playExplosionSound(); // Toca som de explosão
    }
});