document.addEventListener("DOMContentLoaded", () => {
  const introScene = document.getElementById("introScene");
  const logoSvg = document.getElementById("logoSvg");
  const candelSvg = document.getElementById("candelSvg");
  const enterText = document.getElementById("enterText");

  const characterScene = document.getElementById("characterScene");
  const pcBoy = document.getElementById("pcBoy");
  const pcGirl = document.getElementById("pcGirl");
  const genderBar = document.getElementById("genderBar");

  const nextScene = document.getElementById("nextScene");
  const candlfireImg = document.getElementById("candlfireImg");
  const confessionTitleImg = document.getElementById("confessionTitleImg");
  const startConfessionBtn = document.getElementById("startConfessionBtn");

  const confessionRoomScene = document.getElementById("confessionRoomScene");
  const memoParallaxScene = document.getElementById("memoParallaxScene");
  const memoImg = document.getElementById("memoImg");
  const briefingPanel = document.getElementById("briefingPanel");
  const briefingStory = document.getElementById("briefingStory");
  const briefingGoal = document.getElementById("briefingGoal");
  const briefingReminder = document.getElementById("briefingReminder");
  const briefingNextBtn = document.getElementById("briefingNextBtn");

  const howToPlayScene = document.getElementById("howToPlayScene");
  const howtoCandles = document.getElementById("howtoCandles");
  const howtoStartPrompt = document.getElementById("howtoStartPrompt");

  const warningScene = document.getElementById("warningScene");
  const warningCandelfireImg = document.getElementById("warningCandelfireImg");
  const warningSparksCanvas = document.getElementById("warningSparksCanvas");
  const startGameBtn = document.getElementById("startGameBtn");

  let timers = [];
  let isTransitioning = false;
  let isSelectingGender = false;
  let isStartingConfession = false;
  let isEnteringHowTo = false;
  let isEnteringWarning = false;
  let selectedGender = null;
  let memoParallaxInstance = null;
  let candleDemoTimer = null;

  let typewriterChars = [];
  let isTypingBriefing = false;
  let isBriefingDone = false;

  // 第六頁背景：星火飛舞粒子系統
  const sparksController = (() => {
    if (!warningSparksCanvas) {
      return { start() {}, stop() {} };
    }

    const ctx = warningSparksCanvas.getContext("2d");
    let animId = null;
    let width = 0;
    let height = 0;
    let particles = [];
    let windX = 0;
    let targetWindX = 0;

    // 對應背景六處燭火的相對位置
    const flameOrigins = [
      { x: 0.22, y: 0.08 },
      { x: 0.396, y: 0.16 },
      { x: 0.456, y: 0.52 },
      { x: 0.551, y: 0.52 },
      { x: 0.594, y: 0.16 },
      { x: 0.766, y: 0.08 },
    ];

    const palette = [
      { core: "255, 250, 210", glow: "255, 196, 92" },
      { core: "255, 224, 145", glow: "255, 148, 56" },
      { core: "255, 190, 110", glow: "238, 102, 44" },
    ];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      warningSparksCanvas.width = width * dpr;
      warningSparksCanvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createSpark(initialScatter = false) {
      const fromCandle = Math.random() < 0.55;
      let startX;
      let startY;

      if (fromCandle) {
        const origin =
          flameOrigins[Math.floor(Math.random() * flameOrigins.length)];
        startX = origin.x * width + (Math.random() - 0.5) * 46;
        startY = origin.y * height + (Math.random() - 0.5) * 24;
      } else {
        startX = Math.random() * width;
        startY = initialScatter
          ? Math.random() * height
          : height + Math.random() * 60;
      }

      const color = palette[Math.floor(Math.random() * palette.length)];
      const maxLife = 160 + Math.random() * 220;

      return {
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -(0.45 + Math.random() * 1.35),
        size: 1.2 + Math.random() * 2.8,
        maxAlpha: 0.45 + Math.random() * 0.55,
        life: initialScatter ? Math.random() * maxLife : 0,
        maxLife,
        swayFreq: 0.015 + Math.random() * 0.025,
        swayAmp: 0.25 + Math.random() * 0.65,
        twinkleFreq: 0.05 + Math.random() * 0.08,
        phase: Math.random() * Math.PI * 2,
        color,
      };
    }

    function initParticles() {
      const count = Math.min(75, Math.max(42, Math.floor(width / 22)));
      particles = Array.from({ length: count }, () => createSpark(true));
    }

    function render() {
      ctx.clearRect(0, 0, width, height);
      windX += (targetWindX - windX) * 0.04;
      targetWindX *= 0.96;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += 1;

        if (p.life >= p.maxLife || p.y < -30 || p.x < -40 || p.x > width + 40) {
          particles[i] = createSpark(false);
          continue;
        }

        const progress = p.life / p.maxLife;
        const fadeIn = Math.min(1, progress * 6);
        const fadeOut = 1 - Math.pow(progress, 1.8);
        const twinkle =
          0.72 + 0.28 * Math.sin(p.life * p.twinkleFreq + p.phase);
        const alpha = p.maxAlpha * fadeIn * fadeOut * twinkle;

        const sway = Math.sin(p.life * p.swayFreq + p.phase) * p.swayAmp;
        p.x += p.vx + sway + windX * (0.4 + p.size * 0.2);
        p.y += p.vy;

        const glowRadius = p.size * 4.4;
        const grad = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          glowRadius,
        );
        grad.addColorStop(0, `rgba(${p.color.core}, ${alpha})`);
        grad.addColorStop(0.35, `rgba(${p.color.glow}, ${alpha * 0.65})`);
        grad.addColorStop(1, `rgba(${p.color.glow}, 0)`);

        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // 星火核心亮點
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color.core}, ${Math.min(1, alpha * 1.25)})`;
        ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    }

    window.addEventListener("resize", () => {
      if (animId !== null) resize();
    });

    if (warningScene) {
      warningScene.addEventListener("mousemove", (e) => {
        const normX = (e.clientX / Math.max(1, width) - 0.5) * 2;
        targetWindX = normX * 0.85;
      });
    }

    return {
      start() {
        if (animId !== null) return;
        resize();
        initParticles();
        animId = requestAnimationFrame(render);
      },
      stop() {
        if (animId !== null) {
          cancelAnimationFrame(animId);
          animId = null;
        }
        ctx.clearRect(0, 0, width, height);
      },
    };
  })();

  // 將第四頁三段文字拆解為逐字 span（保留換行與各段樣式）
  function prepareBriefingTypewriter() {
    const blocks = [briefingStory, briefingGoal, briefingReminder].filter(
      Boolean,
    );
    typewriterChars = [];

    blocks.forEach((block, blockIdx) => {
      const childNodes = Array.from(block.childNodes);
      const fragment = document.createDocumentFragment();
      let pendingPause = blockIdx > 0 ? 360 : 0;

      childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const cleaned = node.textContent.replace(/\r?\n\s*/g, "");
          Array.from(cleaned).forEach((ch) => {
            const span = document.createElement("span");
            span.className = "tw-char";
            span.textContent = ch;
            if (pendingPause > 0) {
              span.dataset.pause = String(pendingPause);
              pendingPause = 0;
            }
            fragment.appendChild(span);
            typewriterChars.push(span);
          });
        } else if (node.nodeName === "BR") {
          fragment.appendChild(document.createElement("br"));
          pendingPause = Math.max(pendingPause, 220);
        }
      });

      block.innerHTML = "";
      block.appendChild(fragment);
    });
  }

  prepareBriefingTypewriter();

  function resetBriefingTypewriter() {
    isTypingBriefing = false;
    isBriefingDone = false;
    typewriterChars.forEach((span) => {
      span.classList.remove("is-typed", "is-current");
    });
    if (briefingNextBtn) {
      briefingNextBtn.classList.remove("is-visible");
    }
  }

  function finishBriefingTypewriter() {
    isTypingBriefing = false;
    isBriefingDone = true;
    typewriterChars.forEach((span) => {
      span.classList.add("is-typed");
      span.classList.remove("is-current");
    });
    if (briefingNextBtn) {
      briefingNextBtn.classList.add("is-visible");
    }
  }

  function startBriefingTypewriter() {
    resetBriefingTypewriter();
    if (!typewriterChars.length) {
      finishBriefingTypewriter();
      return;
    }

    isTypingBriefing = true;
    let idx = 0;

    function typeNextChar() {
      if (!isTypingBriefing) return;

      if (idx > 0) {
        typewriterChars[idx - 1].classList.remove("is-current");
      }

      if (idx >= typewriterChars.length) {
        finishBriefingTypewriter();
        return;
      }

      const currentSpan = typewriterChars[idx];
      currentSpan.classList.add("is-typed", "is-current");
      idx += 1;

      const nextSpan = typewriterChars[idx];
      const extraPause =
        nextSpan && nextSpan.dataset.pause ? Number(nextSpan.dataset.pause) : 0;
      const charDelay = 48 + extraPause;

      timers.push(setTimeout(typeNextChar, charDelay));
    }

    timers.push(setTimeout(typeNextChar, 450));
  }

  // 初始化 Parallax.js 滑鼠視差互動
  if (memoParallaxScene && typeof Parallax !== "undefined") {
    memoParallaxInstance = new Parallax(memoParallaxScene, {
      relativeInput: true,
      clipRelativeInput: false,
      hoverOnly: false,
      scalarX: 14,
      scalarY: 14,
      frictionX: 0.1,
      frictionY: 0.1,
    });
  }

  // 圖檔名稱自動備援（兼容不同版本後綴或副檔名）
  function setupImageFallback(imgEl, fallbacks, onFallbackApplied) {
    if (!imgEl) return;
    let index = 0;
    imgEl.addEventListener("error", () => {
      if (index < fallbacks.length) {
        const nextSrc = fallbacks[index++];
        imgEl.src = nextSrc;
        if (typeof onFallbackApplied === "function") {
          onFallbackApplied(nextSrc);
        }
      }
    });
  }

  setupImageFallback(candlfireImg, ["img_candlfire_4.0.png"]);
  setupImageFallback(confessionTitleImg, [
    "img_confession start_10.1_3.png",
    "img_confession start_10.1_2.png",
    "img_confession start_10.1.png",
  ]);
  setupImageFallback(
    memoImg,
    ["Group 3_2.png", "Group 3.png", "Group 3.jpg"],
    (src) => {
      if (src.toLowerCase().endsWith(".png")) {
        memoImg.classList.remove("is-jpg-fallback");
      } else {
        memoImg.classList.add("is-jpg-fallback");
      }
    },
  );
  setupImageFallback(
    warningCandelfireImg,
    ["img_candelfire_5.0.png", "img_candelfire_5.0.jpg"],
    (src) => {
      if (src.toLowerCase().endsWith(".jpg")) {
        warningCandelfireImg.classList.add("is-jpg-fallback");
      } else {
        warningCandelfireImg.classList.remove("is-jpg-fallback");
      }
    },
  );

  function clearTimers() {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
  }

  // 重設所有場景狀態
  function resetIntro() {
    clearTimers();
    isTransitioning = false;
    isSelectingGender = false;
    isStartingConfession = false;
    isEnteringHowTo = false;
    isEnteringWarning = false;
    selectedGender = null;

    if (candleDemoTimer) {
      clearInterval(candleDemoTimer);
      candleDemoTimer = null;
    }

    introScene.classList.add("is-active");
    characterScene.classList.remove("is-active");

    if (nextScene) {
      nextScene.classList.remove("is-active");
    }

    if (startConfessionBtn) {
      startConfessionBtn.classList.remove("is-clicked");
    }

    if (confessionRoomScene) {
      confessionRoomScene.classList.remove("is-active");
      confessionRoomScene.removeAttribute("data-gender");
    }

    if (howToPlayScene) {
      howToPlayScene.classList.remove("is-active");
    }

    if (howtoCandles) {
      howtoCandles
        .querySelectorAll(".mini-candle")
        .forEach((c) => c.classList.remove("is-out"));
    }

    if (warningScene) {
      warningScene.classList.remove("is-active");
      warningScene.removeAttribute("data-gender");
    }

    sparksController.stop();

    if (startGameBtn) {
      startGameBtn.classList.remove("is-pressed");
    }

    resetBriefingTypewriter();

    pcBoy.style.transition = "none";
    pcBoy.classList.remove("is-visible", "is-selected");
    pcGirl.style.transition = "none";
    pcGirl.classList.remove("is-visible", "is-selected");

    if (genderBar) {
      genderBar.style.transition = "none";
      genderBar.classList.remove("is-visible");
    }

    if (logoSvg) {
      logoSvg.style.transition = "none";
      logoSvg.classList.remove("is-animated", "is-dimmed");
      logoSvg.querySelectorAll(".draw-path").forEach((path) => {
        const length = path.getTotalLength();
        path.style.transition = "none";
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
      });
    }

    if (candelSvg) {
      candelSvg.style.transition = "none";
      candelSvg.classList.remove("is-visible", "is-lit", "is-boosted");
    }

    if (enterText) {
      enterText.style.transition = "none";
      enterText.classList.remove("is-visible");
    }
  }

  // 播放第一頁開場序列
  function playIntroSequence() {
    resetIntro();

    requestAnimationFrame(() => {
      timers.push(
        setTimeout(() => {
          // 1. 「告解室」線條描繪並填滿原色
          const paths = logoSvg.querySelectorAll(".draw-path");
          paths.forEach((path, index) => {
            path.getBoundingClientRect();
            const delay = (index * 0.05).toFixed(2);
            path.style.transition = `stroke-dashoffset 1.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s, fill-opacity 0.8s ease ${Number(delay) + 1.1}s, stroke-width 0.8s ease ${Number(delay) + 1.1}s`;
            path.style.strokeDashoffset = "0";
          });

          requestAnimationFrame(() => {
            logoSvg.classList.add("is-animated");
          });

          // 2. 約 2.2 秒後：「告解室」淡化退入背景，中央燭台緩緩浮現
          timers.push(
            setTimeout(() => {
              logoSvg.style.transition = "";
              logoSvg.classList.add("is-dimmed");

              candelSvg.style.transition = "";
              candelSvg.classList.add("is-visible");
            }, 2200),
          );

          // 3. 約 3.0 秒後：三支蠟燭點亮發光
          timers.push(
            setTimeout(() => {
              candelSvg.classList.add("is-lit");
            }, 3000),
          );

          // 4. 約 3.4 秒後：「點火進入遊戲」浮現於前景
          timers.push(
            setTimeout(() => {
              enterText.style.transition = "";
              enterText.classList.add("is-visible");
            }, 3400),
          );
        }, 60),
      );
    });
  }

  // 原地切換至第二頁：分別依序淡入男女角色與底部性別選擇框
  function enterCharacterPage() {
    if (isTransitioning) return;
    isTransitioning = true;
    clearTimers();

    candelSvg.classList.add("is-boosted");
    introScene.classList.remove("is-active");

    timers.push(
      setTimeout(() => {
        characterScene.classList.add("is-active");

        // 第一步：左側男角淡入
        requestAnimationFrame(() => {
          pcBoy.style.transition = "";
          pcBoy.classList.add("is-visible");
        });

        // 第二步：間隔 1 秒後，右側女角接續淡入
        timers.push(
          setTimeout(() => {
            pcGirl.style.transition = "";
            pcGirl.classList.add("is-visible");
          }, 1000),
        );

        // 第三步：雙人進場後，底部性別選擇列淡入
        timers.push(
          setTimeout(() => {
            if (genderBar) {
              genderBar.style.transition = "";
              genderBar.classList.add("is-visible");
            }
          }, 1450),
        );
      }, 650),
    );
  }

  // 點擊第二頁角色（hover 狀態）後切換至第三頁「開始告解」
  function selectCharacterAndNext(gender) {
    if (isSelectingGender) return;
    const targetChar = gender === "male" ? pcBoy : pcGirl;
    if (!targetChar.classList.contains("is-visible")) return;

    isSelectingGender = true;
    selectedGender = gender;

    // 鎖定所選角色的 hover 狀態（維持背光與替換圖）
    targetChar.classList.add("is-selected");

    timers.push(
      setTimeout(() => {
        characterScene.classList.remove("is-active");

        timers.push(
          setTimeout(() => {
            if (nextScene) {
              nextScene.classList.add("is-active");
            }
          }, 450),
        );
      }, 380),
    );
  }

  // 點擊第三頁「開始告解」圖片按鈕後切換至第四頁並啟動 Parallax.js 與打字機效果
  function enterConfessionRoom() {
    if (isStartingConfession) return;
    if (!nextScene || !nextScene.classList.contains("is-active")) return;

    isStartingConfession = true;

    if (startConfessionBtn) {
      startConfessionBtn.classList.add("is-clicked");
    }

    timers.push(
      setTimeout(() => {
        nextScene.classList.remove("is-active");

        timers.push(
          setTimeout(() => {
            if (confessionRoomScene) {
              if (selectedGender) {
                confessionRoomScene.setAttribute("data-gender", selectedGender);
              }
              confessionRoomScene.classList.add("is-active");

              if (memoParallaxInstance) {
                memoParallaxInstance.enable();
                memoParallaxInstance.updateDimensions();
              }

              startBriefingTypewriter();
            }
          }, 450),
        );
      }, 320),
    );
  }

  // 啟動第五頁蠟燭「熄滅 → 復燃」互動示範
  function startCandleDemoLoop() {
    if (!howtoCandles) return;
    const candles = Array.from(howtoCandles.querySelectorAll(".mini-candle"));
    if (candles.length < 7) return;

    if (candleDemoTimer) clearInterval(candleDemoTimer);

    candleDemoTimer = setInterval(() => {
      if (!howToPlayScene || !howToPlayScene.classList.contains("is-active"))
        return;

      candles[6].classList.add("is-out");
      timers.push(
        setTimeout(() => {
          candles[5].classList.add("is-out");
        }, 450),
      );
      timers.push(
        setTimeout(() => {
          candles[5].classList.remove("is-out");
          candles[6].classList.remove("is-out");
        }, 2400),
      );
    }, 5200);
  }

  // 點擊第四頁「next」按鈕後切換至第五頁「操作方法」
  function enterHowToPlayPage() {
    if (isEnteringHowTo) return;
    if (
      !confessionRoomScene ||
      !confessionRoomScene.classList.contains("is-active")
    )
      return;

    isEnteringHowTo = true;
    confessionRoomScene.classList.remove("is-active");

    if (memoParallaxInstance) {
      memoParallaxInstance.disable();
    }

    timers.push(
      setTimeout(() => {
        if (howToPlayScene) {
          howToPlayScene.classList.add("is-active");
          startCandleDemoLoop();
        }
      }, 450),
    );
  }

  // 第五頁點擊滑鼠左鍵後切換至第六頁「切記，不要被神父發現你是兇手！」並啟動星火動畫
  function enterWarningPage() {
    if (isEnteringWarning) return;
    if (!howToPlayScene || !howToPlayScene.classList.contains("is-active"))
      return;

    isEnteringWarning = true;

    if (candleDemoTimer) {
      clearInterval(candleDemoTimer);
      candleDemoTimer = null;
    }

    howToPlayScene.classList.remove("is-active");

    timers.push(
      setTimeout(() => {
        if (warningScene) {
          if (selectedGender) {
            warningScene.setAttribute("data-gender", selectedGender);
          }
          warningScene.classList.add("is-active");
          sparksController.start();
        }
      }, 450),
    );
  }

  playIntroSequence();

  enterText.addEventListener("mouseenter", () => {
    candelSvg.classList.add("is-boosted");
  });

  enterText.addEventListener("mouseleave", () => {
    if (!isTransitioning) {
      candelSvg.classList.remove("is-boosted");
    }
  });

  enterText.addEventListener("click", (e) => {
    e.stopPropagation();
    enterCharacterPage();
  });

  introScene.addEventListener("click", () => {
    if (!isTransitioning) {
      playIntroSequence();
    }
  });

  pcBoy.addEventListener("click", () => {
    selectCharacterAndNext("male");
  });

  pcGirl.addEventListener("click", () => {
    selectCharacterAndNext("female");
  });

  if (startConfessionBtn) {
    startConfessionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      enterConfessionRoom();
    });
  }

  // 打字過程中點擊右側文字區塊可立即顯示完整句子與 next 按鈕
  if (briefingPanel) {
    briefingPanel.addEventListener("click", (e) => {
      if (isTypingBriefing && !isBriefingDone) {
        e.stopPropagation();
        finishBriefingTypewriter();
      }
    });
  }

  if (briefingNextBtn) {
    briefingNextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      enterHowToPlayPage();
    });
  }

  // 第五頁：點擊任意蠟燭可手動切換熄滅/點燃（不觸發切頁）
  if (howtoCandles) {
    howtoCandles.querySelectorAll(".mini-candle").forEach((candle) => {
      candle.addEventListener("click", (e) => {
        e.stopPropagation();
        candle.classList.toggle("is-out");
      });
    });
  }

  // 第五頁：點擊滑鼠左鍵（底部提示或場景空白處）進入第六頁警告畫面
  if (howtoStartPrompt) {
    howtoStartPrompt.addEventListener("click", (e) => {
      e.stopPropagation();
      enterWarningPage();
    });
  }

  if (howToPlayScene) {
    howToPlayScene.addEventListener("click", (e) => {
      if (e.button === 0) {
        enterWarningPage();
      }
    });
  }

  // 第六頁：點擊「開始遊戲」按鈕進入正式告解對話
  if (startGameBtn) {
    startGameBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      startGameBtn.classList.add("is-pressed");
      console.log("正式開始遊戲，已選性別：", selectedGender);
    });
  }
});
