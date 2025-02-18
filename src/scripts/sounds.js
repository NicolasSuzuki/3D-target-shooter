
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
export function loadAudioFile(url, callback) {
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
export function playMusic() {
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
export function playLaserSound() {
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
export function playExplosionSound() {
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