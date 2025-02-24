document.addEventListener("DOMContentLoaded", () => {
  const englishNameInput = document.getElementById("englishName");
  const generateBtn = document.getElementById("generateBtn");
  const loadingDiv = document.getElementById("loading");
  const resultsDiv = document.getElementById("results");
  const errorMessageDiv = document.getElementById("errorMessage");

  // 监听输入变化，确保输入不为空时才能点击生成按钮
  englishNameInput.addEventListener("input", () => {
    generateBtn.disabled = !englishNameInput.value.trim();
  });

  // 初始状态下禁用生成按钮
  generateBtn.disabled = true;

  generateBtn.addEventListener("click", async () => {
    const englishName = englishNameInput.value.trim();
    const birthYear = document.getElementById("birthYear").value.trim();
    const gender = document.querySelector('input[name="gender"]:checked').value;
    if (!englishName) return;

    // 显示加载动画，隐藏其他元素
    loadingDiv.style.display = "block";
    resultsDiv.style.display = "none";
    errorMessageDiv.style.display = "none";
    generateBtn.disabled = true;

    try {
      const response = await fetch("http://localhost:3000/generate-names", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ englishName, birthYear, gender }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      displayResults(data.names);
    } catch (error) {
      console.error("Error:", error);
      errorMessageDiv.style.display = "block";
    } finally {
      loadingDiv.style.display = "none";
      generateBtn.disabled = false;
    }
  });

  // 显示生成的名字和解释
  function displayResults(names) {
    resultsDiv.innerHTML = "";
    resultsDiv.style.display = "flex";

    names.forEach((name) => {
      const nameCard = document.createElement("div");
      nameCard.className = "name-card";
      nameCard.innerHTML = `
                <div class="chinese-name">${name.chinese}（${name.pinyin}）</div>
                <div class="meaning">
                    <strong>中文寓意：</strong>${name.meaningChinese}
                </div>
                <div class="meaning">
                    <strong>English Meaning：</strong>${name.meaningEnglish}
                </div>
                <div class="meaning">
                    <strong>生肖解析：</strong>${name.zodiac || '-'}
                </div>
                <div class="meaning">
                    <strong>五行分析：</strong>${name.fiveElements || '-'}
                </div>
            `;
      resultsDiv.appendChild(nameCard);
    });
  }
});
