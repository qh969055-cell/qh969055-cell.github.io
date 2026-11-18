document.addEventListener("DOMContentLoaded", () => {
  // 開場至警告頁：快取節點、管理場景狀態與共用動畫計時器。
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

  const getSavedGender = () => {
    try {
      return sessionStorage.getItem("selectedGender") || null;
    } catch {
      return null;
    }
  };

  const saveSelectedGender = (gender) => {
    if (!gender) return;
    try {
      sessionStorage.setItem("selectedGender", gender);
    } catch {
      // 忽略無法寫入的情況（例如隱私模式）
    }
  };

  const syncSceneGender = (scene) => {
    if (scene && selectedGender) {
      scene.setAttribute("data-gender", selectedGender);
    }
  };

  let selectedGender = getSavedGender();

  let memoParallaxInstance = null;
  let candleDemoTimer = null;

  let typewriterChars = [];
  let isTypingBriefing = false;
  let isBriefingDone = false;

  // 警告頁：依燭火位置產生星火，並支援視窗調整與滑鼠風向。
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

  // 前情提要：將文字拆成逐字動畫節點，並控制播放、跳過與重設。
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

  // 前情提要與背景素材：初始化視差效果，並在圖片載入失敗時依序嘗試備援。
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

  // 場景流程：統一重設狀態，並依序切換角色、前情提要、教學與警告頁。
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

  // 入口頁：播放開場動畫與燭火、文字進場
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

  // 第二頁：角色選擇頁，雙人同步淡入後顯示性別選擇框
  function enterCharacterPage() {
    if (isTransitioning) return;
    isTransitioning = true;
    clearTimers();

    candelSvg.classList.add("is-boosted");
    introScene.classList.remove("is-active");

    timers.push(
      setTimeout(() => {
        characterScene.classList.add("is-active");

        // 雙人同步淡入
        requestAnimationFrame(() => {
          pcBoy.style.transition = "";
          pcBoy.classList.add("is-visible");
          pcGirl.style.transition = "";
          pcGirl.classList.add("is-visible");
        });

        // 雙人進場後，底部性別選擇列淡入
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

  // 第二頁：點擊角色後，存入 selectedGender 並切至開始告解頁
  function selectCharacterAndNext(gender) {
    if (isSelectingGender) return;
    const targetChar = gender === "male" ? pcBoy : pcGirl;
    if (!targetChar.classList.contains("is-visible")) return;

    isSelectingGender = true;
    selectedGender = gender;
    saveSelectedGender(gender);

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

  // 第三頁：開始告解，切到前情提要頁並啟動打字機
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
              syncSceneGender(confessionRoomScene);
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

  // 第五頁：蠟燭示範動畫，模擬熄滅與復燃
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

  // 第四頁：點擊下一步，切入操作教學頁
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

  // 第五頁：點擊場景或提示區，進入第六頁警告畫面並啟動星火動畫
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
          syncSceneGender(warningScene);
          warningScene.classList.add("is-active");
          sparksController.start();
        }
      }, 450),
    );
  }

  // 綁定開場到警告頁的按鈕、角色、教學互動事件。
  playIntroSequence();

  // 首頁入口按鈕：滑鼠懸停時點亮燭火
  enterText.addEventListener("mouseenter", () => {
    candelSvg.classList.add("is-boosted");
  });

  // 首頁入口按鈕：滑鼠離開時恢復靜態燭火
  enterText.addEventListener("mouseleave", () => {
    if (!isTransitioning) {
      candelSvg.classList.remove("is-boosted");
    }
  });

  // 首頁入口按鈕：點擊進入角色選擇頁
  enterText.addEventListener("click", (e) => {
    e.stopPropagation();
    enterCharacterPage();
  });

  // 開場頁空白處點擊可重新播放 intro 動畫
  introScene.addEventListener("click", () => {
    if (!isTransitioning) {
      playIntroSequence();
    }
  });

  // 男角色點擊：存入 male，進入下一場景
  pcBoy.addEventListener("click", () => {
    selectCharacterAndNext("male");
  });

  // 女角色點擊：存入 female，進入下一場景
  pcGirl.addEventListener("click", () => {
    selectCharacterAndNext("female");
  });

  // 開始告解按鈕：進入前情提要頁
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

  // 前情提要下一步：進入操作說明頁
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

  // 第五頁提示區：點擊後進入警告頁
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
      saveSelectedGender(selectedGender);
      console.log("正式開始遊戲，已選性別：", selectedGender);
      // 從第六頁進入第七頁 
      enterQuestionScene();
    });
  }
  
  // 題目互動：快取頁面節點，並共用樣板建立記分板與心跳畫面的燭火。

  // 第七頁的整體場景
  const questionScene = document.getElementById("questionScene");
  const rhythmIntroScene = document.getElementById("rhythmIntroScene");
  const rhythmScene = document.getElementById("rhythmScene");
  const excuseScene = document.getElementById("excuseScene");
  const questionStage = questionScene.querySelector(".question-stage");
  const questionNpcLeft = document.getElementById("questionNpcLeft");
  const questionNpcRight = document.getElementById("questionNpcRight");

  // NPC 對話框容器
  const questionDialogues = document.getElementById("questionDialogues");

  // 四個選項的面板
  const questionChoicePanel = document.getElementById("questionChoicePanel");
  const questionScoreboard = document.getElementById("questionScoreboard");

  rhythmIntroScene.addEventListener("click", () => {
    rhythmIntroScene.classList.remove("is-active");
    window.dispatchEvent(new Event("startRhythmBranch"));
  });

  const candleSlotsTemplate = document.getElementById("candleSlotsTemplate");
  const rhythmCandlesWrap = document.getElementById("rhythmCandlesWrap");
  const excuseCandlesWrap = document.getElementById("excuseCandlesWrap");

  function renderCandleSlots(container, isScoreboard = false) {
    if (!container || !candleSlotsTemplate) return;

    const slots = candleSlotsTemplate.content.cloneNode(true);
    if (isScoreboard) {
      slots.querySelectorAll(".candle-flame-slot").forEach((slot) => {
        slot.classList.add("scoreboard-flame");
        slot.setAttribute("aria-hidden", "true");
      });
    }
    container.appendChild(slots);
  }

  renderCandleSlots(questionScoreboard, true);
  renderCandleSlots(rhythmCandlesWrap);
  renderCandleSlots(excuseCandlesWrap);

  const scoreboardFlames = questionScoreboard
    ? Array.from(questionScoreboard.querySelectorAll(".scoreboard-flame"))
    : [];

  // 取得所有選項按鈕
  const questionButtons = Array.from(
    document.querySelectorAll(".question-choice"),
  );

  // 五題結束後的完成畫面
  const questionFinish = document.getElementById("questionFinish");

  // 重新開始按鈕
  const questionRestartBtn = document.getElementById("questionRestartBtn");

  function syncQuestionDialogueBounds() {
    const stageBounds = questionStage.getBoundingClientRect();
    const choiceBounds = questionChoicePanel.getBoundingClientRect();
    questionDialogues.style.bottom = `${stageBounds.bottom - choiceBounds.top}px`;
  }

  window.addEventListener("resize", syncQuestionDialogueBounds);

  // 五題流程：保存題目索引、對話進度、答案、扣分與防重複點擊狀態。

  // 目前題目索引，0 代表第一題
  let questionIndex = 0;
  let questionDialogueIndex = 0;

  // 防止玩家連續點擊造成重複選擇
  let questionLocked = false;

  // 儲存對話動畫的計時器
  let questionTimers = [];

  // 記錄玩家在五題中選擇的答案
  // 0 = 第一個選項
  // 1 = 第二個選項
  // 2 = 第三個選項
  // 3 = 第四個選項
  const questionAnswers = [];
  let extinguishedCandleCount = 0;
  let hasTriggeredRhythmEvent = false;
  let hasTriggeredExcuseEvent = false;

  // 題目資料：每題包含依序顯示的對話、最多四個選項，以及會扣分的選項索引（從 0 開始）。

  const questionData = [
    //  第一題
    {
      dialogues: [
        {
          side: "left",
          text: "願長夜聆聽你的言語，亦寬恕你的罪行。",
        },
        {
          side: "right",
          text: "……日安，神父",
        },
        {
          side: "right",
          text: "（沉默）",
        },
        {
          side: "left",
          text: "若不知從何說起，便談談近日發生的事吧。",
        },
        {
          side: "right",
          text: "請原諒我的生疏，這是我第一次來此傾訴——昨日，我赴了奈克的邀約。",
        },
        {
          side: "left",
          text: "你們在何時相約？",
        },
        {
          side: "right",
          text: "我們在＿＿＿＿時，於鎮中央見面。打算邊吃邊談些生意。",
        },
      ],

      choices: ["12:00 a.m", "01:00 p.m", "02:00 p.m", "03:00 p.m"],
      penaltyChoiceIndex: 3,
    },

    //  第二題
    {
      dialogues: [
        {
          side: "right",
          text: "如今鎮上人人自危，誰也不願成為下一個目標。",
        },
        {
          side: "left",
          text: "那麼，就說說你的生意吧",
        },
        {
          side: "right",
          text: "您也對這些感興趣嗎？好的，不過請先容我說完這部分",
        },
        {
          side: "right",
          text: "我跟奈克相談甚歡，後來去了酒吧，也許是因為命案的緣故，店裡實在冷清的很",
        },
        {
          side: "left",
          text: "你們在哪裡談生意呢？",
        },
        {
          side: "right",
          text: "我們在酒吧的＿＿＿＿，談了一些買賣，我對這筆交易感到滿意。",
        },
      ],

      choices: ["舞池區", "附近小巷", "包廂裡", "吧檯座位"],
      penaltyChoiceIndex: 1,
    },

    //  第三題
    {
      dialogues: [
        {
          side: "right",
          text: "您想知道交易內容？",
        },
        {
          side: "right",
          text: "如您所願，既然我來到此處，自然不會有所隱瞞。",
        },
        {
          side: "right",
          text: "如今鎮上因命案戒備森嚴，許多東西都受到管制。",
        },
        {
          side: "left",
          text: "你買了甚麼呢？",
        },
        {
          side: "right",
          text: "不過是家用的＿＿＿＿",
        },
      ],

      choices: ["鋸子", "菜刀", "斧頭", "小刀"],
      penaltyChoiceIndex: 2,
    },

    //  第四題
    {
      dialogues: [
        {
          side: "left",
          text: "(沉默)",
        },
        {
          side: "right",
          text: "我對於在您面前撒謊感到抱歉，請原諒我———準確而言，是用來防身的。",
        },
        {
          side: "right",
          text: "我實在太擔心兇手會再度出現，因此，即使鎮上現在對刀械管制森嚴，我也必須這麼做。",
        },
        {
          side: "left",
          text: "你在酒吧除了談生意之外，還做了甚麼？",
        },
        {
          side: "right",
          text: "……神父，您這是在懷疑我嗎？",
        },
        {
          side: "right",
          text: "……罷了，我會回答您，我記得我還曾與酒吧內的＿＿＿＿交談過幾句。",
        },
      ],

      choices: ["泰德(服務生)", "湯姆(酒保)", "梅茲(商人)", "道卡茲(酒客)"],
      penaltyChoiceIndex: 1,
    },

    //  第五題
    {
      dialogues: [
        {
          side: "right",
          text: "他是個十足有趣的人，似乎對鎮上的一且瞭如指掌，即使我和他並不太熟悉，但他依舊知無不言。",
        },
        {
          side: "left",
          text: "你是否知道，你的行蹤與警方推測的兇手路線重疊？",
        },
        {
          side: "left",
          text: "甚至有人反應，目擊你出現在案發現場。",
        },
        {
          side: "right",
          text: "我？這不可能！並且就我所知，案發地點並未公開？",
        },
        {
          side: "right",
          text: "喔、不，您讓我開始擔憂自身的安危了。",
        },
        {
          side: "left",
          text: "那麼，你後來又去了哪裡？",
        },
        {
          side: "right",
          text: "我最後去了＿＿＿＿。",
        },
      ],

      choices: ["巷口", "住家", "旅店", "麵包店"],
      penaltyChoiceIndex: 0,
    },
  ];

  // 清理題目延遲動畫，避免換題後舊計時器繼續更新畫面。
  function clearQuestionTimers() {
    questionTimers.forEach(clearTimeout);

    questionTimers = [];
  }

  function resetQuestionScore() {
    extinguishedCandleCount = 0;
    scoreboardFlames.forEach((flame) =>
      flame.classList.remove("is-extinguished"),
    );
    if (questionScoreboard) {
      questionScoreboard.setAttribute(
        "aria-label",
        `蠟燭記分板，${scoreboardFlames.length}根燭火全亮`,
      );
    }
  }

  function extinguishNextCandle() {
    const flame =
      scoreboardFlames[scoreboardFlames.length - 1 - extinguishedCandleCount];
    if (!flame) return;

    flame.classList.add("is-extinguished");
    extinguishedCandleCount++;
    questionScoreboard.setAttribute(
      "aria-label",
      `蠟燭記分板，剩餘${scoreboardFlames.length - extinguishedCandleCount}根燭火`,
    );
  }

  function showQuestionChoices() {
    questionChoicePanel.classList.add("is-ready");
    questionButtons.forEach((button) => {
      button.disabled = button.hidden;
    });
  }

  function showNextQuestionDialogue() {
    const data = questionData[questionIndex];
    const dialogue = data.dialogues[questionDialogueIndex];
    if (!dialogue) return;

    questionDialogueIndex++;

    const isRightSpeaking = dialogue.side === "right";
    if (questionNpcLeft) {
      questionNpcLeft.src = isRightSpeaking
        ? "./images/bg/F_eyes.PNG"
        : "./images/bg/F_close.PNG";
    }
    if (questionNpcRight) {
      const playerFolder = selectedGender === "female" ? "PC_G" : "PC_B";
      const playerExpression = isRightSpeaking ? "close" : "open";
      questionNpcRight.src = `./images/${playerFolder}/PC_${playerExpression}.PNG`;
    }

    const bubble = document.createElement("div");
    bubble.className =
      "question-bubble " + (dialogue.side === "right" ? "right" : "left");
    bubble.textContent = dialogue.text;
    if (/[＿_]{2,}/.test(dialogue.text)) {
      bubble.classList.add("is-fill-in");
    }

    questionDialogues.appendChild(bubble);
    questionDialogues.scrollTop = questionDialogues.scrollHeight;

    if (questionDialogueIndex === data.dialogues.length) {
      showQuestionChoices();
    }
  }

  // 顯示題目、更新選項，並播放第一段對話。
  function renderQuestion() {
    // 清除上一題尚未執行的動畫
    clearQuestionTimers();

    // 解鎖題目
    questionLocked = false;

    // 取得目前題目的資料
    const data = questionData[questionIndex];
    questionDialogueIndex = 0;

    // 清空上一題的 NPC 對話
    questionDialogues.replaceChildren();

    // 先隱藏選項
    questionChoicePanel.classList.remove("is-ready");

    // 更新四個選項按鈕
    questionButtons.forEach((button, index) => {
      // 更換按鈕文字
      button.textContent = data.choices[index] || "";

      // 沒有文字的選項不顯示
      button.hidden = !data.choices[index];

      // 對話播放期間不能點擊
      button.disabled = true;
    });

    syncQuestionDialogueBounds();

    if (data.dialogues.length === 0) {
      showQuestionChoices();
    } else {
      showNextQuestionDialogue();
    }
  }

  // 從警告頁初始化並進入五題互動。
  function enterQuestionScene() {
    // 如果找不到第七頁，停止執行
    if (!questionScene) return;

    const isFemaleCharacter = selectedGender === "female";
    if (questionNpcRight) {
      questionNpcRight.src = isFemaleCharacter
        ? "./images/PC_G/PC_close.PNG"
        : "./images/PC_B/PC_close.PNG";
      questionNpcRight.alt = isFemaleCharacter ? "女角色" : "男角色";
    }

    // 停止第六頁的星火動畫
    sparksController.stop();

    // 隱藏原本第六頁
    warningScene.classList.remove("is-active");

    // 顯示第七頁
    questionScene.classList.add("is-active");
    syncSceneGender(rhythmScene);

    // 從第一題開始
    questionIndex = 0;
    hasTriggeredRhythmEvent = false;
    hasTriggeredExcuseEvent = false;

    // 清空上一次的答案
    questionAnswers.length = 0;
    resetQuestionScore();

    // 隱藏完成畫面
    questionFinish.hidden = true;

    // 顯示第一題
    renderQuestion();
  }

  // 玩家作答、處理扣分與特殊環節分支。
  function continueQuestionnaire() {
    if (questionIndex < questionData.length) {
      renderQuestion();
    } else {
      questionChoicePanel.classList.remove("is-ready");
      questionDialogues.replaceChildren();
      questionFinish.hidden = false;
      console.log("五題選擇紀錄：", questionAnswers);
    }
  }

  function startExcuseBranchIfReady() {
    if (
      !excuseScene ||
      hasTriggeredExcuseEvent ||
      extinguishedCandleCount !== 5
    ) {
      return false;
    }

    hasTriggeredExcuseEvent = true;
    syncSceneGender(excuseScene);
    excuseScene.classList.add("is-active");
    window.dispatchEvent(new Event("startExcuseBranch"));
    return true;
  }

  window.addEventListener("rhythmBranchCompleted", (event) => {
    rhythmScene.classList.remove("is-active");
    if (event.detail && event.detail.success === false) {
      extinguishNextCandle();
    }
    if (startExcuseBranchIfReady()) return;
    continueQuestionnaire();
  });

  window.addEventListener("excuseBranchCompleted", (event) => {
    excuseScene.classList.remove("is-active");
    if (event.detail && event.detail.success === false) {
      extinguishNextCandle();
    }
    continueQuestionnaire();
  });

  function chooseQuestion(index) {
    // 防止重複點擊
    if (questionLocked || questionButtons[index].disabled) {
      return;
    }

    // 鎖定目前題目
    questionLocked = true;

    let startRhythmAfterAnswer = false;
    let startExcuseAfterAnswer = false;
    if (index === questionData[questionIndex].penaltyChoiceIndex) {
      extinguishNextCandle();
      if (!hasTriggeredRhythmEvent && extinguishedCandleCount === 2) {
        hasTriggeredRhythmEvent = true;
        startRhythmAfterAnswer = true;
      } else if (
        !hasTriggeredExcuseEvent &&
        extinguishedCandleCount === 5
      ) {
        startExcuseAfterAnswer = true;
      }
    }

    // 儲存玩家選擇的答案
    questionAnswers.push(index);

    // 暫時停用所有按鈕
    questionButtons.forEach((button) => {
      button.disabled = true;
    });

    // 被選擇的按鈕變色
    questionButtons[index].style.background = "#898ed0";

    // ===== 延遲後進入下一題 =====

    questionTimers.push(
      setTimeout(() => {
        // 還原按鈕顏色
        questionButtons[index].style.background = "";

        // 題目進度加一
        questionIndex++;

        if (startRhythmAfterAnswer) {
          syncSceneGender(rhythmScene);
          rhythmIntroScene.classList.add("is-active");
          return;
        }

        if (startExcuseAfterAnswer) {
          startExcuseBranchIfReady();
          return;
        }

        continueQuestionnaire();
      }, 450),
    );
  }

  // 題目、對話推進與重玩的事件綁定。
  questionButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      chooseQuestion(index);
    });
  });

  questionStage.addEventListener("click", () => {
    if (!questionScene.classList.contains("is-active") || questionLocked) {
      return;
    }

    const data = questionData[questionIndex];
    if (data && questionDialogueIndex < data.dialogues.length) {
      showNextQuestionDialogue();
    }
  });

  if (questionRestartBtn) {
    questionRestartBtn.addEventListener("click", () => {
      // 回到第一題
      questionIndex = 0;

      // 清除之前的答案
      questionAnswers.length = 0;
      resetQuestionScore();
      hasTriggeredRhythmEvent = false;
      hasTriggeredExcuseEvent = false;

      // 隱藏完成畫面
      questionFinish.hidden = true;

      // 重新顯示第一題
      renderQuestion();
    });
  }

});

// 心跳檢定：控制對話、音效、節奏判定、燭火結果與角色素材。
document.addEventListener("DOMContentLoaded", () => {
  const rhythmScene = document.getElementById("rhythmScene");
  const rhythmDialogueText = document.getElementById("rhythmDialogueText");
  const dialogueNextHint = document.getElementById("dialogueNextHint");
  
  const rhythmTrackArea = document.getElementById("rhythmTrackArea");
  const rhythmWaveLabel = document.getElementById("rhythmWaveLabel");
  const rhythmWavePips = document.getElementById("rhythmWavePips");
  const rhythmEcg = document.getElementById("rhythmEcg");
  const rhythmEcgWindow = document.getElementById("rhythmEcgWindow");
  const rhythmEcgTrace = document.getElementById("rhythmEcgTrace");
  const rhythmEcgCursor = document.getElementById("rhythmEcgCursor");
  const rhythmEcgDot = document.getElementById("rhythmEcgDot");
  const rhythmJudgment = document.getElementById("rhythmJudgment");

  const rhythmCharacterImg = document.getElementById("rhythmCharacterImg");
  const rhythmHeartBtn = document.getElementById("rhythmHeartBtn");
  const rhythmCandlesWrap = document.getElementById("rhythmCandlesWrap");
  const rhythmCandlesImg = document.getElementById("rhythmCandlesImg");
  const rhythmInstructionBox = document.getElementById("rhythmInstructionBox");
  const rhythmInstructionText = document.getElementById(
    "rhythmInstructionText",
  );
  const rhythmActionBtn = document.getElementById("rhythmActionBtn");

  let selectedGender = rhythmScene
    ? rhythmScene.getAttribute("data-gender")
    : "male";

  function alignRhythmCandlesWithInstructionBox() {
    if (!rhythmCandlesWrap || !rhythmInstructionBox) return;

    const boxRect = rhythmInstructionBox.getBoundingClientRect();
    // The right edge of the left drip and holder baseline in IMG_8976.PNG.
    const leftDripRight = 182 / 1920;
    const holderBottom = 766 / 1080;
    const scale = 0.75;
    const imageHeight = (boxRect.width * 9) / 16;

    rhythmCandlesWrap.style.width = `${boxRect.width}px`;
    rhythmCandlesWrap.style.height = `${imageHeight}px`;
    rhythmCandlesWrap.style.transformOrigin = "top left";
    rhythmCandlesWrap.style.transform = `scale(${scale})`;
    rhythmCandlesWrap.style.left =
      `${boxRect.left - boxRect.width * leftDripRight * scale}px`;
    rhythmCandlesWrap.style.top =
      `${boxRect.top - imageHeight * holderBottom * scale}px`;
  }

  window.addEventListener("resize", alignRhythmCandlesWithInstructionBox);
  if (rhythmInstructionBox && typeof ResizeObserver !== "undefined") {
    new ResizeObserver(alignRhythmCandlesWithInstructionBox).observe(
      rhythmInstructionBox,
    );
  }

  function configureRhythmAssets() {
    const isFemaleCharacter = selectedGender === "female";
    const characterSrc = isFemaleCharacter
      ? "./images/PC_G/PC_heart.PNG"
      : "./images/PC_B/PC_heart.PNG";

    if (rhythmCharacterImg) {
      rhythmCharacterImg.src = characterSrc;
    }

    if (rhythmCandlesImg) {
      rhythmCandlesImg.src = "./images/bg/IMG_8976.PNG";
    }
  }
  // =========================================
  // Web Audio 合成音效
  // =========================================
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function playTone(
    freq,
    duration,
    type = "sine",
    gainVal = 0.14,
    endFreqRatio = 0.55,
  ) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(30, freq * endFreqRatio),
      now + duration,
    );

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  // =========================================
  // 打字機效果控制器
  // =========================================
  const typewriter = (() => {
    let timerId = null;
    let isTyping = false;
    let fullText = "";
    let targetEl = null;
    let onDoneCallback = null;

    function stop() {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      isTyping = false;
      if (targetEl) {
        targetEl.classList.remove("is-typing");
      }
    }

    function finishImmediately() {
      if (!isTyping) return false;
      stop();
      if (targetEl) {
        targetEl.textContent = fullText;
      }
      const cb = onDoneCallback;
      onDoneCallback = null;
      if (typeof cb === "function") cb();
      return true;
    }

    function start(el, text, speed = 46, onDone = null, withSound = true) {
      stop();
      if (!el) return;
      targetEl = el;
      fullText = text;
      onDoneCallback = onDone;
      isTyping = true;
      el.textContent = "";
      el.classList.add("is-typing");

      const chars = Array.from(text);
      let idx = 0;

      function step() {
        if (!isTyping) return;
        if (idx >= chars.length) {
          stop();
          const cb = onDoneCallback;
          onDoneCallback = null;
          if (typeof cb === "function") cb();
          return;
        }

        const ch = chars[idx++];
        el.textContent += ch;
        if (withSound && ch.trim() !== "" && idx % 2 === 1) {
          playTone(520, 0.03, "triangle", 0.03, 0.85);
        }

        const pauseExtra = "，。！？…、".includes(ch) ? 130 : 0;
        timerId = setTimeout(step, speed + pauseExtra);
      }

      step();
    }

    return {
      start,
      finishImmediately,
      stop,
      get active() {
        return isTyping;
      },
    };
  })();

  // =========================================
  // 遊戲數值與流程圖分支設定
  // 過：兩根蠟燭熄滅（7 -> 5 根燃燒）
  // 沒過：三根蠟燭熄滅（7 -> 4 根燃燒）
  // =========================================
  const TOTAL_CANDLES = 7;
  const PASS_EXTINGUISH_COUNT = 2;
  const FAIL_EXTINGUISH_COUNT = 3;
  const HIT_TOLERANCE = 1.6;

  let phase = "inactive";

  const introScript = [
    "和您的對話令我感到懷疑。",
    "你的呼吸越來越急促……在主面前，你隱瞞了什麼？",
    "別試圖用言語掩飾了——讓我聽聽你真實的心跳聲吧。",
  ];
  let introLineIndex = 0;

  const waves = [
    {
      label: "第 1 階段心律：急促加速脈動",
      dialogue: "「和您的對話令我感到懷疑。」",
      zoneStart: 48,
      zoneWidth: 13,
      duration: 1750,
      curve(t) {
        return (0.45 * t + 0.55 * Math.pow(t, 2.2)) * 100;
      },
    },
    {
      label: "第 2 階段心律：驟停頓挫・突進",
      dialogue: "「……你的眼神為什麼在閃躲？」",
      zoneStart: 60,
      zoneWidth: 12,
      duration: 1950,
      curve(t) {
        if (t < 0.28) return (t / 0.28) * 38;
        if (t < 0.5) return 38 + ((t - 0.28) / 0.22) * 2;
        const k = (t - 0.5) / 0.5;
        return 40 + Math.pow(k, 1.25) * 60;
      },
    },
    {
      label: "第 3 階段心律：心律顫動・逆向回彈",
      dialogue: "「別想編造謊言，你的脈搏正在發抖！」",
      zoneStart: 42,
      zoneWidth: 11,
      duration: 2050,
      curve(t) {
        if (t < 0.32) return (t / 0.32) * 34;
        if (t < 0.48) return 34 - ((t - 0.32) / 0.16) * 11;
        const k = (t - 0.48) / 0.52;
        return 23 + Math.pow(k, 1.35) * 77;
      },
    },
    {
      label: "第 4 階段心律：極限心悸・終局詰問",
      dialogue: "「案發當晚，你真的待在教堂裡嗎？！」",
      zoneStart: 66,
      zoneWidth: 10,
      duration: 1480,
      curve(t) {
        const jitter = Math.sin(t * Math.PI * 3) * 0.025;
        return Math.min(100, Math.max(0, (t + jitter) * 100));
      },
    },
  ];

  // =========================================
  // 蠟燭動態控制（由右至左依序熄滅並飄煙）
  // =========================================
  let candleTimers = [];

  function clearCandleTimers() {
    candleTimers.forEach((id) => clearTimeout(id));
    candleTimers = [];
  }

  function resetCandles() {
    clearCandleTimers();
    if (!rhythmCandlesWrap) return;
    rhythmCandlesWrap.querySelectorAll(".candle-flame-slot").forEach((slot) => {
      slot.classList.remove("is-extinguished");
    });
  }

  function extinguishCandlesFromRight(count, immediate = false) {
    clearCandleTimers();
    if (!rhythmCandlesWrap) return;
    const clampedCount = Math.min(TOTAL_CANDLES, Math.max(0, count));
    for (let i = 0; i < clampedCount; i += 1) {
      const targetIndex = TOTAL_CANDLES - 1 - i;
      const slot = rhythmCandlesWrap.querySelector(
        `.candle-flame-slot[data-candle-index="${targetIndex}"]`,
      );
      if (slot && !slot.classList.contains("is-extinguished")) {
        if (immediate) {
          slot.classList.add("is-extinguished");
          continue;
        }
        const timerId = setTimeout(() => {
          slot.classList.add("is-extinguished");
          playTone(190, 0.18, "sine", 0.06, 0.4);
        }, i * 220);
        candleTimers.push(timerId);
      }
    }
  }

  // =========================================
  // 判定回饋特效（通過或失誤）
  // =========================================
  function showJudgment(text, isGood) {
    if (!rhythmJudgment) return;
    rhythmJudgment.textContent = text;
    rhythmJudgment.classList.remove("is-good", "is-bad");
    void rhythmJudgment.offsetWidth;
    rhythmJudgment.classList.add(isGood ? "is-good" : "is-bad");
  }

  // =========================================
  // 開場對話環節控制
  // =========================================
  function playIntroDialogueLine(index) {
    phase = "intro-dialogue";
    if (dialogueNextHint) dialogueNextHint.classList.remove("is-visible");
    if (rhythmInstructionBox)
      rhythmInstructionBox.classList.add("is-clickable");
    if (rhythmHeartBtn) rhythmHeartBtn.disabled = true;
    if (rhythmTrackArea) rhythmTrackArea.classList.add("is-standby");

    if (index === 0 && rhythmInstructionText) {
      rhythmInstructionText.textContent =
        "請先聆聽神父的對話（點擊下方方框或按空白鍵繼續）。";
    }

    typewriter.start(rhythmDialogueText, introScript[index], 46, () => {
      if (dialogueNextHint) {
        dialogueNextHint.textContent =
          index < introScript.length - 1
            ? "點擊下方方框繼續 ▾"
            : "點擊下方方框開始檢定 ▸";
        dialogueNextHint.classList.add("is-visible");
      }
    });
  }

  function advanceIntroDialogue() {
    if (phase !== "intro-dialogue") return;
    ensureAudio();

    if (typewriter.finishImmediately()) {
      return;
    }

    introLineIndex += 1;
    if (introLineIndex < introScript.length) {
      playIntroDialogueLine(introLineIndex);
    } else {
      if (dialogueNextHint) dialogueNextHint.classList.remove("is-visible");
      if (rhythmInstructionBox)
        rhythmInstructionBox.classList.remove("is-clickable");
      rhythmController.start();
    }
  }

  // =========================================
  // 不規則心跳節奏控制器
  // =========================================
  const rhythmController = (() => {
    let rafId = null;
    let stepTimers = [];
    let waveIndex = 0;
    let scanPercent = 0;
    let activeZoneStart = 48;
    let activeZoneWidth = 13;
    let isSweepActive = false;
    let sweepStartTime = 0;
    let trace = [];
    let pendingPeaks = [];
    let wavePeaks = [];
    let waveStrengths = [];
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const beatShape = [[-27, 0], [-18, 5], [-12, 0], [-6, -11], [0, 53],
      [9, -21], [17, 0], [31, 10], [46, 0]];

    function drawTrace(peaks, amplitude, now = 0) {
      function baselineAt(x) {
        if (!now) return 76;
        return 76 + Math.sin(x / 115 - now / 230) * 2.8 +
          Math.sin(x / 48 - now / 430) * 1.2;
      }

      trace = [[0, baselineAt(0)]];
      peaks.forEach((peak, index) => {
        const base = Array.isArray(amplitude) ? amplitude[index] : amplitude;
        const strength = now ? base * (1 + Math.sin(now / 180 - index * .92) * .21) : base;
        beatShape.forEach(([offset, height]) => {
          const x = peak * 10 + offset;
          if (x > 0 && x < 1000) trace.push([x, baselineAt(x) - height * strength]);
        });
      });
      trace.push([1000, baselineAt(1000)]);
      rhythmEcgTrace?.setAttribute("points", trace.map(point =>
        point.map(value => value.toFixed(2)).join(",")).join(" "));
    }

    function drawAmbientTrace(now) {
      const stable = rhythmEcg?.classList.contains("is-stable");
      if (phase === "rhythm" && wavePeaks.length) {
        drawTrace(wavePeaks, waveStrengths, now);
        positionScan(scanPercent);
        return;
      }

      const scrolling = motionPreference.matches ? 0 : (now / (stable ? 48 : 38)) % 100;
      const beats = stable ? [8, 33, 58, 83] : [9, 29, 58, 74, 91];
      const peaks = [];
      const strengths = [];
      for (let repeat = -1; repeat <= 1; repeat++) {
        beats.forEach((beat, index) => {
          const position = repeat * 100 + beat - scrolling;
          if (position < -5 || position > 104) return;
          peaks.push(position);
          strengths.push(stable ? .64 : [.56, 1, .73, .9, .49][index]);
        });
      }
      drawTrace(peaks, strengths);
    }

    let ambientFrame = null;

    function animateAmbient(now) {
      if (rhythmScene?.classList.contains("is-active") && !motionPreference.matches) {
        if (!isSweepActive) drawAmbientTrace(now);
        ambientFrame = requestAnimationFrame(animateAmbient);
      } else {
        ambientFrame = null;
      }
    }

    function syncAmbient() {
      const active = rhythmScene?.classList.contains("is-active");
      if (active && !motionPreference.matches) {
        if (ambientFrame === null) ambientFrame = requestAnimationFrame(animateAmbient);
        return;
      }
      if (ambientFrame !== null) {
        cancelAnimationFrame(ambientFrame);
        ambientFrame = null;
      }
      if (active && !isSweepActive) drawAmbientTrace(0);
    }

    if (rhythmScene) {
      const sceneObserver = new MutationObserver(syncAmbient);
      sceneObserver.observe(rhythmScene, { attributes: true, attributeFilter: ["class"] });
      motionPreference.addEventListener("change", syncAmbient);
      syncAmbient();
    }

    function isInWindow(percent) {
      return percent >= activeZoneStart - HIT_TOLERANCE &&
        percent <= activeZoneStart + activeZoneWidth + HIT_TOLERANCE;
    }

    function positionScan(percent) {
      if (!rhythmEcgCursor || !rhythmEcgDot) return;
      const x = Math.min(995, Math.max(5, percent * 10));
      const right = trace.findIndex(point => point[0] >= x);
      const [x0, y0] = trace[right - 1];
      const [x1, y1] = trace[right];
      const y = y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
      rhythmEcgCursor.setAttribute("transform", `translate(${x} 0)`);
      rhythmEcgDot.setAttribute("y1", y);
      rhythmEcgDot.setAttribute("y2", y);
      rhythmEcg?.classList.toggle("is-in-window", isInWindow(percent));
    }

    function clearStepTimers() {
      stepTimers.forEach((id) => clearTimeout(id));
      stepTimers = [];
    }

    function triggerHeartbeatPulse() {
      playTone(92, 0.13, "sine", 0.24);
      if (rhythmHeartBtn) {
        rhythmHeartBtn.classList.add("is-beating");
        stepTimers.push(
          setTimeout(() => rhythmHeartBtn.classList.remove("is-beating"), 130),
        );
      }
    }

    function updateWaveUI() {
      const current = waves[Math.min(waveIndex, waves.length - 1)];
      activeZoneWidth = current.zoneWidth;
      activeZoneStart = current.zoneStart;

      if (rhythmWaveLabel) rhythmWaveLabel.textContent = current.label;
      if (rhythmDialogueText) {
        typewriter.start(rhythmDialogueText, current.dialogue, 32, null, false);
      }

      if (rhythmWavePips) {
        const pips = rhythmWavePips.querySelectorAll(".wave-pip");
        pips.forEach((pip, idx) => {
          pip.classList.remove("is-current", "is-cleared");
          if (idx < waveIndex) pip.classList.add("is-cleared");
          else if (idx === waveIndex) pip.classList.add("is-current");
        });
      }
    }

    function startWaveSweep() {
      if (phase !== "rhythm") return;
      const current = waves[waveIndex];
      updateWaveUI();
      scanPercent = 0;
      const target = activeZoneStart + activeZoneWidth / 2;
      const sidePeaks = [[14, 30, 84], [12, 48, 87], [17, 32, 79], [19, 41, 89]];
      wavePeaks = [...sidePeaks[waveIndex].slice(0, 2), target, sidePeaks[waveIndex][2]];
      pendingPeaks = [...wavePeaks];
      const irregularity = 1 - waveIndex * 0.2;
      waveStrengths = [1 - 0.22 * irregularity, 1 + 0.13 * irregularity,
        1, 1 - 0.34 * irregularity];
      drawTrace(wavePeaks, waveStrengths);
      if (rhythmEcgWindow) {
        rhythmEcgWindow.style.left = `${activeZoneStart - HIT_TOLERANCE}%`;
        rhythmEcgWindow.style.width = `${activeZoneWidth + HIT_TOLERANCE * 2}%`;
      }
      positionScan(0);

      isSweepActive = true;
      sweepStartTime = performance.now();
      triggerHeartbeatPulse();

      function tick(now) {
        if (!isSweepActive || phase !== "rhythm") return;
        const elapsed = now - sweepStartTime;
        const t = Math.min(1, elapsed / current.duration);

        scanPercent = current.curve(t);
        if (pendingPeaks.length && scanPercent >= pendingPeaks[0]) {
          do {
            pendingPeaks.shift();
          } while (pendingPeaks.length && scanPercent >= pendingPeaks[0]);
          triggerHeartbeatPulse();
        }
        if (!motionPreference.matches) drawTrace(wavePeaks, waveStrengths, now);
        positionScan(scanPercent);

        if (t >= 1) {
          isSweepActive = false;
          handleFail("錯過心跳節拍");
          return;
        }

        rafId = requestAnimationFrame(tick);
      }

      rafId = requestAnimationFrame(tick);
    }

    function finishBranch(isPassed, failReason = "") {
      phase = "outro-dialogue";
      isSweepActive = false;
      clearStepTimers();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (rhythmHeartBtn) rhythmHeartBtn.disabled = true;
      rhythmEcg?.classList.remove("is-hit", "is-in-window");
      rhythmEcg?.classList.add(isPassed ? "is-stable" : "is-missed");
      drawAmbientTrace(performance.now());

      if (isPassed) {
        playTone(659.25, 0.35, "triangle", 0.2, 1.15);
        if (rhythmWaveLabel)
          rhythmWaveLabel.textContent = "檢定結果：過（兩根蠟燭熄滅）";

        typewriter.start(
          rhythmDialogueText,
          "「……看來只是我多心了。願主寬恕你的不安，請繼續告解吧。」",
          44,
        );
        if (rhythmInstructionText) {
          typewriter.start(
            rhythmInstructionText,
            "完美通過！兩根蠟燭熄滅，成功瞞過神父的懷疑。",
            32,
            () => {
              if (rhythmActionBtn) {
                rhythmActionBtn.textContent = "繼續告解對話";
                rhythmActionBtn.dataset.outcome = "success";
                rhythmActionBtn.hidden = false;
              }
            },
            false,
          );
        }
      } else {
        playTone(98, 0.45, "sawtooth", 0.2, 0.5);
        extinguishCandlesFromRight(FAIL_EXTINGUISH_COUNT);
        showJudgment("未通過", false);

        if (rhythmTrackArea) {
          rhythmTrackArea.classList.remove("is-shake");
          void rhythmTrackArea.offsetWidth;
          rhythmTrackArea.classList.add("is-shake");
        }
        if (rhythmScene) {
          rhythmScene.classList.add("is-miss-flash");
          stepTimers.push(
            setTimeout(
              () => rhythmScene.classList.remove("is-miss-flash"),
              360,
            ),
          );
        }

        if (rhythmWaveLabel) {
          rhythmWaveLabel.textContent = `檢定結果：沒過（${failReason}・三根蠟燭熄滅）`;
        }
        typewriter.start(
          rhythmDialogueText,
          "「劇烈的心跳與慌亂已經出賣了你……你根本不是無辜的！」",
          44,
        );
        if (rhythmInstructionText) {
          typewriter.start(
            rhythmInstructionText,
            `沒過（${failReason}）：三根蠟燭熄滅，請繼續告解。`,
            32,
            () => {
              if (rhythmActionBtn) {
                rhythmActionBtn.textContent = "繼續告解對話";
                rhythmActionBtn.dataset.outcome = "failure";
                rhythmActionBtn.hidden = false;
              }
            },
            false,
          );
        }
      }
    }

    function handleFail(reason) {
      if (phase !== "rhythm") return;
      finishBranch(false, reason);
    }

    function handleHitAttempt() {
      if (phase !== "rhythm" || !isSweepActive) return;

      ensureAudio();
      isSweepActive = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      const isHit = isInWindow(scanPercent);

      if (isHit) {
        playTone(587.33, 0.28, "triangle", 0.18, 1.1);
        if (rhythmHeartBtn) {
          rhythmHeartBtn.classList.remove("is-hit-pop");
          void rhythmHeartBtn.offsetWidth;
          rhythmHeartBtn.classList.add("is-hit-pop");
          stepTimers.push(
            setTimeout(
              () => rhythmHeartBtn.classList.remove("is-hit-pop"),
              520,
            ),
          );
        }
        rhythmEcg?.classList.add("is-hit");
        stepTimers.push(setTimeout(() => rhythmEcg?.classList.remove("is-hit"), 360));

        waveIndex += 1;
        updateWaveUI();
        showJudgment("完美通過", true);

        if (waveIndex >= waves.length) {
          stepTimers.push(setTimeout(() => finishBranch(true), 520));
          return;
        }

        stepTimers.push(
          setTimeout(() => {
            if (phase === "rhythm") startWaveSweep();
          }, 680),
        );
      } else {
        handleFail("未能抓準心律");
      }
    }

    return {
      start() {
        this.stop();
        ensureAudio();
        phase = "rhythm";
        waveIndex = 0;
        if (rhythmTrackArea) rhythmTrackArea.classList.remove("is-standby");
        if (rhythmHeartBtn) rhythmHeartBtn.disabled = false;
        if (rhythmActionBtn) rhythmActionBtn.hidden = true;
        if (rhythmInstructionText) {
          rhythmInstructionText.textContent =
            "心電圖亮點進入淡綠色區域時，點擊紅心或按空白鍵。";
        }

        stepTimers.push(setTimeout(() => startWaveSweep(), 380));
      },
      stop() {
        isSweepActive = false;
        rhythmEcg?.classList.remove("is-stable", "is-missed", "is-hit", "is-in-window");
        wavePeaks = [];
        waveStrengths = [];
        drawAmbientTrace(0);
        positionScan(0);
        if (rhythmEcgWindow) rhythmEcgWindow.style.width = "0";
        clearStepTimers();
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
      triggerHit() {
        handleHitAttempt();
      },
      handleFail,
    };
  })();

  // =========================================
  // 事件綁定
  // =========================================
  if (rhythmInstructionBox) {
    rhythmInstructionBox.addEventListener("click", (e) => {
      if (phase !== "intro-dialogue") return;
      e.stopPropagation();
      advanceIntroDialogue();
    });
  }

  if (rhythmHeartBtn) {
    rhythmHeartBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (phase === "rhythm") {
        rhythmController.triggerHit();
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (!rhythmScene || !rhythmScene.classList.contains("is-active")) return;
    if (e.code === "Space" || e.code === "Enter") {
      if (phase === "intro-dialogue") {
        e.preventDefault();
        advanceIntroDialogue();
      } else if (phase === "rhythm" && e.code === "Space") {
        e.preventDefault();
        rhythmController.triggerHit();
      }
    }
  });

  if (rhythmActionBtn) {
    rhythmActionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const outcome = rhythmActionBtn.dataset.outcome;
      if (outcome !== "success" && outcome !== "failure") return;

      const success = outcome === "success";
      const litCandles =
        TOTAL_CANDLES -
        (success ? PASS_EXTINGUISH_COUNT : FAIL_EXTINGUISH_COUNT);
      phase = "inactive";
      window.dispatchEvent(
        new CustomEvent("rhythmBranchCompleted", {
          detail: { success, litCandles, gender: selectedGender },
        }),
      );
      if (window.parent !== window) {
        window.parent.postMessage(
          {
            type: "rhythmBranchCompleted",
            success,
            litCandles,
          },
          "*",
        );
      }
    });
  }

  window.addEventListener("startRhythmBranch", () => {
    if (!rhythmScene) return;
    selectedGender = rhythmScene.getAttribute("data-gender") || "male";
    configureRhythmAssets();
    rhythmController.stop();
    typewriter.stop();
    introLineIndex = 0;
    phase = "inactive";
    rhythmScene.classList.remove("is-miss-flash");
    alignRhythmCandlesWithInstructionBox();
    rhythmScene.classList.add("is-active");
    resetCandles();
    extinguishCandlesFromRight(PASS_EXTINGUISH_COUNT, true);
    if (rhythmActionBtn) rhythmActionBtn.hidden = true;
    playIntroDialogueLine(0);
  });

  requestAnimationFrame(() => {
    resetCandles();
  });
});

// Integrated excuse branch controller.
document.addEventListener("DOMContentLoaded", () => {
  const excuseScene = document.getElementById("excuseScene");
  const hudTimerCard = document.getElementById("hudTimerCard");
  const timerValueText = document.getElementById("timerValueText");

  const leftDialogueColumn = document.getElementById("leftDialogueColumn");
  const centerDialogueColumn = document.getElementById("centerDialogueColumn");
  const dialogueControlHint = document.getElementById("dialogueControlHint");

  const excuseCharacterImg = document.getElementById("excuseCharacterImg");
  const excuseCandlesWrap = document.getElementById("excuseCandlesWrap");
  const excuseCandlesImg = document.getElementById("excuseCandlesImg");
  const excuseFeedbackBanner = document.getElementById("excuseFeedbackBanner");

  const excuseTypingBox = document.getElementById("excuseTypingBox");
  const typingTimerFill = document.getElementById("typingTimerFill");
  const typingStatusBadge = document.getElementById("typingStatusBadge");
  const excuseActionBtn = document.getElementById("excuseActionBtn");
  const typingLettersGrid = document.getElementById("typingLettersGrid");

  // 素材副檔名自動備援
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

  setupImageFallback(excuseCandlesImg, [
    `${excuseScene.dataset.assetBase || "./images/"}Candle_0.png`,
    `${excuseScene.dataset.assetBase || "./images/"}Candle_0.jpg`,
  ]);

  // =========================================
  // Web Audio 合成音效
  // =========================================
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function playTone(
    freq,
    duration,
    type = "sine",
    gainVal = 0.14,
    endFreqRatio = 0.6,
  ) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(30, freq * endFreqRatio),
      now + duration,
    );

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  // =========================================
  // 打字機效果控制器
  // =========================================
  const typewriter = (() => {
    let timerId = null;
    let isTyping = false;
    let fullText = "";
    let targetEl = null;
    let onDoneCallback = null;

    function stop() {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      isTyping = false;
      if (targetEl) {
        targetEl.classList.remove("is-typing");
      }
    }

    function finishImmediately() {
      if (!isTyping) return false;
      stop();
      if (targetEl) {
        targetEl.textContent = fullText;
      }
      const cb = onDoneCallback;
      onDoneCallback = null;
      if (typeof cb === "function") cb();
      return true;
    }

    function start(el, text, speed = 42, onDone = null, withSound = true) {
      stop();
      if (!el) return;
      targetEl = el;
      fullText = text;
      onDoneCallback = onDone;
      isTyping = true;
      el.textContent = "";
      el.classList.add("is-typing");

      const chars = Array.from(text);
      let idx = 0;

      function step() {
        if (!isTyping) return;
        if (idx >= chars.length) {
          stop();
          const cb = onDoneCallback;
          onDoneCallback = null;
          if (typeof cb === "function") cb();
          return;
        }

        const ch = chars[idx++];
        el.textContent += ch;
        if (withSound && ch.trim() !== "" && idx % 2 === 1) {
          playTone(540, 0.028, "triangle", 0.028, 0.85);
        }

        const pauseExtra = "，。！？…、".includes(ch) ? 115 : 0;
        timerId = setTimeout(step, speed + pauseExtra);
      }

      step();
    }

    return {
      start,
      finishImmediately,
      stop,
      get active() {
        return isTyping;
      },
    };
  })();

  // 狡辯計時與本環節的燭火顯示。
  const TOTAL_CANDLES = 7;
  const PASS_EXTINGUISH_COUNT = 5; // 過：五根蠟燭熄滅
  const FAIL_EXTINGUISH_COUNT = 6; // 沒過：六根蠟燭熄滅
  const ROUND_TIME_LIMIT = 5.0; // 每題限時 5 秒

  let remainingTime = ROUND_TIME_LIMIT;
  let phase = "inactive";
  let currentRoundIndex = 0;
  let dialogueStepIndex = 0;
  let activeDialogueList = [];
  let activeWord = "";
  let typedCount = 0;
  let countdownRafId = null;
  let lastFrameTime = 0;
  let transitionTimers = [];

  // 四題為共用題庫，每次狡辯從中隨機抽取兩題。
  const originalRounds = [
    {
      word: "killer",
      dialogues: [
        { side: "left", text: "我親愛的教徒。" },
        { side: "left", text: "您確定對我沒有任何隱瞞？" },
        { side: "center", text: "當然，我親愛的神父。" },
        { side: "center", text: "我怎麼能對你說謊呢？" },
        { side: "center", text: "殺手怎麼能是我呢？" },
        { side: "center", text: "請不要聽信那些胡言亂語。", separated: true },
      ],
    },
    {
      word: "weapon",
      dialogues: [
        {
          side: "left",
          text: "那麼，現場遺留的兇器又該作何解釋？",
          leftSeparated: true,
        },
        {
          side: "center",
          text: "那不過是祈禱儀式用的器具罷了。",
          replaceBottom: true,
        },
        {
          side: "center",
          text: "請不要聽信那些胡言亂語。",
          replaceBottom: true,
        },
      ],
    },
  ];
  const additionalRounds = [
    {
      word: "corpse",
      dialogues: [
        { side: "left", text: "那麼地窖裡的氣味該怎麼解釋？" },
        { side: "left", text: "有人看見你深夜獨自進出。" },
        { side: "left", text: "那具屍體究竟是怎麼回事？" },
        { side: "center", text: "神父，您誤會了！" },
        { side: "center", text: "我只是去整理陳年的酒桶。" },
        { side: "center", text: "根本沒有您說的任何屍體。" },
        { side: "left", text: "在主面前，謊言無所遁形。", separated: true },
        {
          side: "center",
          text: "請相信我，那只是腐壞的木屑味！",
          separated: true,
        },
      ],
    },
    {
      word: "enigma",
      dialogues: [
        {
          side: "left",
          text: "你的說辭處處充滿矛盾的謎團。",
          replaceSeparated: true,
        },
        {
          side: "center",
          text: "一切都只是巧合，我對主發誓！",
          replaceSeparated: true,
        },
      ],
    },
  ];
  const availableRounds = [...originalRounds, ...additionalRounds];
  let rounds = [];

  function chooseRandomRounds() {
    const shuffledRounds = [...availableRounds];
    for (let index = shuffledRounds.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffledRounds[index], shuffledRounds[randomIndex]] = [
        shuffledRounds[randomIndex],
        shuffledRounds[index],
      ];
    }
    return shuffledRounds.slice(0, 2);
  }

  function clearTransitionTimers() {
    transitionTimers.forEach((id) => clearTimeout(id));
    transitionTimers = [];
  }

  // =========================================
  // 蠟燭動態控制（由右至左依序熄滅並飄煙）
  // =========================================
  let candleTimers = [];

  function clearCandleTimers() {
    candleTimers.forEach((id) => clearTimeout(id));
    candleTimers = [];
  }

  function resetCandles() {
    clearCandleTimers();
    if (!excuseCandlesWrap) return;
    excuseCandlesWrap.querySelectorAll(".candle-flame-slot").forEach((slot) => {
      slot.classList.remove("is-extinguished");
    });
  }

  function extinguishCandlesFromRight(count) {
    clearCandleTimers();
    if (!excuseCandlesWrap) return;
    const clamped = Math.min(TOTAL_CANDLES, Math.max(0, count));
    for (let i = 0; i < clamped; i += 1) {
      const targetIndex = TOTAL_CANDLES - 1 - i;
      const slot = excuseCandlesWrap.querySelector(
        `.candle-flame-slot[data-candle-index="${targetIndex}"]`,
      );
      if (slot && !slot.classList.contains("is-extinguished")) {
        const timerId = setTimeout(() => {
          slot.classList.add("is-extinguished");
          playTone(185, 0.18, "sine", 0.06, 0.4);
        }, i * 180);
        candleTimers.push(timerId);
      }
    }
  }

  function updateTimerUI() {
    const clamped = Math.max(0, remainingTime);
    if (timerValueText) {
      timerValueText.textContent = `${clamped.toFixed(1)}s`;
    }
    if (typingTimerFill) {
      const ratio = clamped / ROUND_TIME_LIMIT;
      typingTimerFill.style.transform = `scaleX(${ratio})`;
      typingTimerFill.classList.toggle(
        "is-warning",
        clamped <= 3.0 && clamped > 1.8,
      );
      typingTimerFill.classList.toggle("is-urgent", clamped <= 1.8);
    }
    if (hudTimerCard) {
      hudTimerCard.classList.toggle("is-urgent", clamped <= 1.8);
    }
  }

  function stopCountdown() {
    if (countdownRafId !== null) {
      cancelAnimationFrame(countdownRafId);
      countdownRafId = null;
    }
  }

  function startCountdown() {
    stopCountdown();
    remainingTime = ROUND_TIME_LIMIT;
    updateTimerUI();
    lastFrameTime = performance.now();

    function tick(now) {
      if (phase !== "typing") return;
      const dt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      remainingTime = Math.max(0, remainingTime - dt);
      updateTimerUI();

      if (remainingTime <= 0) {
        finishBranch(false);
        return;
      }
      countdownRafId = requestAnimationFrame(tick);
    }

    countdownRafId = requestAnimationFrame(tick);
  }

  // =========================================
  // 狡辯結果回饋橫幅
  // =========================================
  function showFeedbackBanner(text, isSuccess) {
    if (!excuseFeedbackBanner) return;
    excuseFeedbackBanner.textContent = text;
    excuseFeedbackBanner.classList.remove("is-success", "is-fail");
    void excuseFeedbackBanner.offsetWidth;
    excuseFeedbackBanner.classList.add(isSuccess ? "is-success" : "is-fail");
  }

  function hideFeedbackBanner() {
    if (!excuseFeedbackBanner) return;
    excuseFeedbackBanner.classList.remove("is-success", "is-fail");
    excuseFeedbackBanner.textContent = "";
  }

  // =========================================
  // 氣泡對話生成與打字機推進
  // =========================================
  function appendSpeechBubble(item, onComplete) {
    const isLeft = item.side === "left";
    const container = isLeft ? leftDialogueColumn : centerDialogueColumn;
    if (!container) return;

    let bubbleEl = null;
    if (item.replaceSeparated) {
      const separatedClass = isLeft ? "is-left-separated" : "is-separated";
      bubbleEl = container.querySelector(`.speech-bubble.${separatedClass}`);
    }
    if (item.replaceBottom) {
      bubbleEl =
        bubbleEl || container.querySelector(".speech-bubble.is-separated");
    }

    if (!bubbleEl) {
      bubbleEl = document.createElement("div");
      bubbleEl.className = `speech-bubble ${isLeft ? "is-left" : "is-right"}`;
      if (item.separated) {
        bubbleEl.classList.add(isLeft ? "is-left-separated" : "is-separated");
      }
      if (item.leftSeparated) bubbleEl.classList.add("is-left-separated");

      const textSpan = document.createElement("span");
      textSpan.className = "speech-bubble-text";
      bubbleEl.appendChild(textSpan);
      container.appendChild(bubbleEl);
    }

    const textEl = bubbleEl.querySelector(".speech-bubble-text");
    typewriter.start(textEl, item.text, 40, onComplete, true);
  }

  function playDialogueStep(idx) {
    phase = "dialogue";
    if (excuseScene) excuseScene.classList.add("is-dialogue-clickable");
    if (excuseTypingBox) {
      excuseTypingBox.classList.add("is-standby");
      excuseTypingBox.classList.remove("is-active-round");
    }
    if (typingStatusBadge) {
      typingStatusBadge.textContent = "聆聽對話中…";
    }
    if (dialogueControlHint) {
      dialogueControlHint.classList.remove("is-visible");
    }

    const item = activeDialogueList[idx];
    appendSpeechBubble(item, () => {
      if (dialogueControlHint) {
        dialogueControlHint.textContent =
          idx < activeDialogueList.length - 1
            ? "點擊畫面或按空白鍵繼續 ▾"
            : "點擊畫面或按空白鍵開始 5 秒快速狡辯 ▸";
        dialogueControlHint.classList.add("is-visible");
      }
    });
  }

  function advanceDialogue() {
    if (phase !== "dialogue") return;
    ensureAudio();

    if (typewriter.finishImmediately()) {
      return;
    }

    dialogueStepIndex += 1;
    if (dialogueStepIndex < activeDialogueList.length) {
      playDialogueStep(dialogueStepIndex);
    } else {
      if (dialogueControlHint)
        dialogueControlHint.classList.remove("is-visible");
      if (excuseScene) excuseScene.classList.remove("is-dialogue-clickable");
      startTypingRound(currentRoundIndex);
    }
  }

  // =========================================
  // 字母格渲染與快速打字檢定
  // =========================================
  function renderWordSlots(word) {
    if (!typingLettersGrid) return;
    typingLettersGrid.innerHTML = "";
    Array.from(word).forEach((ch, idx) => {
      const slot = document.createElement("div");
      slot.className = "letter-slot";
      if (idx === 0) slot.classList.add("is-current");
      slot.dataset.index = String(idx);

      const svgNamespace = "http://www.w3.org/2000/svg";
      const charEl = document.createElementNS(svgNamespace, "svg");
      charEl.setAttribute("class", "letter-char");
      charEl.setAttribute("viewBox", "0 0 56 72");
      charEl.setAttribute("role", "img");
      charEl.setAttribute("aria-label", ch);
      const glyph = document.createElementNS(svgNamespace, "text");
      glyph.setAttribute("class", "letter-glyph");
      glyph.setAttribute("x", "28");
      glyph.setAttribute("y", "56");
      glyph.setAttribute("text-anchor", "middle");
      glyph.setAttribute("aria-hidden", "true");
      glyph.textContent = ch;
      charEl.appendChild(glyph);

      const lineEl = document.createElement("span");
      lineEl.className = "letter-underline";

      slot.appendChild(charEl);
      slot.appendChild(lineEl);
      typingLettersGrid.appendChild(slot);
    });
  }

  function startTypingRound(roundIdx) {
    const roundData = rounds[roundIdx];
    phase = "typing";
    activeWord = roundData.word.toLowerCase();
    typedCount = 0;

    renderWordSlots(activeWord);
    if (excuseTypingBox) {
      excuseTypingBox.classList.remove("is-standby");
      excuseTypingBox.classList.add("is-active-round");
    }
    if (typingStatusBadge) {
      typingStatusBadge.textContent =
        `第 ${roundIdx + 1} 題狡辯（限時 5 秒打出 ${activeWord}）` +
        " — 請直接用鍵盤輸入字母！";
    }

    startCountdown();
  }

  function handleTypingKey(keyChar) {
    if (phase !== "typing") return;
    ensureAudio();

    const expectedChar = activeWord[typedCount];
    const currentSlot = typingLettersGrid
      ? typingLettersGrid.querySelector(
          `.letter-slot[data-index="${typedCount}"]`,
        )
      : null;

    if (keyChar === expectedChar) {
      // 成功輸入當前字母
      playTone(520 + typedCount * 55, 0.14, "triangle", 0.16, 1.08);
      if (currentSlot) {
        currentSlot.classList.remove("is-current", "is-error");
        currentSlot.classList.add("is-typed");
      }

      typedCount += 1;
      if (typedCount < activeWord.length) {
        const nextSlot = typingLettersGrid
          ? typingLettersGrid.querySelector(
              `.letter-slot[data-index="${typedCount}"]`,
            )
          : null;
        if (nextSlot) nextSlot.classList.add("is-current");
      } else {
        // 本題單字全部打出
        stopCountdown();
        if (currentRoundIndex < rounds.length - 1) {
          // 進入下一題狡辯對話。
          phase = "transition";
          playTone(659.25, 0.25, "triangle", 0.18, 1.12);
          showFeedbackBanner("完美通過，準備下一句狡辯！", true);
          if (typingStatusBadge) {
            typingStatusBadge.textContent = "成功完成本句狡辯！";
          }

          transitionTimers.push(
            setTimeout(() => {
              hideFeedbackBanner();
              currentRoundIndex += 1;
              activeDialogueList = rounds[currentRoundIndex].dialogues;
              dialogueStepIndex = 0;
              renderWordSlots(rounds[currentRoundIndex].word);
              playDialogueStep(0);
            }, 950),
          );
        } else {
          // 全部完成 -> 觸發「過」分支
          finishBranch(true);
        }
      }
    } else {
      // 按錯字母給予短暫視覺與音效警示（不中斷計時，玩家需在 5 秒內修正）
      playTone(130, 0.16, "sawtooth", 0.14, 0.55);
      if (currentSlot) {
        currentSlot.classList.remove("is-error");
        void currentSlot.offsetWidth;
        currentSlot.classList.add("is-error");
      }
      if (excuseTypingBox) {
        excuseTypingBox.classList.remove("is-wrong-shake");
        void excuseTypingBox.offsetWidth;
        excuseTypingBox.classList.add("is-wrong-shake");
      }
    }
  }

  // 通過不扣分，失敗扣一根燭火。
  function finishBranch(isPassed) {
    phase = "result";
    stopCountdown();
    clearTransitionTimers();
    if (excuseScene) excuseScene.classList.remove("is-dialogue-clickable");
    if (excuseTypingBox) excuseTypingBox.classList.remove("is-active-round");

    if (isPassed) {
      playTone(659.25, 0.36, "triangle", 0.2, 1.15);
      showFeedbackBanner("完美通過，不扣分", true);

      appendSpeechBubble({
        side: "left",
        text: "……願你的言辭在主面前毫無虛假。進入下一階段吧。",
      });

      if (typingStatusBadge) {
        typingStatusBadge.textContent = "狡辯成功：不扣分。";
      }
      if (excuseActionBtn) {
        excuseActionBtn.textContent = "繼續告解";
        excuseActionBtn.dataset.success = "true";
        excuseActionBtn.hidden = false;
      }
    } else {
      playTone(96, 0.45, "sawtooth", 0.2, 0.5);
      extinguishCandlesFromRight(FAIL_EXTINGUISH_COUNT);
      showFeedbackBanner("狡辯失敗，扣一分", false);

      if (excuseScene) {
        excuseScene.classList.add("is-miss-flash");
        transitionTimers.push(
          setTimeout(() => excuseScene.classList.remove("is-miss-flash"), 380),
        );
      }

      appendSpeechBubble({
        side: "left",
        text: "支吾其詞、破綻百出……你根本無法為自己辯解！",
      });

      if (typingStatusBadge) {
        typingStatusBadge.textContent = "狡辯失敗：扣一分。";
      }
      if (excuseActionBtn) {
        excuseActionBtn.textContent = "繼續告解";
        excuseActionBtn.dataset.success = "false";
        excuseActionBtn.hidden = false;
      }
    }
  }

  // =========================================
  // 初始化與事件綁定
  // =========================================
  function initGame() {
    stopCountdown();
    clearTransitionTimers();
    typewriter.stop();
    hideFeedbackBanner();
    resetCandles();

    currentRoundIndex = 0;
    dialogueStepIndex = 0;
    activeDialogueList = rounds[0].dialogues;
    remainingTime = ROUND_TIME_LIMIT;
    updateTimerUI();

    if (leftDialogueColumn) leftDialogueColumn.innerHTML = "";
    if (centerDialogueColumn) centerDialogueColumn.innerHTML = "";
    if (excuseActionBtn) {
      excuseActionBtn.hidden = true;
      excuseActionBtn.disabled = false;
    }

    renderWordSlots(rounds[0].word);
    playDialogueStep(0);
  }

  if (excuseScene) {
    excuseScene.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      if (phase === "dialogue") {
        advanceDialogue();
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (phase === "dialogue") {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        advanceDialogue();
      }
      return;
    }

    if (phase === "typing") {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleTypingKey(e.key.toLowerCase());
      }
    }
  });

  if (excuseActionBtn) {
    excuseActionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      excuseActionBtn.disabled = true;
      const success = excuseActionBtn.dataset.success === "true";
      phase = "inactive";
      window.dispatchEvent(
        new CustomEvent("excuseBranchCompleted", { detail: { success } }),
      );
    });
  }

  window.addEventListener("startExcuseBranch", () => {
    const selectedGender = excuseScene.getAttribute("data-gender") || "male";
    const isFemaleCharacter = selectedGender === "female";
    rounds = chooseRandomRounds();
    if (excuseScene) {
      excuseScene.classList.add("is-active");
      excuseScene.classList.remove("is-miss-flash");
    }
    if (excuseCharacterImg) {
      excuseCharacterImg.src = isFemaleCharacter
        ? "./images/PC_G/PC_talk.PNG"
        : "./images/PC_B/PC_talk.PNG";
      excuseCharacterImg.alt = isFemaleCharacter ? "女角色神情" : "男角色神情";
    }
    initGame();
    extinguishCandlesFromRight(PASS_EXTINGUISH_COUNT);
  });
});
