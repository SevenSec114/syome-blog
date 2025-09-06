function addCopyButtons(): void {
  const codeBlocks = document.querySelectorAll('pre');

  codeBlocks.forEach((block, index) => {
    const code = block.querySelector('code');
    if (!code) {
      return;
    }

    const codeFirstLine = code.childNodes[0];

    if (codeFirstLine && codeFirstLine.textContent && codeFirstLine.textContent.trim() === '') {
      code.removeChild(codeFirstLine);
      return;
    } else {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'block';
      
      if (block.parentNode) {
        block.parentNode.insertBefore(wrapper, block);
      }
      wrapper.appendChild(block);
      
      const button = document.createElement('button');
      button.className = 'copy-button absolute top-2 right-2 bg-gray-700 text-white rounded px-2 py-1 text-xs hover:bg-gray-600 transition-colors';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      button.style.position = 'absolute';
      button.style.zIndex = '10';

      button.addEventListener('click', () => {
        const text = code.innerText;
        const originalText = button.textContent;
        button.textContent = 'Copied!';

        navigator.clipboard.writeText(text).then(() => {
          setTimeout(() => {
            if (button.textContent) {
              button.textContent = originalText;
            }
          }, 2000);
        }).catch(err => {
          console.error('[addCopyButtons] Failed to copy text: ', err);
          button.textContent = 'Failed';
          setTimeout(() => {
            if (button.textContent) {
              button.textContent = originalText;
            }
          }, 2000);
        });
      });

      wrapper.appendChild(button);
    }
  });

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => addCopyButtons());
} else {
  addCopyButtons();
}

export default addCopyButtons;