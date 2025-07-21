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
    });
    evolutionImage = img; // 後で参照
    canvas.add(img).bringToFront();
  });

  // 3️⃣ ユーザーが透過画像を追加
  document.getElementById("insertImageBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("imageUpload");
    const file = fileInput.files[0];

    if (file) {
      const xValue = parseInt(document.getElementById("imgX").value, 10);
      const safeX = isNaN(xValue) ? canvas.width / 2 : xValue;

      const yValue = parseInt(document.getElementById("imgY").value, 10);
      const safeY = isNaN(yValue) ? canvas.height / 2 : yValue;

      const sizeValue = parseInt(document.getElementById("imgSize").value, 10);
      const safeSize = isNaN(sizeValue) ? 200 : sizeValue;

      const reader = new FileReader();
      reader.onload = function () {
        fabric.Image.fromURL(reader.result, (img) => {
          // サイズ調整
          const scale = safeSize / Math.max(img.width, img.height);
          img.scale(scale);

          img.set({
            left: safeX,
            top: safeY,
            transparentCorners: false,
            cornerColor: "orange", // ユーザー追加画像はオレンジ
            borderColor: "orange",
            selectable: true, // ✅ ドラッグ・回転・リサイズ可
          });

          // evolution の下に挿入
          canvas.add(img);
          const evoIndex = canvas.getObjects().indexOf(evolutionImage);
          canvas.moveTo(img, evoIndex);

          canvas.setActiveObject(img); // 追加直後に選択状態
          canvas.renderAll();
        });
      };
      reader.readAsDataURL(file);
    } else {
      alert("画像ファイルを選択してください");
    }
  });
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
});
