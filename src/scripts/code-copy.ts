function addCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre');

  codeBlocks.forEach((block) => {
    const code = block.querySelector('code');
    if (!code) {
      return;
    }

    const parentElement = block.parentNode as Element;
    if (parentElement && parentElement.classList && parentElement.classList.contains('code-block-wrapper')) {
      return;
    }

    const codeFirstLine = code.childNodes[0];
    const shouldHideCopyButton = codeFirstLine?.textContent?.trim() === '';

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'block';
    
    block.parentNode?.insertBefore(wrapper, block);
    wrapper.appendChild(block);
    
    let language = block.getAttribute('data-language') || 'text';
    
    const toolbar = document.createElement('div');
    toolbar.className = 'flex justify-between items-center px-4 py-2 bg-gray-800 text-gray-200 text-xs uppercase';
    toolbar.style.fontSize = '0.75rem';
    toolbar.style.fontWeight = '600';
    toolbar.style.borderTopLeftRadius = '0.375rem';
    toolbar.style.borderTopRightRadius = '0.375rem';
    
    const languageLabel = document.createElement('span');
    languageLabel.textContent = language;
    languageLabel.className = 'font-medium';
    
    toolbar.appendChild(languageLabel);
    
    if (!shouldHideCopyButton) {
      const button = document.createElement('button');
      button.className = 'copy-button bg-gray-700 text-white rounded px-2 py-1 text-xs hover:bg-gray-600 transition-colors';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      
      toolbar.appendChild(button);
      
      button.addEventListener('click', () => {
        const text = code.innerText;
        const originalText = button.textContent;
        button.textContent = 'Copied!';

        navigator.clipboard.writeText(text).then(() => {
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }).catch(err => {
          console.error('[addCopyButtons] Failed to copy text: ', err);
          button.textContent = 'Failed';
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        });
      });
    }
    
    wrapper.insertBefore(toolbar, block);
    
    block.style.borderTopLeftRadius = '0';
    block.style.borderTopRightRadius = '0';
    block.style.marginTop = '0';

    if (shouldHideCopyButton) {
      code.removeChild(codeFirstLine);
      
      if (code.childNodes.length > 0 && code.childNodes[0].nodeType === Node.TEXT_NODE) {
        const firstTextNode = code.childNodes[0];
        if (firstTextNode.textContent?.startsWith('\n')) {
          firstTextNode.textContent = firstTextNode.textContent.substring(1);
          if (firstTextNode.textContent === '') {
            code.removeChild(firstTextNode);
          }
        }
      }
    }
  });

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addCopyButtons);
} else {
  addCopyButtons();
}

export default addCopyButtons;