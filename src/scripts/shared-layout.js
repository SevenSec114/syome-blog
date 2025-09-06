import addCopyButtons from './code-copy.js';

function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

document.addEventListener("DOMContentLoaded", function () {
  const loader = document.querySelector(".page-loader");
  const content = document.querySelector(".page-content");
  
  document.querySelectorAll("img[alt]").forEach((img) => {
    const image = img;
    const figure = document.createElement("figure");
    const figcaption = document.createElement("figcaption");
    figcaption.classList.add("text-center");
    figcaption.innerHTML = decodeHTML(image.alt);

    const newImage = image.cloneNode();
    
    newImage.style.maxHeight = '512px';
    newImage.style.width = 'auto';
    newImage.classList.add('mx-auto');

    figure.appendChild(newImage);
    figure.appendChild(figcaption);
    figure.classList.add('mx-auto');
    
    img.replaceWith(figure);
  });
  
  document.querySelectorAll("a[href]").forEach((link) => {
    const anchor = link;
    if (anchor.href.startsWith("http") && !anchor.href.includes(window.location.hostname)) {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    }
  });

  addCopyButtons();

  setTimeout(() => {
    if (loader) {
      loader.classList.add("hidden");
    }
    if (content) {
      requestAnimationFrame(() => {
        content.classList.add("fade-in");
      });
    }
  }, 100);
});