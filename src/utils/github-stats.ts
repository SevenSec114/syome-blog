interface GitHubStatsData {
  contributions: number;
  totalRepositories: number;
  publicRepositories: number;
  privateRepositories: number;
  totalStars: number;
  totalPullRequests: number;
  totalIssues: number;
  languages: { name: string; percentage: number }[];
}

const GITHUB_USERNAME = import.meta.env.PUBLIC_GITHUB_USERNAME;

function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4);
}

function animateNumber(element: HTMLElement | null, target: number, decimals: number = 0, duration: number = 1000, isPercentage: boolean = false) {
  // Check if element exists
  if (!element) {
    console.warn('Element not found for animation');
    return;
  }
  
  if (isNaN(target) || target === undefined || target === null) {
    element.textContent = isPercentage ? '0.00%' : '0';
    return;
  }

  if (target === 0) {
    element.textContent = isPercentage ? '0.00%' : '0';
    return;
  }

  const startTime = performance.now();
  
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuart(progress);
    const current = target * easedProgress;
    
    if (progress < 1) {
      const formattedNumber = Number(current).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      element.textContent = isPercentage ? formattedNumber + '%' : formattedNumber;
      requestAnimationFrame(animate);
    } else {
      const formattedNumber = Number(target).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      element.textContent = isPercentage ? formattedNumber + '%' : formattedNumber;
    }
  };
  
  requestAnimationFrame(animate);
}

function animateProgressBar(element: HTMLElement | null, targetWidth: number, duration: number = 1000) {
  if (!element) {
    console.warn('Progress bar element not found for animation');
    return;
  }
  
  if (isNaN(targetWidth) || targetWidth === undefined || targetWidth === null) {
    element.style.width = '0%';
    return;
  }

  if (targetWidth === 0) {
    element.style.width = '0%';
    return;
  }

  const startTime = performance.now();
  
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuart(progress);
    const currentWidth = targetWidth * easedProgress;
    
    if (progress < 1) {
      element.style.width = currentWidth + '%';
      requestAnimationFrame(animate);
    } else {
      element.style.width = targetWidth + '%';
    }
  };
  
  requestAnimationFrame(animate);
}

function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function animateExtraLanguages() {
  document.querySelectorAll('.progress-bar-extra').forEach((bar: Element) => {
    const progressBar = bar as HTMLElement;
    const targetWidth = parseFloat(progressBar.dataset.targetWidth || '0');
    const index = progressBar.dataset.index;
    
    const percentElement = document.getElementById(`extra-lang-percent-${index}`);
    animateNumber(percentElement, targetWidth, 2, 1000, true);
    
    animateProgressBar(progressBar, targetWidth);
  });
}

function initLazyAnimations(githubStats: GitHubStatsData) {
  
  animateNumber(document.getElementById('contributions-count'), githubStats.contributions || 0, 0);
  animateNumber(document.getElementById('repositories-count'), githubStats.totalRepositories || 0, 0);
  animateNumber(document.getElementById('public-repos-count'), githubStats.publicRepositories || 0, 0);
  animateNumber(document.getElementById('private-repos-count'), githubStats.privateRepositories || 0, 0);
  animateNumber(document.getElementById('stars-count'), githubStats.totalStars || 0, 0);
  animateNumber(document.getElementById('prs-count'), githubStats.totalPullRequests || 0, 0);
  animateNumber(document.getElementById('issues-count'), githubStats.totalIssues || 0, 0);
  
  document.querySelectorAll('.progress-bar').forEach((bar: Element) => {
    const progressBar = bar as HTMLElement;
    const targetWidth = parseFloat(progressBar.dataset.targetWidth || '0');
    const index = progressBar.dataset.index;
    
    const percentElement = document.getElementById(`lang-percent-${index}`);
    animateNumber(percentElement, targetWidth, 2, 1000, true);
    
    animateProgressBar(progressBar, targetWidth);
  });
}

export async function loadGitHubStats(): Promise<void> {
  try {
    const response = await fetch('/api/github-stats');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const githubStats: GitHubStatsData = await response.json();
    
    const loadingElement = document.getElementById('github-stats-loading');
    if (loadingElement) {
      loadingElement.classList.add('hidden');
    }
    
    const contentElement = document.getElementById('github-stats-content');
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
            <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400" id="contributions-count">0</p>
            <p class="text-sm text-gray-600 dark:text-gray-300">Contributions</p>
          </div>
          <div class="text-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
            <p class="text-2xl font-bold text-green-600 dark:text-green-400" id="repositories-count">0</p>
            <p class="text-sm text-gray-600 dark:text-gray-300">Total Repositories</p>
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="text-center p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p class="text-xl font-bold text-blue-600 dark:text-blue-300" id="stars-count">0</p>
            <p class="text-xs text-gray-600 dark:text-gray-300">Stars</p>
          </div>
          <div class="text-center p-2 bg-purple-50 dark:bg-purple-900 rounded-lg">
            <p class="text-xl font-bold text-purple-600 dark:text-purple-300" id="prs-count">0</p>
            <p class="text-xs text-gray-600 dark:text-gray-300">PRs</p>
          </div>
          <div class="text-center p-2 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
            <p class="text-xl font-bold text-yellow-600 dark:text-yellow-300" id="issues-count">0</p>
            <p class="text-xs text-gray-600 dark:text-gray-300">Issues</p>
          </div>
        </div>
        
        <div class="flex justify-between mb-4">
          <div class="text-center">
            <span class="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              Public: <span id="public-repos-count">0</span>
            </span>
          </div>
          <div class="text-center">
            <span class="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
              Private: <span id="private-repos-count">0</span>
            </span>
          </div>
        </div>
        
        ${githubStats.languages && githubStats.languages.length > 0 ? `
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Language Usage</h4>
            <div class="space-y-2" id="language-stats">
              ${githubStats.languages.slice(0, 5).map((lang, index) => `
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-700 dark:text-gray-300">${lang.name}</span>
                    <span class="text-gray-500 dark:text-gray-400" id="lang-percent-${index}">0.00%</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      class="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full progress-bar" 
                      data-target-width="${lang.percentage || 0}"
                      data-index="${index}"
                      style="width: 0%"
                    ></div>
                  </div>
                </div>
              `).join('')}
              
              ${githubStats.languages.length > 5 ? `
                <div class="mt-4">
                  <div id="extra-languages" class="max-h-0 overflow-hidden transition-all duration-500">
                    <div class="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      ${githubStats.languages.slice(5).map((lang, index) => `
                        <div>
                          <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-700 dark:text-gray-300">${lang.name}</span>
                            <span class="text-gray-500 dark:text-gray-400" id="extra-lang-percent-${index}">0.00%</span>
                          </div>
                          <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              class="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full progress-bar-extra" 
                              data-target-width="${lang.percentage || 0}"
                              data-index="${index}"
                              style="width: 0%"
                            ></div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                  <button 
                    id="toggle-languages"
                    class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 flex items-center justify-between w-full py-2 mt-2"
                  >
                    <span id="toggle-text">Show ${githubStats.languages.length - 5} more languages</span>
                    <svg 
                      id="toggle-arrow"
                      class="w-4 h-4 transition-transform duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        ` : `
          <div class="text-center py-4 text-gray-500 dark:text-gray-400">
            <p>No language data available</p>
          </div>
        `}
        
        <div class="mt-4 text-center">
          <a 
            href="https://github.com/${GITHUB_USERNAME}"
            target="_blank" 
            class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View on GitHub
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
        </div>
      `;
      
      contentElement.classList.remove('hidden');
      
      const animateOnScroll = () => {
        if (isInViewport(contentElement)) {
          initLazyAnimations(githubStats);
          window.removeEventListener('scroll', animateOnScroll);
        }
      };
      
      if (isInViewport(contentElement)) {
        initLazyAnimations(githubStats);
      } else {
        window.addEventListener('scroll', animateOnScroll);
      }
      
      const toggleButton = document.getElementById('toggle-languages');
      const extraLanguages = document.getElementById('extra-languages');
      const toggleText = document.getElementById('toggle-text');
      const toggleArrow = document.getElementById('toggle-arrow');
      
      if (toggleButton && extraLanguages && toggleText && toggleArrow) {
        let isExpanded = false;
        const remainingCount = githubStats.languages ? githubStats.languages.length - 5 : 0;
        let hasAnimated = false;
        
        toggleButton.addEventListener('click', () => {
          isExpanded = !isExpanded;
          
          if (isExpanded) {
            extraLanguages.style.maxHeight = '96rem';
            toggleText.textContent = 'Collapse';
            toggleArrow.style.transform = 'rotate(180deg)';
            
            if (!hasAnimated) {
              setTimeout(() => {
                animateExtraLanguages();
                hasAnimated = true;
              }, 100);
            }
          } else {
            extraLanguages.style.maxHeight = '0';
            
            extraLanguages.addEventListener('transitionend', function handler() {
              if (!isExpanded) {
                toggleText.textContent = `Show ${remainingCount} more languages`;
                toggleArrow.style.transform = 'rotate(0deg)';
              }
              extraLanguages.removeEventListener('transitionend', handler);
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading GitHub stats:', error);
    const loadingElement = document.getElementById('github-stats-loading');
    if (loadingElement) {
      loadingElement.classList.add('hidden');
    }
    
    const contentElement = document.getElementById('github-stats-content');
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="text-center py-8">
          <p class="text-red-600 dark:text-red-400">Failed to load GitHub statistics</p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">The stats will be available when the API is accessible</p>
          <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">Error: ${(error as Error).message}</p>
        </div>
      `;
      contentElement.classList.remove('hidden');
    }
  }
}