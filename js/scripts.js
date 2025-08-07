document.addEventListener("DOMContentLoaded", () => {
  const canvas = new fabric.Canvas("canvas", {
    width: 900, // 初期サイズ（デスクトップ向け）
    height: 600, // 初期サイズ（デスクトップ向け）
    preserveObjectStacking: true,
  });

  let evolutionImage;
  let uploadedFile = null;

  let draggedItem = null;

  const textInput = document.getElementById("textInput");
  const addTextBtn = document.getElementById("addTextBtn");

  const imageUpload = document.getElementById("imageUpload");
  const insertImageBtn = document.getElementById("insertImageBtn");

  const saveBtn = document.getElementById("saveBtn");
  const clearBtn = document.getElementById("clearBtn");

  const selectedObjectControls = document.getElementById(
    "selectedObjectControls"
  );
  const noObjectSelectedText = document.getElementById("noObjectSelectedText");
  const currentX = document.getElementById("currentX");
  const currentY = document.getElementById("currentY");
  const currentWidth = document.getElementById("currentWidth");
  const currentHeight = document.getElementById("currentHeight");
  const currentScale = document.getElementById("currentScale");
  const scaleRange = document.getElementById("scaleRange");
  const currentAngle = document.getElementById("currentAngle");
  const flipXBtn = document.getElementById("flipXBtn");
  const flipYBtn = document.getElementById("flipYBtn");

  // ★追加: モード切り替え用のDOM要素を取得
  const transparentModeCheckbox = document.getElementById(
    "transparentModeCheckbox"
  );
  let isTransparentMode = false; // 透明モードの状態を保持する変数

  const defaultTextWidth = 400;
  const defaultTextX = 655;
  const defaultTextY = 515;
  const defaultTextSize = 100;

  const defaultImgX = 250;
  const defaultImgY = 200;
  const defaultImgSize = 300;

  function loadObjectProperties(object) {
    if (object) {
      selectedObjectControls.style.display = "block";
      noObjectSelectedText.style.display = "none";

      currentX.value = Math.round(object.left);
      currentY.value = Math.round(object.top);

      currentWidth.value = Math.round(object.getScaledWidth());
      currentHeight.value = Math.round(object.getScaledHeight());
      currentWidth.readOnly = true;
      currentHeight.readOnly = true;
      currentWidth.style.backgroundColor = "#f0f0f0";
      currentHeight.style.backgroundColor = "#f0f0f0";

      let currentObjectScale = 100;
      if (
        object.type === "image" ||
        object.type === "group" ||
        object.type === "textbox"
      ) {
        const originalWidth = object._originalWidth || object.width;
        if (originalWidth) {
          currentObjectScale = Math.round(object.scaleX * 100);
        }
      }
      currentScale.value = currentObjectScale;
      scaleRange.value = currentObjectScale;

      currentAngle.value = Math.round(object.angle || 0);

      const isScaleEditable = object !== evolutionImage;
      currentScale.disabled = !isScaleEditable;
      scaleRange.disabled = !isScaleEditable;
      currentScale.style.backgroundColor = isScaleEditable ? "" : "#f0f0f0";
      scaleRange.style.backgroundColor = isScaleEditable ? "" : "#f0f0f0";
    } else {
      selectedObjectControls.style.display = "none";
      noObjectSelectedText.style.display = "block";
      currentX.value = "";
      currentY.value = "";
      currentWidth.value = "";
      currentHeight.value = "";
      currentScale.value = "";
      scaleRange.value = 100;
      currentAngle.value = "";

      currentWidth.readOnly = true;
      currentHeight.readOnly = true;
      currentWidth.style.backgroundColor = "#f0f0f0";
      currentHeight.style.backgroundColor = "#f0f0f0";
      currentScale.disabled = true;
      scaleRange.disabled = true;
      currentScale.style.backgroundColor = "#f0f0f0";
      scaleRange.style.backgroundColor = "#f0f0f0";
    }
  }

  function applyPropertyChange(prop, value) {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject !== evolutionImage) {
      let numericValue = parseFloat(value);
      if (isNaN(numericValue)) return;

      switch (prop) {
        case "left":
        case "top":
          activeObject.set(prop, numericValue);
          break;
        case "angle":
          activeObject.set(prop, numericValue % 360);
          break;
        case "scale":
          let scaleValue = numericValue / 100;
          if (scaleValue <= 0) scaleValue = 0.01;

          activeObject.scaleX = scaleValue;
          activeObject.scaleY = scaleValue;

          activeObject.setCoords();
          break;
      }
      canvas.renderAll();
      loadObjectProperties(activeObject);
    }
  }

  currentX.addEventListener("change", (e) =>
    applyPropertyChange("left", e.target.value)
  );
  currentY.addEventListener("change", (e) =>
    applyPropertyChange("top", e.target.value)
  );
  currentAngle.addEventListener("change", (e) =>
    applyPropertyChange("angle", e.target.value)
  );

  currentScale.addEventListener("change", (e) =>
    applyPropertyChange("scale", e.target.value)
  );
  scaleRange.addEventListener("input", (e) => {
    currentScale.value = e.target.value;
    applyPropertyChange("scale", e.target.value);
  });

  flipXBtn.addEventListener("click", () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject !== evolutionImage) {
      activeObject.set("flipX", !activeObject.flipX);
      canvas.renderAll();
      loadObjectProperties(activeObject);
    }
  });

  flipYBtn.addEventListener("click", () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject !== evolutionImage) {
      activeObject.set("flipY", !activeObject.flipY);
      canvas.renderAll();
      loadObjectProperties(activeObject);
    }
  });

  function updateObjectList() {
    const objectUl = document.getElementById("object-ul");
    objectUl.innerHTML = "";

    const allObjects = canvas.getObjects();
    const userObjects = allObjects.filter(
      (obj) => obj !== evolutionImage && obj !== canvas.backgroundImage
    );

    userObjects.reverse();

    const activeCanvasObject = canvas.getActiveObject();

    userObjects.forEach((obj, index) => {
      if (!obj.canvasId) {
        obj.canvasId = `obj_${nextObjectId++}`;
      }

      const li = document.createElement("li");
      let objectName = "";

      if (obj.type === "textbox" || obj.type === "group") {
        objectName = obj.text || "テキスト";
        if (obj.type === "group" && obj._objects && obj._objects.length > 1) {
          const mainTextObj = obj._objects.find((o) => o.fill === "#FFFFFF");
          objectName = mainTextObj ? mainTextObj.text : "テキストグループ";
        }
      } else if (obj.type === "image") {
        objectName = "画像";
        if (obj.file && obj.file.name) {
          objectName = obj.file.name;
        } else if (obj.src) {
          const urlParts = obj.src.split("/");
          objectName = urlParts[urlParts.length - 1];
        }
      }

      const textSpan = document.createElement("span");
      textSpan.textContent = `${index + 1}. ${objectName}`;
      li.appendChild(textSpan);

      li.dataset.objectId = obj.canvasId;
      if (activeCanvasObject && activeCanvasObject.canvasId === obj.canvasId) {
        li.classList.add("selected");
      } else {
        li.classList.remove("selected");
      }
      li.draggable = true;

      const buttonContainer = document.createElement("div");
      buttonContainer.classList.add("item-buttons");

      const moveUpButton = document.createElement("button");
      moveUpButton.classList.add("move-btn", "move-up-btn");
      moveUpButton.disabled = index === 0;
      moveUpButton.addEventListener("click", (e) => {
        e.stopPropagation();
        const objToMove = canvas
          .getObjects()
          .find((o) => o.canvasId === li.dataset.objectId);
        if (
          objToMove &&
          objToMove !== evolutionImage &&
          objToMove !== canvas.backgroundImage
        ) {
          canvas.bringForward(objToMove);
          canvas.renderAll();
          updateObjectList();
        }
      });
      buttonContainer.appendChild(moveUpButton);

      const moveDownButton = document.createElement("button");
      moveDownButton.classList.add("move-btn", "move-down-btn");
      moveDownButton.disabled = index === userObjects.length - 1;
      moveDownButton.addEventListener("click", (e) => {
        e.stopPropagation();
        const objToMove = canvas
          .getObjects()
          .find((o) => o.canvasId === li.dataset.objectId);
        if (
          objToMove &&
          objToMove !== evolutionImage &&
          objToMove !== canvas.backgroundImage
        ) {
          canvas.sendBackwards(objToMove);
          canvas.renderAll();
          updateObjectList();
        }
      });
      buttonContainer.appendChild(moveDownButton);

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "削除";
      deleteButton.classList.add("delete-item-btn");
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        const objToDelete = canvas
          .getObjects()
          .find((o) => o.canvasId === li.dataset.objectId);
        if (
          objToDelete &&
          objToDelete !== evolutionImage &&
          objToDelete !== canvas.backgroundImage
        ) {
          canvas.remove(objToDelete);
        }
      });
      buttonContainer.appendChild(deleteButton);
      li.appendChild(buttonContainer);

      li.addEventListener("dragstart", (e) => {
        draggedItem = li;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", li.dataset.objectId);
        li.classList.add("dragging");
      });

      li.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (li !== draggedItem) {
          li.classList.add("drag-over");
        }
      });

      li.addEventListener("dragleave", () => {
        li.classList.remove("drag-over");
      });

      li.addEventListener("drop", (e) => {
        e.preventDefault();
        li.classList.remove("drag-over");

        if (draggedItem && draggedItem !== li) {
          const draggedObjectId = draggedItem.dataset.objectId;
          const targetObjectId = li.dataset.objectId;

          const draggedFabricObj = canvas
            .getObjects()
            .find((o) => o.canvasId === draggedObjectId);
          const targetFabricObj = canvas
            .getObjects()
            .find((o) => o.canvasId === targetObjectId);

          if (
            draggedFabricObj &&
            targetFabricObj &&
            draggedFabricObj !== evolutionImage &&
            draggedFabricObj !== canvas.backgroundImage &&
            targetFabricObj !== evolutionImage &&
            targetFabricObj !== canvas.backgroundImage
          ) {
            const currentFabricObjects = canvas.getObjects();
            const draggedOriginalIndex =
              currentFabricObjects.indexOf(draggedFabricObj);
            const targetOriginalIndex =
              currentFabricObjects.indexOf(targetFabricObj);

            const draggedLiIndex = Array.from(objectUl.children).indexOf(
              draggedItem
            );
            const targetLiIndex = Array.from(objectUl.children).indexOf(li);

            let newZIndex;
            if (targetLiIndex < draggedLiIndex) {
              newZIndex = targetOriginalIndex + 1;
            } else {
              newZIndex = targetOriginalIndex;
            }

            newZIndex = Math.min(newZIndex, currentFabricObjects.length - 1);
            newZIndex = Math.max(newZIndex, 0);

            canvas.moveTo(draggedFabricObj, newZIndex);
            canvas.renderAll();
            updateObjectList();
          }
        }
      });

      li.addEventListener("dragend", () => {
        if (draggedItem) {
          draggedItem.classList.remove("dragging");
        }
        draggedItem = null;
        document.querySelectorAll("#object-ul li").forEach((item) => {
          item.classList.remove("drag-over");
        });
      });

      li.addEventListener("click", (e) => {
        if (
          e.target.classList.contains("move-btn") ||
          e.target.classList.contains("delete-item-btn")
        ) {
          return;
        }

        const targetObj = canvas
          .getObjects()
          .find((o) => o.canvasId === li.dataset.objectId);

        if (targetObj) {
          canvas.setActiveObject(targetObj);
        } else {
          canvas.discardActiveObject();
        }
        canvas.renderAll();
      });

      objectUl.appendChild(li);
    });

    loadObjectProperties(canvas.getActiveObject());
  }

  let nextObjectId = 0;
  canvas.on("object:added", (e) => {
    if (e.target && !e.target.canvasId) {
      e.target.canvasId = `obj_${nextObjectId++}`;
    }
    updateObjectList();
    loadObjectProperties(e.target);
  });

  canvas.on("object:removed", () => {
    updateObjectList();
    loadObjectProperties(canvas.getActiveObject());
  });

  canvas.on("selection:created", (e) => {
    updateObjectList();
    loadObjectProperties(e.selected[0]);
  });

  canvas.on("selection:updated", (e) => {
    updateObjectList();
    loadObjectProperties(e.selected[0]);
  });

  canvas.on("selection:cleared", () => {
    updateObjectList();
    loadObjectProperties(null);
  });

  canvas.on("object:modified", (e) => {
    loadObjectProperties(e.target);
  });

  // fitImageToCanvas 関数を修正 (変更なし)
  function fitImageToCanvas(img) {
    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = img.width / img.height;
    let scale;

    if (imgRatio > canvasRatio) {
      scale = canvas.width / img.width;
    } else {
      scale = canvas.height / img.height;
    }

    img.scale(scale);
    img.set({
      left: (canvas.width - img.width * scale) / 2,
      top: (canvas.height - img.height * scale) / 2,
    });
  }

  // ★修正箇所 1: resizeCanvas 関数
  function resizeCanvas() {
    const canvasContainer = document.querySelector(".canvas-container");
    const windowWidth = window.innerWidth;
    let newWidth;
    let newHeight;

    if (windowWidth <= 1024) {
      newWidth = 900;
      newHeight = 600;
    } else {
      newWidth = canvasContainer.offsetWidth;
      newHeight = newWidth * (600 / 900);
    }

    canvas.setDimensions({ width: newWidth, height: newHeight });

    if (canvas.backgroundImage) {
      canvas.backgroundImage.set({
        scaleX: newWidth / canvas.backgroundImage.width,
        scaleY: newHeight / canvas.backgroundImage.height,
        originX: "left",
        originY: "top",
        left: 0,
        top: 0,
      });
      canvas.backgroundImage.setCoords();
    }

    if (evolutionImage) {
      fitImageToCanvas(evolutionImage);
      evolutionImage.setCoords();
    }
    canvas.renderAll();
  }

  // 画像の読み込みとCanvasへの追加
  let loadedImagesCount = 0; // 読み込み完了した画像の数
  const totalImagesToLoad = 2; // back.png と evolution.png

  fabric.Image.fromURL("img/back.png", (img) => {
    img.selectable = false;
    img.evented = false;
    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
      scaleX: canvas.width / img.width, // Canvasの初期幅に合わせてスケール
      scaleY: canvas.height / img.height, // Canvasの初期高さに合わせてスケール
      originX: "left",
      originY: "top",
      left: 0,
      top: 0,
    });
    loadedImagesCount++;
    if (loadedImagesCount === totalImagesToLoad) {
      resizeCanvas();
    }
  });

  fabric.Image.fromURL("img/evolution.png", (img) => {
    img.set({
      transparentCorners: false,
      cornerColor: "blue",
      borderColor: "blue",
      selectable: false,
      evented: false,
    });
    evolutionImage = img; // グローバル変数に格納
    canvas.add(img).bringToFront(); // Canvasに追加

    loadedImagesCount++;
    if (loadedImagesCount === totalImagesToLoad) {
      resizeCanvas();
    }
  });

  window.addEventListener("resize", resizeCanvas);

  imageUpload.addEventListener("change", (event) => {
    uploadedFile = event.target.files[0] || null;
    if (uploadedFile) {
      addImageToCanvas(uploadedFile);
    }
  });

  insertImageBtn.addEventListener("click", () => {
    if (!uploadedFile) {
      alert("画像ファイルを先に選択してください");
      return;
    }
    addImageToCanvas(uploadedFile);
  });

  function addImageToCanvas(file) {
    const safeX = defaultImgX;
    const safeY = defaultImgY;
    const safeSize = defaultImgSize;

    const reader = new FileReader();
    reader.onload = function () {
      fabric.Image.fromURL(reader.result, (img) => {
        const scale = safeSize / Math.max(img.width, img.height);
        img.scale(scale);
        img.set({
          left: safeX,
          top: safeY,
          transparentCorners: false,
          cornerColor: "orange",
          borderColor: "orange",
          selectable: true,
        });
        img.file = file;

        canvas.add(img);

        const evoIndex = canvas.getObjects().indexOf(evolutionImage);
        const insertIndex = Math.max(evoIndex - 1, 0);
        canvas.moveTo(img, insertIndex);

        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  }

  addTextBtn.addEventListener("click", () => {
    const textValue = textInput.value || "テキスト";

    const safeX = defaultTextX;
    const safeY = defaultTextY;
    const safeSize = defaultTextSize;
    const safeWidth = defaultTextWidth;

    const outlineText = new fabric.Textbox(textValue, {
      left: 0,
      top: 0,
      fontSize: safeSize,
      fill: "#000000",
      stroke: "#000000",
      strokeWidth: 20,
      fontWeight: "bold",
      fontStyle: "italic",
      fontFamily: "'M PLUS Rounded 1c', sans-serif",
      textAlign: "center",
      originX: "center",
      originY: "center",
      width: safeWidth,
      splitByGrapheme: false,
      selectable: false,
      evented: false,
    });

    const mainText = new fabric.Textbox(textValue, {
      left: 0,
      top: 0,
      fontSize: safeSize,
      fill: "#FFFFFF",
      fontWeight: "bold",
      fontStyle: "italic",
      fontFamily: "'M PLUS Rounded 1c', sans-serif",
      textAlign: "center",
      originX: "center",
      originY: "center",
      width: safeWidth,
      splitByGrapheme: false,
      editable: true,
      transparentCorners: false,
      cornerColor: "red",
      borderColor: "red",
    });

    const group = new fabric.Group([outlineText, mainText], {
      left: safeX,
      top: safeY,
      originX: "center",
      originY: "center",
      subTargetCheck: true,
    });
    group.text = textValue;

    canvas.add(group);
    canvas.renderAll();
    group._originalWidth = group.getScaledWidth();
    group._originalHeight = group.getScaledHeight();

    const evoIndex = canvas.getObjects().indexOf(evolutionImage);
    const insertIndex = Math.max(evoIndex - 1, 0);
    canvas.moveTo(group, insertIndex);

    canvas.setActiveObject(group);
    canvas.renderAll();
  });

  // ★修正箇所: saveBtn のイベントリスナー
  saveBtn.addEventListener("click", () => {
    // 保存時にevolutionImageとbackgroundImageが非表示でも保存されるようにする
    const originalEvolutionVisible = evolutionImage
      ? evolutionImage.visible
      : false;
    const originalBackgroundVisible = canvas.backgroundImage
      ? canvas.backgroundImage.visible
      : false;

    // 透明モードがONの場合は、両方の画像を非表示にする
    if (isTransparentMode) {
      if (evolutionImage) evolutionImage.visible = false;
      if (canvas.backgroundImage) canvas.backgroundImage.visible = false;
    } else {
      // 通常モードの場合は、両方の画像を強制的に表示する
      if (evolutionImage) evolutionImage.visible = true;
      if (canvas.backgroundImage) canvas.backgroundImage.visible = true;
    }

    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
    });

    // 元の表示状態に戻す
    if (evolutionImage) evolutionImage.visible = originalEvolutionVisible;
    if (canvas.backgroundImage)
      canvas.backgroundImage.visible = originalBackgroundVisible;

    const textValue = textInput.value || "無題";
    const safeText = textValue.replace(
      /[^a-zA-Z0-9_\u3040-\u30ff\u4e00-\u9faf]/g,
      "_"
    );

    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `エボ風_${safeText}.png`;
    link.click();
  });

  // ★修正箇所: clearBtn のイベントリスナー
  clearBtn.addEventListener("click", () => {
    const objects = canvas.getObjects();

    // evolution.pngとback.png以外の、ユーザーが追加したオブジェクトを全て削除
    objects.forEach((obj) => {
      if (obj === evolutionImage || obj === canvas.backgroundImage) {
        return;
      }
      canvas.remove(obj);
    });

    // 透明モードがONの場合、evolution.pngとback.pngを非表示にする
    if (isTransparentMode) {
      if (evolutionImage) {
        evolutionImage.visible = false;
      }
      if (canvas.backgroundImage) {
        canvas.backgroundImage.visible = false;
      }
    } else {
      // 透明モードがOFFの場合は、常に表示状態にする
      if (evolutionImage) {
        evolutionImage.visible = true;
      }
      if (canvas.backgroundImage) {
        canvas.backgroundImage.visible = true;
      }
    }

    imageUpload.value = "";
    uploadedFile = null;

    canvas.renderAll();
  });

  // ★追加: transparentModeCheckbox のイベントリスナー
  transparentModeCheckbox.addEventListener("change", (e) => {
    isTransparentMode = e.target.checked;
    if (evolutionImage) {
      evolutionImage.visible = !isTransparentMode;
    }
    if (canvas.backgroundImage) {
      canvas.backgroundImage.visible = !isTransparentMode;
    }
    canvas.renderAll();
  });

  // 初期ロード時のリストとプロパティの更新
  updateObjectList();
  loadObjectProperties(null);
});
