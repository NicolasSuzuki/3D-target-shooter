        // Cria a cena e ajusta camera
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(9, 0.3, 3); 

        // Cria o renderizador
        var renderer = new THREE.WebGLRenderer({ alpha: true, depth: true });
        // Configuracao do renderizador
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ReinhardToneMapping; //iluminacao??
        renderer.setClearColor(0x000000, 1); //Cor do background
        renderer.domElement.style.position = 'fixed';
        renderer.domElement.id = 'renderer';
        renderer.domElement.style.zIndex = '-1';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.top = '0';
        document.body.appendChild(renderer.domElement);

        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        var particles = [];
        var triangles = [];
        let cubes = [];
        let esferas = [];

        var hasCubeMoved = false; // rastrear se cubo moveu
        var hasEsferaMoved = false; // rastrear se esfera moveu

        // Gravity effect variables
        var gravity = new THREE.Vector3(0, -0.01, 0); // Adjust the gravity strength as needed
        var maxGravityDistance = 2; // Adjust the maximum distance affected by gravity as needed

        // Add PointerLockControls
        var controls = new THREE.PointerLockControls(camera, document.body);

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


        // Criar o cubo
        var geometry = new THREE.BoxGeometry(1, 1, 1);
        var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Cor cubo verde

        for (var i = 0; i < 5; i++) {
            var cube = new THREE.Mesh(geometry, material);
            cube.position.set(0, 0.5, 0); // Definir posição 0.5 unidades acima do grid
            scene.add(cube);
            cubes.push(cube);
        }

        // Criar uma esfera
        var geometry = new THREE.SphereGeometry(0.5, 16, 16); // Raio 0.5, 16 segmentos horizontais e verticais
        var material = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Cor esfera azul

        for (var i = 0; i < 5; i++) {
            var esfera = new THREE.Mesh(geometry, material);
            esfera.position.set(0, 4.5, 0); // Definir posição 4.5 unidades acima do grid
            scene.add(esfera);
            esferas.push(esfera); 
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

        let tempoRestante = 10;
        let jogoAtivo = false;
        let totalPlacar = 0;

        function cronometroJogo(){
            if(!jogoAtivo){
                jogoAtivo = true;
                tempoRestante = 10;
                console.log("Jogo iniciado!");

                let contador = setInterval(() => {
                    tempoRestante--;
                    console.log(`Tempo restante: ${tempoRestante} segundos`);

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
            //logica
            controls.unlock();
        }

        function removeParticle(particle) {
            scene.remove(particle);
            particles.splice(particles.indexOf(particle), 1);
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
            for (var j = 0; j < cubes.length; j++) {
                var cube = cubes[j];
                var isColliding = false;

                if (cube.visible) {
                    for (var i = 0; i < particles.length; i++) {
                        var particle = particles[i];
                        var particlePosition = particle.position;
                        var particleEdge = particlePosition
                            .clone()
                            .add(particle.velocity.clone().normalize().multiplyScalar(0.1));

                        raycaster.set(particlePosition, particleEdge.sub(particlePosition).normalize());
                        var intersects = raycaster.intersectObject(cube);

                        if (intersects.length === 1) {
                            // Particle collided with the cube
                            isColliding = true;
                            break;
                        }
                    }
                }

                // Set cube color and visibility based on collision status
                if (isColliding) {
                    // Cube is red during collision
                    cube.material.color.set(0xff0000);
                    explosion(cube);
                    moveCubeRandomly(cube);
                    hasCubeMoved = false; // Reset the flag when the cube is hidden
                } else {
                    // Cube is green when there is no collision
                    cube.material.color.set(0x00ff00);

                    // Check if all particles have been removed and the cube has not moved
                    if (collidedParticles === particles.length && !hasCubeMoved) {
                        collidedParticles = 0; // Reset the collided particles counter
                        hasCubeMoved = true; // Set the flag to indicate that the cube has been moved
                    }
                }
            }

            for (var j = 0; j < esferas.length; j++) {
                var esfera = esferas[j];
                var isColliding = false;

                if (esfera.visible) {
                    for (var i = 0; i < particles.length; i++) {
                        var particle = particles[i];
                        var particlePosition = particle.position;
                        var particleEdge = particlePosition
                            .clone()
                            .add(particle.velocity.clone().normalize().multiplyScalar(0.1));

                        raycaster.set(particlePosition, particleEdge.sub(particlePosition).normalize());
                        var intersects = raycaster.intersectObject(esfera);

                        if (intersects.length === 1) {
                            // Particle collided with the esfera
                            isColliding = true;
                            break;
                        }
                    }
                }

                // Set esfera color and visibility based on collision status
                if (isColliding) {
                    // esfera is red during collision
                    esfera.material.color.set(0xff0000);
                    explosionEsfera(esfera);
                    moveEsferaRandomly(esfera);
                    hasEsferaMoved = false; // Reset the flag when the cube is hidden
                } else {
                    // esfera is green when there is no collision
                    esfera.material.color.set(0x0000ff);

                    // Check if all particles have been removed and the cube has not moved
                    if (collidedParticles === particles.length && !hasEsferaMoved) {
                        collidedParticles = 0; // Reset the collided particles counter
                        hasEsferaMoved = true; // Set the flag to indicate that the cube has been moved
                    }
                }
            }
        }

        // Move the cube to a random location on the grid
        function moveCubeRandomly(cube) {
            var gridSize = 20; // Adjust the grid size as desired
            var randomX = Math.floor(Math.random() * gridSize) - gridSize / 2;
            var randomZ = Math.floor(Math.random() * gridSize) - gridSize / 2;

            cube.position.x = randomX;
            cube.position.z = randomZ;
        }

        function moveEsferaRandomly(esfera) {
            var gridSize = 40; // Adjust the grid size as desired
            var randomX = Math.floor(Math.random() * gridSize) - gridSize / 2;
            var randomZ = Math.floor(Math.random() * gridSize) - gridSize / 2;

            esfera.position.x = randomX;
            esfera.position.z = randomZ;
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

        
        function updatePlacar() {
            //verificar time
            //contabilizar placar
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

