/**
 * HAPPY 25TH BIRTHDAY ALDA
 * Interactive Birthday Web Experience
 * Theme: Cheerful Baby Blue & Doraemon
 */

(function () {
  'use strict';

  // ============================================================
  // 1. CONFIGURATION & STATE
  // ============================================================
  const CONFIG = {
    // Target: 14 November at 00:00:00 (Local Time)
    targetMonth: 10, // 0-indexed: 10 = November
    targetDay: 14,
    targetHour: 0,
    targetMinute: 0,
    targetSecond: 0,
    aldaAge: 25,
    name: 'Alda'
  };

  const state = {
    isCelebrationActive: false,
    isCandleLit: true,
    isMicListening: false,
    micStream: null,
    audioContext: null,
    analyser: null,
    micAnimationId: null,
    bgmPlaying: false,
    bgmInterval: null,
    tapPrayCount: 0,
    hasBlown: false
  };

  // DOM Elements
  const el = {
    sectionCountdown: document.getElementById('section-countdown'),
    sectionCelebration: document.getElementById('section-celebration'),
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    btnPreviewMode: document.getElementById('btn-preview-mode'),
    boomOverlay: document.getElementById('boom-overlay'),
    boomFlash: document.getElementById('boom-flash'),
    confettiCanvas: document.getElementById('confetti-canvas'),
    musicBtn: document.getElementById('music-btn'),
    musicLabel: document.getElementById('music-label'),
    soundWave: document.getElementById('sound-wave'),
    musicIcon: document.getElementById('music-icon'),
    btnTapBell: document.getElementById('btn-tap-bell'),
    tapCounterText: document.getElementById('tap-counter-text'),
    // Cake & Candles
    flame1: document.getElementById('flame-1'),
    flame2: document.getElementById('flame-2'),
    candle2: document.getElementById('candle-2'),
    candle5: document.getElementById('candle-5'),
    cakeWrapper: document.getElementById('cake-wrapper'),
    smoke1: document.getElementById('smoke-1'),
    smoke2: document.getElementById('smoke-2'),
    smoke3: document.getElementById('smoke-3'),
    btnMicBlow: document.getElementById('btn-mic-blow'),
    btnTouchBlow: document.getElementById('btn-touch-blow'),
    micMeterBox: document.getElementById('mic-meter-box'),
    micProgressFill: document.getElementById('mic-progress-fill'),
    micLevelText: document.getElementById('mic-level-text'),
    blowStatusText: document.getElementById('blow-status-text'),
    wishGrantedCard: document.getElementById('wish-granted-card'),
    btnRelight: document.getElementById('btn-relight'),
    // Gift Box
    giftBoxWrapper: document.getElementById('gift-box-wrapper'),
    giftRevealedContent: document.getElementById('gift-revealed-content'),
    toastPopup: document.getElementById('toast-popup'),
    toastMessage: document.getElementById('toast-message'),
    skyBackground: document.getElementById('sky-background')
  };

  // ============================================================
  // 2. TARGET DATE & COUNTDOWN LOGIC
  // ============================================================
  function getNextTargetDate() {
    const now = new Date();
    const currentYear = now.getFullYear();
    // Target: 14 November 00:00:00 WIB (UTC+7)
    // Di zona WIB: tepat jam 00:00 WIB | Di zona WITA: tepat jam 01:00 WITA
    const targetIso = `${currentYear}-11-14T00:00:00+07:00`;
    return new Date(targetIso);
  }

  function initCountdown() {
    const targetDate = getNextTargetDate();

    // Check query params for instant test/preview
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('preview') === 'true' || urlParams.get('test') === 'true') {
      triggerSurpriseBoom(false);
      return;
    }

    function update() {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      // If countdown reached 00:00 (or already passed on Nov 14)
      if (diff <= 0) {
        if (!state.isCelebrationActive) {
          triggerSurpriseBoom(true);
        }
        if (el.days) el.days.textContent = '00';
        if (el.hours) el.hours.textContent = '00';
        if (el.minutes) el.minutes.textContent = '00';
        if (el.seconds) el.seconds.textContent = '00';
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const d = Math.floor(totalSeconds / (3600 * 24));
      const h = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = Math.floor(totalSeconds % 60);

      if (el.days) el.days.textContent = String(d).padStart(2, '0');
      if (el.hours) el.hours.textContent = String(h).padStart(2, '0');
      if (el.minutes) el.minutes.textContent = String(m).padStart(2, '0');
      if (el.seconds) el.seconds.textContent = String(s).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  // ============================================================
  // 3. SOUND SYNTHESIZER (WEB AUDIO API)
  // No external audio files needed - 100% reliable anywhere!
  // ============================================================
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Sound: Boom / Surprise Explosion Fanfare
  function playBoomSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Low boom bass oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.8);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);

      // Noise burst (explosion fizz)
      const bufferSize = ctx.sampleRate * 0.6;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.6);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);

      // Celebratory chime arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(freq, now + 0.15 + idx * 0.08);
        chimeGain.gain.setValueAtTime(0, now + 0.15 + idx * 0.08);
        chimeGain.gain.linearRampToValueAtTime(0.25, now + 0.17 + idx * 0.08);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8 + idx * 0.08);

        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chime.start(now + 0.15 + idx * 0.08);
        chime.stop(now + 0.85 + idx * 0.08);
      });
    } catch (err) {
      console.warn('Audio synthesis issue:', err);
    }
  }

  // Sound: Bell Chime
  function playBellChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  // Sound: Blowing Out Candle ("Whoooosh")
  function playBlowSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // White noise breath whoosh
      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(1.5, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);

      // Victory cheer chime
      setTimeout(() => {
        playCelebrationFanfare();
      }, 400);
    } catch (e) {}
  }

  // Sound: Cheer Fanfare
  function playCelebrationFanfare() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      });
    } catch (e) {}
  }

  // Music Box Melody: "Happy Birthday" Theme Looping Synth
  const birthdayMelody = [
    // [midiNote, durationInBeats]
    { f: 261.63, d: 0.75 }, // C4 Hap-
    { f: 261.63, d: 0.25 }, // C4 py
    { f: 293.66, d: 1.0 },  // D4 Birth-
    { f: 261.63, d: 1.0 },  // C4 day
    { f: 349.23, d: 1.0 },  // F4 to
    { f: 329.63, d: 2.0 },  // E4 you~
    { f: 0, d: 0.5 },       // rest

    { f: 261.63, d: 0.75 }, // Hap-
    { f: 261.63, d: 0.25 }, // py
    { f: 293.66, d: 1.0 },  // Birth-
    { f: 261.63, d: 1.0 },  // day
    { f: 392.00, d: 1.0 },  // G4 to
    { f: 349.23, d: 2.0 },  // F4 you~
    { f: 0, d: 0.5 },       // rest

    { f: 261.63, d: 0.75 }, // Hap-
    { f: 261.63, d: 0.25 }, // py
    { f: 523.25, d: 1.0 },  // C5 Birth-
    { f: 440.00, d: 1.0 },  // A4 day
    { f: 349.23, d: 1.0 },  // F4 dear
    { f: 329.63, d: 1.0 },  // E4 Al-
    { f: 293.66, d: 1.5 },  // D4 da~
    { f: 0, d: 0.5 },       // rest

    { f: 466.16, d: 0.75 }, // A#4 Hap-
    { f: 466.16, d: 0.25 }, // py
    { f: 440.00, d: 1.0 },  // A4 Birth-
    { f: 349.23, d: 1.0 },  // F4 day
    { f: 392.00, d: 1.0 },  // G4 to
    { f: 349.23, d: 2.5 },  // F4 you~~
    { f: 0, d: 1.0 }        // rest
  ];

  let melodyIndex = 0;
  let melodyTimeout = null;

  function playNextMelodyNote() {
    if (!state.bgmPlaying) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const note = birthdayMelody[melodyIndex];
    const beatTime = 480; // ms per beat (moderato cheerful)
    const durationMs = note.d * beatTime;

    if (note.f > 0) {
      const now = ctx.currentTime;
      // Music box sound: dual sine + soft harmonic
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(note.f * 1.0, now);
      osc2.frequency.setValueAtTime(note.f * 2.0, now);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (durationMs / 1000) * 0.95);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + (durationMs / 1000));
      osc2.stop(now + (durationMs / 1000));
    }

    melodyIndex = (melodyIndex + 1) % birthdayMelody.length;
    melodyTimeout = setTimeout(playNextMelodyNote, durationMs);
  }

  function toggleMusic(forceState) {
    if (typeof forceState === 'boolean') {
      state.bgmPlaying = forceState;
    } else {
      state.bgmPlaying = !state.bgmPlaying;
    }

    if (state.bgmPlaying) {
      getAudioContext();
      melodyIndex = 0;
      playNextMelodyNote();
      if (el.musicLabel) el.musicLabel.textContent = 'Musik: On';
      if (el.soundWave) el.soundWave.classList.add('playing');
      if (el.musicIcon) el.musicIcon.textContent = '🎶';
      showToast('Musik ulang tahun diputar 🎵✨');
    } else {
      if (melodyTimeout) clearTimeout(melodyTimeout);
      if (el.musicLabel) el.musicLabel.textContent = 'Musik: Off';
      if (el.soundWave) el.soundWave.classList.remove('playing');
      if (el.musicIcon) el.musicIcon.textContent = '🎵';
      showToast('Musik dihentikan ⏸️');
    }
  }

  // ============================================================
  // 4. CONFETTI & SPARKS ENGINE (HIGH PERFORMANCE CANVAS)
  // ============================================================
  const confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,
    colors: ['#38bdf8', '#0284c7', '#ffd13b', '#ff4757', '#ffffff', '#a78bfa', '#34d399', '#f472b6'],

    init() {
      this.canvas = el.confettiCanvas;
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    createParticle(x, y, isMega = false) {
      const angle = Math.random() * Math.PI * 2;
      const speed = isMega ? Math.random() * 15 + 8 : Math.random() * 8 + 3;
      return {
        x: x || Math.random() * this.canvas.width,
        y: y || Math.random() * (this.canvas.height * 0.4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: Math.random() * 8 + 5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
        alpha: 1,
        gravity: 0.28,
        friction: 0.97
      };
    },

    burst(x, y, count = 120, isMega = false) {
      if (!this.ctx) this.init();
      const originX = x || window.innerWidth / 2;
      const originY = y || window.innerHeight / 2;

      for (let i = 0; i < count; i++) {
        this.particles.push(this.createParticle(originX, originY, isMega));
      }

      if (!this.animationId) {
        this.loop();
      }
    },

    continuousShower(durationMs = 4000) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        if (Date.now() - startTime > durationMs) {
          clearInterval(interval);
          return;
        }
        // Burst from both bottom corners like cannons
        this.burst(window.innerWidth * 0.15, window.innerHeight * 0.85, 25, false);
        this.burst(window.innerWidth * 0.85, window.innerHeight * 0.85, 25, false);
      }, 300);
    },

    loop() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vx *= p.friction;
        p.vy = p.vy * p.friction + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.alpha -= 0.007;

        if (p.alpha <= 0 || p.y > this.canvas.height + 20) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(() => this.loop());
      } else {
        this.animationId = null;
      }
    }
  };

  // ============================================================
  // 5. SURPRISE BOOM ANIMATION & PERNAK-PERNIK
  // ============================================================
  const cuteJewels = ['💎', '💍', '✨', '🔔', '🍰', '🍓', '🎀', '🌸', '💖', '⭐', '🎈', '🎉'];

  function spawnExplodingJewelry() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const count = 35;

    for (let i = 0; i < count; i++) {
      const elParticle = document.createElement('div');
      elParticle.className = 'boom-particle';
      elParticle.textContent = cuteJewels[Math.floor(Math.random() * cuteJewels.length)];

      const angle = (Math.PI * 2 / count) * i + (Math.random() * 0.4);
      const distance = Math.min(window.innerWidth, window.innerHeight) * (0.35 + Math.random() * 0.45);
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const rot = (Math.random() * 720 - 360) + 'deg';

      elParticle.style.left = centerX + 'px';
      elParticle.style.top = centerY + 'px';
      elParticle.style.setProperty('--tx', tx + 'px');
      elParticle.style.setProperty('--ty', ty + 'px');
      elParticle.style.setProperty('--rot', rot);
      elParticle.style.fontSize = (1.5 + Math.random() * 1.5) + 'rem';

      document.body.appendChild(elParticle);

      setTimeout(() => {
        if (elParticle.parentNode) elParticle.parentNode.removeChild(elParticle);
      }, 2000);
    }
  }

  function triggerSurpriseBoom(withSound = true) {
    if (state.isCelebrationActive) return;
    state.isCelebrationActive = true;

    if (withSound) {
      playBoomSound();
    }

    // Screen Shake effect
    document.body.style.animation = 'screenShake 0.6s ease-in-out';
    setTimeout(() => {
      document.body.style.animation = '';
    }, 600);

    // Boom Flash & Overlay
    if (el.boomOverlay && el.boomFlash) {
      el.boomOverlay.style.display = 'flex';
      el.boomFlash.style.opacity = '0.9';
      el.boomFlash.style.transition = 'opacity 0.6s ease';

      const boomContent = el.boomOverlay.querySelector('.boom-content');
      if (boomContent) {
        boomContent.style.transform = 'scale(1)';
        boomContent.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }

      setTimeout(() => {
        el.boomFlash.style.opacity = '0';
      }, 80);

      // Spawn Pernak-pernik & Perhiasan explosion
      spawnExplodingJewelry();

      // Confetti Cannon
      confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 180, true);
      confetti.continuousShower(4500);

      setTimeout(() => {
        if (boomContent) {
          boomContent.style.transform = 'scale(0.8)';
          boomContent.style.opacity = '0';
          boomContent.style.transition = 'all 0.5s ease';
        }
        setTimeout(() => {
          el.boomOverlay.style.display = 'none';
        }, 500);
      }, 1600);
    }

    // Transition View: Hide Countdown, Show Celebration Section
    setTimeout(() => {
      if (el.sectionCountdown) {
        el.sectionCountdown.classList.add('hidden-section');
      }
      if (el.sectionCelebration) {
        el.sectionCelebration.classList.add('active-celebration');
        el.sectionCelebration.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Automatically start background birthday melody
      setTimeout(() => {
        if (!state.bgmPlaying) {
          toggleMusic(true);
        }
      }, 800);
    }, 1100);

    // Update Top Helper button to "Lihat Countdown Lagi"
    if (el.btnPreviewMode) {
      el.btnPreviewMode.textContent = '🔄 Hitung Mundur';
      el.btnPreviewMode.title = 'Kembali ke halaman hitung mundur';
    }
  }

  function resetToCountdown() {
    state.isCelebrationActive = false;
    if (el.sectionCelebration) {
      el.sectionCelebration.classList.remove('active-celebration');
    }
    if (el.sectionCountdown) {
      el.sectionCountdown.classList.remove('hidden-section');
      el.sectionCountdown.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (el.btnPreviewMode) {
      el.btnPreviewMode.textContent = '⚡ Buka Kejutan Langsung';
      el.btnPreviewMode.title = 'Tekan untuk langsung melihat kejutan';
    }
    showToast('Mode hitung mundur ditampilkan kembali ⏳');
  }

  // ============================================================
  // 6. CAKE CANDLE BLOW INTERACTION (MIC & TOUCH)
  // ============================================================
  function extinguishCandles() {
    if (!state.isCandleLit) return;
    state.isCandleLit = false;
    state.hasBlown = true;

    // Extinguish Flames
    if (el.flame1) el.flame1.classList.add('extinguished');
    if (el.flame2) el.flame2.classList.add('extinguished');

    // Trigger Smoke Animation
    if (el.smoke1) el.smoke1.classList.add('animating');
    if (el.smoke2) el.smoke2.classList.add('animating');
    if (el.smoke3) el.smoke3.classList.add('animating');

    // Sound effect & Fanfare
    playBlowSound();

    // Confetti shower directly above the cake
    const cakeRect = el.cakeWrapper ? el.cakeWrapper.getBoundingClientRect() : null;
    const cakeCenterX = cakeRect ? cakeRect.left + cakeRect.width / 2 : window.innerWidth / 2;
    const cakeCenterY = cakeRect ? cakeRect.top : window.innerHeight / 2;

    confetti.burst(cakeCenterX, cakeCenterY, 140, true);

    // Update Status Pill
    if (el.blowStatusText) {
      el.blowStatusText.textContent = 'Lilin sudah ditiup! Wish kamu didengar semesta ✨';
    }

    // Stop Mic if active
    stopMicListening();

    // Reveal Wish Granted Card
    setTimeout(() => {
      if (el.wishGrantedCard) {
        el.wishGrantedCard.style.display = 'block';
        el.wishGrantedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      confetti.burst(window.innerWidth / 2, window.innerHeight * 0.4, 100, false);
    }, 700);

    showToast('YAAAY! Lilin berhasil ditiup! 🥳🎂✨');
  }

  function relightCandles() {
    state.isCandleLit = true;
    if (el.flame1) el.flame1.classList.remove('extinguished');
    if (el.flame2) el.flame2.classList.remove('extinguished');

    if (el.smoke1) el.smoke1.classList.remove('animating');
    if (el.smoke2) el.smoke2.classList.remove('animating');
    if (el.smoke3) el.smoke3.classList.remove('animating');

    if (el.wishGrantedCard) {
      el.wishGrantedCard.style.display = 'none';
    }

    if (el.blowStatusText) {
      el.blowStatusText.textContent = 'Lilin menyala kembali! Silakan tiup lagi 🕯️';
    }

    playBellChime();
    showToast('Lilin dinyalakan lagi! Boleh buat wish baru ✨');
  }

  // Microphone Audio Detection for Blowing
  async function startMicListening() {
    if (!state.isCandleLit) {
      showToast('Nyalakan lilin dulu yaa untuk ditiup lagi ✨');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Fitur mic tidak didukung di browser ini. Gunakan tombol Sentuh Lilin yaa! 👇');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      state.micStream = stream;
      state.isMicListening = true;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioContextClass();
      const source = state.audioContext.createMediaStreamSource(stream);
      const analyser = state.audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      state.analyser = analyser;

      if (el.micMeterBox) el.micMeterBox.style.display = 'block';
      if (el.btnMicBlow) {
        el.btnMicBlow.style.borderColor = '#22c55e';
        el.btnMicBlow.querySelector('strong').textContent = 'Mic Aktif: Ayo Tiup! 💨';
      }

      showToast('Mikrofon aktif! Tiup layar/mic HP kamu sekarang 💨');

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let blowFrames = 0;

      function checkVolume() {
        if (!state.isMicListening) return;
        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume & high frequency wind noise
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        // Visual progress update
        const progressPercent = Math.min(100, Math.round((average / 45) * 100));
        if (el.micProgressFill) {
          el.micProgressFill.style.width = progressPercent + '%';
        }

        // Blow threshold
        if (average > 38) {
          blowFrames++;
          if (blowFrames >= 2) {
            extinguishCandles();
            return;
          }
        } else {
          blowFrames = Math.max(0, blowFrames - 1);
        }

        state.micAnimationId = requestAnimationFrame(checkVolume);
      }

      checkVolume();

    } catch (err) {
      console.warn('Mic access error or denied:', err);
      showToast('Izin mic tidak aktif. Jangan khawatir, kamu bisa sentuh/klik lilinnya! 👆');
      if (el.btnMicBlow) {
        el.btnMicBlow.querySelector('strong').textContent = 'Gunakan Sentuh Lilin 👇';
      }
    }
  }

  function stopMicListening() {
    state.isMicListening = false;
    if (state.micAnimationId) {
      cancelAnimationFrame(state.micAnimationId);
      state.micAnimationId = null;
    }
    if (state.micStream) {
      state.micStream.getTracks().forEach(track => track.stop());
      state.micStream = null;
    }
    if (state.audioContext && state.audioContext.state !== 'closed') {
      try {
        state.audioContext.close();
      } catch (e) {}
      state.audioContext = null;
    }
    if (el.micMeterBox) {
      el.micMeterBox.style.display = 'none';
    }
    if (el.btnMicBlow) {
      el.btnMicBlow.style.borderColor = '';
      el.btnMicBlow.querySelector('strong').textContent = 'Aktifkan Tiup Mic';
    }
  }

  // ============================================================
  // 7. TOAST & FLOATING SKY ELEMENTS
  // ============================================================
  let toastTimer = null;
  function showToast(message) {
    if (!el.toastPopup || !el.toastMessage) return;
    el.toastMessage.textContent = message;
    el.toastPopup.classList.add('visible');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toastPopup.classList.remove('visible');
    }, 2800);
  }

  function setupFloatingSkyElements() {
    if (!el.skyBackground) return;
    const icons = ['☁️', '🔔', '✨', '⭐', '🎈', '💙', '🍰'];

    for (let i = 0; i < 18; i++) {
      const item = document.createElement('div');
      item.className = 'floating-item';
      item.textContent = icons[Math.floor(Math.random() * icons.length)];
      item.style.left = Math.random() * 95 + 'vw';
      item.style.fontSize = (1.2 + Math.random() * 1.3) + 'rem';
      item.style.animationDuration = (12 + Math.random() * 16) + 's';
      item.style.animationDelay = (Math.random() * 10) + 's';
      item.style.opacity = (0.4 + Math.random() * 0.4).toFixed(2);
      el.skyBackground.appendChild(item);
    }
  }

  // ============================================================
  // 8. EVENT LISTENERS
  // ============================================================
  function setupEvents() {
    // Top Nav Preview Mode Toggle
    if (el.btnPreviewMode) {
      el.btnPreviewMode.addEventListener('click', () => {
        if (state.isCelebrationActive) {
          resetToCountdown();
        } else {
          triggerSurpriseBoom(true);
        }
      });
    }

    // Music Toggle Pill
    if (el.musicBtn) {
      el.musicBtn.addEventListener('click', () => {
        toggleMusic();
      });
    }

    // Interactive Tap Bell on Countdown
    if (el.btnTapBell) {
      el.btnTapBell.addEventListener('click', () => {
        state.tapPrayCount++;
        playBellChime();
        if (el.tapCounterText) {
          el.tapCounterText.textContent = `${state.tapPrayCount} doa baik terkirim untuk Alda ✨💙`;
        }
        // Little bounce
        el.btnTapBell.style.transform = 'scale(1.08)';
        setTimeout(() => {
          el.btnTapBell.style.transform = '';
        }, 150);

        // Mini confetti from bell
        const rect = el.btnTapBell.getBoundingClientRect();
        confetti.burst(rect.left + rect.width / 2, rect.top, 15, false);

        showToast(`Doa ke-${state.tapPrayCount} untuk Alda terkirim! 🤲💙`);
      });
    }

    // Candle Blow Actions
    if (el.btnMicBlow) {
      el.btnMicBlow.addEventListener('click', () => {
        if (state.isMicListening) {
          stopMicListening();
        } else {
          startMicListening();
        }
      });
    }

    if (el.btnTouchBlow) {
      el.btnTouchBlow.addEventListener('click', () => {
        extinguishCandles();
      });
    }

    // Touching Candle directly
    if (el.candle2) {
      el.candle2.addEventListener('click', () => extinguishCandles());
    }
    if (el.candle5) {
      el.candle5.addEventListener('click', () => extinguishCandles());
    }
    if (el.flame1) {
      el.flame1.addEventListener('click', () => extinguishCandles());
    }
    if (el.flame2) {
      el.flame2.addEventListener('click', () => extinguishCandles());
    }

    // Relight Candle
    if (el.btnRelight) {
      el.btnRelight.addEventListener('click', () => {
        relightCandles();
      });
    }

    // Interactive Gift Box (Doraemon's 4D Pocket)
    if (el.giftBoxWrapper) {
      el.giftBoxWrapper.addEventListener('click', () => {
        el.giftBoxWrapper.classList.toggle('opened');
        playBellChime();
        confetti.burst(window.innerWidth / 2, window.innerHeight * 0.7, 40, false);

        if (el.giftRevealedContent) {
          if (el.giftRevealedContent.style.display === 'none') {
            el.giftRevealedContent.style.display = 'block';
            el.giftRevealedContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            showToast('Tadaaa! Kotak kado terbuka! 🎁✨');
          } else {
            el.giftRevealedContent.style.display = 'none';
          }
        }
      });
    }
  }

  // ============================================================
  // 9. INITIALIZATION
  // ============================================================
  function init() {
    setupFloatingSkyElements();
    confetti.init();
    setupEvents();
    initCountdown();

    console.log('%c🎂 Happy 25th Birthday Alda! ✨', 'font-size: 20px; font-weight: bold; color: #0284c7;');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

