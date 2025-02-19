/*----------------------------------------------------
Alvo/Personagem complexo
------------------------------------------------------*/
export function createPersonTarget(camera) {
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

export function createBottle() {
    const bottleGroup = new THREE.Group();
    
    // Perfil 2D para LatheGeometry (garrafa)
    const bottlePoints = [
        new THREE.Vector2(0.2, 0.0),   // Base
        new THREE.Vector2(0.25, 0.3),
        new THREE.Vector2(0.3, 0.6),
        new THREE.Vector2(0.35, 0.8),
        new THREE.Vector2(0.3, 1.2),
        new THREE.Vector2(0.2, 1.4),   // Gargalo
        new THREE.Vector2(0.15, 1.6),
        new THREE.Vector2(0.15, 1.8)
    ];
    
    const bottleGeometry = new THREE.LatheGeometry(bottlePoints, 32);
    const bottleMaterial = new THREE.MeshStandardMaterial({ color: 0x77ccff, transparent: true, opacity: 0.6 });
    const bottleMesh = new THREE.Mesh(bottleGeometry, bottleMaterial);
    bottleGroup.add(bottleMesh);
    
    // Rolha
    const corkGeometry = new THREE.CylinderGeometry(0.15, 0.17, 0.2, 16);
    const corkMaterial = new THREE.MeshStandardMaterial({ color: 0xaa7744 });
    const corkMesh = new THREE.Mesh(corkGeometry, corkMaterial);
    corkMesh.position.set(0, 1.85, 0);
    bottleGroup.add(corkMesh);
    
    // Mensagem (um cilindro enrolado dentro da garrafa)
    const messageGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16);
    const messageMaterial = new THREE.MeshStandardMaterial({ color: 0xffee99 });
    const messageMesh = new THREE.Mesh(messageGeometry, messageMaterial);
    messageMesh.position.set(0, 0.8, 0);
    messageMesh.rotation.z = Math.PI / 6;
    bottleGroup.add(messageMesh);
    
    return bottleGroup;
}


export function createCubeTarget() {
    var textureLoader = new THREE.TextureLoader();
    var cubeTexture = textureLoader.load('https://threejs.org/examples/textures/crate.gif');
    // Criar cubo
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    // Substituimos o MeshBasicMaterial pelo MashStandard por conta de realismo e sombras
    var cubeMaterial = new THREE.MeshStandardMaterial({map: cubeTexture});

    const cube = new THREE.Mesh(geometry, cubeMaterial);
    return cube;
}
export function createSphereTarget() {
    var textureLoader = new THREE.TextureLoader();
    var sphereTexture = textureLoader.load('https://threejs.org/manual/resources/images/mip-low-res-enlarged.png');
    var geometry = new THREE.SphereGeometry(0.5, 16, 16); // Raio 0.5, 16 segmentos horizontais e verticais
    var sphereMaterial = new THREE.MeshStandardMaterial({ map: sphereTexture });
    var esfera = new THREE.Mesh(geometry, sphereMaterial);

    return esfera;   
}