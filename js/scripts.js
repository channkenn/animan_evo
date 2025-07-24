document.addEventListener("DOMContentLoaded", () => {
  const canvas = new fabric.Canvas("canvas", {
    preserveObjectStacking: true,
  });

  let evolutionImage; // evolution参照用

  // アスペクト比を維持して画像をフィットさせる
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

  // 1️⃣ デフォルト背景画像
  fabric.Image.fromURL("img/back.png", (img) => {
    fitImageToCanvas(img);
    img.selectable = false; // 背景は動かせない
    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
  });

  // 2️⃣ evolution画像
  fabric.Image.fromURL("img/evolution.png", (img) => {
    fitImageToCanvas(img);
    img.set({
      transparentCorners: false,
      cornerColor: "blue",
      borderColor: "blue",
      selectable: false,
      evented: false, // これを追加！
    });
    evolutionImage = img; // 後で参照
    canvas.add(img).bringToFront();
  });

  // ファイルが選択されたとき：読み込み＋canvasに即追加
  document.getElementById("imageUpload").addEventListener("change", (event) => {
    uploadedFile = event.target.files[0] || null;
    if (uploadedFile) {
      addImageToCanvas(uploadedFile);
    }
  });

  // 「透過画像を追加」ボタンで再度追加
  document.getElementById("insertImageBtn").addEventListener("click", () => {
    if (!uploadedFile) {
      alert("画像ファイルを先に選択してください");
      return;
    }
    addImageToCanvas(uploadedFile);
  });
  // canvasへ画像を追加する共通関数
  function addImageToCanvas(file) {
    const xValue = parseInt(document.getElementById("imgX").value, 10);
    const safeX = isNaN(xValue) ? canvas.width / 2 : xValue;

    const yValue = parseInt(document.getElementById("imgY").value, 10);
    const safeY = isNaN(yValue) ? canvas.height / 2 : yValue;

    const sizeValue = parseInt(document.getElementById("imgSize").value, 10);
    const safeSize = isNaN(sizeValue) ? 200 : sizeValue;

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

  // テキスト追加
  document.getElementById("addTextBtn").addEventListener("click", () => {
    const textValue = document.getElementById("textInput").value || "テキスト";

    const xValue = parseInt(document.getElementById("xInput").value, 10);
    const safeX = isNaN(xValue) ? canvas.width / 2 : xValue;

    const yValue = parseInt(document.getElementById("yInput").value, 10);
    const safeY = isNaN(yValue) ? canvas.height / 2 : yValue;

    const sizeValue = parseInt(document.getElementById("sizeInput").value, 10);
    const safeSize = isNaN(sizeValue) ? 60 : sizeValue;

    const widthValue = parseInt(
      document.getElementById("widthInput").value,
      10
    );
    const safeWidth = isNaN(widthValue) ? 200 : widthValue; // 💡 ユーザー指定の幅

    // 縁取りテキスト
    const outlineText = new fabric.Textbox(textValue, {
      left: safeX,
      top: safeY,
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
      width: safeWidth, // 💡 固定幅
      splitByGrapheme: false, // 改行させない
      selectable: false,
      evented: false,
    });

    // メインテキスト
    const mainText = new fabric.Textbox(textValue, {
      left: safeX,
      top: safeY,
      fontSize: safeSize,
      fill: "#FFFFFF",
      fontWeight: "bold",
      fontStyle: "italic",
      fontFamily: "'M PLUS Rounded 1c', sans-serif",
      textAlign: "center",
      originX: "center",
      originY: "center",
      width: safeWidth, // 💡 固定幅
      splitByGrapheme: false, // 改行させない
      editable: true,
      transparentCorners: false,
      cornerColor: "red",
      borderColor: "red",
    });

    // 💡 幅に収まらない場合はscaleXで縮小
    if (mainText.width > safeWidth) {
      const scaleFactor = safeWidth / mainText.width;
      mainText.scaleX = scaleFactor;
      outlineText.scaleX = scaleFactor;
    }

    // グループ化
    const group = new fabric.Group([outlineText, mainText], {
      left: safeX,
      top: safeY,
      originX: "center",
      originY: "center",
      subTargetCheck: true,
    });

    canvas.add(group).setActiveObject(group);
  });
  // 4️⃣ 画像保存
  // 4️⃣ 画像保存
  document.getElementById("saveBtn").addEventListener("click", () => {
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
    });

    // 💡 入力テキストを取得
    const textValue = document.getElementById("textInput").value || "無題";
    // ファイル名に使用できない文字を削除
    const safeText = textValue.replace(
      /[^a-zA-Z0-9_\u3040-\u30ff\u4e00-\u9faf]/g,
      "_"
    );

    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `エボ風_${safeText}.png`; // 💡 動的ファイル名
    link.click();
  });
  document.getElementById("clearBtn").addEventListener("click", () => {
    // canvas上のオブジェクトを全部取得
    const objects = canvas.getObjects();

    // 削除対象を絞る条件：evolutionImage以外、かつ画像かテキストグループなら消す
    // 背景画像やevolutionImageは残すためのフィルター
    objects.forEach((obj) => {
      // evolutionImageは残す
      if (obj === evolutionImage) return;

      // 背景画像はcanvas.backgroundImageに格納されているのでobjにはないはず
      // 透過画像はfabric.Image、テキストはfabric.Group（テキストグループ）
      // fabric.Groupでテキストグループを判別

      if (
        obj.type === "image" || // 透過画像
        obj.type === "group" // テキストグループ
      ) {
        canvas.remove(obj);
      }
    });

    canvas.discardActiveObject();
    canvas.renderAll();
    // ファイル選択もクリアする
    document.getElementById("imageUpload").value = "";
  });
});
