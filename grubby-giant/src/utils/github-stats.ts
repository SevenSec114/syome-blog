interface GitHubStatsData {
  contributions: number;
  totalRepositories: number;
  publicRepositories: number;
  privateRepositories: number;
  languages: { name: string; percentage: number }[];
}

const GITHUB_USERNAME = import.meta.env.PUBLIC_GITHUB_USERNAME;

export async function loadGitHubStats(containerId: string): Promise<void> {
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
            <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${githubStats.contributions}</p>
            <p class="text-sm text-gray-600 dark:text-gray-300">Contributions</p>
          </div>
          <div class="text-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">${githubStats.totalRepositories}</p>
            <p class="text-sm text-gray-600 dark:text-gray-300">Total Repositories</p>
          </div>
        </div>
        
        <div class="flex justify-between mb-4">
          <div class="text-center">
            <span class="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              Public: ${githubStats.publicRepositories}
            </span>
          </div>
          <div class="text-center">
            <span class="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
              Private: ${githubStats.privateRepositories}
            </span>
          </div>
        </div>
        
        ${githubStats.languages.length > 0 ? `
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Language Usage</h4>
            <div class="space-y-2" id="language-stats">
              ${githubStats.languages.slice(0, 5).map((lang) => `
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-700 dark:text-gray-300">${lang.name}</span>
                    <span class="text-gray-500 dark:text-gray-400">${lang.percentage.toFixed(1)}%</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      class="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full" 
                      style="width: ${lang.percentage}%"
                    ></div>
                  </div>
                </div>
              `).join('')}
              
              ${githubStats.languages.length > 5 ? `
                <div class="mt-4">
                  <div id="extra-languages" class="max-h-0 overflow-hidden transition-all duration-500">
                    <div class="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      ${githubStats.languages.slice(5).map((lang) => `
                        <div>
                          <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-700 dark:text-gray-300">${lang.name}</span>
                            <span class="text-gray-500 dark:text-gray-400">${lang.percentage.toFixed(1)}%</span>
                          </div>
                          <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              class="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full" 
                              style="width: ${lang.percentage}%"
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
        ` : ''}
        
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
      
      const toggleButton = document.getElementById('toggle-languages');
      const extraLanguages = document.getElementById('extra-languages');
      const toggleText = document.getElementById('toggle-text');
      const toggleArrow = document.getElementById('toggle-arrow');
      
      if (toggleButton && extraLanguages && toggleText && toggleArrow) {
        let isExpanded = false;
        const remainingCount = githubStats.languages.length - 5;
        
        toggleButton.addEventListener('click', () => {
          isExpanded = !isExpanded;
          
          if (isExpanded) {
            extraLanguages.style.maxHeight = '96rem';
            toggleText.textContent = 'Collapse';
            toggleArrow.style.transform = 'rotate(180deg)';
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
        </div>
      `;
      contentElement.classList.remove('hidden');
    }
  }
}