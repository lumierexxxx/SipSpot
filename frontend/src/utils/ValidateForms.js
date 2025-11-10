export function applyValidation() {
  // 找到 React 页面中的所有需要校验的表单
  const forms = document.querySelectorAll(".validated-form");

  Array.from(forms).forEach((form) => {
    // 每次进入页面时绑定一次 submit 事件
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      { once: true } // ✅ 避免重复绑定
    );
  });
}
